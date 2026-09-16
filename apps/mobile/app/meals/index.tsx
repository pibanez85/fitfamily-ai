import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Coffee,
  Cookie,
  Moon,
  Plus,
  RefreshCw,
  Trash2,
  UtensilsCrossed,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { useLocalDay } from "@/hooks/useLocalDay";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { computeNutritionGoals } from "@/utils/nutritionGoals";
import {
  addLocalDays,
  datesEndingAt,
  formatLocalDate,
  isLocalDate,
  localDateKey,
  parseLocalDate,
  resolveSelectedDate,
} from "@/utils/localDate";
import {
  copyMealToDate,
  mealLabels,
  mealsOnDate,
  mealTypes,
  sumMeals,
  type DiaryMeal,
} from "@/utils/mealDiary";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

const bucketIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Moon,
  snack: Cookie,
  other: UtensilsCrossed,
};

export default function MealsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profile = useAppStore(
    (state) => state.profiles.find((item) => item.id === profileId) ?? null,
  );
  const today = useLocalDay();
  const params = useLocalSearchParams<{ date?: string }>();
  // null means follow today. An explicitly chosen history date stays put overnight.
  const [selection, setSelection] = useState<{ profileId: string | null; date: string | null }>({
    profileId,
    date: null,
  });
  const selectedDate = resolveSelectedDate(
    selection.profileId === profileId ? selection.date : null,
    today,
  );
  const [snapshot, setSnapshot] = useState<{
    profileId: string;
    meals: DiaryMeal[];
    weight: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [copying, setCopying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const copyLock = useRef(false);
  const previousProfile = useRef(profileId);
  const meals = snapshot?.profileId === profileId ? snapshot.meals : [];

  useEffect(() => {
    const profileChanged = previousProfile.current !== profileId;
    previousProfile.current = profileId;
    setPendingDelete(null);
    const date =
      !profileChanged && isLocalDate(params.date) && params.date <= localDateKey()
        ? params.date
        : null;
    setSelection({ profileId, date: date === localDateKey() ? null : date });
  }, [params.date, profileId]);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      setError(null);
      setNotice(null);
      Promise.all([api.meals.list(profileId), api.bodyMetrics.list(profileId).catch(() => [])])
        .then(([items, metrics]) => {
          if (!alive) return;
          const weight =
            metrics
              .slice()
              .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
              .find((item) => item.weightKg != null)?.weightKg ?? null;
          setSnapshot({ profileId, meals: items as DiaryMeal[], weight });
        })
        .catch((caught) => {
          if (alive)
            setError(caught instanceof Error ? caught.message : "No pudimos cargar tus comidas.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId, today, reload]),
  );

  const selectedMeals = mealsOnDate(meals, selectedDate, profileId);
  const totals = sumMeals(selectedMeals);
  const goals = computeNutritionGoals(
    profile,
    snapshot?.profileId === profileId ? snapshot.weight : null,
  );
  const days = datesEndingAt(selectedDate);
  const recent = meals
    .filter((meal) => meal.profileId === profileId && localDateKey(meal.eatenAt) !== selectedDate)
    .filter(
      (meal, index, all) =>
        all.findIndex((other) => other.name === meal.name && other.mealType === meal.mealType) ===
        index,
    )
    .slice(0, 3);
  const isToday = selectedDate === today;

  function chooseDate(date: string) {
    setSelection({ profileId, date: date === today ? null : date });
    router.setParams({ date: date === today ? undefined : date });
    setNotice(null);
    setPendingDelete(null);
  }

  function addMeal(mealType?: string) {
    router.push({
      pathname: "/meals/new",
      params: { date: selectedDate, ...(mealType ? { mealType } : {}) },
    });
  }

  async function repeatMeal(meal: DiaryMeal) {
    if (!profileId || copyLock.current) return;
    copyLock.current = true;
    setCopying(meal.id);
    setError(null);
    try {
      const created = await api.meals.create(profileId, copyMealToDate(meal, selectedDate));
      if (useAppStore.getState().activeProfileId !== profileId) return;
      setSnapshot((current) =>
        current?.profileId === profileId
          ? { ...current, meals: [created, ...current.meals] }
          : current,
      );
      setNotice(
        `${meal.name || mealLabels[meal.mealType]} añadida al ${isToday ? "día de hoy" : formatLocalDate(selectedDate)}.`,
      );
    } catch (caught) {
      if (useAppStore.getState().activeProfileId === profileId)
        setError(caught instanceof Error ? caught.message : "No se pudo repetir la comida.");
    } finally {
      setCopying(null);
      copyLock.current = false;
    }
  }

  async function removeMeal(mealId: string) {
    if (!profileId || deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await api.meals.delete(mealId);
      if (useAppStore.getState().activeProfileId !== profileId) return;
      setSnapshot((current) =>
        current?.profileId === profileId
          ? { ...current, meals: current.meals.filter((meal) => meal.id !== mealId) }
          : current,
      );
      setPendingDelete(null);
      setNotice("Comida eliminada. Actualizamos los totales del día.");
    } catch (caught) {
      if (useAppStore.getState().activeProfileId === profileId)
        setError(caught instanceof Error ? caught.message : "No pudimos eliminar esta comida.");
    } finally {
      setDeleting(false);
      deleteLock.current = false;
    }
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.grow}>
          <Text style={styles.eyebrow}>
            TU DIARIO · {profile?.displayName?.toLocaleUpperCase() ?? "NUTRICIÓN"}
          </Text>
          <Text style={styles.title}>
            Comer bien,<Text style={styles.titleSoft}> a tu ritmo.</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar comidas"
          style={styles.iconButton}
          onPress={() => setReload((value) => value + 1)}
        >
          <RefreshCw size={19} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.dateHeading}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Día anterior"
          style={styles.dayArrow}
          onPress={() => chooseDate(addLocalDays(selectedDate, -1))}
        >
          <ArrowLeft size={18} color={colors.text} />
        </Pressable>
        <View style={styles.dateLabel}>
          <Text style={styles.dateTitle}>{isToday ? "Hoy" : "Tu historial"}</Text>
          <Text style={styles.dateSubtitle}>{formatLocalDate(selectedDate)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Día siguiente"
          disabled={isToday}
          style={[styles.dayArrow, isToday && styles.disabled]}
          onPress={() => chooseDate(addLocalDays(selectedDate, 1))}
        >
          <ArrowRight size={18} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.week}>
        {days.map((date) => {
          const active = selectedDate === date;
          const recorded = mealsOnDate(meals, date, profileId).length > 0;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`Ver comidas del ${formatLocalDate(date)}`}
              accessibilityState={{ selected: active }}
              style={[styles.day, active && styles.activeDay]}
              onPress={() => chooseDate(date)}
            >
              <Text style={[styles.weekday, active && styles.activeText]}>
                {parseLocalDate(date)
                  .toLocaleDateString("es-CL", { weekday: "short" })
                  .replace(".", "")}
              </Text>
              <Text style={[styles.dayNumber, active && styles.activeText]}>
                {parseLocalDate(date).getDate()}
              </Text>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: recorded
                      ? active
                        ? colors.onPrimary
                        : colors.primary
                      : "transparent",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      {!isToday ? (
        <Pressable accessibilityRole="button" onPress={() => chooseDate(today)}>
          <Text style={styles.link}>Volver a hoy →</Text>
        </Pressable>
      ) : null}
      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <AppButton
            label="Reintentar"
            variant="secondary"
            onPress={() => setReload((value) => value + 1)}
          />
        </Card>
      ) : null}
      {notice ? (
        <View style={styles.notice}>
          <Check size={17} color={colors.primary} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {loading ? (
        <LoadingState label="Cargando tu diario..." />
      ) : (
        <>
          <Card style={styles.summary}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.eyebrow}>ENERGÍA DEL DÍA</Text>
                <Text style={styles.calories}>
                  {Math.round(totals.calories).toLocaleString("es-CL")}{" "}
                  <Text style={styles.unit}>kcal</Text>
                </Text>
              </View>
              <View style={styles.goalPill}>
                <Text style={styles.goalText}>
                  {Math.max(goals.calories - Math.round(totals.calories), 0)} por completar
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(100, (totals.calories / Math.max(goals.calories, 1)) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.hint}>
              Meta orientativa: {goals.calories.toLocaleString("es-CL")} kcal
            </Text>
            <View style={styles.macros}>
              {[
                { name: "Proteína", value: totals.proteinG, goal: goals.proteinG },
                { name: "Carbohidratos", value: totals.carbsG, goal: goals.carbsG },
                { name: "Grasas", value: totals.fatG, goal: goals.fatG },
              ].map((macro) => (
                <View key={macro.name} style={styles.macro}>
                  <Text style={styles.macroName}>{macro.name}</Text>
                  <Text style={styles.macroValue}>
                    {Math.round(macro.value)}
                    <Text style={styles.macroGoal}> / {macro.goal} g</Text>
                  </Text>
                </View>
              ))}
            </View>
          </Card>
          <View style={styles.actions}>
            <AppButton
              label="Agregar comida"
              icon={Plus}
              onPress={() => addMeal()}
              style={styles.grow}
            />
            <AppButton
              label="Foto"
              icon={Camera}
              variant="secondary"
              onPress={() =>
                router.push({ pathname: "/meals/photo", params: { date: selectedDate } })
              }
            />
          </View>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Tus comidas</Text>
            <Text style={styles.hint}>{selectedMeals.length} registros</Text>
          </View>
          {mealTypes.map((type) => {
            const items = selectedMeals.filter((meal) => meal.mealType === type);
            if (type === "other" && items.length === 0) return null;
            const Icon = bucketIcons[type];
            return (
              <Card key={type} style={styles.bucket}>
                <View style={styles.bucketHeading}>
                  <View style={styles.bucketIcon}>
                    <Icon size={21} color={colors.primary} />
                  </View>
                  <View style={styles.grow}>
                    <Text style={styles.bucketTitle}>{mealLabels[type]}</Text>
                    <Text style={styles.hint}>
                      {items.length
                        ? `${Math.round(sumMeals(items).calories)} kcal`
                        : "Aún sin registrar"}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar ${mealLabels[type].toLowerCase()}`}
                    onPress={() => addMeal(type)}
                    style={styles.addButton}
                  >
                    <Plus size={20} color={colors.primary} />
                  </Pressable>
                </View>
                {items.map((meal) => (
                  <View key={meal.id} style={styles.mealEntry}>
                    <View style={styles.mealLine}>
                      <View style={styles.grow}>
                        <Text style={styles.mealName}>{meal.name || mealLabels[type]}</Text>
                        {meal.mealItems?.length ? (
                          <Text style={styles.hint}>
                            {meal.mealItems
                              .map(
                                (item) =>
                                  `${item.name}${item.estimatedPortion ? ` · ${item.estimatedPortion}` : ""}`,
                              )
                              .join(" · ")}
                          </Text>
                        ) : null}
                        <Text style={styles.hint}>
                          P {Math.round(meal.proteinG ?? 0)} · C {Math.round(meal.carbsG ?? 0)} · G{" "}
                          {Math.round(meal.fatG ?? 0)} g
                        </Text>
                      </View>
                      <Text style={styles.mealCalories}>
                        {Math.round(meal.calories ?? 0)}
                        <Text style={styles.smallUnit}> kcal</Text>
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar ${meal.name || mealLabels[type]}`}
                        style={styles.deleteButton}
                        disabled={deleting}
                        onPress={() => setPendingDelete(meal.id)}
                      >
                        <Trash2 size={16} color={colors.muted} />
                      </Pressable>
                    </View>
                    {pendingDelete === meal.id ? (
                      <View style={styles.deleteConfirm}>
                        <Text style={styles.hint}>
                          ¿Eliminar este registro? También se quitará de los totales del día.
                        </Text>
                        <View style={styles.actions}>
                          <AppButton
                            label="Cancelar"
                            variant="secondary"
                            disabled={deleting}
                            style={styles.grow}
                            onPress={() => setPendingDelete(null)}
                          />
                          <AppButton
                            label="Eliminar"
                            variant="danger"
                            loading={deleting}
                            style={styles.grow}
                            onPress={() => void removeMeal(meal.id)}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                ))}
              </Card>
            );
          })}
          {recent.length > 0 ? (
            <Card>
              <Text style={styles.sectionTitle}>Lo de siempre, en un toque</Text>
              <Text style={styles.hint}>Repite una comida en el día seleccionado.</Text>
              {recent.map((meal) => (
                <Pressable
                  key={meal.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Repetir ${meal.name || mealLabels[meal.mealType]}`}
                  disabled={!!copying}
                  style={styles.repeatRow}
                  onPress={() => void repeatMeal(meal)}
                >
                  <View style={styles.grow}>
                    <Text style={styles.mealName}>{meal.name || mealLabels[meal.mealType]}</Text>
                    <Text style={styles.hint}>
                      {Math.round(meal.calories ?? 0)} kcal ·{" "}
                      {copying === meal.id ? "Guardando…" : "Agregar de nuevo"}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.primary} />
                </Pressable>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    grow: { flex: 1 },
    heading: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 4 },
    eyebrow: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    title: {
      color: c.text,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: "800",
      letterSpacing: -1,
      marginTop: 8,
    },
    titleSoft: { color: c.primary },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    dateHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
    dateLabel: { flex: 1, alignItems: "center", gap: 3 },
    dateTitle: { color: c.text, fontSize: 18, fontWeight: "800" },
    dateSubtitle: { color: c.muted, fontSize: 12 },
    dayArrow: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      backgroundColor: c.surface,
    },
    disabled: { opacity: 0.25 },
    week: { flexDirection: "row", gap: 6 },
    day: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      gap: 6,
      borderRadius: 18,
      backgroundColor: c.surface,
    },
    activeDay: { backgroundColor: c.primary },
    weekday: { color: c.muted, fontSize: 10, fontWeight: "600" },
    dayNumber: { color: c.text, fontSize: 17, fontWeight: "800" },
    activeText: { color: c.onPrimary },
    dot: { width: 4, height: 4, borderRadius: 2 },
    link: { color: c.primary, textAlign: "center", fontSize: 13, fontWeight: "700" },
    summary: { gap: 12 },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    calories: { color: c.text, fontWeight: "800", fontSize: 34, letterSpacing: -1, marginTop: 4 },
    unit: { fontSize: 15, fontWeight: "500", color: c.muted },
    goalPill: { borderRadius: 14, backgroundColor: c.primarySoft, padding: 9 },
    goalText: { color: c.primary, fontSize: 10, fontWeight: "700" },
    track: { height: 7, borderRadius: 5, overflow: "hidden", backgroundColor: c.surfaceMuted },
    fill: { height: "100%", backgroundColor: c.primary, borderRadius: 5 },
    hint: { color: c.muted, fontSize: 12, lineHeight: 18 },
    macros: {
      flexDirection: "row",
      gap: 10,
      borderTopWidth: 1,
      borderColor: c.border,
      paddingTop: 14,
    },
    macro: { flex: 1, gap: 4 },
    macroName: { color: c.muted, fontSize: 11 },
    macroValue: { color: c.text, fontSize: 18, fontWeight: "800" },
    macroGoal: { color: c.muted, fontSize: 10, fontWeight: "500" },
    actions: { flexDirection: "row", gap: 10 },
    sectionHeading: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    sectionTitle: { fontSize: 18, color: c.text, fontWeight: "800", letterSpacing: -0.3 },
    bucket: { gap: 12 },
    bucketHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
    bucketIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: c.primarySoft,
      justifyContent: "center",
      alignItems: "center",
    },
    bucketTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
    addButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    mealEntry: { borderTopWidth: 1, borderColor: c.border, paddingTop: 12, gap: 10 },
    deleteButton: { width: 38, height: 42, justifyContent: "center", alignItems: "center" },
    deleteConfirm: {
      gap: 10,
      backgroundColor: c.backgroundElevated,
      borderRadius: 12,
      padding: 12,
    },
    mealLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    mealName: { color: c.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
    mealCalories: { color: c.text, fontSize: 16, fontWeight: "800" },
    smallUnit: { fontSize: 10, color: c.muted, fontWeight: "500" },
    repeatRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    error: { color: c.danger, fontSize: 13 },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      backgroundColor: c.primarySoft,
      borderRadius: 12,
    },
    noticeText: { flex: 1, color: c.primary, fontSize: 12 },
  });
}
