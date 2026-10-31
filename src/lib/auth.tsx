import { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { supabase } from "./supabase";

// Needed so the browser window closes properly after Google login.
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the saved session at startup
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    // Stay in sync with login / logout / token refresh
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    // Where Google/Supabase should send the user back to in our app
    const redirectTo = Linking.createURL("auth-callback");
    console.log("redirectTo =", redirectTo); // useful if Supabase rejects the URL

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw error ?? new Error("No login URL");

    // Open Google login in an in-app browser, wait for the redirect back
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return; // user cancelled

    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code !== "string")
      throw new Error("Login failed: no code returned");

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
