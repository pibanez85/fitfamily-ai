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
import { useLocalDay } from "@/hooks/useLocalDay";
import { suggestedWorkoutDay } from "@/utils/workoutSchedule";
import { localDateKey } from "@/utils/localDate";

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
  const profileId = useActiveProfileId();
  return <ProfileToday key={profileId ?? "no-profile"} />;
}

function ProfileToday() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const activeWorkoutId = useAppStore((state) =>
    profileId ? (state.activeWorkoutByProfile[profileId] ?? null) : null,
  );
  const profile = useAppStore((state) => state.activeProfile());
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const today = useLocalDay();

  useFocusEffect(
    useCallback(() => {
      setCompletedToday(false);
      setAiResponse(null);
      setError(null);
      if (!profileId) return;
      if (!activeWorkoutId) {
        setWorkout(null);
        setLoading(false);
        return;
      }
      let alive = true;
      setLoading(true);
      setWorkout(null);
      setAiResponse(null);
      setError(null);
      Promise.all([api.workouts.detail(activeWorkoutId), api.workouts.logs(profileId)])
        .then(([data, logs]) => {
          if (alive) {
            if (data.profileId !== profileId)
              throw new Error("Esta rutina pertenece a otro perfil.");
            const detail = data as unknown as WorkoutDetail;
            setWorkout(detail);
            setSelectedDayIndex(
              suggestedWorkoutDay(
                [...(detail.workoutDays ?? [])].sort((a, b) => a.dayIndex - b.dayIndex),
                logs,
                activeWorkoutId,
                today,
              ),
            );
            setCompletedToday(
              logs.some(
                (log) => log.workoutId === activeWorkoutId && localDateKey(log.startedAt) === today,
              ),
            );
          }
        })
        .catch((caught) => {
          if (alive) {
            setWorkout(null);
            setError(caught instanceof Error ? caught.message : "No pudimos cargar tu rutina.");
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId, activeWorkoutId, today]),
  );

  const days = workout?.workoutDays ?? [];
  const sortedDays = useMemo(() => days.slice().sort((a, b) => a.dayIndex - b.dayIndex), [days]);
  const selectedDay = sortedDays[selectedDayIndex];

  async function askAi(prompt: string) {
    if (!profileId) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const context =
        workout && selectedDay
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
      <Title>Tu próximo paso.</Title>
      <Subtitle>
        {profile ? `${profile.displayName}, elige` : "Elige"} tu sesión y registra cada serie a tu
        ritmo.
      </Subtitle>

      {loading ? <LoadingState /> : null}
      {error ? <BodyText style={{ color: colors.danger }}>{error}</BodyText> : null}
      {completedToday ? (
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <BodyText>Ya registraste un entrenamiento hoy. Tu sesión está en el historial.</BodyText>
        </Card>
      ) : null}

      {!loading && !workout && !error ? (
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
          {selectedDayIndex === -1 ? (
            <View
              style={{ padding: 18, backgroundColor: colors.primarySoft, borderRadius: 12, gap: 8 }}
            >
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>
                Hoy toca recuperar.
              </Text>
              <BodyText>
                Tu rutina no programa pesas para hoy. Puedes revisar otra sesión usando los días de
                abajo.
              </BodyText>
            </View>
          ) : null}

          <View style={styles.daySelector}>
            {sortedDays.map((day, index) => {
              const active = index === selectedDayIndex;
              return (
                <Pressable
                  key={day.id}
                  accessibilityRole="button"
                  accessibilityLabel={day.name}
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedDayIndex(index)}
                  style={[styles.dayChip, active ? styles.dayChipActive : null]}
                >
                  <Text style={[styles.dayChipText, active ? styles.dayChipTextActive : null]}>
                    {day.name.includes("·") ? day.name.split(" · ")[0] : `Día ${index + 1}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <AppButton
            label="Empezar sesión"
            icon={Play}
            disabled={!selectedDay || loading}
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
                    {entry.notes ? (
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
                        {entry.notes.match(/RIR [^.]+/)?.[0] ?? entry.notes}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          ) : null}

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
          title="Consulta a tu coach"
          subtitle="Resuelve dudas sobre esta sesión. Las respuestas son sugerencias; puedes editar tu rutina desde Mis rutinas."
          chips={trainingPrompts}
          onAsk={askAi}
          response={aiResponse}
          loading={aiLoading}
          actions={
            aiResponse && !aiLoading
              ? [{ label: "Descartar", variant: "ghost", onPress: () => setAiResponse(null) }]
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
