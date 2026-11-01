import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { daysAgoISO, parseISO, todayISO } from "../lib/dates";
import { useProfile } from "../lib/profile";
import { DayRow, buildDays, computeStats } from "../lib/stats";
import { useSteps } from "../lib/steps";
import { supabase } from "../lib/supabase";
import BarChart from "./BarChart";
import StatTile from "./StatTile";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function MyStats() {
  const { session } = useAuth();
  const { goal } = useProfile();
  const { lastSync } = useSteps();
  const [rows, setRows] = useState<DayRow[]>([]);

  // Reload after every step sync
  useEffect(() => {
    if (!session) return;
    supabase
      .from("daily_steps")
      .select("day, steps")
      .eq("user_id", session.user.id)
      .gte("day", daysAgoISO(29))
      .then(({ data }) => setRows((data as DayRow[]) ?? []));
  }, [session, lastSync]);

  const today = todayISO();
  const days = buildDays(rows, daysAgoISO(29), today);

  // Stats start at your first day with steps, so a new account isn't diluted by empty days
  const first = days.findIndex((d) => d.steps > 0);
  const stats = computeStats(
    first === -1 ? [] : days.slice(first),
    goal,
    today,
  );

  return (
    <View className="mb-6">
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2 ml-1">
        YOUR STATS
      </Text>

      <View className="bg-card border border-line rounded-3xl p-5 mb-3">
        <Text className="text-ink font-bold mb-4">Last 7 days</Text>
        <BarChart days={days.slice(-7)} goal={goal} today={today} />
      </View>

      <View className="flex-row gap-3 mb-3">
        <StatTile
          label="STREAK"
          value={`${stats.streak}`}
          sub={stats.streak === 1 ? "day at goal" : "days at goal in a row"}
          highlight={stats.streak > 0}
        />
        <StatTile
          label="BEST DAY"
          value={stats.best ? fmt(stats.best.steps) : "–"}
          sub={
            stats.best && stats.best.steps > 0
              ? parseISO(stats.best.day).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : undefined
          }
        />
      </View>
      <View className="flex-row gap-3">
        <StatTile label="AVERAGE" value={fmt(stats.avg)} sub="steps per day" />
        <StatTile
          label="GOAL DAYS"
          value={`${stats.goalDays}/${stats.elapsed}`}
          sub="last 30 days"
        />
      </View>
    </View>
  );
}
