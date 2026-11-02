import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import BarChart from "../../components/BarChart";
import StatTile from "../../components/StatTile";
import { useAuth } from "../../lib/auth";
import { parseISO, todayISO } from "../../lib/dates";
import { DayRow, buildDays, computeStats } from "../../lib/stats";
import { supabase } from "../../lib/supabase";

type PlayerProfile = {
  display_name: string | null;
  avatar_url: string | null;
  daily_goal: number;
};

const fmt = (n: number) => n.toLocaleString("en-US");

export default function PlayerScreen() {
  const { userId, comp } = useLocalSearchParams<{
    userId: string;
    comp: string;
  }>();
  const { session } = useAuth();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [extra, setExtra] = useState({ distanceM: 0, kcal: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [profRes, compRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url, daily_goal")
          .eq("id", userId)
          .single(),
        supabase
          .from("competitions")
          .select("start_date, end_date")
          .eq("id", comp)
          .single(),
      ]);
      if (profRes.error || compRes.error) {
        setError((profRes.error ?? compRes.error)!.message);
        setLoading(false);
        return;
      }
      const { start_date, end_date } = compRes.data;
      const stepsRes = await supabase
        .from("daily_steps")
        .select("day, steps, distance_m, active_kcal")
        .eq("user_id", userId)
        .gte("day", start_date)
        .lte("day", end_date);

      const raw = (stepsRes.data ?? []) as {
        day: string;
        steps: number;
        distance_m: number;
        active_kcal: number;
      }[];

      setProfile(profRes.data as PlayerProfile);
      setDays(
        buildDays(
          raw.map((r) => ({ day: r.day, steps: r.steps })),
          start_date,
          end_date,
        ),
      );
      setExtra({
        distanceM: raw.reduce((s, r) => s + (r.distance_m ?? 0), 0),
        kcal: raw.reduce((s, r) => s + (r.active_kcal ?? 0), 0),
      });
      setLoading(false);
    })();
  }, [userId, comp]);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#C6F432" />
      </View>
    );
  }
  if (error || !profile) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-red-400 text-center">
          Could not load this player. {error}
        </Text>
      </View>
    );
  }

  const today = todayISO();
  const goal = profile.daily_goal;
  const stats = computeStats(days, goal, today);
  const name = profile.display_name ?? "Player";
  const me = userId === session?.user.id;
  const hasExtra = extra.distanceM > 0 || extra.kcal > 0;
  const bestLabel =
    stats.best && stats.best.steps > 0
      ? parseISO(stats.best.day).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : undefined;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: me ? "You" : name }} />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="items-center mb-6"
      >
        <View className="w-24 h-24 rounded-full border-4 border-accent p-1 items-center justify-center">
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <View className="w-full h-full rounded-full bg-accent items-center justify-center">
              <Text className="text-black text-3xl font-extrabold">
                {name[0]}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-ink text-2xl font-extrabold mt-3">{name}</Text>
        <Text className="text-muted text-sm mt-1">
          Goal: {fmt(goal)} steps a day
        </Text>
      </Animated.View>

      {/* Total + chart */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="bg-card border border-line rounded-3xl p-5 mb-3"
      >
        <Text className="text-muted text-xs font-semibold tracking-widest">
          IN THIS COMPETITION
        </Text>
        <Text className="text-accent text-5xl font-extrabold mt-1">
          {fmt(stats.total)}
        </Text>
        <Text className="text-muted text-sm">steps in total</Text>

        <View className="mt-5">
          <BarChart days={days} goal={goal} today={today} />
        </View>
        <Text className="text-muted text-xs mt-3">
          Lime = goal reached · dashed line = daily goal
        </Text>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View className="flex-row gap-3 mb-3">
          <StatTile
            label="AVERAGE"
            value={fmt(stats.avg)}
            sub="steps per day"
          />
          <StatTile
            label="BEST DAY"
            value={stats.best ? fmt(stats.best.steps) : "–"}
            sub={bestLabel}
          />
        </View>

        <View className="flex-row gap-3">
          <StatTile
            label="GOAL DAYS"
            value={`${stats.goalDays}/${stats.elapsed}`}
            sub="days at goal"
          />
          <StatTile
            label="STREAK"
            value={`${stats.streak}`}
            sub={stats.streak === 1 ? "day in a row" : "days in a row"}
            highlight={stats.streak > 0}
          />
        </View>

        {hasExtra ? (
          <View className="flex-row gap-3 mt-3">
            <StatTile
              label="DISTANCE"
              value={`${(extra.distanceM / 1000).toFixed(1)} km`}
              sub="in this competition"
            />
            <StatTile
              label="ACTIVE ENERGY"
              value={fmt(extra.kcal)}
              sub="kcal in this competition"
            />
          </View>
        ) : null}
      </Animated.View>

      <Text className="text-muted text-xs text-center mt-6">
        Manually entered steps are ignored. Anything suspicious shows up in the
        chart.
      </Text>
    </ScrollView>
  );
}
