import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../lib/auth";
import { colors } from "../theme";

// Redirects based on login state:
// not logged in -> login screen, logged in -> dashboard
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
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: "My competitions" }} />
        <Stack.Screen name="create" options={{ title: "New competition" }} />
        <Stack.Screen
          name="competition/[id]"
          options={{ title: "Competition" }}
        />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
      </Stack>
      <AuthGate />
    </AuthProvider>
  );
}
