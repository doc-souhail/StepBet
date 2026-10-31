import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// One shared Supabase client for the whole app.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage, // keeps you logged in between app launches
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // that's a web-only feature
      flowType: "pkce", // safer login flow for mobile
    },
  },
);
