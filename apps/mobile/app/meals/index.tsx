import { router, useFocusEffect } from "expo-router";
import { Bot, Camera, Coffee, Cookie, Moon, Plus, Search, Sparkles, UtensilsCrossed } from "lucide-react-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MacroTotals, Meal } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { MacroDonut, MacroProgress, MiniBarChart } from "@/components/NutritionCharts";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { computeNutritionGoals } from "@/utils/nutritionGoals";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type MealWithItems = Meal & {
  mealItems?: Array<{ name: string; estimatedPortion?: string | null }>;
};

type MealBucket = {
  type: string;
  label: string;
  meals: MealWithItems[];
};

export default function MealsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profile = useAppStore((state) =>
    state.profiles.find((entry) => entry.id === state.activeProfileId) ?? null,
  );
  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      Promise.all([api.meals.list(profileId), api.bodyMetrics.list(profileId).catch(() => [])])
        .then(([items, metrics]) => {
          if (!alive) return;
          setMeals(items as MealWithItems[]);
          const lastWeight = metrics
            .slice()
            .sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : -1))
            .find((metric) => metric.weightKg != null)?.weightKg;
          setLatestWeightKg(lastWeight ?? null);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId]),
  );

  const dailyGoals = useMemo(
    () => computeNutritionGoals(profile, latestWeightKg),
    [profile, latestWeightKg],
  );

  const todayMeals = useMemo(() => meals.filter((meal) => isSameLocalDay(meal.eatenAt, new Date())), [meals]);
  const totals = useMemo(() => sumMeals(todayMeals), [todayMeals]);
  const remainingCalories = Math.max(dailyGoals.calories - totals.calories, 0);
  const mealBuckets = useMemo(() => buildMealBuckets(todayMeals), [todayMeals]);
  const weekCalories = useMemo(() => weeklyValues(meals, "calories"), [meals]);
  const weekProtein = useMemo(() => weeklyValues(meals, "proteinG"), [meals]);
  const frequentFoods = useMemo(() => topMealItems(meals), [meals]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Title>Nutrición</Title>
          <Subtitle>Tu día de comida con macros claros, porciones reales e IA cuando haya dudas.</Subtitle>
        </View>
        <Pressable style={styles.aiButton} onPress={() => router.push("/chat")}>
          <Bot size={20} color={colors.onPrimary} />
        </Pressable>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Consumido hoy</Text>
            <Text style={styles.calorieValue}>{Math.round(totals.calories)} kcal</Text>
            <Text style={styles.remainingText}>
              {remainingCalories} kcal restantes de tu meta de {dailyGoals.calories}
            </Text>
          </View>
          <View style={styles.scorePill}>
            <Sparkles size={15} color={colors.energy} />
            <Text style={styles.scoreText}>{todayMeals.length} comidas</Text>
          </View>
        </View>
        <MacroDonut totals={totals} />
        <View style={styles.progressStack}>
          <MacroProgress label="Proteína" value={totals.proteinG} goal={dailyGoals.proteinG} color={colors.primary} />
          <MacroProgress label="Carbohidratos" value={totals.carbsG} goal={dailyGoals.carbsG} color={colors.energy} />
          <MacroProgress label="Grasas" value={totals.fatG} goal={dailyGoals.fatG} color={colors.accent} />
        </View>
        <BodyText style={styles.goalHint}>{dailyGoals.explanation}</BodyText>
        {dailyGoals.personalized ? null : (
          <Pressable onPress={() => router.push("/profiles/edit")}>
            <Text style={styles.goalLink}>Completar mi perfil</Text>
          </Pressable>
        )}
      </Card>

      <View style={styles.actions}>
        <AppButton label="Agregar comida" icon={Plus} onPress={() => router.push("/meals/new")} style={styles.action} />
        <AppButton label="Foto IA" icon={Camera} variant="secondary" onPress={() => router.push("/meals/photo")} style={styles.action} />
      </View>
      <View style={styles.actions}>
        <AppButton label="Buscar alimento" icon={Search} variant="secondary" onPress={() => router.push("/meals/new")} style={styles.action} />
        <AppButton label="Preguntar a IA" icon={Bot} variant="secondary" onPress={() => router.push("/chat")} style={styles.action} />
      </View>

      {loading ? <LoadingState /> : null}

      <Card>
        <Text style={styles.sectionTitle}>Comidas de hoy</Text>
        {!loading && todayMeals.length === 0 ? (
          <EmptyState title="Sin comidas hoy" body="Agrega un alimento frecuente, busca por nombre o sube una foto para estimar el plato." />
        ) : null}
        <View style={styles.mealBuckets}>
          {mealBuckets.map((bucket) => (
            <MealBucketCard key={bucket.type} bucket={bucket} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Semana</Text>
        <View style={styles.weekGrid}>
          <View style={styles.weekCard}>
            <Text style={styles.weekTitle}>Calorías</Text>
            <MiniBarChart values={weekCalories} color={colors.energy} />
          </View>
          <View style={styles.weekCard}>
            <Text style={styles.weekTitle}>Proteína</Text>
            <MiniBarChart values={weekProtein} color={colors.primary} />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Frecuentes y recientes</Text>
        {frequentFoods.length === 0 ? (
          <BodyText style={styles.muted}>Aún no hay patrones. Al registrar comidas, aca apareceran tus alimentos repetidos.</BodyText>
        ) : (
          <View style={styles.frequentRow}>
            {frequentFoods.map((item) => (
              <Text key={item} style={styles.frequentChip}>{item}</Text>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

// Identidad visual por momento del día: icono y color propios.
const mealTypeVisuals: Record<string, { icon: ComponentType<LucideProps>; tint: string }> = {
  breakfast: { icon: Coffee, tint: "#f59e0b" },
  lunch: { icon: UtensilsCrossed, tint: "#10b981" },
  dinner: { icon: Moon, tint: "#8b5cf6" },
  snack: { icon: Cookie, tint: "#f43f5e" },
};

function MealBucketCard({ bucket }: { bucket: MealBucket }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const totals = sumMeals(bucket.meals);
  const visual = mealTypeVisuals[bucket.type] ?? { icon: UtensilsCrossed, tint: colors.primary };
  const MealIcon = visual.icon;
  return (
    <View style={styles.bucketCard}>
      <View style={styles.bucketHeader}>
        <View style={[styles.mealIcon, { backgroundColor: `${visual.tint}1f` }]}>
          <MealIcon size={17} color={visual.tint} />
        </View>
        <View style={styles.bucketTitleCol}>
          <Text style={styles.bucketTitle}>{bucket.label}</Text>
          <Text style={styles.bucketMeta}>
            {bucket.meals.length === 0 ? "Sin registro" : `${Math.round(totals.calories)} kcal - P ${totals.proteinG} g`}
          </Text>
        </View>
        <Pressable
          style={styles.bucketAdd}
          onPress={() => router.push({ pathname: "/meals/new", params: { mealType: bucket.type } })}
        >
          <Plus size={18} color={colors.primary} />
        </Pressable>
      </View>
      {bucket.meals.slice(0, 2).map((meal) => (
        <View key={meal.id} style={styles.mealLine}>
          <Text style={styles.mealName} numberOfLines={1}>
            {meal.name ?? mealTypeLabels[meal.mealType] ?? meal.mealType}
          </Text>
          <Text style={styles.mealCalories}>{Math.round(meal.calories ?? 0)} kcal</Text>
        </View>
      ))}
    </View>
  );
}

function buildMealBuckets(meals: MealWithItems[]): MealBucket[] {
  return ["breakfast", "lunch", "dinner", "snack"].map((type) => ({
    type,
    label: mealTypeLabels[type] ?? type,
    meals: meals.filter((meal) => meal.mealType === type),
  }));
}

function sumMeals(items: MealWithItems[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories ?? 0),
      proteinG: round(totals.proteinG + (meal.proteinG ?? 0), 1),
      carbsG: round(totals.carbsG + (meal.carbsG ?? 0), 1),
      fatG: round(totals.fatG + (meal.fatG ?? 0), 1),
      fiberG: round(totals.fiberG + (meal.fiberG ?? 0), 1),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

function weeklyValues(meals: MealWithItems[], key: "calories" | "proteinG"): number[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return Math.round(meals.filter((meal) => isSameLocalDay(meal.eatenAt, day)).reduce((sum, meal) => sum + (meal[key] ?? 0), 0));
  });
}

function topMealItems(meals: MealWithItems[]): string[] {
  const counts = new Map<string, number>();
  meals.forEach((meal) => {
    meal.mealItems?.forEach((item) => {
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);
}

function isSameLocalDay(value: string, day: Date): boolean {
  const date = new Date(value);
  return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snacks",
  other: "Otro",
};

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    headerText: { flex: 1 },
    aiButton: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    heroCard: { gap: 16, borderColor: colors.primary, backgroundColor: colors.backgroundElevated },
    heroTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    heroLabel: { color: colors.muted, fontWeight: "900", fontSize: 12 },
    calorieValue: { color: colors.text, fontSize: 34, fontWeight: "900", marginTop: 2 },
    remainingText: { color: colors.muted, fontSize: 12.5, fontWeight: "700", marginTop: 4 },
    scorePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: colors.energySoft,
      paddingHorizontal: 10,
    },
    scoreText: { color: colors.text, fontWeight: "900", fontSize: 12 },
    progressStack: { gap: 12 },
    goalHint: { color: colors.muted, fontSize: 12 },
    goalLink: { color: colors.primary, fontSize: 12.5, fontWeight: "900" },
    actions: { flexDirection: "row", gap: 10 },
    action: { flex: 1 },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
    mealBuckets: { gap: 10 },
    bucketCard: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
      gap: 9,
    },
    bucketHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    mealIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    bucketTitleCol: { flex: 1, gap: 2 },
    bucketTitle: { color: colors.text, fontWeight: "900", fontSize: 15 },
    bucketMeta: { color: colors.muted, fontWeight: "700", fontSize: 12 },
    bucketAdd: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    mealLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    mealName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "800" },
    mealCalories: { color: colors.muted, fontSize: 12, fontWeight: "900" },
    weekGrid: { flexDirection: "row", gap: 10 },
    weekCard: {
      flex: 1,
      gap: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
    },
    weekTitle: { color: colors.text, fontWeight: "900", fontSize: 13 },
    frequentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    frequentChip: {
      color: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontWeight: "900",
      fontSize: 12,
    },
    muted: { color: colors.muted },
  });
}
