import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

export type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  daily_goal: number;
};
type Patch = { display_name?: string; daily_goal?: number };

type ProfileContextType = {
  profile: Profile | null;
  name: string; // nickname if set, otherwise Google name
  avatar: string | undefined;
  goal: number;
  update: (patch: Patch) => Promise<string | null>; // returns an error message or null
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  name: "Player",
  avatar: undefined,
  goal: 10000,
  update: async () => null,
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, daily_goal")
      .eq("id", session.user.id)
      .single();
    if (data) setProfile(data as Profile);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Patch) => {
      if (!session) return "Not logged in";
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);
      if (error) return error.message;
      await load();
      return null;
    },
    [session, load],
  );

  const meta = session?.user.user_metadata ?? {};
  const name: string =
    profile?.display_name || meta.full_name || meta.name || "Player";
  const avatar: string | undefined = profile?.avatar_url ?? meta.avatar_url;
  const goal = profile?.daily_goal ?? 10000;

  return (
    <ProfileContext.Provider value={{ profile, name, avatar, goal, update }}>
      {children}
    </ProfileContext.Provider>
  );
}
