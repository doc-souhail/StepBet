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
const STEPS_CAP = 60000; // same caps as the database
const DISTANCE_CAP_M = 200000;
const KCAL_CAP = 20000;
const MANUAL_ENTRY = 3; // Health Connect "recording method" for values typed by hand

const ALL_PERMISSIONS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "Distance" },
  { accessType: "read", recordType: "ActiveCaloriesBurned" },
];

type Status =
  | "loading"
  | "unavailable"
  | "needs-permission"
  | "ready"
  | "error";
type Extras = { distance: boolean; calories: boolean };
type Today = { steps: number; distanceM: number; kcal: number };

type StepsContextType = {
  status: Status;
  todaySteps: number;
  todayDistanceM: number;
  todayKcal: number;
  extras: Extras; // which optional stats the user allowed
  lastSync: Date | null;
  syncing: boolean;
  message: string | null;
  connect: () => Promise<void>;
  sync: () => Promise<void>;
};

const StepsContext = createContext<StepsContextType>({
  status: "loading",
  todaySteps: 0,
  todayDistanceM: 0,
  todayKcal: 0,
  extras: { distance: false, calories: false },
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

// Total of one record type for a time range, ignoring manual entries.
// If several apps write the same data (Samsung Health + Google Fit...), we keep the
// biggest single source instead of adding them up, to avoid counting the same walk twice.
async function sumBySource(
  recordType: "Steps" | "Distance" | "ActiveCaloriesBurned",
  start: Date,
  end: Date,
  value: (record: any) => number,
): Promise<number> {
  const perSource: Record<string, number> = {};
  let pageToken: string | undefined;
  do {
    const res: any = await readRecords(recordType as any, {
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
      perSource[source] = (perSource[source] ?? 0) + value(r);
    }
    pageToken = res.pageToken;
  } while (pageToken);
  return Math.max(0, ...Object.values(perSource));
}

async function syncAll(userId: string, extras: Extras): Promise<Today> {
  const rows: Record<string, any>[] = [];
  let today: Today = { steps: 0, distanceM: 0, kcal: 0 };

  for (let i = 0; i < DAYS_TO_SYNC; i++) {
    const start = startOfDay(i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const steps = Math.min(
      STEPS_CAP,
      await sumBySource("Steps", start, end, (r) => r.count),
    );
    const distanceM = extras.distance
      ? Math.min(
          DISTANCE_CAP_M,
          Math.round(
            await sumBySource(
              "Distance",
              start,
              end,
              (r) => r.distance?.inMeters ?? 0,
            ),
          ),
        )
      : 0;
    const kcal = extras.calories
      ? Math.min(
          KCAL_CAP,
          Math.round(
            await sumBySource(
              "ActiveCaloriesBurned",
              start,
              end,
              (r) => r.energy?.inKilocalories ?? 0,
            ),
          ),
        )
      : 0;

    if (i === 0) today = { steps, distanceM, kcal };

    if (steps > 0 || distanceM > 0 || kcal > 0) {
      rows.push({
        user_id: userId,
        day: toISO(start),
        steps,
        updated_at: new Date().toISOString(),
        // Only write a column if the user allowed it, so we never overwrite saved values with 0
        ...(extras.distance ? { distance_m: distanceM } : {}),
        ...(extras.calories ? { active_kcal: kcal } : {}),
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
  const [today, setToday] = useState<Today>({
    steps: 0,
    distanceM: 0,
    kcal: 0,
  });
  const [extras, setExtras] = useState<Extras>({
    distance: false,
    calories: false,
  });
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

      const granted: any[] = await getGrantedPermissions();
      const has = (type: string) =>
        granted.some((p) => p.recordType === type && p.accessType === "read");
      if (!has("Steps")) {
        setStatus("needs-permission");
        return;
      }
      const allowed = {
        distance: has("Distance"),
        calories: has("ActiveCaloriesBurned"),
      };
      setExtras(allowed);

      setSyncing(true);
      const result = await syncAll(session.user.id, allowed);
      setToday(result);
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

  // Shows the Health Connect permission screen (steps, distance, calories), then syncs
  const connect = useCallback(async () => {
    try {
      const sdk = await getSdkStatus();
      if (sdk !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        setStatus("unavailable");
        return;
      }
      await initialize();
      await requestPermission(ALL_PERMISSIONS as any);
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
      value={{
        status,
        todaySteps: today.steps,
        todayDistanceM: today.distanceM,
        todayKcal: today.kcal,
        extras,
        lastSync,
        syncing,
        message,
        connect,
        sync,
      }}
    >
      {children}
    </StepsContext.Provider>
  );
}
