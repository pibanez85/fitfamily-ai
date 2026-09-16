import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { localDateKey, millisecondsUntilNextDay } from "../utils/localDate";

/** Invalidates daily views at local midnight and when the app resumes. */
export function useLocalDay(): string {
  const [today, setToday] = useState(() => localDateKey());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      setToday(localDateKey(now));
      timer = setTimeout(refresh, millisecondsUntilNextDay(now));
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    if (Platform.OS === "web" && typeof window !== "undefined")
      window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(timer);
      subscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined")
        window.removeEventListener("focus", refresh);
    };
  }, []);
  return today;
}
