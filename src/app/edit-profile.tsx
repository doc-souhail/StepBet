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
import { useProfile } from "../lib/profile";

const GOALS = [5000, 8000, 10000, 12000, 15000, 20000];

export default function EditProfile() {
  const router = useRouter();
  const { name, goal: currentGoal, update } = useProfile();
  const [displayName, setDisplayName] = useState(name);
  const [goal, setGoal] = useState(currentGoal);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (displayName.trim().length < 2) {
      Alert.alert("Name needed", "Your name needs at least 2 characters.");
      return;
    }
    setBusy(true);
    const error = await update({
      display_name: displayName.trim(),
      daily_goal: goal,
    });
    setBusy(false);
    if (error) {
      Alert.alert("Could not save", error);
      return;
    }
    router.back();
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        DISPLAY NAME
      </Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={24}
        placeholder="Your nickname"
        placeholderTextColor="#8B8D94"
        className="bg-card border border-line rounded-2xl px-4 py-4 text-ink text-lg font-semibold"
      />
      <Text className="text-muted text-xs mt-2 mb-6">
        This is the name your friends see on the leaderboard.
      </Text>

      <Text className="text-muted text-xs font-semibold tracking-widest mb-2">
        DAILY STEP GOAL
      </Text>
      <View className="flex-row flex-wrap mb-8">
        {GOALS.map((g) => (
          <Chip
            key={g}
            label={g.toLocaleString("en-US")}
            active={goal === g}
            onPress={() => setGoal(g)}
          />
        ))}
      </View>

      <Pressable
        onPress={onSave}
        disabled={busy}
        className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
      >
        {busy ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text className="text-black text-base font-bold">Save</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
