import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { AppState } from "react-native";
import {
    SdkAvailabilityStatus,
    getGrantedPermissions,
    getSdkStatus,
    initialize,
    readRecords,
    requestPermission,
} from "react-native-health-connect";
import { useAuth } from "./auth";
import { toISO } from "./dates";
import { supabase } from "./supabase";

const DAYS_TO_SYNC = 7;
const DAILY_CAP = 60000; // same cap as the database
const MANUAL_ENTRY = 3; // Health Connect "recording method" for steps typed by hand

type Status =
  | "loading"
  | "unavailable"
  | "needs-permission"
  | "ready"
  | "error";

type StepsContextType = {
  status: Status;
  todaySteps: number;
  lastSync: Date | null;
  syncing: boolean;
  message: string | null;
  connect: () => Promise<void>;
  sync: () => Promise<void>;
};

const StepsContext = createContext<StepsContextType>({
  status: "loading",
  todaySteps: 0,
  lastSync: null,
  syncing: false,
  message: null,
  connect: async () => {},
  sync: async () => {},
});

export const useSteps = () => useContext(StepsContext);

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// Steps for one day, ignoring manual entries.
// If several apps write steps (Samsung Health + Google Fit...), we keep the biggest
// single source instead of adding them up, to avoid counting the same walk twice.
async function stepsForDay(start: Date): Promise<number> {
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const perSource: Record<string, number> = {};
  let pageToken: string | undefined;
  do {
    const res: any = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      pageSize: 1000,
      pageToken,
    });
    for (const r of res.records) {
      if ((r.metadata?.recordingMethod ?? 0) === MANUAL_ENTRY) continue;
      const source = r.metadata?.dataOrigin ?? "unknown";
      perSource[source] = (perSource[source] ?? 0) + r.count;
    }
    pageToken = res.pageToken;
  } while (pageToken);

  const best = Math.max(0, ...Object.values(perSource));
  return Math.min(DAILY_CAP, best);
}

async function syncSteps(userId: string): Promise<number> {
  const rows: {
    user_id: string;
    day: string;
    steps: number;
    updated_at: string;
  }[] = [];
  let today = 0;

  for (let i = 0; i < DAYS_TO_SYNC; i++) {
    const day = startOfDay(i);
    const steps = await stepsForDay(day);
    if (i === 0) today = steps;
    if (steps > 0) {
      rows.push({
        user_id: userId,
        day: toISO(day),
        steps,
        updated_at: new Date().toISOString(),
      });
    }
  }
  if (rows.length > 0) {
    const { error } = await supabase
      .from("daily_steps")
      .upsert(rows, { onConflict: "user_id,day" });
    if (error) throw error;
  }
  return today;
}

export function StepsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [todaySteps, setTodaySteps] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = useCallback(async () => {
    if (!session) return;
    try {
      const sdk = await getSdkStatus();
      if (sdk !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        setStatus("unavailable");
        return;
      }
      await initialize();
      const granted = await getGrantedPermissions();
      if (
        !granted.some(
          (p: any) => p.recordType === "Steps" && p.accessType === "read",
        )
      ) {
        setStatus("needs-permission");
        return;
      }
      setSyncing(true);
      const today = await syncSteps(session.user.id);
      setTodaySteps(today);
      setLastSync(new Date());
      setMessage(null);
      setStatus("ready");
    } catch (e: any) {
      setMessage(e?.message ?? "Unknown error");
      setStatus("error");
    } finally {
      setSyncing(false);
    }
  }, [session]);

  // Asks Android to show the Health Connect permission screen, then syncs
  const connect = useCallback(async () => {
    try {
      const sdk = await getSdkStatus();
      if (sdk !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        setStatus("unavailable");
        return;
      }
      await initialize();
      await requestPermission([{ accessType: "read", recordType: "Steps" }]);
    } catch (e: any) {
      setMessage(e?.message ?? "Unknown error");
      setStatus("error");
      return;
    }
    await sync();
  }, [sync]);

  // Sync when the app opens / after login...
  useEffect(() => {
    sync();
  }, [sync]);

  // ...and every time the app comes back to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") sync();
    });
    return () => sub.remove();
  }, [sync]);

  return (
    <StepsContext.Provider
      value={{ status, todaySteps, lastSync, syncing, message, connect, sync }}
    >
      {children}
    </StepsContext.Provider>
  );
}
