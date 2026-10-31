import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { competitionInfo, todayISO } from "../../lib/dates";
import { supabase } from "../../lib/supabase";

const DAILY_GOAL = 10000;

type Comp = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  stake_eur: number;
  invite_code: string;
  players: number;
  my_steps: number;
  my_rank: number;
};

const fmt = (n: number) => n.toLocaleString("en-US");
const ordinal = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [comps, setComps] = useState<Comp[]>([]);
  const [todaySteps, setTodaySteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const [compsRes, todayRes] = await Promise.all([
      supabase.rpc("my_competitions"),
      supabase
        .from("daily_steps")
        .select("steps")
        .eq("user_id", session.user.id)
        .eq("day", todayISO())
        .maybeSingle(),
    ]);
    if (compsRes.error) setError(compsRes.error.message);
    else {
      setError(null);
      setComps((compsRes.data as Comp[]) ?? []);
    }
    setTodaySteps(todayRes.data?.steps ?? 0);
    setLoading(false);
  }, [session]);

  // Reload every time the screen comes back into focus (e.g. after creating a competition)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const meta = session?.user.user_metadata ?? {};
  const firstName: string = (meta.full_name ?? meta.name ?? "there").split(
    " ",
  )[0];
  const avatar: string | undefined = meta.avatar_url;
  const pct = Math.min(100, Math.round((todaySteps / DAILY_GOAL) * 100));

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#C6F432"
        />
      }
    >
      {/* Header: greeting + avatar */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-muted text-sm">{greeting()},</Text>
          <Text className="text-ink text-3xl font-extrabold">
            {firstName} 👋
          </Text>
        </View>
        {avatar ? (
          <Image source={{ uri: avatar }} className="w-11 h-11 rounded-full" />
        ) : (
          <View className="w-11 h-11 rounded-full bg-accent items-center justify-center">
            <Text className="text-black font-bold text-lg">{firstName[0]}</Text>
          </View>
        )}
      </View>

      {/* Today's steps */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="bg-card border border-line rounded-3xl p-5 mb-8"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs font-semibold tracking-widest">
            TODAY
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="flame" size={14} color="#C6F432" />
            <Text className="text-accent text-xs font-bold ml-1">
              {pct}% of goal
            </Text>
          </View>
        </View>
        <View className="flex-row items-end mt-2">
          <Text className="text-ink text-6xl font-extrabold">
            {fmt(todaySteps)}
          </Text>
          <Text className="text-muted text-base mb-2 ml-2">steps</Text>
        </View>
        <View className="h-2.5 bg-line rounded-full mt-4 overflow-hidden">
          <View
            className="h-full bg-accent rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
        <Text className="text-muted text-xs mt-2">
          Daily goal: {fmt(DAILY_GOAL)}
        </Text>
      </Animated.View>

      {/* Competitions header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink text-xl font-bold">Your competitions</Text>
        <Pressable
          onPress={() => router.push("/create")}
          className="bg-accent rounded-full px-4 py-2 flex-row items-center active:opacity-80"
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text className="text-black font-bold text-sm ml-1">New</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color="#C6F432" className="my-8" />}
      {error && (
        <Text className="text-red-400 mb-3">Could not load: {error}</Text>
      )}

      {!loading && !error && comps.length === 0 && (
        <View className="bg-card border border-line rounded-3xl p-6 items-center mb-3">
          <Ionicons name="trophy-outline" size={32} color="#8B8D94" />
          <Text className="text-ink font-bold text-lg mt-3">
            No competitions yet
          </Text>
          <Text className="text-muted text-center mt-1">
            Create one, or join a friend's with their invite code.
          </Text>
        </View>
      )}

      {/* Competition cards */}
      {comps.map((c, i) => {
        const info = competitionInfo(c.start_date, c.end_date);
        const pill =
          info.status === "live"
            ? { text: "LIVE", box: "bg-accent/15", color: "text-accent" }
            : info.status === "upcoming"
              ? { text: "UPCOMING", box: "bg-line", color: "text-muted" }
              : { text: "FINISHED", box: "bg-line", color: "text-muted" };
        return (
          <Animated.View
            key={c.id}
            entering={FadeInDown.delay(150 + i * 80).duration(500)}
          >
            <Link href={`/competition/${c.id}`} asChild>
              <Pressable className="bg-card border border-line rounded-3xl p-5 mb-3 active:opacity-80">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-ink text-lg font-bold flex-1 mr-3"
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <View className={`rounded-full px-3 py-1 ${pill.box}`}>
                    <Text className={`text-xs font-bold ${pill.color}`}>
                      {pill.text}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted text-sm mt-1">
                  {info.text} · {c.players}{" "}
                  {c.players === 1 ? "player" : "players"}
                </Text>

                <View className="flex-row mt-4">
                  <View className="flex-1">
                    <Text className="text-muted text-xs">RANK</Text>
                    <Text className="text-ink text-xl font-extrabold">
                      {info.status === "upcoming" ? "–" : ordinal(c.my_rank)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted text-xs">STEPS</Text>
                    <Text className="text-ink text-xl font-extrabold">
                      {fmt(c.my_steps)}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-muted text-xs">POT</Text>
                    <Text className="text-accent text-xl font-extrabold">
                      {c.players * c.stake_eur} €
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          </Animated.View>
        );
      })}

      {/* Join with a code */}
      <Pressable
        onPress={() => router.push("/join")}
        className="border border-dashed border-line rounded-3xl py-4 flex-row items-center justify-center mt-2 active:opacity-70"
      >
        <Ionicons name="key-outline" size={18} color="#8B8D94" />
        <Text className="text-muted font-semibold ml-2">Join with a code</Text>
      </Pressable>
    </ScrollView>
  );
}
