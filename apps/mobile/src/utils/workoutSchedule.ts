import type { WorkoutLog } from "@fitfamily-ai/shared";
import { localDateKey, parseLocalDate } from "./localDate";

type Day = { id: string; name: string; dayIndex: number };
const weekdays = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const plain = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Calendar-named routines follow their schedule; others advance after the last session. */
export function suggestedWorkoutDay(
  days: Day[],
  logs: WorkoutLog[],
  workoutId: string,
  today: string,
): number {
  if (!days.length) return -1;
  const scheduled = days.every((day) => weekdays.some((name) => plain(day.name).startsWith(name)));
  if (scheduled) {
    const weekday = weekdays[parseLocalDate(today).getDay()]!;
    return days.findIndex((day) => plain(day.name).startsWith(weekday));
  }
  const relevant = logs
    .filter((log) => log.workoutId === workoutId && localDateKey(log.startedAt) <= today)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const latest = relevant[0];
  const lastIndex = days.findIndex((day) => day.id === latest?.workoutDayId);
  return lastIndex < 0
    ? 0
    : localDateKey(latest!.startedAt) === today
      ? lastIndex
      : (lastIndex + 1) % days.length;
}
