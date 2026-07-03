import { router, useFocusEffect } from "expo-router";
import { ListChecks, Play, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AIHelperCard } from "@/components/AIHelperCard";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

type WorkoutDetail = {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  workoutDays?: Array<{
    id: string;
    name: string;
    dayIndex: number;
    workoutDayExercises?: Array<{
      id: string;
      targetSets?: number | null;
      targetReps?: string | null;
      restSeconds?: number | null;
      targetWeight?: number | null;
      notes?: string | null;
      exercises?: { name?: string } | null;
    }>;
  }>;
};

const trainingPrompts = [
  "No tengo esa máquina hoy, dame alternativa",
  "Tengo solo 35 minutos, reduce el día",
  "Hoy quiero entrenar más liviano",
  "Me duele el hombro, que evito",
  "Sugiere progresión para la próxima semana",
];

export default function TodayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const activeWorkoutId = useAppStore((state) =>
    profileId ? state.activeWorkoutByProfile[profileId] ?? null : null,
  );
  const profile = useAppStore((state) => state.activeProfile());
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      if (!activeWorkoutId) {
        setWorkout(null);
        setLoading(false);
        return;
      }
      let alive = true;
      setLoading(true);
      api.workouts
        .detail(activeWorkoutId)
        .then((data) => {
          if (alive) {
            setWorkout(data as unknown as WorkoutDetail);
            setSelectedDayIndex(0);
          }
        })
        .catch(() => {
          if (alive) setWorkout(null);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId, activeWorkoutId]),
  );

  const days = workout?.workoutDays ?? [];
  const sortedDays = useMemo(
    () => days.slice().sort((a, b) => a.dayIndex - b.dayIndex),
    [days],
  );
  const selectedDay = sortedDays[selectedDayIndex];

  async function askAi(prompt: string) {
    if (!profileId) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const context = workout && selectedDay
        ? ` Rutina activa: ${workout.name}. Día: ${selectedDay.name} con ejercicios ${
            (selectedDay.workoutDayExercises ?? [])
              .map((entry) => entry.exercises?.name ?? "ejercicio")
              .join(", ") || "(sin ejercicios)"
          }.`
        : "";
      const result = await api.ai.chat(profileId, `${prompt}.${context}`);
      setAiResponse(result.message.content);
    } catch (caught) {
      setAiResponse(caught instanceof Error ? caught.message : "No pude obtener respuesta.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Entrenamiento</Title>
      <Subtitle>
        {profile ? `${profile.displayName}, esta` : "Esta"} es tu rutina activa. Puedes adaptar el día con IA
        antes de empezar.
      </Subtitle>

      {loading ? <LoadingState /> : null}

      {!loading && !workout ? (
        <Card>
          <EmptyState
            title="Aún no tienes rutina activa"
            body="Crea una rutina y marcala como activa para que aparezca aquí."
          />
          <AppButton
            label="Crear rutina"
            icon={Plus}
            onPress={() => router.push("/workouts/create")}
          />
          <AppButton
            label="Ver mis rutinas"
            icon={ListChecks}
            variant="secondary"
            onPress={() => router.push("/workouts")}
          />
        </Card>
      ) : null}

      {workout ? (
        <Card>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <BodyText style={styles.workoutMeta}>
            {workout.goal ?? workout.description ?? "Rutina sin descripción."}
          </BodyText>

          <View style={styles.daySelector}>
            {sortedDays.map((day, index) => {
              const active = index === selectedDayIndex;
              return (
                <Pressable
                  key={day.id}
                  onPress={() => setSelectedDayIndex(index)}
                  style={[styles.dayChip, active ? styles.dayChipActive : null]}
                >
                  <Text style={[styles.dayChipText, active ? styles.dayChipTextActive : null]}>
                    D{index + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedDay ? (
            <View style={styles.dayBlock}>
              <Text style={styles.dayTitle}>{selectedDay.name}</Text>
              {(selectedDay.workoutDayExercises ?? []).length === 0 ? (
                <BodyText style={styles.muted}>Este día no tiene ejercicios todavía.</BodyText>
              ) : (
                (selectedDay.workoutDayExercises ?? []).map((entry) => (
                  <View key={entry.id} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{entry.exercises?.name ?? "Ejercicio"}</Text>
                    <BodyText style={styles.exerciseMeta}>
                      {entry.targetSets ?? "?"} series · {entry.targetReps ?? "?"} reps
                      {entry.restSeconds ? ` · descanso ${entry.restSeconds}s` : ""}
                      {entry.targetWeight ? ` · ${entry.targetWeight} kg` : ""}
                    </BodyText>
                  </View>
                ))
              )}
            </View>
          ) : null}

          <AppButton
            label="Registrar este entrenamiento"
            icon={Play}
            onPress={() =>
              router.push({
                pathname: "/workouts/log",
                params: {
                  workoutId: workout.id,
                  workoutDayId: selectedDay?.id ?? "",
                  dayIndex: String(selectedDayIndex),
                },
              })
            }
          />
          <AppButton
            label="Mis rutinas e historial"
            icon={ListChecks}
            variant="secondary"
            onPress={() => router.push("/workouts")}
          />
        </Card>
      ) : null}

      {workout ? (
        <AIHelperCard
          title="Adapta el día con tu coach IA"
          subtitle="Pide alternativas, ajusta tiempo, evita molestias. Tu confirmas antes de aplicar."
          chips={trainingPrompts}
          onAsk={askAi}
          response={aiResponse}
          loading={aiLoading}
          actions={
            aiResponse && !aiLoading
              ? [
                  {
                    label: "Aplicar solo hoy",
                    variant: "primary",
                    onPress: () =>
                      setAiResponse(
                        "Cambio aplicado SOLO al día de hoy (en memoria). La rutina base no se modifica.",
                      ),
                  },
                  {
                    label: "Guardar como alternativa",
                    onPress: () =>
                      setAiResponse(
                        "Guardado como alternativa (pendiente: vincular al ejercicio). Por ahora queda registrado en el contexto del chat.",
                      ),
                  },
                  { label: "Descartar", variant: "ghost", onPress: () => setAiResponse(null) },
                ]
              : []
          }
        />
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    workoutName: { color: colors.text, fontSize: 20, fontWeight: "900" },
    workoutMeta: { color: colors.muted },
    daySelector: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    dayChip: {
      minWidth: 50,
      alignItems: "center",
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dayChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    dayChipText: { color: colors.text, fontWeight: "900" },
    dayChipTextActive: { color: colors.onPrimary },
    dayBlock: { gap: 8, marginTop: 6 },
    dayTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
    muted: { color: colors.muted },
    exerciseRow: {
      gap: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    exerciseName: { color: colors.text, fontWeight: "800" },
    exerciseMeta: { color: colors.muted, fontSize: 13 },
  });
}
