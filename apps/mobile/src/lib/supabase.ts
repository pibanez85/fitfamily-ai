import "react-native-url-polyfill/auto";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { env, isDemoMode } from "@/config/env";

const memoryStorage = new Map<string, string>();

const secureStoreAdapter = {
  async getItem(key: string) {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

// ---------------------------------------------------------------------------
// Cliente demo: evita que createClient() crashee cuando no hay credenciales y
// permite que el flujo de auth funcione en memoria (Expo Go / web sin backend).
// ---------------------------------------------------------------------------
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

function buildDemoSession(email: string): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: DEMO_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email,
      app_metadata: { provider: "demo" },
      user_metadata: { demo: true },
      created_at: new Date().toISOString(),
    },
  } as unknown as Session;
}

function createDemoClient(): SupabaseClient {
  let session: Session | null = null;
  const listeners = new Set<(event: string, session: Session | null) => void>();

  function emit(event: string) {
    for (const listener of listeners) listener(event, session);
  }

  const auth = {
    async getSession() {
      return { data: { session }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            id: "demo-subscription",
            callback,
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      session = buildDemoSession(email || "demo@fitfamily.ai");
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    async signUp({ email }: { email: string; password: string }) {
      session = buildDemoSession(email || "demo@fitfamily.ai");
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: null };
    },
    async exchangeCodeForSession() {
      session = buildDemoSession("demo@fitfamily.ai");
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    async setSession() {
      session = buildDemoSession("demo@fitfamily.ai");
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    async updateUser() {
      return { data: { user: session?.user ?? buildDemoSession("demo@fitfamily.ai").user }, error: null };
    },
    async signOut() {
      session = null;
      emit("SIGNED_OUT");
      return { error: null };
    },
  };

  const storage = {
    from() {
      return {
        async upload() {
          return { data: { path: "demo" }, error: null };
        },
        async createSignedUrl() {
          return { data: { signedUrl: "https://demo.local/image.jpg" }, error: null };
        },
      };
    },
  };

  return { auth, storage } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isDemoMode
  ? createDemoClient()
  : createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
