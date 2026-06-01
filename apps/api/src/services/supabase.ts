import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Env } from "../config/env";
import { AppError } from "../utils/AppError";

export class SupabaseService {
  public readonly admin: SupabaseClient;
  private readonly authClient: SupabaseClient;

  constructor(env: Env) {
    this.admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.authClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getUserFromToken(token: string): Promise<User> {
    const { data, error } = await this.authClient.auth.getUser(token);

    if (data.user) {
      return data.user;
    }

    const adminResult = await this.admin.auth.getUser(token);

    if (adminResult.data.user) {
      return adminResult.data.user;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("Supabase token validation failed", {
        publicClientError: error?.message,
        adminClientError: adminResult.error?.message,
      });
    }

    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired Supabase token.");
  }
}
