import type { Session } from "@supabase/supabase-js";
import { deviceStorage } from "./localStorage";

export const DEMO_SESSION_STORAGE_KEY = "fitfamily.demo.session.v1";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

function buildDemoSession(email: string): Session {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: timestamp + 3600,
    user: {
      id: DEMO_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email,
      app_metadata: { provider: "demo" },
      user_metadata: { demo: true },
      created_at: new Date().toISOString(),
    },
  };
}

/** Local simulator only: this never receives, saves or validates real auth tokens. */
export function createDemoAuth() {
  let session: Session | null = null;
  let initialized = false;
  let queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<(event: string, current: Session | null) => void>();

  async function hydrate() {
    if (initialized) return;
    const raw = await deviceStorage.getItem(DEMO_SESSION_STORAGE_KEY);
    if (raw !== null) {
      let saved: unknown;
      try {
        saved = JSON.parse(raw);
      } catch {
        throw new Error("La sesión demo guardada no se puede leer.");
      }
      if (
        typeof saved !== "object" ||
        saved === null ||
        !("version" in saved) ||
        saved.version !== 1 ||
        !("mode" in saved) ||
        saved.mode !== "demo" ||
        !("email" in saved) ||
        typeof saved.email !== "string" ||
        !saved.email.trim()
      )
        throw new Error("La sesión demo guardada no se puede leer.");
      session = buildDemoSession(saved.email);
    }
    initialized = true;
  }

  function run<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(async () => {
      await hydrate();
      return operation();
    });
    queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  function emit(event: string) {
    for (const listener of listeners) listener(event, session);
  }

  async function signIn(email = "demo@fitfamily.ai") {
    const nextSession = buildDemoSession(email.trim() || "demo@fitfamily.ai");
    try {
      await deviceStorage.setItem(
        DEMO_SESSION_STORAGE_KEY,
        JSON.stringify({ version: 1, mode: "demo", email: nextSession.user.email }),
      );
    } catch {
      throw new Error(
        "No se pudo guardar la sesión demo en este dispositivo. Inténtalo nuevamente.",
      );
    }
    session = nextSession;
    emit("SIGNED_IN");
    return { data: { session, user: session.user }, error: null };
  }

  return {
    getSession: () => run(async () => ({ data: { session }, error: null })),
    getUser: () => run(async () => ({ data: { user: session?.user ?? null }, error: null })),
    onAuthStateChange(callback: (event: string, current: Session | null) => void) {
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
    signInWithPassword: ({ email }: { email: string; password: string }) =>
      run(() => signIn(email)),
    signUp: ({ email }: { email: string; password: string }) => run(() => signIn(email)),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    exchangeCodeForSession: () => run(() => signIn()),
    setSession: () => run(() => signIn()),
    updateUser: () => run(async () => ({ data: { user: session?.user ?? null }, error: null })),
    signOut: () =>
      run(async () => {
        try {
          await deviceStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
        } catch {
          throw new Error(
            "No se pudo cerrar la sesión demo en este dispositivo. Inténtalo nuevamente.",
          );
        }
        session = null;
        emit("SIGNED_OUT");
        return { error: null };
      }),
  };
}
