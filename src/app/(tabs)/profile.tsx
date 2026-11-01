import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { useSteps } from "../../lib/steps";
import { supabase } from "../../lib/supabase";

type Profile = { display_name: string | null; avatar_url: string | null };

// One line inside a card: icon + label on the left, value on the right
function Row({
  icon,
  label,
  right,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-5 py-4 ${last ? "" : "border-b border-line"}`}
    >
      <View className="w-9 h-9 rounded-xl bg-line items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#C6F432" />
      </View>
      <Text className="text-ink font-semibold flex-1">{label}</Text>
      {right}
    </View>
  );
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const { status, connect } = useSteps();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!session) return;
    // Row created automatically by the database trigger at signup
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const meta = session?.user.user_metadata ?? {};
  const name: string =
    profile?.display_name ?? meta.full_name ?? meta.name ?? "Player";
  const avatar: string | undefined = profile?.avatar_url ?? meta.avatar_url;
  const memberSince = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "–";

  function confirmLogout() {
    Alert.alert("Log out", "You will need to sign in with Google again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="items-center mb-8"
      >
        <View className="w-28 h-28 rounded-full border-4 border-accent p-1 items-center justify-center">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-full"
            />
          ) : (
            <View className="w-full h-full rounded-full bg-accent items-center justify-center">
              <Text className="text-black text-4xl font-extrabold">
                {name[0]}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-ink text-3xl font-extrabold mt-4">{name}</Text>
        <Text className="text-muted text-sm mt-1">{session?.user.email}</Text>
      </Animated.View>

      {/* Account */}
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2 ml-1">
        ACCOUNT
      </Text>
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="bg-card border border-line rounded-3xl mb-6 overflow-hidden"
      >
        <Row
          icon="logo-google"
          label="Signed in with"
          right={<Text className="text-muted">Google</Text>}
        />
        <Row
          icon="calendar-outline"
          label="Member since"
          right={<Text className="text-muted">{memberSince}</Text>}
          last
        />
      </Animated.View>

      {/* Step tracking */}
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2 ml-1">
        STEP TRACKING
      </Text>
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="bg-card border border-line rounded-3xl mb-8 overflow-hidden"
      >
        <Row
          icon="footsteps"
          label="Health Connect"
          last
          right={
            status === "ready" ? (
              <View className="bg-accent/15 rounded-full px-3 py-1">
                <Text className="text-accent text-xs font-bold">CONNECTED</Text>
              </View>
            ) : (
              <Pressable
                onPress={connect}
                className="bg-accent rounded-full px-3 py-1"
              >
                <Text className="text-black text-xs font-bold">CONNECT</Text>
              </Pressable>
            )
          }
        />
      </Animated.View>

      {/* Log out */}
      <Pressable
        onPress={confirmLogout}
        className="border border-line rounded-2xl py-4 flex-row items-center justify-center active:opacity-70"
      >
        <Ionicons name="log-out-outline" size={20} color="#F87171" />
        <Text className="text-red-400 font-bold ml-2">Log out</Text>
      </Pressable>

      <Text className="text-muted text-xs text-center mt-6">
        StepBet · Friends only
      </Text>
    </ScrollView>
  );
}
