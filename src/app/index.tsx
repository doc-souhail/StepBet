import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";

// Fake data, only to show what the app looks like
const PREVIEW = [
  { rank: 1, name: "Sarah", steps: "68,412", color: "#C6F432", initial: "S" },
  { rank: 2, name: "Tom", steps: "61,090", color: "#60A5FA", initial: "T" },
  { rank: 3, name: "You", steps: "57,333", color: "#F472B6", initial: "Y" },
];

function PreviewCard() {
  return (
    <View
      className="bg-card border border-line rounded-3xl p-4"
      style={{ transform: [{ rotate: "-3deg" }] }}
    >
      {/* Header: week info + pot */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-muted text-xs font-semibold tracking-wider">
          WEEK 1 · 4 DAYS LEFT
        </Text>
        <View className="bg-accent/15 rounded-full px-3 py-1">
          <Text className="text-accent text-xs font-bold">POT 20 €</Text>
        </View>
      </View>

      {/* Leaderboard rows */}
      {PREVIEW.map((p) => (
        <View
          key={p.rank}
          className={`flex-row items-center rounded-2xl px-3 py-2.5 mb-1.5 ${
            p.rank === 1 ? "bg-accent/10 border border-accent/30" : ""
          }`}
        >
          <Text
            className={`w-6 font-bold ${p.rank === 1 ? "text-accent" : "text-muted"}`}
          >
            {p.rank}
          </Text>
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: p.color }}
          >
            <Text className="text-black font-bold">{p.initial}</Text>
          </View>
          <Text className="text-ink font-semibold flex-1">{p.name}</Text>
          <Text className="text-ink font-bold">{p.steps}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  async function onPress() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert("Login failed", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-bg overflow-hidden">
      {/* Lime glow in the background (stacked translucent circles) */}
      <View className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-accent/10" />
      <View className="absolute -top-16 -right-8 w-52 h-52 rounded-full bg-accent/10" />

      <View
        className="flex-1 px-6 justify-between"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Top: logo */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-xl bg-accent items-center justify-center mr-2">
              <Ionicons name="footsteps" size={20} color="#000" />
            </View>
            <Text className="text-ink text-xl font-extrabold">StepBet</Text>
          </View>
        </Animated.View>

        {/* Middle: preview card */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <PreviewCard />
        </Animated.View>

        {/* Bottom: headline + button */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <Text className="text-ink text-5xl font-extrabold leading-tight">
            Walk more.{"\n"}
            <Text className="text-accent">Beat your friends.</Text>
          </Text>
          <Text className="text-muted text-base mt-3 mb-8">
            Set a stake, walk for a week, winner takes the pot.
          </Text>

          <Pressable
            onPress={onPress}
            disabled={busy}
            className="bg-white rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text className="text-black text-base font-bold ml-3">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <Text className="text-muted text-xs text-center mt-4">
            Friends only · No payments in the app
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
