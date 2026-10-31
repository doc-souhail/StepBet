import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";

// ---- Fake data for now (real data comes later) ----
const TODAY_STEPS = 8432;
const DAILY_GOAL = 10000;

const COMPETITIONS = [
  {
    id: "demo",
    name: "Office showdown",
    live: true,
    info: "4 days left",
    rank: 2,
    players: 4,
    pot: 20,
    steps: 57333,
  },
  {
    id: "demo2",
    name: "Weekend warriors",
    live: false,
    info: "Starts in 2 days",
    rank: null,
    players: 3,
    pot: 15,
    steps: 0,
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ordinal(n: number) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}

export default function Dashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const meta = session?.user.user_metadata ?? {};
  const firstName = (meta.full_name ?? meta.name ?? "there").split(" ")[0];
  const avatar: string | undefined = meta.avatar_url;
  const pct = Math.min(100, Math.round((TODAY_STEPS / DAILY_GOAL) * 100));

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
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
            {TODAY_STEPS.toLocaleString("en-US")}
          </Text>
          <Text className="text-muted text-base mb-2 ml-2">steps</Text>
        </View>

        {/* Progress bar (will become a ring later) */}
        <View className="h-2.5 bg-line rounded-full mt-4 overflow-hidden">
          <View
            className="h-full bg-accent rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
        <Text className="text-muted text-xs mt-2">
          Daily goal: {DAILY_GOAL.toLocaleString("en-US")}
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

      {/* Competition cards */}
      {COMPETITIONS.map((c, i) => (
        <Animated.View
          key={c.id}
          entering={FadeInDown.delay(150 + i * 100).duration(500)}
        >
          <Link href={`/competition/${c.id}`} asChild>
            <Pressable className="bg-card border border-line rounded-3xl p-5 mb-3 active:opacity-80">
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-ink text-lg font-bold flex-1"
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
                <View
                  className={`rounded-full px-3 py-1 ${c.live ? "bg-accent/15" : "bg-line"}`}
                >
                  <Text
                    className={`text-xs font-bold ${c.live ? "text-accent" : "text-muted"}`}
                  >
                    {c.live ? "LIVE" : "UPCOMING"}
                  </Text>
                </View>
              </View>
              <Text className="text-muted text-sm mt-1">
                {c.info} · {c.players} players
              </Text>

              <View className="flex-row mt-4">
                <View className="flex-1">
                  <Text className="text-muted text-xs">RANK</Text>
                  <Text className="text-ink text-xl font-extrabold">
                    {c.rank ? ordinal(c.rank) : "–"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs">STEPS</Text>
                  <Text className="text-ink text-xl font-extrabold">
                    {c.steps.toLocaleString("en-US")}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-muted text-xs">POT</Text>
                  <Text className="text-accent text-xl font-extrabold">
                    {c.pot} €
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        </Animated.View>
      ))}

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
