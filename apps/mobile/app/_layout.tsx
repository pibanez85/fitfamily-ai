import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LoadingState } from "@/components/StateViews";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";
import { ThemeProvider, useTheme } from "@/theme/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const setSession = useAppStore((state) => state.setSession);
  const setProfiles = useAppStore((state) => state.setProfiles);

  useEffect(() => {
    let alive = true;

    async function restoreSession() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          if (alive) setSession(null);
          return;
        }

        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut();
          if (alive) {
            setSession(null);
            setProfiles([]);
          }
          return;
        }

        if (alive) setSession(data.session);
      } finally {
        if (alive) setReady(true);
      }
    }

    restoreSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [setProfiles, setSession]);

  if (!ready) {
    return <LoadingState label="Preparando FitFamily AI..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="profiles/index" />
      <Stack.Screen name="profiles/edit" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="today" />
      <Stack.Screen name="workouts/index" />
      <Stack.Screen name="workouts/[workoutId]" />
      <Stack.Screen name="workouts/create" />
      <Stack.Screen name="workouts/log" />
      <Stack.Screen name="workouts/history" />
      <Stack.Screen name="workouts/progress" />
      <Stack.Screen name="exercises/[exerciseId]" />
      <Stack.Screen name="meals/index" />
      <Stack.Screen name="meals/new" />
      <Stack.Screen name="meals/photo" />
      <Stack.Screen name="meals/analysis" />
      <Stack.Screen name="meals/confirm" />
      <Stack.Screen name="machines/photo" />
      <Stack.Screen name="machines/analysis" />
      <Stack.Screen name="progress/index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="body-metrics" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="wearables/index" />
    </Stack>
  );
}
