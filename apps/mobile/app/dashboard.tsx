import { router, useFocusEffect } from "expo-router";
import {
  ArrowUpRight,
  Dumbbell,
  Plus,
  Utensils,
  CalendarDays,
  Scale,
  ChevronRight,
  Check,
  Camera,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { BodyMetric, Meal, Workout, WorkoutLog } from "@fitfamily-ai/shared";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { AppButton } from "@/components/AppButton";
import { Title, BodyText } from "@/components/Typography";
import { LoadingState } from "@/components/StateViews";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/theme";
import { useLocalDay } from "@/hooks/useLocalDay";
import { datesEndingAt, localDateKey, parseLocalDate } from "@/utils/localDate";
import { computeNutritionGoals } from "@/utils/nutritionGoals";

type Diary = { meals: Meal[]; logs: WorkoutLog[]; workouts: Workout[]; metrics: BodyMetric[] };
export default function DashboardScreen() {
  const profileId = useActiveProfileId();
  return <ProfileDashboard key={profileId ?? "no-profile"} />;
}

function ProfileDashboard() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const profileId = useActiveProfileId();
  const profile = useAppStore((state) => state.activeProfile());
  const activeId = useAppStore((state) => state.getActiveWorkoutId(profileId));
  const today = useLocalDay();
  const [data, setData] = useState<Diary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setData(null);
      setError(null);
      Promise.all([
        api.meals.list(profileId),
        api.workouts.logs(profileId),
        api.workouts.list(profileId),
        api.bodyMetrics.list(profileId),
      ])
        .then(([meals, logs, workouts, metrics]) => {
          if (alive) setData({ meals, logs, workouts, metrics });
        })
        .catch((caught) => {
          if (alive)
            setError(caught instanceof Error ? caught.message : "No pudimos cargar tu día.");
        });
      return () => {
        alive = false;
      };
    }, [profileId, today, retry]),
  );
  const days = datesEndingAt(today);
  const meals = data?.meals.filter((meal) => localDateKey(meal.eatenAt) === today) ?? [];
  const total = meals.reduce(
    (sum, meal) => ({
      kcal: sum.kcal + (meal.calories ?? 0),
      protein: sum.protein + (meal.proteinG ?? 0),
      carbs: sum.carbs + (meal.carbsG ?? 0),
      fat: sum.fat + (meal.fatG ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const weight = data?.metrics
    .slice()
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0]?.weightKg;
  const goals = computeNutritionGoals(profile, weight);
  const workout = data?.workouts.find((item) => item.id === activeId);
  const weekLogs = data?.logs.filter((log) => days.includes(localDateKey(log.startedAt))) ?? [];
  const todayLogs = weekLogs.filter((log) => localDateKey(log.startedAt) === today);
  const fraction = Math.min(1, total.kcal / goals.calories);
  return (
    <Screen>
      <View style={s.header}>
        <View style={{ gap: 7 }}>
          <Text style={[s.eyebrow, { color: colors.primary }]}>TU DIARIO PERSONAL</Text>
          <Title>
            Hola, {profile?.displayName ?? "familia"}
            <Text style={{ color: colors.primary }}>.</Text>
          </Title>
          <BodyText style={{ color: colors.muted }}>
            Cada pequeño paso cuenta. Este es el tuyo de hoy.
          </BodyText>
        </View>
        <View style={[s.date, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <CalendarDays size={16} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {parseLocalDate(today).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}
          </Text>
        </View>
      </View>
      <View style={[s.week, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {days.map((day) => {
          const isToday = day === today;
          const trained = data?.logs.some((log) => localDateKey(log.startedAt) === day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={"Ver registros del " + day}
              onPress={() => router.push({ pathname: "/meals", params: { date: day } })}
              style={[s.weekDay, { backgroundColor: isToday ? colors.primary : "transparent" }]}
            >
              <Text style={[s.weekLabel, { color: isToday ? "#E2EDDC" : colors.muted }]}>
                {parseLocalDate(day)
                  .toLocaleDateString("es-CL", { weekday: "short" })
                  .replace(".", "")
                  .toUpperCase()}
              </Text>
              <Text style={[s.dayNumber, { color: isToday ? "#FFFFFF" : colors.text }]}>
                {parseLocalDate(day).getDate()}
              </Text>
              {trained ? (
                <Check size={12} color={isToday ? "#D4EF8A" : colors.primary} />
              ) : (
                <View style={[s.dot, { backgroundColor: isToday ? "#D4EF8A" : colors.border }]} />
              )}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Card>
          <BodyText>{error}</BodyText>
          <AppButton label="Volver a intentar" onPress={() => setRetry((value) => value + 1)} />
        </Card>
      ) : null}
      {!data && !error ? <LoadingState label="Preparando tu día..." /> : null}
      {data ? (
        <>
          <View style={[s.columns, wide ? s.horizontal : null]}>
            <View style={[s.training, { flex: wide ? 1.15 : undefined }]}>
              <View style={s.row}>
                <View style={s.badge}>
                  <Dumbbell size={15} color="#D4EF8A" />
                  <Text style={s.badgeText}>TU MOVIMIENTO DE HOY</Text>
                </View>
                <ArrowUpRight size={23} color="#B9CDB9" />
              </View>
              <Text style={s.trainingTitle}>
                {todayLogs.length
                  ? "Buen trabajo.\nYa sumaste hoy."
                  : workout
                    ? "Tu próxima serie\nempieza aquí."
                    : "Hagamos espacio\npara ti."}
              </Text>
              <Text style={s.trainingSubtitle}>
                {workout?.name ?? "Incorpora tu rutina y ten cada sesión a mano."}
              </Text>
              <View style={s.trainingFooter}>
                <Text style={s.trainingMeta}>{weekLogs.length} sesiones en los últimos 7 días</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={workout ? "Ver entrenamiento de hoy" : "Elegir mi rutina"}
                  onPress={() => router.push(workout ? "/today" : "/workouts")}
                  style={s.trainingButton}
                >
                  <Text style={s.trainingButtonText}>
                    {workout ? "Ver mi sesión" : "Elegir rutina"}
                  </Text>
                  <ArrowUpRight size={17} color="#233A29" />
                </Pressable>
              </View>
              <View pointerEvents="none" style={s.orbitOne} />
              <View pointerEvents="none" style={s.orbitTwo} />
            </View>
            <Card style={{ flex: wide ? 1 : undefined, gap: 18 }}>
              <View style={s.row}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Tu nutrición, hoy</Text>
                <Utensils size={19} color={colors.primary} />
              </View>
              <View style={s.nutritionRow}>
                <View style={s.ring}>
                  <Svg width={130} height={130} viewBox="0 0 130 130">
                    <Circle
                      cx={65}
                      cy={65}
                      r={55}
                      fill="none"
                      stroke={colors.surfaceMuted}
                      strokeWidth={9}
                    />
                    <Circle
                      cx={65}
                      cy={65}
                      r={55}
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth={9}
                      strokeLinecap="round"
                      strokeDasharray={[345.6 * fraction, 345.6]}
                      transform="rotate(-90 65 65)"
                    />
                  </Svg>
                  <View style={s.ringText}>
                    <Text style={[s.total, { color: colors.text }]}>{Math.round(total.kcal)}</Text>
                    <Text style={[s.small, { color: colors.muted }]}>kcal registradas</Text>
                  </View>
                </View>
                <View style={{ flex: 1, gap: 12 }}>
                  <Text style={[s.remaining, { color: colors.text }]}>
                    {Math.max(0, Math.round(goals.calories - total.kcal))}{" "}
                    <Text style={s.small}>kcal restantes</Text>
                  </Text>
                  <Text style={[s.small, { color: colors.muted }]}>
                    Referencia estimada: {goals.calories} kcal
                  </Text>
                  <Text style={[s.small, { color: colors.muted }]}>
                    {meals.length} comidas registradas hoy
                  </Text>
                </View>
              </View>
              <View style={s.macros}>
                {[
                  {
                    name: "Proteína",
                    value: total.protein,
                    goal: goals.proteinG,
                    color: "#65A30D",
                  },
                  { name: "Carbos", value: total.carbs, goal: goals.carbsG, color: "#FF8A3D" },
                  { name: "Grasas", value: total.fat, goal: goals.fatG, color: "#FF5C6E" },
                ].map((macro) => (
                  <View key={macro.name} style={{ flex: 1, gap: 7 }}>
                    <Text style={[s.small, { color: colors.muted }]}>{macro.name}</Text>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      {Math.round(macro.value)}{" "}
                      <Text style={{ color: colors.muted, fontWeight: "400", fontSize: 10 }}>
                        / {macro.goal} g
                      </Text>
                    </Text>
                    <View style={[s.track, { backgroundColor: colors.surfaceMuted }]}>
                      <View
                        style={{
                          height: 4,
                          borderRadius: 3,
                          width: (Math.min(100, (macro.value / macro.goal) * 100) +
                            "%") as `${number}%`,
                          backgroundColor: macro.color,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <AppButton
                label="Registrar comida"
                icon={Plus}
                variant="secondary"
                onPress={() => router.push("/meals/new")}
              />
            </Card>
          </View>
          <View style={s.row}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Tu semana, en perspectiva</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/progress")}
              style={s.inline}
            >
              <Text style={[s.small, { color: colors.primary }]}>Ver progreso</Text>
              <ChevronRight size={15} color={colors.primary} />
            </Pressable>
          </View>
          <View style={[s.columns, wide ? s.horizontal : null]}>
            <Card style={{ flex: wide ? 1.55 : undefined }}>
              <View style={s.row}>
                <View style={{ gap: 6 }}>
                  <Text style={[s.eyebrow, { color: colors.muted }]}>CONSTANCIA DIARIA</Text>
                  <Text style={[s.statNumber, { color: colors.text }]}>
                    {
                      days.filter(
                        (day) =>
                          data.meals.some((meal) => localDateKey(meal.eatenAt) === day) ||
                          data.logs.some((log) => localDateKey(log.startedAt) === day),
                      ).length
                    }
                    <Text style={[s.small, { color: colors.muted }]}> / 7 días con registros</Text>
                  </Text>
                </View>
                <View style={s.inline}>
                  <View style={[s.dot, { backgroundColor: colors.primary }]} />
                  <Text style={[s.small, { color: colors.muted }]}>Comidas</Text>
                </View>
              </View>
              <View style={s.chart}>
                {days.map((day) => {
                  const count = data.meals.filter(
                    (meal) => localDateKey(meal.eatenAt) === day,
                  ).length;
                  return (
                    <View key={day} style={s.chartColumn}>
                      <Text style={[s.small, { color: colors.muted }]}>{count}</Text>
                      <View
                        style={[
                          s.bar,
                          {
                            height: Math.max(4, Math.min(80, count * 17)),
                            backgroundColor: day === today ? colors.primary : "#DDE6CC",
                          },
                        ]}
                      />
                      <Text style={[s.small, { color: colors.muted }]}>
                        {parseLocalDate(day)
                          .toLocaleDateString("es-CL", { weekday: "short" })
                          .slice(0, 2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
            <Card style={{ flex: wide ? 1 : undefined, justifyContent: "space-between", gap: 17 }}>
              <View style={s.row}>
                <Text style={[s.eyebrow, { color: colors.muted }]}>ÚLTIMO PESO REGISTRADO</Text>
                <Scale size={19} color={colors.primary} />
              </View>
              <Text style={[s.statNumber, { color: colors.text }]}>
                {weight ?? "—"}
                <Text style={[s.small, { color: colors.muted }]}> kg</Text>
              </Text>
              <Text style={[s.small, { color: colors.muted }]}>
                Observa tu evolución a tu propio ritmo.
              </Text>
              <AppButton
                label="Registrar medida"
                variant="secondary"
                icon={Plus}
                onPress={() => router.push("/body-metrics")}
              />
            </Card>
          </View>
          <View style={s.quickRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/meals/photo")}
              style={[s.quick, { backgroundColor: colors.accentSoft }]}
            >
              <Camera size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>
                  ¿Qué hay en tu plato?
                </Text>
                <Text style={[s.small, { color: colors.muted }]}>
                  Registra una foto y revisa la estimación.
                </Text>
              </View>
              <ArrowUpRight size={19} color={colors.accent} />
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
  },
  eyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  date: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  week: { flexDirection: "row", padding: 8, gap: 5, borderRadius: 18, borderWidth: 1 },
  weekDay: { flex: 1, paddingVertical: 12, alignItems: "center", gap: 8, borderRadius: 12 },
  weekLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 1 },
  dayNumber: { fontSize: 21, fontWeight: "600" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  columns: { gap: 18 },
  horizontal: { flexDirection: "row", alignItems: "stretch" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  inline: { flexDirection: "row", gap: 7, alignItems: "center" },
  training: {
    backgroundColor: "#243F30",
    borderRadius: 20,
    padding: 27,
    gap: 18,
    overflow: "hidden",
    minHeight: 300,
  },
  badge: { flexDirection: "row", gap: 8, alignItems: "center", zIndex: 1 },
  badgeText: { color: "#D4EF8A", fontSize: 9, fontWeight: "700", letterSpacing: 1.4 },
  trainingTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "600",
    letterSpacing: -1.3,
    zIndex: 1,
  },
  trainingSubtitle: { color: "#CBDBC9", fontSize: 13, lineHeight: 20, zIndex: 1 },
  trainingFooter: { marginTop: "auto", gap: 18, alignItems: "flex-start", zIndex: 1 },
  trainingMeta: { fontSize: 11, color: "#B5C9B7" },
  trainingButton: {
    backgroundColor: "#D4EF8A",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  trainingButtonText: { color: "#233A29", fontSize: 12, fontWeight: "700" },
  orbitOne: {
    position: "absolute",
    right: -155,
    top: 60,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "#4D6852",
  },
  orbitTwo: {
    position: "absolute",
    right: -110,
    top: 105,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "#4D6852",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  nutritionRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  ring: { width: 130, height: 130 },
  ringText: { position: "absolute", top: 43, left: 0, right: 0, alignItems: "center", gap: 3 },
  total: { fontSize: 27, fontWeight: "700", letterSpacing: -1 },
  small: { fontSize: 11, lineHeight: 17 },
  remaining: { fontSize: 22, fontWeight: "600" },
  macros: { flexDirection: "row", gap: 18 },
  track: { height: 4, borderRadius: 3 },
  statNumber: { fontSize: 32, fontWeight: "600", letterSpacing: -1 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 18, height: 125, paddingTop: 16 },
  chartColumn: { flex: 1, alignItems: "center", gap: 7 },
  bar: { width: "100%", maxWidth: 45, borderRadius: 5 },
  quickRow: { gap: 16 },
  quick: { flexDirection: "row", alignItems: "center", gap: 15, borderRadius: 14, padding: 18 },
});
