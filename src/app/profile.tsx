import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { colors, spacing } from "../theme";

type Profile = { display_name: string | null; avatar_url: string | null };

export default function Profile() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!session) return;
    // Reads the row created automatically by the database trigger at signup
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  return (
    <View style={styles.container}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : null}
      <Text style={styles.name}>{profile?.display_name ?? "..."}</Text>
      <Text style={styles.email}>{session?.user.email}</Text>
      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  name: { fontSize: 24, fontWeight: "700", color: colors.text },
  email: { fontSize: 14, color: colors.muted, marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  buttonText: { color: colors.text, fontWeight: "600" },
});
