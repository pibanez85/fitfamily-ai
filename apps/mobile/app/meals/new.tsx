import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Bot, Camera, CheckCircle2, Plus, Save, Search, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ChoiceGroup, type ChoiceOption } from "@/components/ChoiceGroup";
import { DatePickerField } from "@/components/DatePickerField";
import { FormField } from "@/components/FormField";
import { MacroDonut, MacroProgress } from "@/components/NutritionCharts";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import {
  calculateFoodMacros,
  describeServing,
  foodCatalog,
  gramsFor,
  searchFoods,
  sumSelectedFoods,
  unitsFor,
  type FoodCatalogItem,
  type FoodSource,
  type SelectedFoodItem,
} from "@/data/foodCatalog";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { computeNutritionGoals } from "@/utils/nutritionGoals";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

// Fraccion de la meta diaria que suele cubrir cada momento del día.
const MEAL_SHARE: Record<MealForm["mealType"], number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.28,
  snack: 0.12,
  other: 0.3,
};

const MealFormSchema = z.object({
  name: z.string().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
  eatenDate: z.string().min(1, "Selecciona la fecha"),
  notes: z.string().optional(),
});

type MealForm = z.infer<typeof MealFormSchema>;

const sourceOrder: FoodSource[] = ["local", "open_food_facts", "usda", "ai_estimate", "user_custom"];
const passiveFilters = ["Todos", "Recientes", "Favoritos"];
const foodCategoryFilters = [
  "Todos",
  "Recientes",
  "Favoritos",
  "Panes",
  "Cereales y arroz",
  "Carnes",
  "Pollo y pavo",
  "Pescados y mariscos",
  "Lacteos",
  "Huevos",
  "Frutas",
  "Verduras",
  "Legumbres",
  "Frutos secos",
  "Aceites y grasas",
  "Bebidas",
  "Comidas chilenas",
  "Snacks",
  "Suplementos",
];

export default function NewMealScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ mealType?: string }>();
  const profileId = useActiveProfileId();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<FoodCatalogItem[]>(() => searchFoods(""));
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFoodItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [detailFood, setDetailFood] = useState<FoodCatalogItem | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const initialMealType = isMealType(params.mealType) ? params.mealType : "lunch";
  const { control, handleSubmit, watch } = useForm<MealForm>({
    resolver: zodResolver(MealFormSchema),
    defaultValues: {
      name: "",
      mealType: initialMealType,
      eatenDate: toIsoDate(new Date()),
      notes: "",
    },
  });

  const totals = useMemo(() => sumSelectedFoods(selectedFoods), [selectedFoods]);
  const watchedName = watch("name");
  const watchedMealType = watch("mealType");
  const profile = useAppStore((state) =>
    state.profiles.find((entry) => entry.id === state.activeProfileId) ?? null,
  );
  const mealGoals = useMemo(() => {
    const daily = computeNutritionGoals(profile, null);
    const share = MEAL_SHARE[watchedMealType] ?? 0.3;
    return {
      proteinG: Math.round(daily.proteinG * share),
      carbsG: Math.round(daily.carbsG * share),
      fatG: Math.round(daily.fatG * share),
    };
  }, [profile, watchedMealType]);
  const recentFoods = useMemo(() => uniqueFoods(selectedFoods.map((item) => item.food)).slice(0, 8), [selectedFoods]);
  const favoriteFoods = useMemo(() => foodCatalog.filter((food) => favoriteIds.includes(food.id)).slice(0, 12), [favoriteIds]);
  const displayedResults = useMemo(() => {
    if (categoryFilter === "Recientes") return recentFoods;
    if (categoryFilter === "Favoritos") return favoriteFoods;
    if (!passiveFilters.includes(categoryFilter) && debouncedQuery.length < 2) {
      return foodCatalog.filter((food) => food.category === categoryFilter).slice(0, 18);
    }
    if (debouncedQuery.length < 2) return [];
    return results.filter((food) => categoryFilter === "Todos" || food.category === categoryFilter);
  }, [categoryFilter, debouncedQuery.length, favoriteFoods, recentFoods, results]);
  const groupedResults = useMemo(() => groupBySource(displayedResults), [displayedResults]);
  const quickFoods = useMemo(() => searchFoods("").slice(0, 8), []);
  const shouldShowResults = debouncedQuery.length >= 2 || categoryFilter !== "Todos";

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setSearchError(null);
      if (debouncedQuery.length < 2) {
        setResults(searchFoods(debouncedQuery));
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const response = await api.foods.search(debouncedQuery, true, 24);
        if (alive) setResults(response.results.length > 0 ? response.results : searchFoods(debouncedQuery));
      } catch (caught) {
        if (alive) {
          setResults(searchFoods(debouncedQuery));
          setSearchError(caught instanceof Error ? caught.message : "No pude buscar en proveedores externos.");
        }
      } finally {
        if (alive) setSearching(false);
      }
    }
    void run();
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  function addFood(food: FoodCatalogItem, selection?: { quantity: number; unitLabel: string; grams: number }) {
    const unit = unitsFor(food)[0]!;
    setSelectedFoods((current) => [
      ...current,
      {
        id: `${food.id}-${Date.now()}`,
        food,
        quantity: selection?.quantity ?? 1,
        unitLabel: selection?.unitLabel ?? unit.label,
        grams: selection?.grams ?? gramsFor(food, 1, unit.label),
      },
    ]);
    setQuery("");
    setDetailFood(null);
  }

  function updateItem(id: string, next: { quantity: number; unitLabel: string; grams: number }) {
    setSelectedFoods((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }

  async function onSubmit(values: MealForm) {
    if (!profileId) return;
    if (selectedFoods.length === 0) {
      setError("Agrega al menos un alimento desde el buscador.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.meals.create(profileId, {
        mealType: values.mealType,
        eatenAt: new Date(`${values.eatenDate}T12:00:00`).toISOString(),
        name: values.name || buildMealName(selectedFoods),
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        fiberG: totals.fiberG,
        notes: values.notes || "Calculado desde catalogo nutricional. Revisa porciones si el alimento es estimado.",
        items: selectedFoods.map((item) => {
          const macros = calculateFoodMacros(item.food, item.grams);
          return {
            name: item.food.name,
            estimatedPortion: describeServing(item.food, item.quantity, item.unitLabel),
            calories: macros.calories,
            proteinG: macros.proteinG,
            carbsG: macros.carbsG,
            fatG: macros.fatG,
            fiberG: macros.fiberG,
            confidence: item.food.isVerified ? 0.95 : item.food.isEstimated ? 0.75 : 0.86,
          };
        }),
      });
      router.replace("/meals");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la comida.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Agregar comida</Title>
      <Subtitle>Busca alimentos chilenos, productos envasados o datos USDA. Ajusta la porción antes de guardar.</Subtitle>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{watchedName || buildMealName(selectedFoods) || "Nueva comida"}</Text>
            <Text style={styles.summarySub}>{selectedFoods.length} alimentos seleccionados</Text>
          </View>
          <CheckCircle2 size={26} color={selectedFoods.length > 0 ? colors.primary : colors.muted} />
        </View>
        <MacroDonut totals={totals} size={132} />
        <View style={styles.progressStack}>
          <MacroProgress label="Proteína" value={totals.proteinG} goal={mealGoals.proteinG} color={colors.primary} />
          <MacroProgress label="Carbos" value={totals.carbsG} goal={mealGoals.carbsG} color={colors.energy} />
          <MacroProgress label="Grasas" value={totals.fatG} goal={mealGoals.fatG} color={colors.accent} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>1. Tipo de comida</Text>
        <FormField control={control} name="name" label="Nombre opcional" placeholder="Ej: Almuerzo post entreno" />
        <ChoiceGroup control={control} name="mealType" label="Momento del día" options={mealTypeOptions} />
        <DatePickerField control={control} name="eatenDate" label="Fecha" minYear={2020} />
      </Card>

      <Card>
        <View style={styles.searchHeader}>
          <Search size={19} color={colors.primary} />
          <Text style={styles.sectionTitle}>2. Buscar alimento</Text>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Busca un alimento, producto o comida chilena"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
        />
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push("/meals/photo")}>
            <Camera size={16} color={colors.primary} />
            <Text style={styles.quickActionText}>Foto IA</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push({ pathname: "/chat", params: { prompt: `Ayudame a estimar nutricionalmente: ${query || "una comida casera"}` } })}
          >
            <Bot size={16} color={colors.primary} />
            <Text style={styles.quickActionText}>Estimar con IA</Text>
          </Pressable>
        </View>
        {searching ? <BodyText style={styles.muted}>Buscando en catalogo local, Open Food Facts y USDA...</BodyText> : null}
        {searchError ? <BodyText style={styles.warning}>Busqueda externa no disponible. Mostrando base local.</BodyText> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {foodCategoryFilters.map((category) => {
            const active = category === categoryFilter;
            return (
              <Pressable
                key={category}
                onPress={() => setCategoryFilter(category)}
                style={[styles.categoryChip, active ? styles.categoryChipActive : null]}
              >
                <Text style={[styles.categoryText, active ? styles.categoryTextActive : null]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {debouncedQuery.length < 2 && categoryFilter === "Todos" ? (
          <View style={styles.quickFoods}>
            <Text style={styles.smallTitle}>Sugerencias rapidas</Text>
            <View style={styles.quickFoodGrid}>
              {quickFoods.map((food) => (
                <Pressable key={food.id} onPress={() => setDetailFood(food)} style={styles.quickFoodChip}>
                  <Text style={styles.quickFoodText}>{food.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {recentFoods.length > 0 && categoryFilter === "Todos" && debouncedQuery.length < 2 ? (
          <View style={styles.quickFoods}>
            <Text style={styles.smallTitle}>Recientes</Text>
            <View style={styles.quickFoodGrid}>
              {recentFoods.map((food) => (
                <Pressable key={`recent-${food.id}`} onPress={() => setDetailFood(food)} style={styles.quickFoodChip}>
                  <Text style={styles.quickFoodText}>{food.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {shouldShowResults && displayedResults.length === 0 ? (
          <View style={styles.emptySearch}>
            <Text style={styles.emptyTitle}>No encontramos este alimento</Text>
            <BodyText style={styles.muted}>Puedes probar otro nombre chileno, buscar por foto o pedir una estimación a la IA.</BodyText>
            <View style={styles.emptyActions}>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/chat")}>
                <Text style={styles.emptyButtonText}>Crear alimento</Text>
              </Pressable>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/chat")}>
                <Text style={styles.emptyButtonText}>Buscar con IA</Text>
              </Pressable>
              <Pressable style={styles.emptyButton} onPress={() => router.push("/meals/photo")}>
                <Text style={styles.emptyButtonText}>Escanear codigo</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        {shouldShowResults ? sourceOrder.map((source) => {
          const items = groupedResults[source] ?? [];
          if (items.length === 0) return null;
          return (
            <View key={source} style={styles.sourceGroup}>
              <Text style={styles.sourceTitle}>{sourceLabel(source)}</Text>
              {items.map((food) => (
                <FoodResultCard
                  key={`${food.source}-${food.id}`}
                  food={food}
                  onOpen={() => setDetailFood(food)}
                  onAdd={() => addFood(food)}
                />
              ))}
            </View>
          );
        }) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>3. Revisar porciones</Text>
        {selectedFoods.length === 0 ? (
          <BodyText style={styles.muted}>Selecciona alimentos para ajustar cantidades y ver macros por porción.</BodyText>
        ) : null}
        {selectedFoods.map((item) => (
          <View key={item.id} style={styles.selectedRow}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedTitleCol}>
                <Text style={styles.foodName}>{item.food.name}</Text>
                <Text style={styles.foodMeta}>{sourceLabel(item.food.source)} - {item.food.servingLabel}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedFoods((current) => current.filter((food) => food.id !== item.id))}
                style={styles.deleteButton}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
            <QuantitySelector
              food={item.food}
              quantity={item.quantity}
              unitLabel={item.unitLabel}
              onChange={(next) => updateItem(item.id, next)}
            />
          </View>
        ))}
        <FormField control={control} name="notes" label="Notas" multiline />
        <BodyText style={styles.disclaimer}>
          Los valores locales y de IA pueden ser estimados. Corrige porciones si la preparacion, marca o receta cambia.
        </BodyText>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Guardar comida" icon={Save} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>
      <FoodDetailSheet
        food={detailFood}
        favorite={detailFood ? favoriteIds.includes(detailFood.id) : false}
        onClose={() => setDetailFood(null)}
        onAdd={addFood}
        onToggleFavorite={(food) =>
          setFavoriteIds((current) =>
            current.includes(food.id) ? current.filter((id) => id !== food.id) : [...current, food.id],
          )
        }
      />
    </Screen>
  );
}

function FoodResultCard({ food, onOpen, onAdd }: { food: FoodCatalogItem; onOpen: () => void; onAdd: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const servingMacros = calculateFoodMacros(food, food.servingG);
  return (
    <Pressable onPress={onOpen} style={styles.foodRow}>
      <View style={styles.foodInfo}>
        <View style={styles.foodTitleRow}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.isVerified ? <Text style={styles.verifiedBadge}>Verificado</Text> : null}
          {food.isEstimated ? <Text style={styles.estimatedBadge}>Estimado</Text> : null}
        </View>
        <BodyText style={styles.foodMeta}>
          {food.brand ? `${food.brand} - ` : ""}
          {food.category} - {food.servingLabel} - {servingMacros.calories} kcal - P {servingMacros.proteinG} g
        </BodyText>
      </View>
      <Pressable onPress={onAdd} style={styles.addIcon}>
        <Plus size={18} color={colors.onPrimary} />
      </Pressable>
    </Pressable>
  );
}

function FoodDetailSheet({
  food,
  favorite,
  onClose,
  onAdd,
  onToggleFavorite,
}: {
  food: FoodCatalogItem | null;
  favorite: boolean;
  onClose: () => void;
  onAdd: (food: FoodCatalogItem, selection: { quantity: number; unitLabel: string; grams: number }) => void;
  onToggleFavorite: (food: FoodCatalogItem) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [quantity, setQuantity] = useState(1);
  const [unitLabel, setUnitLabel] = useState("");
  const units = food ? unitsFor(food) : [];
  const unit = unitLabel || units[0]?.label || "g";
  const grams = food ? gramsFor(food, quantity, unit) : 0;
  const macros = food ? calculateFoodMacros(food, grams) : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

  useEffect(() => {
    if (!food) return;
    const nextUnit = unitsFor(food)[0]?.label ?? "g";
    setQuantity(1);
    setUnitLabel(nextUnit);
  }, [food]);

  if (!food) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleCol}>
              <Text style={styles.detailTitle}>{food.name}</Text>
              <Text style={styles.detailMeta}>{sourceLabel(food.source)} - {food.category}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>
          {food.aliases?.length ? (
            <Text style={styles.aliasText}>Tambien: {food.aliases.slice(0, 6).join(", ")}</Text>
          ) : null}
          {food.isEstimated ? <Text style={styles.estimatedNotice}>Datos aproximados para MVP. Ajusta si la marca o receta cambia.</Text> : null}
          <QuantitySelector
            food={food}
            quantity={quantity}
            unitLabel={unit}
            onChange={(next) => {
              setQuantity(next.quantity);
              setUnitLabel(next.unitLabel);
            }}
          />
          <View style={styles.detailMacroGrid}>
            <DetailMacro label="kcal" value={Math.round(macros.calories)} />
            <DetailMacro label="Proteína" value={`${macros.proteinG} g`} />
            <DetailMacro label="Carbos" value={`${macros.carbsG} g`} />
            <DetailMacro label="Grasas" value={`${macros.fatG} g`} />
            <DetailMacro label="Fibra" value={`${macros.fiberG} g`} />
          </View>
          <View style={styles.detailActions}>
            <Pressable style={styles.favoriteButton} onPress={() => onToggleFavorite(food)}>
              <Text style={styles.favoriteText}>{favorite ? "Favorito guardado" : "Guardar favorito"}</Text>
            </Pressable>
            <Pressable style={styles.addDetailButton} onPress={() => onAdd(food, { quantity, unitLabel: unit, grams })}>
              <Text style={styles.addDetailText}>Agregar a comida</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailMacro({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.detailMacro}>
      <Text style={styles.detailMacroValue}>{value}</Text>
      <Text style={styles.detailMacroLabel}>{label}</Text>
    </View>
  );
}

function buildMealName(items: SelectedFoodItem[]) {
  return items
    .slice(0, 2)
    .map((item) => item.food.name)
    .join(" + ");
}

function groupBySource(items: FoodCatalogItem[]): Partial<Record<FoodSource, FoodCatalogItem[]>> {
  return items.reduce<Partial<Record<FoodSource, FoodCatalogItem[]>>>((groups, item) => {
    groups[item.source] = [...(groups[item.source] ?? []), item];
    return groups;
  }, {});
}

function uniqueFoods(items: FoodCatalogItem[]): FoodCatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sourceLabel(source: FoodSource): string {
  const labels: Record<FoodSource, string> = {
    local: "Base chilena",
    open_food_facts: "Open Food Facts",
    usda: "USDA FoodData Central",
    ai_estimate: "Estimado por IA",
    user_custom: "Mis alimentos",
  };
  return labels[source] ?? source;
}

function isMealType(value: unknown): value is MealForm["mealType"] {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack" || value === "other";
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const mealTypeOptions: ChoiceOption[] = [
  { label: "Desayuno", value: "breakfast" },
  { label: "Almuerzo", value: "lunch" },
  { label: "Cena", value: "dinner" },
  { label: "Snack", value: "snack" },
  { label: "Otro", value: "other" },
];

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    summaryCard: { gap: 14, borderColor: colors.primary, backgroundColor: colors.backgroundElevated },
    summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    summaryText: { flex: 1, gap: 2 },
    summaryTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
    summarySub: { color: colors.muted, fontSize: 12, fontWeight: "800" },
    progressStack: { gap: 10 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
    searchHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    searchInput: {
      minHeight: 52,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 14,
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    quickActions: { flexDirection: "row", gap: 8 },
    quickAction: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    quickActionText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    categoryRow: { gap: 8, paddingRight: 8 },
    categoryChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    categoryText: { color: colors.text, fontWeight: "800", fontSize: 12 },
    categoryTextActive: { color: colors.onPrimary },
    quickFoods: { gap: 9 },
    smallTitle: { color: colors.muted, fontSize: 12, fontWeight: "900" },
    quickFoodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickFoodChip: {
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    quickFoodText: { color: colors.text, fontWeight: "800", fontSize: 12 },
    emptySearch: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 },
    emptyTitle: { color: colors.text, fontWeight: "900", fontSize: 15 },
    emptyActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    emptyButton: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: colors.primarySoft,
    },
    emptyButtonText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    sourceGroup: { gap: 8 },
    sourceTitle: { color: colors.primary, fontWeight: "900", fontSize: 13, marginTop: 4 },
    foodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    foodInfo: { flex: 1, gap: 3 },
    foodTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
    foodName: { color: colors.text, fontSize: 15, fontWeight: "900" },
    foodMeta: { color: colors.muted, fontSize: 12.5 },
    verifiedBadge: {
      color: colors.onPrimary,
      backgroundColor: colors.success,
      borderRadius: radius.pill,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 2,
      fontSize: 10,
      fontWeight: "900",
    },
    estimatedBadge: {
      color: colors.text,
      backgroundColor: colors.energySoft,
      borderRadius: radius.pill,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 2,
      fontSize: 10,
      fontWeight: "900",
    },
    addIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
    detailSheet: {
      maxHeight: "88%",
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 18,
      gap: 12,
    },
    sheetHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
    },
    detailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    detailTitleCol: { flex: 1, gap: 3 },
    detailTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
    detailMeta: { color: colors.muted, fontSize: 12.5, fontWeight: "800" },
    closeButton: {
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    closeText: { color: colors.text, fontWeight: "900", fontSize: 12 },
    aliasText: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
    estimatedNotice: {
      color: colors.warning,
      borderRadius: radius.sm,
      backgroundColor: colors.energySoft,
      padding: 10,
      fontSize: 12.5,
      fontWeight: "800",
    },
    detailMacroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    detailMacro: {
      flexGrow: 1,
      minWidth: "30%",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 10,
      gap: 2,
    },
    detailMacroValue: { color: colors.text, fontWeight: "900", fontSize: 16 },
    detailMacroLabel: { color: colors.muted, fontWeight: "800", fontSize: 11 },
    detailActions: { flexDirection: "row", gap: 10 },
    favoriteButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundElevated,
    },
    favoriteText: { color: colors.primary, fontWeight: "900", fontSize: 13 },
    addDetailButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    addDetailText: { color: colors.onPrimary, fontWeight: "900", fontSize: 13 },
    selectedRow: {
      gap: 10,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
    },
    selectedHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    selectedTitleCol: { flex: 1, gap: 2 },
    deleteButton: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
    },
    muted: { color: colors.muted },
    warning: { color: colors.warning, fontSize: 12.5 },
    disclaimer: { color: colors.warning, fontSize: 13 },
    error: { color: colors.danger },
  });
}
