import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Chip from "../components/Chip";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

// Start options: always in the future (the database blocks joining after the start)
const STARTS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 2 days", days: 2 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
];
const DURATIONS = [3, 7, 14];
const STAKES = [0, 5, 10, 20];

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// "2026-11-02" in local time (toISOString would shift the day because of UTC)
function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const pretty = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function Create() {
  const { session } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [startIn, setStartIn] = useState(1);
  const [duration, setDuration] = useState(7);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);

  const start = addDays(startIn);
  const end = addDays(startIn + duration - 1); // last day is included

  async function onCreate() {
    if (name.trim().length < 2) {
      Alert.alert(
        "Name needed",
        "Give your competition a name (2 letters minimum).",
      );
      return;
    }
    if (!session) return;

    setBusy(true);
    const { data, error } = await supabase
      .from("competitions")
      .insert({
        name: name.trim(),
        creator_id: session.user.id,
        stake_eur: stake,
        start_date: toISO(start),
        end_date: toISO(end),
      })
      .select()
      .single();
    setBusy(false);

    if (error) {
      Alert.alert("Could not create", error.message);
      return;
    }
    // The database trigger already added you as the first participant
    router.replace(`/competition/${data.id}`);
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        NAME
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Office showdown"
        placeholderTextColor="#8B8D94"
        maxLength={40}
        className="bg-card border border-line rounded-2xl px-4 py-4 text-ink text-lg font-semibold mb-6"
      />

      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        STARTS
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {STARTS.map((s) => (
          <Chip
            key={s.days}
            label={s.label}
            active={startIn === s.days}
            onPress={() => setStartIn(s.days)}
          />
        ))}
      </View>

      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        DURATION
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {DURATIONS.map((d) => (
          <Chip
            key={d}
            label={`${d} days`}
            active={duration === d}
            onPress={() => setDuration(d)}
          />
        ))}
      </View>

      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        STAKE PER PLAYER
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {STAKES.map((s) => (
          <Chip
            key={s}
            label={s === 0 ? "Just for fun" : `${s} €`}
            active={stake === s}
            onPress={() => setStake(s)}
          />
        ))}
      </View>

      {/* Summary */}
      <View className="bg-card border border-line rounded-3xl p-5 mt-2 mb-6">
        <Text className="text-muted text-xs font-semibold tracking-widest">
          SUMMARY
        </Text>
        <Text className="text-ink text-lg font-bold mt-2">
          {pretty(start)} → {pretty(end)}
        </Text>
        <Text className="text-muted text-sm mt-1">
          {stake === 0
            ? "No stake, bragging rights only."
            : `${stake} € each, paid between friends outside the app.`}
        </Text>
      </View>

      <Pressable
        onPress={onCreate}
        disabled={busy}
        className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
      >
        {busy ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text className="text-black text-base font-bold">
            Create competition
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
