import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Pencil, Play } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { api } from "@/services/api";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";
import { useActiveProfileId } from "@/lib/activeProfile";

type WorkoutDetail = {
  id: string;
  name: string;
  description?: string | null;
  workoutDays?: Array<{
    id: string;
    name: string;
    dayIndex: number;
    workoutDayExercises?: Array<{
      id: string;
      targetSets?: number | null;
      targetReps?: string | null;
      exercises?: { name?: string } | null;
    }>;
  }>;
};

export default function WorkoutDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileId = useActiveProfileId();

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setWorkout(null);
      setError(null);
      if (workoutId && profileId) {
        api.workouts
          .detail(workoutId)
          .then((data) => {
            if (!alive) return;
            if (data.profileId !== profileId)
              throw new Error("Esta rutina pertenece a otro perfil.");
            setWorkout(data as unknown as WorkoutDetail);
          })
          .catch((caught) => {
            if (alive)
              setError(caught instanceof Error ? caught.message : "No pudimos cargar la rutina.");
          });
      }
      return () => {
        alive = false;
      };
    }, [workoutId, profileId]),
  );

  if (error)
    return (
      <Screen>
        <BodyText>{error}</BodyText>
        <AppButton label="Mis rutinas" onPress={() => router.replace("/workouts")} />
      </Screen>
    );
  if (!workout) return <LoadingState />;

  return (
    <Screen>
      <Title>{workout.name}</Title>
      <Subtitle>{workout.workoutDays?.length ?? 0} sesiones · Tu plan para esta semana</Subtitle>
      {workout.description ? (
        <>
          <Pressable accessibilityRole="button" onPress={() => setShowNotes((value) => !value)}>
            <Text style={{ color: colors.primary, fontWeight: "600", paddingVertical: 10 }}>
              {showNotes ? "Ocultar indicaciones" : "Ver indicaciones de la rutina"}
            </Text>
          </Pressable>
          {showNotes ? (
            <Card>
              <BodyText>{workout.description.replace(/\[plantilla:[^\]]+\]/g, "").trim()}</BodyText>
            </Card>
          ) : null}
        </>
      ) : null}
      <AppButton
        label="Editar rutina"
        icon={Pencil}
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/workouts/create", params: { workoutId: workout.id } })
        }
      />
      {workout.workoutDays
        ?.slice()
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .map((day) => (
          <Card key={day.id}>
            <Text style={styles.day}>{day.name}</Text>
            {day.workoutDayExercises?.map((entry) => (
              <BodyText key={entry.id}>
                {entry.exercises?.name ?? "Ejercicio"} - {entry.targetSets ?? "-"} series -{" "}
                {entry.targetReps ?? "-"} reps
              </BodyText>
            ))}
            <AppButton
              label="Registrar este día"
              icon={Play}
              onPress={() =>
                router.push({
                  pathname: "/workouts/log",
                  params: {
                    workoutId: workout.id,
                    workoutDayId: day.id,
                    dayIndex: String(day.dayIndex),
                  },
                })
              }
            />
          </Card>
        ))}
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    day: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900",
    },
  });
}
