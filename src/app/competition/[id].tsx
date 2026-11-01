import { Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "../../lib/auth";
import { competitionInfo, todayISO } from "../../lib/dates";
import { supabase } from "../../lib/supabase";

type Competition = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  stake_eur: number;
  invite_code: string;
};
type Player = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_steps: number;
  today_steps: number;
};

const fmt = (n: number) => n.toLocaleString("en-US");
const COLORS = [
  "#C6F432",
  "#60A5FA",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
  "#34D399",
];

// Same user always gets the same color
function colorFor(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

function Avatar({ p, size = 40 }: { p: Player; size?: number }) {
  if (p.avatar_url) {
    return (
      <Image
        source={{ uri: p.avatar_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorFor(p.user_id),
      }}
    >
      <Text className="text-black font-bold" style={{ fontSize: size * 0.42 }}>
        {(p.display_name ?? "?")[0]}
      </Text>
    </View>
  );
}

function PodiumSpot({ player, rank }: { player: Player; rank: 1 | 2 | 3 }) {
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
      <Avatar p={player} size={rank === 1 ? 56 : 46} />
      <Text className="text-ink font-bold mt-2" numberOfLines={1}>
        {(player.display_name ?? "Player").split(" ")[0]}
      </Text>
      <Text className="text-muted text-xs mb-2">{fmt(player.total_steps)}</Text>
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

export default function CompetitionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [comp, setComp] = useState<Competition | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [compRes, boardRes] = await Promise.all([
      supabase.from("competitions").select("*").eq("id", id).single(),
      supabase.rpc("competition_leaderboard", {
        p_comp: id,
        p_today: todayISO(),
      }),
    ]);
    if (compRes.error) setError(compRes.error.message);
    else if (boardRes.error) setError(boardRes.error.message);
    else {
      setError(null);
      setComp(compRes.data as Competition);
      setPlayers((boardRes.data as Player[]) ?? []);
    }
    setLoading(false);
  }, [id]);

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

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#C6F432" />
      </View>
    );
  }
  if (error || !comp) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-6">
        <Text className="text-red-400 text-center">
          Could not load this competition. {error}
        </Text>
      </View>
    );
  }

  const info = competitionInfo(comp.start_date, comp.end_date);
  const upcoming = info.status === "upcoming";
  const pot = players.length * comp.stake_eur;
  const leaderSteps = players[0]?.total_steps ?? 0;
  // Ties share the same rank (1 + number of players with strictly more steps)
  const rankOf = (p: Player) =>
    1 + players.filter((o) => o.total_steps > p.total_steps).length;
  const [first, second, third] = players;

  async function onShare() {
    await Share.share({
      message: `Join my StepBet challenge "${comp!.name}"! Open the app and use the code ${comp!.invite_code}.`,
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#C6F432"
        />
      }
    >
      <Stack.Screen options={{ title: comp.name }} />

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
              {info.text.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text className="text-accent text-6xl font-extrabold mt-2">
          {pot} €
        </Text>
        <Text className="text-muted text-sm mt-1">
          {players.length} {players.length === 1 ? "player" : "players"} ×{" "}
          {comp.stake_eur} € · winner takes all
        </Text>
      </Animated.View>

      {/* Podium: only once the competition started and there are at least 2 players */}
      {!upcoming && players.length >= 2 && (
        <Animated.View
          entering={FadeInDown.delay(120).duration(500)}
          className="flex-row items-end mt-8 px-2"
        >
          {second && <PodiumSpot player={second} rank={2} />}
          {first && <PodiumSpot player={first} rank={1} />}
          {third && <PodiumSpot player={third} rank={3} />}
        </Animated.View>
      )}

      {/* Leaderboard */}
      <View className="flex-row items-center justify-between mt-8 mb-3">
        <Text className="text-ink text-xl font-bold">
          {upcoming ? "Players" : "Leaderboard"}
        </Text>
        <Text className="text-muted text-xs">Pull down to refresh</Text>
      </View>

      {players.map((p, i) => {
        const me = p.user_id === session?.user.id;
        const rank = rankOf(p);
        return (
          <Animated.View
            key={p.user_id}
            entering={FadeInDown.delay(200 + i * 60).duration(400)}
          >
            <Pressable
              disabled={upcoming}
              onPress={() =>
                router.push(`/player/${p.user_id}?comp=${comp.id}` as any)
              }
              className={`flex-row items-center rounded-2xl px-4 py-3 mb-2 border active:opacity-80 ${
                me ? "bg-accent/10 border-accent/40" : "bg-card border-line"
              }`}
            >
              <Text
                className={`w-6 text-lg font-extrabold ${!upcoming && rank === 1 ? "text-accent" : "text-muted"}`}
              >
                {upcoming ? "•" : rank}
              </Text>
              <Avatar p={p} />
              <View className="flex-1 ml-3">
                <Text className="text-ink font-bold">
                  {p.display_name ?? "Player"}
                  {me ? <Text className="text-accent"> · you</Text> : null}
                </Text>
                {!upcoming && (
                  <Text className="text-muted text-xs">
                    {rank === 1
                      ? `+${fmt(p.today_steps)} today`
                      : `−${fmt(leaderSteps - p.total_steps)} behind · +${fmt(p.today_steps)} today`}
                  </Text>
                )}
              </View>
              {!upcoming && (
                <Text className="text-ink text-lg font-extrabold mr-1">
                  {fmt(p.total_steps)}
                </Text>
              )}
              {!upcoming && (
                <Ionicons name="chevron-forward" size={16} color="#8B8D94" />
              )}
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Invite */}
      <View className="bg-card border border-dashed border-line rounded-3xl p-5 mt-4 items-center">
        <Text className="text-muted text-xs font-semibold tracking-widest">
          INVITE CODE
        </Text>
        <Text className="text-ink text-4xl font-extrabold tracking-widest mt-1">
          {comp.invite_code}
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
