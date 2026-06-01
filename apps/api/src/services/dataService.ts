import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../utils/AppError";
import { toCamel, toSnake } from "../utils/case";

export type Row = Record<string, unknown>;

const notFoundCode = "PGRST116";

export class DataService {
  constructor(public readonly client: SupabaseClient) {}

  async list(table: string, options: { select?: string; order?: string } = {}): Promise<unknown[]> {
    let query = this.client.from(table).select(options.select ?? "*");

    if (options.order) {
      query = query.order(options.order, { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new AppError(500, "DB_QUERY_FAILED", error.message);

    return toCamel(data ?? []);
  }

  async listBy(
    table: string,
    column: string,
    value: string,
    options: { select?: string; order?: string; limit?: number } = {},
  ): Promise<unknown[]> {
    let query = this.client.from(table).select(options.select ?? "*").eq(column, value);

    if (options.order) {
      query = query.order(options.order, { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw new AppError(500, "DB_QUERY_FAILED", error.message);

    return toCamel(data ?? []);
  }

  async getById(table: string, id: string, select = "*"): Promise<Row> {
    const { data, error } = await this.client.from(table).select(select).eq("id", id).single();

    if (error?.code === notFoundCode) {
      throw new AppError(404, "NOT_FOUND", `${table} record was not found.`);
    }

    if (error) throw new AppError(500, "DB_QUERY_FAILED", error.message);

    return toCamel(data as unknown as Row);
  }

  async getRawById(table: string, id: string, select = "*"): Promise<Row> {
    const { data, error } = await this.client.from(table).select(select).eq("id", id).single();

    if (error?.code === notFoundCode) {
      throw new AppError(404, "NOT_FOUND", `${table} record was not found.`);
    }

    if (error) throw new AppError(500, "DB_QUERY_FAILED", error.message);

    return data as unknown as Row;
  }

  async maybeRawById(table: string, id: string, select = "*"): Promise<Row | null> {
    const { data, error } = await this.client.from(table).select(select).eq("id", id).maybeSingle();

    if (error) throw new AppError(500, "DB_QUERY_FAILED", error.message);

    return (data as unknown as Row | null) ?? null;
  }

  async insert(table: string, input: Row, select = "*"): Promise<Row> {
    const { data, error } = await this.client
      .from(table)
      .insert(toSnake(input))
      .select(select)
      .single();

    if (error) throw new AppError(500, "DB_INSERT_FAILED", error.message);

    return toCamel(data as unknown as Row);
  }

  async bulkInsert(table: string, input: Row[], select = "*"): Promise<Row[]> {
    if (input.length === 0) return [];

    const { data, error } = await this.client.from(table).insert(toSnake(input)).select(select);

    if (error) throw new AppError(500, "DB_INSERT_FAILED", error.message);

    return toCamel((data ?? []) as unknown as Row[]);
  }

  async update(table: string, id: string, input: Row, select = "*"): Promise<Row> {
    const { data, error } = await this.client
      .from(table)
      .update(toSnake(input))
      .eq("id", id)
      .select(select)
      .single();

    if (error?.code === notFoundCode) {
      throw new AppError(404, "NOT_FOUND", `${table} record was not found.`);
    }

    if (error) throw new AppError(500, "DB_UPDATE_FAILED", error.message);

    return toCamel(data as unknown as Row);
  }

  async remove(table: string, id: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq("id", id);
    if (error) throw new AppError(500, "DB_DELETE_FAILED", error.message);
  }
}
