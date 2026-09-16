import "react-native-url-polyfill/auto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { env, isDemoMode } from "@/config/env";
import { createDemoAuth } from "../services/demoSession";

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
// restaura únicamente el correo demo guardado en el dispositivo.
// ---------------------------------------------------------------------------
function createDemoClient(): SupabaseClient {
  const auth = createDemoAuth();

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
