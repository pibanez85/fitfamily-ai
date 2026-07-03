import { useFocusEffect } from "expo-router";
import { CalendarDays, Dumbbell, Flame, Gauge, Timer } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";
import {
  allWorkoutSets,
  formatVolume,
  getLogSets,
  logDurationMinutes,
  logVolume,
  type WorkoutLogDetail,
} from "@/utils/workoutAnalytics";

export default function WorkoutHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const [logs, setLogs] = useState<WorkoutLogDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      setError(null);
      api.workouts
        .logs(profileId)
        .then((data) => {
          if (alive) setLogs(data as WorkoutLogDetail[]);
        })
        .catch((caught) => {
          if (alive) setError(caught instanceof Error ? caught.message : "No pude cargar el historial.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId]),
  );

  const metrics = useMemo(() => buildHistoryMetrics(logs), [logs]);

  return (
    <Screen>
      <Title>Historial de entrenamientos</Title>
      <Subtitle>Revisa sesiones, volumen, esfuerzo y consistencia registrada.</Subtitle>

      {loading ? <LoadingState /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && logs.length === 0 ? (
        <EmptyState
          title="Sin historial todavía"
          body="Cuando guardes un entrenamiento, aquí veras volumen, series, duración y mejores ejercicios."
        />
      ) : null}

      {logs.length > 0 ? (
        <>
          <View style={styles.kpiGrid}>
            <Kpi icon={<Dumbbell size={17} color={colors.primary} />} label="Sesiones" value={String(logs.length)} />
            <Kpi icon={<Flame size={17} color={colors.energy} />} label="Volumen" value={formatVolume(metrics.totalVolume)} />
            <Kpi icon={<Gauge size={17} color={colors.accent} />} label="RPE prom." value={metrics.averageRpe ?? "-"} />
            <Kpi icon={<Timer size={17} color={colors.success} />} label="Duración" value={metrics.averageDuration} />
          </View>

          <Card>
            <Text style={styles.cardTitle}>Volumen reciente</Text>
            <View style={styles.barRow}>
              {metrics.volumeBars.map((bar) => (
                <View key={bar.id} style={styles.barItem}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${Math.max(8, bar.percent)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {logs.map((log) => (
            <HistoryCard key={log.id} log={log} />
          ))}
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

function HistoryCard({ log }: { log: WorkoutLogDetail }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sets = getLogSets(log);
  const volume = logVolume(log);
  const duration = logDurationMinutes(log);
  const exerciseNames = [...new Set(sets.map((set) => set.exercises?.name ?? "Ejercicio"))].slice(0, 4);
  const title = [log.workouts?.name, log.workoutDays?.name].filter(Boolean).join(" - ") || "Entrenamiento";
  const date = new Date(log.startedAt).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <Card>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleCol}>
          <Text style={styles.historyTitle}>{title}</Text>
          <View style={styles.inlineMeta}>
            <CalendarDays size={14} color={colors.muted} />
            <Text style={styles.historyDate}>{date}</Text>
          </View>
        </View>
        <View style={styles.effortBadge}>
          <Text style={styles.effortLabel}>RPE</Text>
          <Text style={styles.effortValue}>{log.perceivedEffort ?? "-"}</Text>
        </View>
      </View>

      <View style={styles.sessionStats}>
        <MiniStat label="Series" value={String(sets.length)} />
        <MiniStat label="Volumen" value={formatVolume(volume)} />
        <MiniStat label="Tiempo" value={duration ? `${duration} min` : "-"} />
      </View>

      {exerciseNames.length > 0 ? (
        <View style={styles.exerciseChips}>
          {exerciseNames.map((name) => (
            <Text key={name} style={styles.exerciseChip}>{name}</Text>
          ))}
        </View>
      ) : null}

      {log.notes ? <BodyText style={styles.notes}>{log.notes}</BodyText> : null}
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

function buildHistoryMetrics(logs: WorkoutLogDetail[]) {
  const sets = allWorkoutSets(logs);
  const totalVolume = logs.reduce((sum, log) => sum + logVolume(log), 0);
  const rpes = sets.map(({ set }) => set.rpe ?? 0).filter((value) => value > 0);
  const durations = logs.map(logDurationMinutes).filter((value): value is number => Boolean(value));
  const averageRpe = rpes.length
    ? (rpes.reduce((sum, value) => sum + value, 0) / rpes.length).toFixed(1)
    : null;
  const averageDuration = durations.length
    ? `${Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)} min`
    : "-";
  const recent = logs
    .slice(0, 8)
    .reverse()
    .map((log) => ({
      id: log.id,
      label: new Date(log.startedAt).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
      value: logVolume(log),
    }));
  const max = Math.max(1, ...recent.map((item) => item.value));
  return {
    totalVolume,
    averageRpe,
    averageDuration,
    volumeBars: recent.map((item) => ({ ...item, percent: (item.value / max) * 100 })),
  };
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
    barRow: { minHeight: 140, flexDirection: "row", alignItems: "flex-end", gap: 8, paddingTop: 8 },
    barItem: { flex: 1, alignItems: "center", gap: 6 },
    barTrack: {
      width: "100%",
      maxWidth: 32,
      height: 100,
      justifyContent: "flex-end",
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      overflow: "hidden",
    },
    barFill: { width: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
    barLabel: { color: colors.muted, fontSize: 10, fontWeight: "800" },
    historyHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    historyTitleCol: { flex: 1, gap: 6 },
    historyTitle: { color: colors.text, fontWeight: "900", fontSize: 17 },
    inlineMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
    historyDate: { color: colors.muted, fontWeight: "700", fontSize: 12 },
    effortBadge: {
      minWidth: 56,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.energySoft,
      borderWidth: 1,
      borderColor: colors.energy,
      paddingVertical: 6,
    },
    effortLabel: { color: colors.energy, fontWeight: "900", fontSize: 10 },
    effortValue: { color: colors.energy, fontWeight: "900", fontSize: 18 },
    sessionStats: { flexDirection: "row", gap: 8 },
    miniStat: {
      flex: 1,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 2,
    },
    miniValue: { color: colors.text, fontWeight: "900", fontSize: 14 },
    miniLabel: { color: colors.muted, fontWeight: "800", fontSize: 11 },
    exerciseChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    exerciseChip: {
      color: colors.primary,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 9,
      paddingVertical: 5,
      fontSize: 11,
      fontWeight: "800",
    },
    notes: { color: colors.muted },
  });
}
