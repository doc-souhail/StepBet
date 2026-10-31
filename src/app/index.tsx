import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../lib/auth";
import { colors, spacing } from "../theme";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>StepBet</Text>
      <Text style={styles.subtitle}>Walk more than your friends.</Text>
      <Pressable style={styles.button} onPress={onPress} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "center",
  },
  title: { fontSize: 40, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
