import React from "react";
import { router, useFocusEffect } from "expo-router";
import {
  Bot,
  ChevronRight,
  Dumbbell,
  Flame,
  MessageSquare,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type { BodyMetric, Meal } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import {
  buildExerciseProgress,
  logVolume,
  type WorkoutLogDetail,
} from "@/utils/workoutAnalytics";
import { computeNutritionGoals, type NutritionGoals } from "@/utils/nutritionGoals";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

// ─── Tipos y periodo ─────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };
const PERIOD_LABEL: Record<Period, string> = {
  "7d": "últimos 7 días",
  "30d": "últimos 30 días",
  "90d": "últimos 90 días",
};

const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

type VolumeBar = { label: string; value: number };
type NutritionDay = { day: string; calories: number; protein: number; workout: boolean };
type WeightPoint = { label: string; weight: number; fat: number | null };
type PersonalRecord = { exercise: string; kg: number; date: string; deltaKg: number };

type ProgressData = {
  sessions: number;
  sessionsPrev: number;
  avgCalories: number | null;
  avgProtein: number | null;
  latestWeight: number | null;
  latestFat: number | null;
  weightDelta: number | null;
  volumeBars: VolumeBar[];
  volumeTrendPct: number | null;
  nutritionWeek: NutritionDay[];
  cross: { workoutCal: number; restCal: number; workoutProt: number; restProt: number } | null;
  weightPoints: WeightPoint[];
  personalRecords: PersonalRecord[];
  hasAnyData: boolean;
};

// ─── Pantalla ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profile = useAppStore((state) =>
    state.profiles.find((entry) => entry.id === state.activeProfileId) ?? null,
  );
  const [period, setPeriod] = useState<Period>("30d");
  const [logs, setLogs] = useState<WorkoutLogDetail[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      setError(null);
      Promise.all([
        api.workouts.logs(profileId),
        api.meals.list(profileId),
        api.bodyMetrics.list(profileId),
      ])
        .then(([logsData, mealsData, metricsData]) => {
          if (!alive) return;
          setLogs(logsData as WorkoutLogDetail[]);
          setMeals(mealsData);
          setMetrics(metricsData);
        })
        .catch((caught) => {
          if (alive) setError(caught instanceof Error ? caught.message : "No pude cargar tu progreso.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId]),
  );

  const data = useMemo(() => buildProgressData(logs, meals, metrics, period), [logs, meals, metrics, period]);
  const goals = useMemo(() => computeNutritionGoals(profile, data.latestWeight), [profile, data.latestWeight]);
  const summary = useMemo(() => buildSummaryText(data, goals, period), [data, goals, period]);

  const sessionsSub =
    data.sessionsPrev === data.sessions
      ? "igual que antes"
      : data.sessions > data.sessionsPrev
        ? `+${data.sessions - data.sessionsPrev} vs periodo ant.`
        : `${data.sessions - data.sessionsPrev} vs periodo ant.`;

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Avances</Text>
          <Text style={styles.screenSub}>Tu entreno y nutrición, con datos reales</Text>
        </View>
        <View style={styles.periodRow}>
          {(["7d", "30d", "90d"] as Period[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setPeriod(option)}
              style={[styles.periodBtn, period === option && styles.periodBtnActive]}
            >
              <Text style={[styles.periodLabel, period === option && styles.periodLabelActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? <LoadingState label="Cargando tu progreso..." /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && !data.hasAnyData ? (
        <Card>
          <EmptyState
            title="Aún no hay datos de progreso"
            body="Registra tu primer entrenamiento, una comida o tu peso y esta pantalla se irá llenando con tus avances reales."
          />
          <AppButton
            label="Registrar mi primer entreno"
            icon={Dumbbell}
            onPress={() => router.push("/workouts/log")}
          />
          <AppButton
            label="Registrar mi peso"
            icon={Scale}
            variant="secondary"
            onPress={() => router.push("/body-metrics")}
          />
        </Card>
      ) : null}

      {!loading && !error && data.hasAnyData ? (
        <>
          {/* ── KPIs ── */}
          <View style={styles.kpiRow}>
            <KpiCard
              icon={Zap}
              label="Sesiones"
              value={String(data.sessions)}
              sub={sessionsSub}
              subPositive={data.sessions >= data.sessionsPrev}
              color={colors.primary}
              colors={colors}
            />
            <KpiCard
              icon={Flame}
              label="Kcal/día"
              value={data.avgCalories != null ? String(data.avgCalories) : "-"}
              sub={data.avgProtein != null ? `${data.avgProtein}g prot.` : "sin comidas"}
              subPositive
              color={colors.energy}
              colors={colors}
            />
            <KpiCard
              icon={data.weightDelta != null && data.weightDelta > 0 ? TrendingUp : TrendingDown}
              label="Peso"
              value={data.latestWeight != null ? `${data.latestWeight} kg` : "-"}
              sub={
                data.weightDelta != null
                  ? `${data.weightDelta > 0 ? "+" : ""}${data.weightDelta.toFixed(1)} kg`
                  : "sin registros"
              }
              subPositive
              color={colors.success}
              colors={colors}
            />
          </View>

          {/* ── Resumen del periodo ── */}
          <Card style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <Sparkles size={16} color={colors.energy} />
                <Text style={styles.aiTitle}>Tu resumen</Text>
              </View>
              <Text style={styles.aiDate}>{PERIOD_LABEL[period]}</Text>
            </View>
            <Text style={styles.aiBody}>{summary}</Text>
            <Pressable
              style={styles.aiChatBtn}
              onPress={() => router.push({ pathname: "/chat", params: { context: "progreso" } })}
            >
              <MessageSquare size={15} color={colors.primary} />
              <Text style={styles.aiChatLabel}>Hacer preguntas al Coach IA</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </Card>

          {/* ── Volumen por sesión ── */}
          {data.volumeBars.length > 0 ? (
            <Card>
              <Text style={styles.cardTitle}>Volumen por sesión</Text>
              <Text style={styles.cardSub}>
                Últimas {data.volumeBars.length} sesiones (kg totales levantados)
              </Text>
              <VolumeBarChart data={data.volumeBars} colors={colors} />
            </Card>
          ) : (
            <Card>
              <Text style={styles.cardTitle}>Volumen por sesión</Text>
              <Text style={styles.hintText}>
                Cuando registres entrenamientos con peso y repeticiones, acá verás cuánto levantas por sesión.
              </Text>
            </Card>
          )}

          {/* ── Nutrición esta semana ── */}
          {data.nutritionWeek.some((day) => day.calories > 0) ? (
            <Card>
              <Text style={styles.cardTitle}>Nutrición esta semana</Text>
              <Text style={styles.cardSub}>Días de entreno destacados. Cada línea usa su propia escala.</Text>
              <NutritionChart data={data.nutritionWeek} colors={colors} />
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.energy }]} />
                  <Text style={styles.legendText}>Calorías (kcal)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.legendText}>Proteína (g)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.legendText}>Día entreno</Text>
                </View>
              </View>
            </Card>
          ) : null}

          {/* ── Entreno vs nutrición ── */}
          {data.cross ? (
            <Card>
              <Text style={styles.cardTitle}>Entreno vs Nutrición</Text>
              <Text style={styles.cardSub}>Promedio diario en días con y sin entrenamiento</Text>
              <CrossRefTable cross={data.cross} colors={colors} />
            </Card>
          ) : null}

          {/* ── Composición corporal ── */}
          {data.weightPoints.length >= 2 ? (
            <Card>
              <Text style={styles.cardTitle}>Peso corporal</Text>
              <Text style={styles.cardSub}>Tus últimos registros</Text>
              <WeightChart data={data.weightPoints} colors={colors} />
              <View style={styles.bodyStatRow}>
                <BodyStat
                  label="Primer registro"
                  value={`${data.weightPoints[0]!.weight} kg`}
                  colors={colors}
                />
                <BodyStat
                  label="Peso actual"
                  value={`${data.weightPoints[data.weightPoints.length - 1]!.weight} kg`}
                  highlight
                  colors={colors}
                />
                {data.latestFat != null ? (
                  <BodyStat label="Grasa corporal" value={`${data.latestFat}%`} colors={colors} />
                ) : null}
              </View>
            </Card>
          ) : (
            <Card>
              <Text style={styles.cardTitle}>Peso corporal</Text>
              <Text style={styles.hintText}>
                Registra tu peso al menos una vez por semana para ver tu tendencia acá.
              </Text>
              <AppButton
                label="Registrar peso y medidas"
                icon={Scale}
                variant="secondary"
                onPress={() => router.push("/body-metrics")}
              />
            </Card>
          )}

          {/* ── Récords personales ── */}
          {data.personalRecords.length > 0 ? (
            <Card>
              <View style={styles.cardHeaderRow}>
                <Trophy size={16} color={colors.energy} />
                <Text style={styles.cardTitle}>Récords personales</Text>
              </View>
              <Text style={styles.cardSub}>Tu mejor peso levantado por ejercicio en el periodo</Text>
              {data.personalRecords.map((record) => (
                <PRRow key={record.exercise} record={record} colors={colors} />
              ))}
            </Card>
          ) : null}

          {/* ── CTA coach ── */}
          <Pressable style={styles.coachCta} onPress={() => router.push("/chat")}>
            <Bot size={20} color={colors.onPrimary} />
            <Text style={styles.coachCtaLabel}>Hablar con el Coach IA sobre mi progreso</Text>
            <ChevronRight size={16} color={colors.onPrimary} />
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

// ─── Cálculo de datos reales ─────────────────────────────────────────────────

function dayKey(value: string): string {
  return new Date(value).toDateString();
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

function buildProgressData(
  logs: WorkoutLogDetail[],
  meals: Meal[],
  metrics: BodyMetric[],
  period: Period,
): ProgressData {
  const periodDays = PERIOD_DAYS[period];
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  const prevCutoff = Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000;

  const periodLogs = logs
    .filter((log) => new Date(log.startedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const prevLogs = logs.filter((log) => {
    const time = new Date(log.startedAt).getTime();
    return time >= prevCutoff && time < cutoff;
  });

  // Volumen de las últimas sesiones del periodo.
  const volumeBars: VolumeBar[] = periodLogs.slice(-7).map((log) => ({
    label: WEEKDAY_LETTERS[new Date(log.startedAt).getDay()]!,
    value: logVolume(log),
  }));

  // Tendencia de volumen: primera mitad vs segunda mitad del periodo.
  let volumeTrendPct: number | null = null;
  const volumes = periodLogs.map((log) => logVolume(log)).filter((value) => value > 0);
  if (volumes.length >= 4) {
    const half = Math.floor(volumes.length / 2);
    const firstAvg = volumes.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondAvg = volumes.slice(half).reduce((a, b) => a + b, 0) / (volumes.length - half);
    if (firstAvg > 0) volumeTrendPct = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  }

  // Comidas del periodo agrupadas por día.
  const mealsByDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of meals) {
    if (new Date(meal.eatenAt).getTime() < cutoff) continue;
    const key = dayKey(meal.eatenAt);
    const entry = mealsByDay.get(key) ?? { calories: 0, protein: 0 };
    entry.calories += meal.calories ?? 0;
    entry.protein += meal.proteinG ?? 0;
    mealsByDay.set(key, entry);
  }
  const dailyTotals = [...mealsByDay.values()];
  const avgCalories = dailyTotals.length
    ? Math.round(dailyTotals.reduce((sum, entry) => sum + entry.calories, 0) / dailyTotals.length)
    : null;
  const avgProtein = dailyTotals.length
    ? Math.round(dailyTotals.reduce((sum, entry) => sum + entry.protein, 0) / dailyTotals.length)
    : null;

  // Semana calendario (para el gráfico de nutrición).
  const workoutDayKeys = new Set(logs.map((log) => dayKey(log.startedAt)));
  const allMealsByDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of meals) {
    const key = dayKey(meal.eatenAt);
    const entry = allMealsByDay.get(key) ?? { calories: 0, protein: 0 };
    entry.calories += meal.calories ?? 0;
    entry.protein += meal.proteinG ?? 0;
    allMealsByDay.set(key, entry);
  }
  const nutritionWeek: NutritionDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const entry = allMealsByDay.get(key);
    return {
      day: WEEKDAY_LETTERS[date.getDay()]!,
      calories: Math.round(entry?.calories ?? 0),
      protein: Math.round(entry?.protein ?? 0),
      workout: workoutDayKeys.has(key),
    };
  });

  // Correlación entreno vs descanso (solo días con comidas registradas).
  const workoutDayTotals: Array<{ calories: number; protein: number }> = [];
  const restDayTotals: Array<{ calories: number; protein: number }> = [];
  for (const [key, entry] of mealsByDay) {
    (workoutDayKeys.has(key) ? workoutDayTotals : restDayTotals).push(entry);
  }
  const avgOf = (items: Array<{ calories: number; protein: number }>, field: "calories" | "protein") =>
    Math.round(items.reduce((sum, item) => sum + item[field], 0) / items.length);
  const cross =
    workoutDayTotals.length > 0 && restDayTotals.length > 0
      ? {
          workoutCal: avgOf(workoutDayTotals, "calories"),
          restCal: avgOf(restDayTotals, "calories"),
          workoutProt: avgOf(workoutDayTotals, "protein"),
          restProt: avgOf(restDayTotals, "protein"),
        }
      : null;

  // Peso corporal: registros del periodo (o los últimos 6 si hay pocos).
  const sortedMetrics = metrics
    .filter((metric) => metric.weightKg != null)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  let weightMetrics = sortedMetrics.filter((metric) => new Date(metric.measuredAt).getTime() >= cutoff);
  if (weightMetrics.length < 2) weightMetrics = sortedMetrics.slice(-6);
  const weightPoints: WeightPoint[] = weightMetrics.map((metric) => ({
    label: shortDate(metric.measuredAt),
    weight: metric.weightKg!,
    fat: metric.bodyFatPercentage ?? null,
  }));
  const latestMetric = sortedMetrics[sortedMetrics.length - 1] ?? null;
  const latestWeight = latestMetric?.weightKg ?? null;
  const latestFat = latestMetric?.bodyFatPercentage ?? null;
  const weightDelta =
    weightPoints.length >= 2
      ? Math.round((weightPoints[weightPoints.length - 1]!.weight - weightPoints[0]!.weight) * 10) / 10
      : null;

  // Récords personales desde las series registradas.
  const personalRecords: PersonalRecord[] = buildExerciseProgress(periodLogs)
    .filter((summary) => summary.bestWeight > 0)
    .sort((a, b) => b.bestWeight - a.bestWeight)
    .slice(0, 4)
    .map((summary) => {
      const bestEntry = [...summary.trend].reverse().find((entry) => entry.weight === summary.bestWeight);
      return {
        exercise: summary.exerciseName,
        kg: summary.bestWeight,
        date: bestEntry?.label ?? "",
        deltaKg: Math.round(summary.weightDelta * 10) / 10,
      };
    });

  return {
    sessions: periodLogs.length,
    sessionsPrev: prevLogs.length,
    avgCalories,
    avgProtein,
    latestWeight,
    latestFat,
    weightDelta,
    volumeBars,
    volumeTrendPct,
    nutritionWeek,
    cross,
    weightPoints,
    personalRecords,
    hasAnyData: logs.length > 0 || meals.length > 0 || metrics.length > 0,
  };
}

// Resumen en lenguaje simple, calculado desde los datos (sin IA ni promesas).
function buildSummaryText(data: ProgressData, goals: NutritionGoals, period: Period): string {
  const parts: string[] = [];
  const periodDays = PERIOD_DAYS[period];
  const perWeek = Math.round((data.sessions / periodDays) * 7 * 10) / 10;

  if (data.sessions === 0) {
    parts.push(
      `No registraste entrenamientos en los ${PERIOD_LABEL[period]}. Un buen punto de partida son 2-3 sesiones por semana; tu rutina activa te espera en Entreno.`,
    );
  } else {
    parts.push(
      `Completaste ${data.sessions} ${data.sessions === 1 ? "sesión" : "sesiones"} en los ${PERIOD_LABEL[period]} (~${perWeek} por semana).${
        data.sessions >= data.sessionsPrev && data.sessionsPrev > 0 ? " Vas igual o mejor que el periodo anterior — la constancia es lo que más importa." : ""
      }`,
    );
  }

  if (data.volumeTrendPct != null) {
    if (data.volumeTrendPct > 5) {
      parts.push(`Tu volumen de entrenamiento va subiendo (+${data.volumeTrendPct}% en el periodo). Señal clara de progreso.`);
    } else if (data.volumeTrendPct < -5) {
      parts.push(`Tu volumen bajó ${Math.abs(data.volumeTrendPct)}% en el periodo. Si fue una semana liviana planificada, perfecto; si no, retoma tus pesos habituales.`);
    } else {
      parts.push("Tu volumen se mantiene estable. Cuando las últimas repeticiones salgan fáciles, sube un poco el peso.");
    }
  }

  if (data.avgProtein != null && data.avgCalories != null) {
    const proteinRatio = data.avgProtein / goals.proteinG;
    if (proteinRatio >= 0.9) {
      parts.push(`Nutrición: promedias ${data.avgCalories} kcal y ${data.avgProtein}g de proteína al día — dentro de tu meta de ${goals.proteinG}g. Bien ahí.`);
    } else {
      parts.push(
        `Nutrición: promedias ${data.avgCalories} kcal y ${data.avgProtein}g de proteína al día, por debajo de tu meta de ${goals.proteinG}g. Suma una fuente magra (pollo, huevo, yogurt proteico) en alguna comida.`,
      );
    }
  }

  if (data.weightDelta != null && Math.abs(data.weightDelta) >= 0.3) {
    parts.push(
      `Peso corporal: ${data.weightDelta < 0 ? "bajaste" : "subiste"} ${Math.abs(data.weightDelta).toFixed(1)} kg en el periodo. Los cambios lentos y sostenidos son los que duran.`,
    );
  }

  return parts.join("\n\n");
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  subPositive,
  color,
  colors,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub: string;
  subPositive: boolean;
  color: string;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.kpiCard}>
      <Icon size={14} color={color} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiSub, { color: subPositive ? colors.success : colors.muted }]}>{sub}</Text>
    </View>
  );
}

function VolumeBarChart({ data, colors }: { data: VolumeBar[]; colors: ColorPalette }) {
  const W = 300;
  const H = 110;
  const PAD = { left: 8, right: 8, top: 14, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = chartW / data.length - 5;
  const maxVal = Math.max(...data.map((bar) => bar.value), 1);

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
          <Stop offset="1" stopColor={colors.primaryDark} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <Line
          key={frac}
          x1={PAD.left}
          y1={PAD.top + chartH * (1 - frac)}
          x2={W - PAD.right}
          y2={PAD.top + chartH * (1 - frac)}
          stroke={colors.border}
          strokeWidth={0.6}
          strokeDasharray="4,4"
        />
      ))}
      {data.map((bar, index) => {
        const frac = bar.value / maxVal;
        const barH = Math.max(4, chartH * frac);
        const bx = PAD.left + index * (chartW / data.length) + 2.5;
        const by = PAD.top + chartH - barH;
        const isLast = index === data.length - 1;
        return (
          <React.Fragment key={index}>
            <Rect
              x={bx}
              y={by}
              width={barW}
              height={barH}
              rx={4}
              fill={isLast ? "url(#barGrad)" : colors.surfaceStrong}
              opacity={isLast ? 1 : 0.8}
            />
            <SvgText
              x={bx + barW / 2}
              y={H - 4}
              fontSize={8}
              fill={isLast ? colors.primary : colors.muted}
              textAnchor="middle"
              fontWeight={isLast ? "bold" : "normal"}
            >
              {bar.label}
            </SvgText>
            {bar.value > 0 ? (
              <SvgText
                x={bx + barW / 2}
                y={by - 3}
                fontSize={6.5}
                fill={isLast ? colors.primary : colors.muted}
                textAnchor="middle"
                fontWeight={isLast ? "bold" : "normal"}
              >
                {bar.value >= 1000 ? `${(bar.value / 1000).toFixed(1)}k` : Math.round(bar.value)}
              </SvgText>
            ) : null}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function NutritionChart({ data, colors }: { data: NutritionDay[]; colors: ColorPalette }) {
  const W = 300;
  const H = 110;
  const PAD = { left: 8, right: 8, top: 12, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const step = chartW / (data.length - 1);

  // Cada serie se normaliza a su propio maximo para comparar formas.
  const calMax = Math.max(...data.map((day) => day.calories), 1);
  const protMax = Math.max(...data.map((day) => day.protein), 1);

  const calY = (day: NutritionDay) => PAD.top + chartH - (day.calories / calMax) * chartH;
  const protY = (day: NutritionDay) => PAD.top + chartH - (day.protein / protMax) * chartH;

  const calPoints = data.map((day, index) => `${PAD.left + index * step},${calY(day)}`).join(" ");
  const protPoints = data.map((day, index) => `${PAD.left + index * step},${protY(day)}`).join(" ");

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="calFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.energy} stopOpacity="0.25" />
          <Stop offset="1" stopColor={colors.energy} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {data.map((day, index) => {
        if (!day.workout) return null;
        const x = PAD.left + index * step - step * 0.4;
        return (
          <Rect
            key={index}
            x={x}
            y={PAD.top}
            width={step * 0.8}
            height={chartH}
            fill={colors.accent}
            opacity={0.08}
            rx={3}
          />
        );
      })}
      {[0.5, 1].map((frac) => (
        <Line
          key={frac}
          x1={PAD.left}
          y1={PAD.top + chartH * (1 - frac)}
          x2={W - PAD.right}
          y2={PAD.top + chartH * (1 - frac)}
          stroke={colors.border}
          strokeWidth={0.6}
          strokeDasharray="4,3"
        />
      ))}
      <Path
        d={`M${PAD.left},${PAD.top + chartH} ${data
          .map((day, index) => `L${PAD.left + index * step},${calY(day)}`)
          .join(" ")} L${PAD.left + (data.length - 1) * step},${PAD.top + chartH} Z`}
        fill="url(#calFill)"
      />
      <Polyline
        points={calPoints}
        fill="none"
        stroke={colors.energy}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points={protPoints}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2}
        strokeDasharray="5,3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((day, index) => (
        <SvgText
          key={index}
          x={PAD.left + index * step}
          y={H - 4}
          fontSize={8}
          fill={day.workout ? colors.accent : colors.muted}
          textAnchor="middle"
          fontWeight={day.workout ? "bold" : "normal"}
        >
          {day.day}
        </SvgText>
      ))}
      {data.map((day, index) => (
        <Circle
          key={index}
          cx={PAD.left + index * step}
          cy={calY(day)}
          r={day.workout ? 3.5 : 2.5}
          fill={day.workout ? colors.accent : colors.energy}
          stroke={colors.background}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}

function WeightChart({ data, colors }: { data: WeightPoint[]; colors: ColorPalette }) {
  const W = 300;
  const H = 90;
  const PAD = { left: 32, right: 12, top: 10, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const step = chartW / (data.length - 1);
  const minW = Math.min(...data.map((point) => point.weight)) - 0.5;
  const maxW = Math.max(...data.map((point) => point.weight)) + 0.5;
  const range = maxW - minW;

  const points = data.map((point, index) => ({
    x: PAD.left + index * step,
    y: PAD.top + chartH - ((point.weight - minW) / range) * chartH,
    label: point.label,
  }));

  const polyStr = points.map((point) => `${point.x},${point.y}`).join(" ");
  const lastPoint = points[points.length - 1]!;
  const areaPath = `M${PAD.left},${PAD.top + chartH} ${points
    .map((point) => `L${point.x},${point.y}`)
    .join(" ")} L${lastPoint.x},${PAD.top + chartH} Z`;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.success} stopOpacity="0.3" />
          <Stop offset="1" stopColor={colors.success} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[minW, (minW + maxW) / 2, maxW].map((value, index) => (
        <SvgText
          key={index}
          x={PAD.left - 4}
          y={PAD.top + chartH - ((value - minW) / range) * chartH + 3}
          fontSize={7}
          fill={colors.muted}
          textAnchor="end"
        >
          {value.toFixed(1)}
        </SvgText>
      ))}
      {[0, 0.5, 1].map((frac) => (
        <Line
          key={frac}
          x1={PAD.left}
          y1={PAD.top + chartH * (1 - frac)}
          x2={W - PAD.right}
          y2={PAD.top + chartH * (1 - frac)}
          stroke={colors.border}
          strokeWidth={0.6}
          strokeDasharray="4,3"
        />
      ))}
      <Path d={areaPath} fill="url(#wFill)" />
      <Polyline
        points={polyStr}
        fill="none"
        stroke={colors.success}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 4 : 2.5}
          fill={index === points.length - 1 ? colors.success : colors.background}
          stroke={colors.success}
          strokeWidth={1.5}
        />
      ))}
      {points.map((point, index) => (
        <SvgText key={index} x={point.x} y={H - 4} fontSize={7} fill={colors.muted} textAnchor="middle">
          {point.label}
        </SvgText>
      ))}
    </Svg>
  );
}

function CrossRefTable({
  cross,
  colors,
}: {
  cross: NonNullable<ProgressData["cross"]>;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxCal = Math.max(cross.workoutCal, cross.restCal, 1);

  return (
    <View style={styles.crossTable}>
      <View style={styles.crossHeader}>
        <Text style={[styles.crossCell, styles.crossCellLabel]} />
        <Text style={[styles.crossCell, styles.crossColHead]}>Calorías</Text>
        <Text style={[styles.crossCell, styles.crossColHead]}>Proteína</Text>
        <Text style={[styles.crossCell, styles.crossColHead]} />
      </View>
      <CrossRow label="Días entreno" cal={cross.workoutCal} prot={cross.workoutProt} maxCal={maxCal} highlight colors={colors} />
      <CrossRow label="Días descanso" cal={cross.restCal} prot={cross.restProt} maxCal={maxCal} highlight={false} colors={colors} />
      <CrossRow
        label="Diferencia"
        cal={cross.workoutCal - cross.restCal}
        prot={cross.workoutProt - cross.restProt}
        maxCal={maxCal}
        isDelta
        highlight={false}
        colors={colors}
      />
    </View>
  );
}

function CrossRow({
  label,
  cal,
  prot,
  maxCal,
  highlight,
  isDelta,
  colors,
}: {
  label: string;
  cal: number;
  prot: number;
  maxCal: number;
  highlight?: boolean;
  isDelta?: boolean;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const calColor = isDelta ? (cal >= 0 ? colors.success : colors.danger) : colors.text;
  const protColor = isDelta ? (prot >= 0 ? colors.success : colors.danger) : colors.text;

  return (
    <View style={[styles.crossRow, highlight && styles.crossRowHighlight]}>
      <Text style={[styles.crossCell, styles.crossCellLabel]}>{label}</Text>
      <Text style={[styles.crossCell, { color: calColor, fontWeight: "900" }]}>
        {isDelta && cal > 0 ? "+" : ""}
        {cal} kcal
      </Text>
      <Text style={[styles.crossCell, { color: protColor, fontWeight: "900" }]}>
        {isDelta && prot > 0 ? "+" : ""}
        {prot}g
      </Text>
      <View style={styles.crossCell}>
        {isDelta ? null : (
          <View
            style={[
              styles.barInline,
              {
                width: `${Math.min((cal / maxCal) * 100, 100)}%`,
                backgroundColor: highlight ? colors.energy : colors.surfaceStrong,
              },
            ]}
          />
        )}
      </View>
    </View>
  );
}

function BodyStat({
  label,
  value,
  highlight,
  colors,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.bodyStat, highlight && styles.bodyStatHighlight]}>
      <Text style={styles.bodyStatLabel}>{label}</Text>
      <Text style={[styles.bodyStatValue, highlight && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

function PRRow({ record, colors }: { record: PersonalRecord; colors: ColorPalette }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.prRow}>
      <View style={styles.prLeft}>
        <Text style={styles.prName}>{record.exercise}</Text>
        <Text style={styles.prDate}>{record.date}</Text>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prKg}>{record.kg} kg</Text>
        {record.deltaKg !== 0 ? (
          <View style={styles.prDeltaBadge}>
            {record.deltaKg > 0 ? (
              <TrendingUp size={10} color={colors.success} />
            ) : (
              <TrendingDown size={10} color={colors.muted} />
            )}
            <Text style={[styles.prDelta, record.deltaKg < 0 && { color: colors.muted }]}>
              {record.deltaKg > 0 ? "+" : ""}
              {record.deltaKg} kg
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    screenTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    screenSub: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 2,
    },
    periodRow: {
      flexDirection: "row",
      gap: 4,
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.sm,
      padding: 3,
    },
    periodBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm - 2,
    },
    periodBtnActive: {
      backgroundColor: colors.surface,
    },
    periodLabel: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.muted,
    },
    periodLabelActive: {
      color: colors.text,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
    },
    hintText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
    },
    kpiRow: {
      flexDirection: "row",
      gap: 10,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 3,
      alignItems: "flex-start",
    },
    kpiValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 4,
    },
    kpiLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
    },
    kpiSub: {
      fontSize: 10,
      fontWeight: "800",
    },
    aiCard: {
      borderColor: colors.primarySoft,
      backgroundColor: colors.surface,
      gap: 12,
    },
    aiHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    aiTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    aiTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    aiDate: {
      color: colors.muted,
      fontSize: 11,
    },
    aiBody: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 21,
    },
    aiChatBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    aiChatLabel: {
      flex: 1,
      color: colors.primary,
      fontSize: 13,
      fontWeight: "800",
    },
    cardTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    cardSub: {
      color: colors.muted,
      fontSize: 12,
      marginTop: -4,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 4,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      color: colors.muted,
      fontSize: 11,
    },
    crossTable: {
      gap: 1,
      borderRadius: radius.sm,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    crossHeader: {
      flexDirection: "row",
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    crossRow: {
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: colors.backgroundElevated,
      alignItems: "center",
    },
    crossRowHighlight: {
      backgroundColor: colors.surfaceMuted,
    },
    crossCell: {
      flex: 1,
      color: colors.text,
      fontSize: 12,
    },
    crossCellLabel: {
      fontWeight: "800",
      flex: 1.4,
      fontSize: 11,
    },
    crossColHead: {
      color: colors.muted,
      fontWeight: "800",
      fontSize: 11,
    },
    barInline: {
      height: 4,
      borderRadius: 2,
    },
    bodyStatRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    bodyStat: {
      flex: 1,
      backgroundColor: colors.backgroundElevated,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 3,
    },
    bodyStatHighlight: {
      borderColor: colors.success,
      backgroundColor: colors.surfaceMuted,
    },
    bodyStatLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "800",
    },
    bodyStatValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    prRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    prLeft: {
      gap: 2,
    },
    prName: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 14,
    },
    prDate: {
      color: colors.muted,
      fontSize: 11,
    },
    prRight: {
      alignItems: "flex-end",
      gap: 4,
    },
    prKg: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 15,
    },
    prDeltaBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    prDelta: {
      color: colors.success,
      fontSize: 11,
      fontWeight: "800",
    },
    coachCta: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    coachCtaLabel: {
      flex: 1,
      color: colors.onPrimary,
      fontWeight: "900",
      fontSize: 14,
    },
  });
}
