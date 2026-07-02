import { router, useLocalSearchParams } from "expo-router";
import { Pencil, Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { api } from "@/services/api";
import { colors } from "@/theme/colors";

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
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);

  useEffect(() => {
    if (workoutId) {
      api.workouts.detail(workoutId).then((data) => setWorkout(data as unknown as WorkoutDetail));
    }
  }, [workoutId]);

  if (!workout) return <LoadingState />;

  return (
    <Screen>
      <Title>{workout.name}</Title>
      <Subtitle>{workout.description ?? "Detalle de rutina"}</Subtitle>
      <AppButton
        label="Editar rutina"
        icon={Pencil}
        variant="secondary"
        onPress={() => router.push({ pathname: "/workouts/create", params: { workoutId: workout.id } })}
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
              label="Registrar este dia"
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

const styles = StyleSheet.create({
  day: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
});
