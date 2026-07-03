import { useFocusEffect } from "expo-router";
import { Activity, Dumbbell, TrendingUp, Trophy } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";
import {
  buildExerciseProgress,
  formatKg,
  formatVolume,
  type ExerciseProgressSummary,
  type WorkoutLogDetail,
} from "@/utils/workoutAnalytics";

export default function ExerciseProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const [logs, setLogs] = useState<WorkoutLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      setError(null);
      api.workouts
        .logs(profileId)
        .then((data) => {
          if (!alive) return;
          setLogs(data as WorkoutLogDetail[]);
        })
        .catch((caught) => {
          if (alive) setError(caught instanceof Error ? caught.message : "No pude cargar el progreso.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId]),
  );

  const progress = useMemo(() => buildExerciseProgress(logs), [logs]);
  const selected = progress.find((item) => item.exerciseId === selectedId) ?? progress[0] ?? null;
  const totalVolume = progress.reduce((sum, item) => sum + item.totalVolume, 0);
  const improving = progress.filter((item) => item.weightDelta > 0).length;

  return (
    <Screen>
      <Title>Progreso por ejercicio</Title>
      <Subtitle>Mejores pesos, volumen acumulado y tendencia por ejercicio registrado.</Subtitle>

      {loading ? <LoadingState /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && progress.length === 0 ? (
        <EmptyState
          title="Aún no hay series registradas"
          body="Guarda entrenamientos con repeticiones y peso para ver graficas de avance."
        />
      ) : null}

      {progress.length > 0 ? (
        <>
          <View style={styles.kpiGrid}>
            <Kpi icon={<Dumbbell size={17} color={colors.primary} />} label="Ejercicios" value={String(progress.length)} />
            <Kpi icon={<Activity size={17} color={colors.energy} />} label="Volumen" value={formatVolume(totalVolume)} />
            <Kpi icon={<TrendingUp size={17} color={colors.success} />} label="Subiendo" value={String(improving)} />
            <Kpi icon={<Trophy size={17} color={colors.accent} />} label="Mejor peso" value={formatKg(Math.max(...progress.map((item) => item.bestWeight)))} />
          </View>

          <Card>
            <Text style={styles.cardTitle}>Selecciona ejercicio</Text>
            <View style={styles.exerciseList}>
              {progress.map((item) => {
                const active = item.exerciseId === selected?.exerciseId;
                return (
                  <Pressable
                    key={item.exerciseId}
                    onPress={() => setSelectedId(item.exerciseId)}
                    style={[styles.exerciseOption, active ? styles.exerciseOptionActive : null]}
                  >
                    <View style={styles.exerciseOptionText}>
                      <Text style={[styles.exerciseName, active ? styles.exerciseNameActive : null]}>
                        {item.exerciseName}
                      </Text>
                      <Text style={styles.exerciseMeta}>
                        {item.primaryMuscle} - {item.sessions} sesiones - {formatVolume(item.totalVolume)}
                      </Text>
                    </View>
                    <Text style={[styles.exerciseDelta, item.weightDelta > 0 ? styles.deltaUp : null]}>
                      {item.weightDelta > 0 ? `+${item.weightDelta.toFixed(1)} kg` : formatKg(item.bestWeight)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {selected ? <ExerciseDetail item={selected} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card style={styles.kpiCard}>
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

function ExerciseDetail({ item }: { item: ExerciseProgressSummary }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxTrend = Math.max(1, ...item.trend.map((entry) => entry.value));

  return (
    <Card>
      <Text style={styles.detailTitle}>{item.exerciseName}</Text>
      <Text style={styles.detailSub}>{item.primaryMuscle}</Text>

      <View style={styles.statGrid}>
        <MiniStat label="Mejor peso" value={formatKg(item.bestWeight)} />
        <MiniStat label="Mejores reps" value={item.bestReps ? String(item.bestReps) : "-"} />
        <MiniStat label="Volumen" value={formatVolume(item.totalVolume)} />
        <MiniStat label="RPE prom." value={item.averageRpe ? String(item.averageRpe) : "-"} />
      </View>

      <View style={styles.trendHeader}>
        <Text style={styles.cardTitle}>Tendencia de volumen</Text>
        <Text style={styles.trendHint}>Ultimas {item.trend.length} sesiones</Text>
      </View>
      <View style={styles.barRow}>
        {item.trend.map((entry) => (
          <View key={`${entry.label}-${entry.value}`} style={styles.barItem}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max(8, (entry.value / maxTrend) * 100)}%`,
                    backgroundColor: entry.weight >= item.bestWeight ? colors.energy : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{entry.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    error: { color: colors.danger, fontWeight: "700", fontSize: 13 },
    kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    kpiCard: { width: "47%", gap: 7 },
    kpiIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    kpiValue: { color: colors.text, fontWeight: "900", fontSize: 20 },
    kpiLabel: { color: colors.muted, fontWeight: "800", fontSize: 12 },
    cardTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
    exerciseList: { gap: 8 },
    exerciseOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
    },
    exerciseOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    exerciseOptionText: { flex: 1, gap: 3 },
    exerciseName: { color: colors.text, fontWeight: "900", fontSize: 14 },
    exerciseNameActive: { color: colors.primary },
    exerciseMeta: { color: colors.muted, fontWeight: "700", fontSize: 12 },
    exerciseDelta: { color: colors.muted, fontWeight: "900", fontSize: 12 },
    deltaUp: { color: colors.success },
    detailTitle: { color: colors.text, fontWeight: "900", fontSize: 20 },
    detailSub: { color: colors.muted, fontWeight: "800", fontSize: 13 },
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    miniStat: {
      width: "47%",
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 3,
    },
    miniValue: { color: colors.text, fontWeight: "900", fontSize: 15 },
    miniLabel: { color: colors.muted, fontWeight: "800", fontSize: 11 },
    trendHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    trendHint: { color: colors.muted, fontWeight: "700", fontSize: 11 },
    barRow: { minHeight: 150, flexDirection: "row", alignItems: "flex-end", gap: 9, paddingTop: 10 },
    barItem: { flex: 1, alignItems: "center", gap: 6 },
    barTrack: {
      width: "100%",
      maxWidth: 36,
      height: 110,
      justifyContent: "flex-end",
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      overflow: "hidden",
    },
    barFill: { width: "100%", borderRadius: radius.pill },
    barLabel: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  });
}
