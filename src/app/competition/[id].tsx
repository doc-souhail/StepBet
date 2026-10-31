import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// ---- Fake data for now (real data comes later) ----
const COMP = {
  name: "Office showdown",
  daysLeft: 4,
  stake: 5,
  code: "A3F9K2",
  lastSync: "2 min ago",
};

const PLAYERS = [
  {
    id: "1",
    name: "Sarah",
    steps: 68412,
    today: 9120,
    color: "#C6F432",
    me: false,
  },
  {
    id: "2",
    name: "Tom",
    steps: 61090,
    today: 7544,
    color: "#60A5FA",
    me: false,
  },
  {
    id: "3",
    name: "You",
    steps: 57333,
    today: 8432,
    color: "#F472B6",
    me: true,
  },
  {
    id: "4",
    name: "Léa",
    steps: 49870,
    today: 6310,
    color: "#FB923C",
    me: false,
  },
].sort((a, b) => b.steps - a.steps);

const fmt = (n: number) => n.toLocaleString("en-US");

function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    >
      <Text className="text-black font-bold" style={{ fontSize: size * 0.42 }}>
        {name[0]}
      </Text>
    </View>
  );
}

// One podium column: avatar + name + steps + a bar whose height depends on the rank
function PodiumSpot({
  player,
  rank,
}: {
  player: (typeof PLAYERS)[number];
  rank: 1 | 2 | 3;
}) {
  const height = rank === 1 ? 120 : rank === 2 ? 90 : 70;
  return (
    <View className="flex-1 items-center">
      {rank === 1 && (
        <Ionicons
          name="trophy"
          size={22}
          color="#C6F432"
          style={{ marginBottom: 6 }}
        />
      )}
      <Avatar
        name={player.name}
        color={player.color}
        size={rank === 1 ? 56 : 46}
      />
      <Text className="text-ink font-bold mt-2" numberOfLines={1}>
        {player.name}
      </Text>
      <Text className="text-muted text-xs mb-2">{fmt(player.steps)}</Text>
      <View
        className={`w-full rounded-t-2xl items-center justify-start pt-3 ${
          rank === 1 ? "bg-accent" : "bg-card border border-line"
        }`}
        style={{ height }}
      >
        <Text
          className={`text-3xl font-extrabold ${rank === 1 ? "text-black" : "text-muted"}`}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
}

export default function Competition() {
  const pot = PLAYERS.length * COMP.stake;
  const leader = PLAYERS[0];
  const [first, second, third] = PLAYERS;

  async function onShare() {
    await Share.share({
      message: `Join my StepBet challenge "${COMP.name}"! Open the app and use the code ${COMP.code}.`,
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: COMP.name }} />

      {/* Pot + time left */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="bg-card border border-line rounded-3xl p-5"
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-muted text-xs font-semibold tracking-widest">
            THE POT
          </Text>
          <View className="bg-accent/15 rounded-full px-3 py-1">
            <Text className="text-accent text-xs font-bold">
              {COMP.daysLeft} DAYS LEFT
            </Text>
          </View>
        </View>
        <Text className="text-accent text-6xl font-extrabold mt-2">
          {pot} €
        </Text>
        <Text className="text-muted text-sm mt-1">
          {PLAYERS.length} players × {COMP.stake} € · winner takes all
        </Text>
      </Animated.View>

      {/* Podium (order on screen: 2nd, 1st, 3rd) */}
      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        className="flex-row items-end mt-8 px-2"
      >
        {second && <PodiumSpot player={second} rank={2} />}
        {first && <PodiumSpot player={first} rank={1} />}
        {third && <PodiumSpot player={third} rank={3} />}
      </Animated.View>

      {/* Full leaderboard */}
      <View className="flex-row items-center justify-between mt-8 mb-3">
        <Text className="text-ink text-xl font-bold">Leaderboard</Text>
        <Text className="text-muted text-xs">Synced {COMP.lastSync}</Text>
      </View>

      {PLAYERS.map((p, i) => (
        <Animated.View
          key={p.id}
          entering={FadeInDown.delay(220 + i * 70).duration(400)}
        >
          <View
            className={`flex-row items-center rounded-2xl px-4 py-3 mb-2 border ${
              p.me ? "bg-accent/10 border-accent/40" : "bg-card border-line"
            }`}
          >
            <Text
              className={`w-6 text-lg font-extrabold ${i === 0 ? "text-accent" : "text-muted"}`}
            >
              {i + 1}
            </Text>
            <Avatar name={p.name} color={p.color} />
            <View className="flex-1 ml-3">
              <Text className="text-ink font-bold">
                {p.name}
                {p.me ? <Text className="text-accent"> · you</Text> : null}
              </Text>
              <Text className="text-muted text-xs">
                {i === 0
                  ? `+${fmt(p.today)} today`
                  : `−${fmt(leader.steps - p.steps)} behind · +${fmt(p.today)} today`}
              </Text>
            </View>
            <Text className="text-ink text-lg font-extrabold">
              {fmt(p.steps)}
            </Text>
          </View>
        </Animated.View>
      ))}

      {/* Invite */}
      <View className="bg-card border border-dashed border-line rounded-3xl p-5 mt-4 items-center">
        <Text className="text-muted text-xs font-semibold tracking-widest">
          INVITE CODE
        </Text>
        <Text className="text-ink text-4xl font-extrabold tracking-widest mt-1">
          {COMP.code}
        </Text>
        <Pressable
          onPress={onShare}
          className="bg-accent rounded-2xl px-6 py-3 flex-row items-center mt-4 active:opacity-80"
        >
          <Ionicons name="share-outline" size={18} color="#000" />
          <Text className="text-black font-bold ml-2">Share with friends</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
