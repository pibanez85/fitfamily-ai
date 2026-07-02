import { router, useFocusEffect } from "expo-router";
import { Activity, Check, Clock, Dumbbell, Pencil, Plus, Sparkles, Star, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { Workout } from "@fitfamily-ai/shared";
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

export default function WorkoutsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const setActiveWorkout = useAppStore((state) => state.setActiveWorkout);
  const activeWorkoutId = useAppStore((state) =>
    profileId ? state.activeWorkoutByProfile[profileId] ?? null : null,
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = useCallback(() => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    api.workouts
      .list(profileId)
      .then(setWorkouts)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "No pude cargar las rutinas.");
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  async function deleteWorkout(workout: Workout) {
    if (!profileId) return;
    setDeletingId(workout.id);
    setError(null);
    try {
      await api.workouts.delete(workout.id);
      setWorkouts((current) => current.filter((item) => item.id !== workout.id));
      if (workout.id === activeWorkoutId) setActiveWorkout(profileId, null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pude eliminar la rutina.");
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(workout: Workout) {
    Alert.alert(
      "Eliminar rutina",
      `Vas a eliminar "${workout.name}". El historial ya registrado se mantiene, pero la rutina base desaparece.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteWorkout(workout);
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Title>Rutinas</Title>
      <Subtitle>Tu rutina base se ejecuta cada semana. Puedes modificarla por dia con la IA.</Subtitle>

      <AppButton label="Crear rutina con IA" icon={Sparkles} onPress={() => router.push("/workouts/create")} />
      <AppButton
        label="Crear manualmente"
        icon={Plus}
        variant="secondary"
        onPress={() => router.push("/workouts/create")}
      />
      <View style={styles.row}>
        <AppButton
          label="Registrar entreno"
          icon={Dumbbell}
          variant="secondary"
          style={styles.flex}
          onPress={() => router.push("/workouts/log")}
        />
        <AppButton
          label="Historial"
          icon={Clock}
          variant="secondary"
          style={styles.flex}
          onPress={() => router.push("/workouts/history")}
        />
      </View>
      <AppButton
        label="Progreso por ejercicio"
        icon={Activity}
        variant="secondary"
        onPress={() => router.push("/workouts/progress")}
      />

      {loading ? <LoadingState /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && workouts.length === 0 ? (
        <EmptyState
          title="Aun no tienes rutinas"
          body="Crea tu primera rutina para que la app te guie dia a dia. Demora un par de minutos."
        />
      ) : null}

      {workouts.map((workout) => {
        const isActive = workout.id === activeWorkoutId;
        return (
          <Pressable key={workout.id} onPress={() => router.push(`/workouts/${workout.id}`)}>
            <Card style={isActive ? styles.activeCard : undefined}>
              <View style={styles.header}>
                <Text style={styles.name}>{workout.name}</Text>
                {isActive ? (
                  <View style={styles.badge}>
                    <Star size={12} color={colors.onPrimary} />
                    <Text style={styles.badgeText}>Activa</Text>
                  </View>
                ) : null}
              </View>
              <BodyText style={styles.meta}>
                {workout.goal ?? workout.description ?? "Rutina sin descripcion."}
              </BodyText>
              <View style={styles.cardActions}>
                {!isActive ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={(event) => {
                      event.stopPropagation();
                      if (profileId) setActiveWorkout(profileId, workout.id);
                    }}
                    style={styles.actionPill}
                  >
                    <Check size={14} color={colors.primary} />
                    <Text style={styles.actionPillText}>Marcar activa</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={(event) => {
                      event.stopPropagation();
                      if (profileId) setActiveWorkout(profileId, null);
                    }}
                    style={styles.actionPill}
                  >
                    <Text style={styles.actionPillText}>Desactivar</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    router.push({ pathname: "/workouts/create", params: { workoutId: workout.id } });
                  }}
                  style={styles.actionPill}
                >
                  <Pencil size={14} color={colors.primary} />
                  <Text style={styles.actionPillText}>Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={deletingId === workout.id}
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmDelete(workout);
                  }}
                  style={[styles.actionPill, styles.deletePill, deletingId === workout.id ? styles.disabled : null]}
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text style={[styles.actionPillText, styles.deletePillText]}>
                    {deletingId === workout.id ? "Eliminando..." : "Eliminar"}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: 10 },
    flex: { flex: 1 },
    activeCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    name: { color: colors.text, fontSize: 17, fontWeight: "900", flex: 1, paddingRight: 8 },
    meta: { color: colors.muted },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: { color: colors.onPrimary, fontWeight: "900", fontSize: 11 },
    cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    actionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    actionPillText: { color: colors.primary, fontWeight: "800", fontSize: 12 },
    deletePill: { borderColor: colors.danger },
    deletePillText: { color: colors.danger },
    disabled: { opacity: 0.55 },
    error: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  });
}
