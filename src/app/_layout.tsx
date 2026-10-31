import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "../../global.css";
import { AuthProvider, useAuth } from "../lib/auth";
import { colors } from "../theme";

// Not logged in -> login screen, logged in -> dashboard
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments.length === 0 || segments[0] === "index";
    if (!session && !onLoginScreen) router.replace("/");
    if (session && onLoginScreen) router.replace("/dashboard");
  }, [session, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ title: "New competition" }} />
        <Stack.Screen name="join" options={{ title: "Join a competition" }} />
        <Stack.Screen
          name="competition/[id]"
          options={{ title: "Competition" }}
        />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      </Stack>
      <AuthGate />
    </AuthProvider>
  );
}
