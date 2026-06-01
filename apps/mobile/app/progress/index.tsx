import React from "react";
import { router } from "expo-router";
import {
  Bot,
  ChevronRight,
  Flame,
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

// ─── Mock data ───────────────────────────────────────────────────────────────

const WORKOUT_LOGS = [
  { date: "03 May", label: "L", name: "Pecho & Tríceps", duration: 55, volume: 12400, calories: 320 },
  { date: "05 May", label: "X", name: "Espalda & Bíceps", duration: 62, volume: 15200, calories: 380 },
  { date: "07 May", label: "V", name: "Piernas", duration: 70, volume: 22000, calories: 450 },
  { date: "10 May", label: "L", name: "Hombros", duration: 48, volume: 9800, calories: 290 },
  { date: "12 May", label: "X", name: "Pecho & Tríceps", duration: 58, volume: 13100, calories: 340 },
  { date: "14 May", label: "V", name: "Espalda & Bíceps", duration: 65, volume: 16400, calories: 395 },
  { date: "17 May", label: "L", name: "Piernas", duration: 72, volume: 23500, calories: 465 },
  { date: "19 May", label: "X", name: "Hombros", duration: 50, volume: 10200, calories: 300 },
  { date: "21 May", label: "V", name: "Pecho & Tríceps", duration: 60, volume: 13800, calories: 355 },
  { date: "24 May", label: "L", name: "Espalda & Bíceps", duration: 68, volume: 17200, calories: 410 },
  { date: "26 May", label: "X", name: "Piernas", duration: 75, volume: 24800, calories: 480 },
  { date: "28 May", label: "V", name: "Hombros", duration: 52, volume: 10800, calories: 310 },
];

const NUTRITION_DAYS = [
  { date: "24 May", day: "L", calories: 2340, protein: 178, carbs: 245, fat: 68, workout: true },
  { date: "25 May", day: "M", calories: 2180, protein: 162, carbs: 220, fat: 72, workout: false },
  { date: "26 May", day: "X", calories: 2520, protein: 190, carbs: 270, fat: 70, workout: true },
  { date: "27 May", day: "J", calories: 2100, protein: 158, carbs: 210, fat: 65, workout: false },
  { date: "28 May", day: "V", calories: 2450, protein: 185, carbs: 255, fat: 71, workout: true },
  { date: "29 May", day: "S", calories: 2200, protein: 168, carbs: 230, fat: 68, workout: false },
  { date: "30 May", day: "D", calories: 2310, protein: 174, carbs: 240, fat: 69, workout: false },
];

const BODY_METRICS = [
  { date: "1 Abr", weight: 82.5, fat: 18.2 },
  { date: "15 Abr", weight: 81.8, fat: 17.8 },
  { date: "1 May", weight: 81.0, fat: 17.3 },
  { date: "15 May", weight: 80.2, fat: 16.9 },
  { date: "28 May", weight: 79.6, fat: 16.5 },
];

const PERSONAL_RECORDS = [
  { exercise: "Press Banca", kg: 100, date: "21 May", delta: "+5 kg", up: true },
  { exercise: "Sentadilla", kg: 130, date: "26 May", delta: "+7.5 kg", up: true },
  { exercise: "Peso Muerto", kg: 150, date: "24 May", delta: "+5 kg", up: true },
  { exercise: "Press Militar", kg: 72.5, date: "28 May", delta: "+2.5 kg", up: true },
];

const AI_ANALYSIS = `Tu progreso en las últimas 4 semanas es excelente. Completaste 12 sesiones (3/semana), con un aumento del 8% en volumen total. Punto fuerte: piernas (+12% en volumen).

Nutrición: promedio 2,300 kcal/día con 174g proteína. Detecto que en días de entreno alcanzas ~188g — muy buena correlación. Oportunidad: los días de descanso (mar, jue) las calorías bajan a ~2,100, lo que puede limitar la recuperación muscular.

Recomendación concreta: añade 200–300 kcal en días de descanso priorizando carbohidratos complejos (arroz, avena, batata). Tu peso bajó 2.9 kg en 8 semanas manteniendo masa — ratio de pérdida grasa ideal.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LAST_7 = WORKOUT_LOGS.slice(-7);
const MAX_VOL = Math.max(...LAST_7.map((d) => d.volume));

const avgCalories = Math.round(NUTRITION_DAYS.reduce((s, d) => s + d.calories, 0) / NUTRITION_DAYS.length);
const avgProtein = Math.round(NUTRITION_DAYS.reduce((s, d) => s + d.protein, 0) / NUTRITION_DAYS.length);
const totalSessions = WORKOUT_LOGS.length;
const latestWeight = BODY_METRICS[BODY_METRICS.length - 1]!.weight;
const firstWeight = BODY_METRICS[0]!.weight;
const weightDelta = (latestWeight - firstWeight).toFixed(1);

// ─── Main screen ─────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [period, setPeriod] = useState<Period>("30d");
  const [aiLoading, setAiLoading] = useState(true);
  const [aiText, setAiText] = useState("");
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    const t = setTimeout(() => {
      loop.stop();
      setAiLoading(false);
      setAiText(AI_ANALYSIS);
    }, 1800);
    return () => clearTimeout(t);
  }, [pulseAnim]);

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Avances</Text>
          <Text style={styles.screenSub}>Progreso cruzado entreno & nutrición</Text>
        </View>
        <View style={styles.periodRow}>
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            >
              <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── KPI row ── */}
      <View style={styles.kpiRow}>
        <KpiCard icon={Zap} label="Sesiones" value={String(totalSessions)} sub="+3 vs mes ant." color={colors.primary} colors={colors} />
        <KpiCard icon={Flame} label="Kcal prom." value={String(avgCalories)} sub={`${avgProtein}g prot.`} color={colors.energy} colors={colors} />
        <KpiCard icon={TrendingDown} label="Peso" value={`${latestWeight} kg`} sub={`${weightDelta} kg`} color={colors.success} colors={colors} />
      </View>

      {/* ── AI Insight ── */}
      <Card style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleRow}>
            <Sparkles size={16} color={colors.energy} />
            <Text style={styles.aiTitle}>Análisis IA</Text>
          </View>
          <Text style={styles.aiDate}>Generado hoy</Text>
        </View>
        {aiLoading ? (
          <View style={styles.aiSkeleton}>
            {[100, 85, 90, 70, 95, 60].map((w, i) => (
              <Animated.View
                key={i}
                style={[styles.aiSkeletonLine, { width: `${w}%`, opacity: pulseAnim }]}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.aiBody}>{aiText}</Text>
        )}
        <Pressable
          style={styles.aiChatBtn}
          onPress={() =>
            router.push({
              pathname: "/chat",
              params: { context: "progreso" },
            })
          }
        >
          <MessageSquare size={15} color={colors.primary} />
          <Text style={styles.aiChatLabel}>Hacer preguntas al Coach IA</Text>
          <ChevronRight size={14} color={colors.primary} />
        </Pressable>
      </Card>

      {/* ── Workout volume chart ── */}
      <Card>
        <Text style={styles.cardTitle}>Volumen por sesión</Text>
        <Text style={styles.cardSub}>Últimas 7 sesiones (kg totales)</Text>
        <VolumeBarChart data={LAST_7} maxVal={MAX_VOL} colors={colors} />
      </Card>

      {/* ── Nutrition vs training ── */}
      <Card>
        <Text style={styles.cardTitle}>Nutrición esta semana</Text>
        <Text style={styles.cardSub}>Calorías y proteína — días de entreno destacados</Text>
        <NutritionChart data={NUTRITION_DAYS} colors={colors} />
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.energy }]} />
            <Text style={styles.legendText}>Calorías ÷ 15</Text>
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

      {/* ── Cross-reference table ── */}
      <Card>
        <Text style={styles.cardTitle}>Entreno vs Nutrición</Text>
        <Text style={styles.cardSub}>Correlación calorías y proteína según actividad</Text>
        <CrossRefTable data={NUTRITION_DAYS} colors={colors} />
      </Card>

      {/* ── Body composition ── */}
      <Card>
        <Text style={styles.cardTitle}>Composición corporal</Text>
        <Text style={styles.cardSub}>Peso y % grasa — últimas 8 semanas</Text>
        <WeightChart data={BODY_METRICS} colors={colors} />
        <View style={styles.bodyStatRow}>
          <BodyStat label="Peso inicial" value={`${firstWeight} kg`} colors={colors} />
          <BodyStat label="Peso actual" value={`${latestWeight} kg`} highlight colors={colors} />
          <BodyStat label="Grasa corporal" value={`${BODY_METRICS[BODY_METRICS.length - 1]!.fat}%`} colors={colors} />
        </View>
      </Card>

      {/* ── PRs ── */}
      <Card>
        <View style={styles.cardHeaderRow}>
          <Trophy size={16} color={colors.energy} />
          <Text style={styles.cardTitle}>Récords personales</Text>
        </View>
        {PERSONAL_RECORDS.map((pr) => (
          <PRRow key={pr.exercise} pr={pr} colors={colors} />
        ))}
      </Card>

      {/* ── CTA ── */}
      <Pressable
        style={styles.coachCta}
        onPress={() => router.push("/chat")}
      >
        <Bot size={20} color={colors.onPrimary} />
        <Text style={styles.coachCtaLabel}>Hablar con el Coach IA sobre mi progreso</Text>
        <ChevronRight size={16} color={colors.onPrimary} />
      </Pressable>
    </Screen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  colors,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub: string;
  color: string;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.kpiCard}>
      <Icon size={14} color={color} />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

function VolumeBarChart({
  data,
  maxVal,
  colors,
}: {
  data: typeof LAST_7;
  maxVal: number;
  colors: ColorPalette;
}) {
  const W = 300;
  const H = 110;
  const PAD = { left: 8, right: 8, top: 8, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = chartW / data.length - 5;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
          <Stop offset="1" stopColor={colors.primaryDark} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      {/* Grid lines */}
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
      {data.map((d, i) => {
        const frac = d.volume / maxVal;
        const barH = Math.max(4, chartH * frac);
        const bx = PAD.left + (i * (chartW / data.length)) + 2.5;
        const by = PAD.top + chartH - barH;
        const isLast = i === data.length - 1;
        return (
          <React.Fragment key={i}>
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
              {d.label}
            </SvgText>
            {isLast && (
              <SvgText
                x={bx + barW / 2}
                y={by - 3}
                fontSize={7}
                fill={colors.primary}
                textAnchor="middle"
                fontWeight="bold"
              >
                {Math.round(d.volume / 1000)}k
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function NutritionChart({
  data,
  colors,
}: {
  data: typeof NUTRITION_DAYS;
  colors: ColorPalette;
}) {
  const W = 300;
  const H = 110;
  const PAD = { left: 8, right: 8, top: 12, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const step = chartW / (data.length - 1);

  const calMax = Math.max(...data.map((d) => d.calories / 15));
  const protMax = Math.max(...data.map((d) => d.protein));
  const maxVal = Math.max(calMax, protMax);

  const calPoints = data.map((d, i) => {
    const x = PAD.left + i * step;
    const y = PAD.top + chartH - (d.calories / 15 / maxVal) * chartH;
    return `${x},${y}`;
  }).join(" ");

  const protPoints = data.map((d, i) => {
    const x = PAD.left + i * step;
    const y = PAD.top + chartH - (d.protein / maxVal) * chartH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="calFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.energy} stopOpacity="0.25" />
          <Stop offset="1" stopColor={colors.energy} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Workout day highlight columns */}
      {data.map((d, i) => {
        if (!d.workout) return null;
        const x = PAD.left + i * step - step * 0.4;
        return (
          <Rect
            key={i}
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
      {/* Grid */}
      {[0.5, 1].map((f) => (
        <Line
          key={f}
          x1={PAD.left}
          y1={PAD.top + chartH * (1 - f)}
          x2={W - PAD.right}
          y2={PAD.top + chartH * (1 - f)}
          stroke={colors.border}
          strokeWidth={0.6}
          strokeDasharray="4,3"
        />
      ))}
      {/* Calorie fill area */}
      <Path
        d={`M${PAD.left},${PAD.top + chartH} ${data.map((d, i) => `L${PAD.left + i * step},${PAD.top + chartH - (d.calories / 15 / maxVal) * chartH}`).join(" ")} L${PAD.left + (data.length - 1) * step},${PAD.top + chartH} Z`}
        fill="url(#calFill)"
      />
      {/* Calorie line */}
      <Polyline
        points={calPoints}
        fill="none"
        stroke={colors.energy}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Protein line */}
      <Polyline
        points={protPoints}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2}
        strokeDasharray="5,3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* X labels */}
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={PAD.left + i * step}
          y={H - 4}
          fontSize={8}
          fill={d.workout ? colors.accent : colors.muted}
          textAnchor="middle"
          fontWeight={d.workout ? "bold" : "normal"}
        >
          {d.day}
        </SvgText>
      ))}
      {/* Dots on calories */}
      {data.map((d, i) => {
        const x = PAD.left + i * step;
        const y = PAD.top + chartH - (d.calories / 15 / maxVal) * chartH;
        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={d.workout ? 3.5 : 2.5}
            fill={d.workout ? colors.accent : colors.energy}
            stroke={colors.background}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}

function WeightChart({
  data,
  colors,
}: {
  data: typeof BODY_METRICS;
  colors: ColorPalette;
}) {
  const W = 300;
  const H = 90;
  const PAD = { left: 32, right: 12, top: 10, bottom: 24 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const step = chartW / (data.length - 1);
  const minW = Math.min(...data.map((d) => d.weight)) - 0.5;
  const maxW = Math.max(...data.map((d) => d.weight)) + 0.5;
  const range = maxW - minW;

  const points = data.map((d, i) => {
    const x = PAD.left + i * step;
    const y = PAD.top + chartH - ((d.weight - minW) / range) * chartH;
    return { x, y, ...d };
  });

  const polyStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPt = points[points.length - 1]!;
  const areaPath = `M${PAD.left},${PAD.top + chartH} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${lastPt.x},${PAD.top + chartH} Z`;

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="wFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.success} stopOpacity="0.3" />
          <Stop offset="1" stopColor={colors.success} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Y axis labels */}
      {[minW, (minW + maxW) / 2, maxW].map((v, i) => (
        <SvgText
          key={i}
          x={PAD.left - 4}
          y={PAD.top + chartH - ((v - minW) / range) * chartH + 3}
          fontSize={7}
          fill={colors.muted}
          textAnchor="end"
        >
          {v.toFixed(1)}
        </SvgText>
      ))}
      {/* Grid */}
      {[0, 0.5, 1].map((f) => (
        <Line
          key={f}
          x1={PAD.left}
          y1={PAD.top + chartH * (1 - f)}
          x2={W - PAD.right}
          y2={PAD.top + chartH * (1 - f)}
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
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? colors.success : colors.background}
          stroke={colors.success}
          strokeWidth={1.5}
        />
      ))}
      {/* X labels */}
      {points.map((p, i) => (
        <SvgText
          key={i}
          x={p.x}
          y={H - 4}
          fontSize={7}
          fill={colors.muted}
          textAnchor="middle"
        >
          {p.date.split(" ")[0]}
        </SvgText>
      ))}
    </Svg>
  );
}

function CrossRefTable({
  data,
  colors,
}: {
  data: typeof NUTRITION_DAYS;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const workoutAvgCal = Math.round(
    data.filter((d) => d.workout).reduce((s, d) => s + d.calories, 0) /
      data.filter((d) => d.workout).length,
  );
  const restAvgCal = Math.round(
    data.filter((d) => !d.workout).reduce((s, d) => s + d.calories, 0) /
      data.filter((d) => !d.workout).length,
  );
  const workoutAvgProt = Math.round(
    data.filter((d) => d.workout).reduce((s, d) => s + d.protein, 0) /
      data.filter((d) => d.workout).length,
  );
  const restAvgProt = Math.round(
    data.filter((d) => !d.workout).reduce((s, d) => s + d.protein, 0) /
      data.filter((d) => !d.workout).length,
  );

  return (
    <View style={styles.crossTable}>
      <View style={styles.crossHeader}>
        <Text style={[styles.crossCell, styles.crossCellLabel]} />
        <Text style={[styles.crossCell, styles.crossColHead]}>Calorías</Text>
        <Text style={[styles.crossCell, styles.crossColHead]}>Proteína</Text>
        <Text style={[styles.crossCell, styles.crossColHead]}>Diferencia</Text>
      </View>
      <CrossRow
        label="Días entreno"
        cal={workoutAvgCal}
        prot={workoutAvgProt}
        highlight
        colors={colors}
      />
      <CrossRow
        label="Días descanso"
        cal={restAvgCal}
        prot={restAvgProt}
        highlight={false}
        colors={colors}
      />
      <CrossRow
        label="Diferencia"
        cal={workoutAvgCal - restAvgCal}
        prot={workoutAvgProt - restAvgProt}
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
  highlight,
  isDelta,
  colors,
}: {
  label: string;
  cal: number;
  prot: number;
  highlight?: boolean;
  isDelta?: boolean;
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const calColor = isDelta ? (cal > 0 ? colors.success : colors.danger) : colors.text;
  const protColor = isDelta ? (prot > 0 ? colors.success : colors.danger) : colors.text;

  return (
    <View style={[styles.crossRow, highlight && styles.crossRowHighlight]}>
      <Text style={[styles.crossCell, styles.crossCellLabel]}>{label}</Text>
      <Text style={[styles.crossCell, { color: calColor, fontWeight: "900" }]}>
        {isDelta && cal > 0 ? "+" : ""}{cal} kcal
      </Text>
      <Text style={[styles.crossCell, { color: protColor, fontWeight: "900" }]}>
        {isDelta && prot > 0 ? "+" : ""}{prot}g
      </Text>
      <View style={styles.crossCell}>
        {isDelta ? null : (
          <View style={[styles.barInline, { width: `${Math.min((cal / 2600) * 100, 100)}%`, backgroundColor: highlight ? colors.energy : colors.surfaceStrong }]} />
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

function PRRow({
  pr,
  colors,
}: {
  pr: typeof PERSONAL_RECORDS[0];
  colors: ColorPalette;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.prRow}>
      <View style={styles.prLeft}>
        <Text style={styles.prName}>{pr.exercise}</Text>
        <Text style={styles.prDate}>{pr.date}</Text>
      </View>
      <View style={styles.prRight}>
        <Text style={styles.prKg}>{pr.kg} kg</Text>
        <View style={styles.prDeltaBadge}>
          <TrendingUp size={10} color={colors.success} />
          <Text style={styles.prDelta}>{pr.delta}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
      color: colors.success,
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
    aiSkeleton: {
      gap: 8,
    },
    aiSkeletonLine: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surfaceStrong,
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
