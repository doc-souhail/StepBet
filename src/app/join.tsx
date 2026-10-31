import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Join() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function onJoin() {
    if (code.trim().length < 6) {
      Alert.alert("Invalid code", "The invite code has 6 characters.");
      return;
    }
    setBusy(true);
    // join_competition is the SQL function we created: it checks the code
    // and that the competition has not started yet
    const { data, error } = await supabase.rpc("join_competition", {
      code: code.trim(),
    });
    setBusy(false);

    if (error) {
      Alert.alert("Could not join", error.message);
      return;
    }
    router.replace(`/competition/${data}`);
  }

  return (
    <View className="flex-1 bg-bg px-6 justify-center">
      <Text className="text-ink text-4xl font-extrabold">Got a code?</Text>
      <Text className="text-muted text-base mt-2 mb-8">
        Ask your friend for the 6-character invite code.
      </Text>

      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="A3F9K2"
        placeholderTextColor="#3F4046"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        className="bg-card border border-line rounded-2xl px-4 py-5 text-ink text-4xl font-extrabold text-center tracking-widest mb-6"
      />

      <Pressable
        onPress={onJoin}
        disabled={busy}
        className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
      >
        {busy ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text className="text-black text-base font-bold">
            Join competition
          </Text>
        )}
      </Pressable>
    </View>
  );
}
