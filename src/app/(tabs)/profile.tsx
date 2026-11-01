import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyStats from "../../components/MyStats";
import { useAuth } from "../../lib/auth";
import { useProfile } from "../../lib/profile";
import { useSteps } from "../../lib/steps";

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
  const { name, avatar, goal } = useProfile();
  const { status, connect } = useSteps();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

        <Pressable
          onPress={() => router.push("/edit-profile")}
          className="border border-line rounded-full px-5 py-2 flex-row items-center mt-4 active:opacity-70"
        >
          <Ionicons name="create-outline" size={16} color="#F4F4F5" />
          <Text className="text-ink font-semibold ml-2">Edit profile</Text>
        </Pressable>
      </Animated.View>
      <MyStats />

      {/* Goal + step tracking */}
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2 ml-1">
        STEPS
      </Text>
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="bg-card border border-line rounded-3xl mb-6 overflow-hidden"
      >
        <Row
          icon="flag-outline"
          label="Daily goal"
          right={
            <Text className="text-ink font-bold">
              {goal.toLocaleString("en-US")}
            </Text>
          }
        />
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

      {/* Account */}
      <Text className="text-muted text-xs font-semibold tracking-widest mb-2 ml-1">
        ACCOUNT
      </Text>
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="bg-card border border-line rounded-3xl mb-8 overflow-hidden"
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
