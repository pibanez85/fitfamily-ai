/** Calendar dates stay in the device's local timezone, including DST changes. */
export function localDateKey(value: Date | string = new Date()): string {
  const isCalendarDate = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date =
    value instanceof Date ? value : new Date(isCalendarDate ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return "";
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return isCalendarDate && key !== value ? "" : key;
}

export function parseLocalDate(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error("Selecciona una fecha válida.");
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!, 12);
  if (localDateKey(date) !== key) throw new Error("Selecciona una fecha válida.");
  return date;
}

export function isLocalDate(key: string | undefined): key is string {
  if (!key) return false;
  try {
    parseLocalDate(key);
    return true;
  } catch {
    return false;
  }
}

export function addLocalDays(key: string, days: number): string {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function localNoonIso(key: string): string {
  return parseLocalDate(key).toISOString();
}

export function formatLocalDate(key: string): string {
  return parseLocalDate(key).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function datesEndingAt(key: string, count = 7): string[] {
  return Array.from({ length: count }, (_, index) => addLocalDays(key, index - count + 1));
}

export function millisecondsUntilNextDay(now: Date): number {
  // Do not add 24 hours: a local day can last 23 or 25 hours.
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(100, next.getTime() - now.getTime() + 100);
}

export function resolveSelectedDate(selected: string | null, today: string): string {
  return selected ?? today;
}
