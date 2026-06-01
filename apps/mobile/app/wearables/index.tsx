import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Watch, Heart, Footprints, Dumbbell, Moon, RefreshCw, ChevronRight, CheckCircle, AlertCircle } from "lucide-react-native";
import Svg, { Circle, Rect, Text as SvgText, G } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";
import {
  healthService,
  type HealthSnapshot,
  type DetectedWorkout,
} from "@/services/healthService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso);
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return days[d.getDay()];
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function sleepLabel(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Circular steps progress ring */
function StepsRing({
  steps,
  goal = 10000,
  distanceKm,
  color,
  bg,
  textColor,
  mutedColor,
}: {
  steps: number;
  goal?: number;
  distanceKm: number;
  color: string;
  bg: string;
  textColor: string;
  mutedColor: string;
}) {
  const size = 180;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(steps / goal, 1);
  const dash = circumference * progress;

  return (
    <View style={{ alignItems: "center", marginVertical: 8 }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={bg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
        {/* Center text */}
        <SvgText
          x={cx}
          y={cx - 12}
          textAnchor="middle"
          fill={textColor}
          fontSize="28"
          fontWeight="700"
        >
          {steps.toLocaleString("es-ES")}
        </SvgText>
        <SvgText
          x={cx}
          y={cx + 10}
          textAnchor="middle"
          fill={mutedColor}
          fontSize="12"
        >
          pasos
        </SvgText>
        <SvgText
          x={cx}
          y={cx + 28}
          textAnchor="middle"
          fill={mutedColor}
          fontSize="12"
        >
          {distanceKm.toFixed(1)} km
        </SvgText>
      </Svg>
      <Text style={{ color: mutedColor, fontSize: 12, marginTop: 4 }}>
        Meta: {goal.toLocaleString("es-ES")} pasos
      </Text>
      <View
        style={{
          height: 4,
          width: 160,
          borderRadius: 2,
          backgroundColor: bg,
          marginTop: 6,
        }}
      >
        <View
          style={{
            height: 4,
            width: 160 * progress,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      </View>
      <Text style={{ color: mutedColor, fontSize: 11, marginTop: 4 }}>
        {Math.round(progress * 100)}% completado
      </Text>
    </View>
  );
}

/** Weekly steps mini-bar chart */
function WeeklyBars({
  data,
  color,
  bg,
  mutedColor,
}: {
  data: { date: string; steps: number }[];
  color: string;
  bg: string;
  mutedColor: string;
}) {
  const W = 300;
  const H = 60;
  const max = Math.max(...data.map((d) => d.steps), 1);
  const barW = 28;
  const gap = (W - barW * data.length) / (data.length + 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Svg width={W} height={H + 20}>
      {data.map((d, i) => {
        const barH = (d.steps / max) * H;
        const x = gap + i * (barW + gap);
        const y = H - barH;
        const isToday = d.date === today;
        return (
          <G key={d.date}>
            <Rect
              x={x}
              y={0}
              width={barW}
              height={H}
              rx={6}
              fill={bg}
            />
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={6}
              fill={isToday ? color : color + "99"}
            />
            <SvgText
              x={x + barW / 2}
              y={H + 14}
              textAnchor="middle"
              fill={isToday ? color : mutedColor}
              fontSize="10"
              fontWeight={isToday ? "700" : "400"}
            >
              {fmtDate(d.date + "T12:00:00")}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** Heart rate card */
function HeartRateCard({
  resting,
  maxBpm,
  avgBpm,
  hrv,
  trend,
  colors,
}: {
  resting: number;
  maxBpm: number;
  avgBpm: number;
  hrv: number;
  trend: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const trendColor =
    trend === "improving" ? colors.success : trend === "declining" ? colors.danger : colors.muted;
  const trendLabel =
    trend === "improving" ? "↑ Mejorando" : trend === "declining" ? "↓ Bajando" : "→ Estable";

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={20} color={colors.accent} fill={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            {resting}
            <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "400" }}> bpm reposo</Text>
          </Text>
          <Text style={{ color: trendColor, fontSize: 12, fontWeight: "600" }}>{trendLabel}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          { label: "Máx entrenamiento", value: `${maxBpm} bpm`, color: colors.accent },
          { label: "Prom entrenamiento", value: `${avgBpm} bpm`, color: colors.energy },
          { label: "HRV (SDNN)", value: `${hrv} ms`, color: colors.success },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ color: item.color, fontSize: 16, fontWeight: "700" }}>{item.value}</Text>
            <Text style={{ color: colors.muted, fontSize: 10, textAlign: "center" }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Single workout row */
function WorkoutRow({ workout, colors }: { workout: DetectedWorkout; colors: ReturnType<typeof useTheme>["colors"] }) {
  const icon = healthService.workoutIcon(workout.type);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>{workout.type}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {fmtDate(workout.startDate)} · {fmtTime(workout.startDate)} · {workout.source}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>
          {workout.durationMin} min
        </Text>
        <Text style={{ color: colors.energy, fontSize: 12 }}>{workout.calories} kcal</Text>
      </View>
    </View>
  );
}

/** Sleep quality breakdown */
function SleepCard({
  session,
  colors,
}: {
  session: HealthSnapshot["lastSleep"];
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const total = session.hoursTotal || 1;
  const deepPct = session.hoursDeep / total;
  const remPct = session.hoursREM / total;
  const lightPct = session.hoursLight / total;

  const score = session.recoveryScore;
  const scoreColor = score >= 75 ? colors.success : score >= 50 ? colors.energy : colors.danger;

  return (
    <View style={{ gap: 14 }}>
      {/* Score row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
            {sleepLabel(session.hoursTotal)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>última noche</Text>
        </View>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 3,
            borderColor: scoreColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: scoreColor, fontSize: 18, fontWeight: "700" }}>{score}</Text>
          <Text style={{ color: colors.muted, fontSize: 9 }}>récup.</Text>
        </View>
      </View>

      {/* Stacked bar */}
      <View>
        <View style={{ flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden" }}>
          <View style={{ flex: deepPct, backgroundColor: "#3b82f6" }} />
          <View style={{ flex: remPct, backgroundColor: "#8b5cf6" }} />
          <View style={{ flex: lightPct, backgroundColor: "#60a5fa" }} />
        </View>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        {[
          { label: "Profundo", value: sleepLabel(session.hoursDeep), color: "#3b82f6" },
          { label: "REM", value: sleepLabel(session.hoursREM), color: "#8b5cf6" },
          { label: "Ligero", value: sleepLabel(session.hoursLight), color: "#60a5fa" },
        ].map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <View>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{s.value}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* HRV */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Heart size={14} color={colors.muted} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          HRV nocturno: <Text style={{ color: colors.text, fontWeight: "600" }}>{session.hrv} ms</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── Device badge ─────────────────────────────────────────────────────────────

function DeviceBadge({ name, colors }: { name: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  const icon = name.toLowerCase().includes("watch")
    ? "⌚"
    : name.toLowerCase().includes("garmin")
    ? "🏃"
    : name.toLowerCase().includes("samsung")
    ? "📱"
    : "💪";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.primarySoft,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: colors.primary + "40",
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{name}</Text>
      <CheckCircle size={14} color={colors.success} />
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  colors,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon}
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WearablesScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const syncAnim = useRef(new Animated.Value(0)).current;

  async function loadData() {
    try {
      const data = await healthService.getSnapshot();
      setSnapshot(data);
      const allGranted = Object.values(data.permissions).every((v) => v === "granted");
      setPermissionsGranted(allGranted);
    } catch {
      setSnapshot(healthService.getMockSnapshot());
      setPermissionsGranted(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    Animated.loop(
      Animated.timing(syncAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
    await loadData();
    setSyncing(false);
    syncAnim.stopAnimation();
    syncAnim.setValue(0);
  }

  async function handleGrantPermissions() {
    setSyncing(true);
    try {
      await healthService.requestPermissions();
      await loadData();
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const syncRotate = syncAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>Leyendo datos de salud…</Text>
      </SafeAreaView>
    );
  }

  const s = snapshot!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reloj & Salud</Text>
          <Text style={styles.headerSub}>
            Última sync: {new Date(s.lastSyncAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <Pressable onPress={handleSync} style={styles.syncBtn} disabled={syncing}>
          <Animated.View style={{ transform: [{ rotate: syncRotate }] }}>
            <RefreshCw size={18} color={colors.primary} />
          </Animated.View>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Permissions banner */}
        {!permissionsGranted && (
          <Pressable
            onPress={handleGrantPermissions}
            style={[styles.permBanner, { backgroundColor: colors.energySoft, borderColor: colors.energy }]}
          >
            <AlertCircle size={18} color={colors.energy} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.energy, fontWeight: "700", fontSize: 13 }}>
                Permisos necesarios
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Toca para conectar tu reloj y autorizar acceso a datos de salud
              </Text>
            </View>
            <ChevronRight size={18} color={colors.energy} />
          </Pressable>
        )}

        {/* Connected devices */}
        {s.connectedSources.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionLabel}>Dispositivos conectados</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {s.connectedSources.map((src) => (
                <DeviceBadge key={src} name={src} colors={colors} />
              ))}
            </View>
          </View>
        )}

        {/* Steps section */}
        <Section
          title="Pasos de hoy"
          icon={<Footprints size={18} color={colors.primary} />}
          colors={colors}
        >
          <StepsRing
            steps={s.todaySteps}
            distanceKm={s.todayDistanceKm}
            color={colors.primary}
            bg={colors.surfaceStrong}
            textColor={colors.text}
            mutedColor={colors.muted}
          />
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Text style={styles.sectionLabel}>Últimos 7 días</Text>
            <WeeklyBars
              data={s.weeklySteps}
              color={colors.primary}
              bg={colors.surfaceStrong}
              mutedColor={colors.muted}
            />
          </View>
        </Section>

        {/* Heart rate section */}
        <Section
          title="Frecuencia cardíaca"
          icon={<Heart size={18} color={colors.accent} />}
          colors={colors}
        >
          <HeartRateCard
            resting={s.heartRate.restingBpm}
            maxBpm={s.heartRate.maxWorkoutBpm}
            avgBpm={s.heartRate.avgWorkoutBpm}
            hrv={s.heartRate.hrv}
            trend={s.heartRate.trend}
            colors={colors}
          />
        </Section>

        {/* Detected workouts section */}
        <Section
          title="Entrenamientos detectados"
          icon={<Dumbbell size={18} color={colors.energy} />}
          colors={colors}
        >
          {s.recentWorkouts.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Sin entrenamientos detectados esta semana
            </Text>
          ) : (
            <View>
              {s.recentWorkouts.map((w) => (
                <WorkoutRow
                  key={w.id}
                  workout={w}
                  colors={colors}
                />
              ))}
            </View>
          )}
          {/* Summary row */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 4,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {[
              {
                label: "Sesiones",
                value: `${s.recentWorkouts.length}`,
                color: colors.primary,
              },
              {
                label: "Tiempo total",
                value: healthService.formatDuration(
                  s.recentWorkouts.reduce((a, w) => a + w.durationMin, 0)
                ),
                color: colors.energy,
              },
              {
                label: "Calorías",
                value: `${s.recentWorkouts.reduce((a, w) => a + w.calories, 0)} kcal`,
                color: colors.accent,
              },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: item.color, fontSize: 15, fontWeight: "700" }}>
                  {item.value}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 10, textAlign: "center" }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Sleep section */}
        <Section
          title="Sueño y recuperación"
          icon={<Moon size={18} color="#8b5cf6" />}
          colors={colors}
        >
          <SleepCard session={s.lastSleep} colors={colors} />
        </Section>

        {/* Install note */}
        <View
          style={{
            backgroundColor: colors.surfaceMuted,
            borderRadius: 12,
            padding: 14,
            gap: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Watch size={16} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
              Compatible con:
            </Text>
          </View>
          <Text style={{ color: colors.subtle, fontSize: 11, lineHeight: 18 }}>
            <Text style={{ color: colors.muted }}>iOS: </Text>Apple Watch, Garmin, Fitbit, Polar (vía Apple Health){"\n"}
            <Text style={{ color: colors.muted }}>Android: </Text>Samsung Galaxy Watch, Garmin, Fitbit, Google Pixel Watch (vía Health Connect){"\n\n"}
            Para activar datos reales se requiere build nativo (EAS Build). Los datos mostrados son de demostración.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    syncBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    headerSub: {
      color: colors.muted,
      fontSize: 12,
    },
    scroll: {
      padding: 16,
      gap: 16,
    },
    sectionLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    permBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
  });
}
