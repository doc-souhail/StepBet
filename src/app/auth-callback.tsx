import { Redirect } from "expo-router";

// The login link lands here. The real login work is done in lib/auth.tsx,
// so this screen only needs to send the user back to the root.
// AuthGate then forwards logged-in users to the dashboard.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
