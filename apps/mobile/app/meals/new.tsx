import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, Plus, Search, Trash2, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { MacroTotals, MealItemInput } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { DatePickerField } from "@/components/DatePickerField";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Screen } from "@/components/Screen";
import {
  calculateFoodMacros,
  describeServing,
  foodCatalog,
  gramsFor,
  normalizeFoodText,
  searchFoods,
  sumSelectedFoods,
  unitsFor,
  type FoodCatalogItem,
  type SelectedFoodItem,
} from "@/data/foodCatalog";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { formatLocalDate, isLocalDate, localDateKey, localNoonIso } from "@/utils/localDate";
import { mealLabels, mealTypes, type DiaryMeal } from "@/utils/mealDiary";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type MealForm = { mealType: (typeof mealTypes)[number]; eatenDate: string };
type ManualItem = { id: string; name: string; portion: string; macros: MacroTotals };
const macroKeys = ["calories", "proteinG", "carbsG", "fatG", "fiberG"] as const;
const macroLabels = {
  calories: "Calorías · kcal",
  proteinG: "Proteína · g",
  carbsG: "Carbohidratos · g",
  fatG: "Grasas · g",
  fiberG: "Fibra · g",
};
const emptyManual = {
  name: "",
  portion: "1 porción",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fiberG: "",
};

export default function NewMealScreen() {
  const profileId = useActiveProfileId();
  return <MealEntry key={profileId} profileId={profileId} />;
}

function MealEntry({ profileId }: { profileId: string | null }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{ mealType?: string; date?: string }>();
  const initialMealType = mealTypes.find((type) => type === params.mealType) ?? suggestedMealType();
  const { control, watch } = useForm<MealForm>({
    defaultValues: {
      mealType: initialMealType,
      eatenDate: isLocalDate(params.date) ? params.date : localDateKey(),
    },
  });
  const selectedDate = watch("eatenDate");
  const mealType = watch("mealType");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodCatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFoodItem[]>([]);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodCatalogItem[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState(emptyManual);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const serial = useRef(0);
  const totals = useMemo(() => {
    const sum = sumSelectedFoods(selectedFoods);
    for (const item of manualItems) for (const key of macroKeys) sum[key] += item.macros[key];
    return sum;
  }, [selectedFoods, manualItems]);
  const count = selectedFoods.length + manualItems.length;

  useEffect(() => {
    let alive = true;
    if (profileId)
      api.meals
        .list(profileId)
        .then((meals) => {
          if (!alive) return;
          const names = (meals as DiaryMeal[])
            .filter((meal) => meal.profileId === profileId)
            .flatMap((meal) => meal.mealItems?.map((item) => normalizeFoodText(item.name)) ?? []);
          const unique = [...new Set(names)];
          setRecentFoods(
            unique
              .map((item) => foodCatalog.find((food) => normalizeFoodText(food.name) === item))
              .filter((item): item is FoodCatalogItem => !!item)
              .slice(0, 8),
          );
        })
        .catch(() => {
          /* Suggestions are optional; entering food still works offline. */
        });
    return () => {
      alive = false;
    };
  }, [profileId]);

  useEffect(() => {
    let alive = true;
    const clean = query.trim();
    setSearchNotice(null);
    setResults(clean.length >= 2 ? searchFoods(clean, 12) : []);
    setSearching(clean.length >= 2);
    if (clean.length < 2) return;
    const timer = setTimeout(() => {
      api.foods
        .search(clean, true, 18)
        .then((response) => {
          if (alive && response.results.length) setResults(response.results);
        })
        .catch(() => {
          if (alive)
            setSearchNotice("Mostrando el catálogo local. La búsqueda externa no está disponible.");
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  function addFood(food: FoodCatalogItem) {
    const unit = unitsFor(food)[0]!;
    serial.current += 1;
    setSelectedFoods((items) => [
      ...items,
      {
        id: `${food.id}-${serial.current}`,
        food,
        quantity: 1,
        unitLabel: unit.label,
        grams: gramsFor(food, 1, unit.label),
      },
    ]);
    setQuery("");
    setError(null);
  }

  function addManual() {
    try {
      if (!manual.name.trim()) throw new Error("Escribe el nombre del alimento.");
      if (!manual.calories.trim()) throw new Error("Indica las calorías de esta porción.");
      const macros = Object.fromEntries(
        macroKeys.map((key) => {
          const value = Number(manual[key].replace(",", ".").trim() || "0");
          if (!Number.isFinite(value) || value < 0)
            throw new Error(`${macroLabels[key]} debe ser un número positivo o cero.`);
          return [key, value];
        }),
      ) as MacroTotals;
      serial.current += 1;
      setManualItems((items) => [
        ...items,
        {
          id: `manual-${serial.current}`,
          name: manual.name.trim(),
          portion: manual.portion.trim() || "1 porción",
          macros,
        },
      ]);
      setManual(emptyManual);
      setShowManual(false);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Revisa los datos.");
    }
  }

  async function save() {
    if (!profileId || saveLock.current) return;
    if (count === 0) {
      setError("Añade al menos un alimento para guardar tu comida.");
      return;
    }
    if (!isLocalDate(selectedDate)) {
      setError("Selecciona una fecha válida.");
      return;
    }
    if (selectedDate > localDateKey()) {
      setError("Elige hoy o una fecha anterior para registrar lo que comiste.");
      return;
    }
    if (showManual && manual.name.trim()) {
      setError("Añade el alimento manual a tu comida antes de guardar.");
      return;
    }
    saveLock.current = true;
    setLoading(true);
    setError(null);
    const items: MealItemInput[] = [
      ...selectedFoods.map((item) => ({
        name: item.food.name,
        estimatedPortion: describeServing(item.food, item.quantity, item.unitLabel),
        ...calculateFoodMacros(item.food, item.grams),
        confidence: item.food.isEstimated ? 0.75 : 0.95,
      })),
      ...manualItems.map((item) => ({
        name: item.name,
        estimatedPortion: item.portion,
        ...item.macros,
      })),
    ];
    try {
      if (selectedFoods.some((item) => item.grams <= 0))
        throw new Error("Las porciones deben ser mayores que cero.");
      await api.meals.create(profileId, {
        mealType,
        eatenAt: localNoonIso(selectedDate),
        name: (name.trim() || items.map((item) => item.name).join(" + ")).slice(0, 160),
        ...totals,
        notes: manualItems.length
          ? "Incluye valores ingresados manualmente por el usuario."
          : "Porciones registradas desde el catálogo nutricional.",
        items,
      });
      if (useAppStore.getState().activeProfileId === profileId)
        router.replace({ pathname: "/meals", params: { date: selectedDate } });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No pudimos guardar. Tus alimentos siguen aquí.",
      );
    } finally {
      setLoading(false);
      saveLock.current = false;
    }
  }

  const suggestions = recentFoods.length ? recentFoods : searchFoods("", 8);
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al diario"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <View style={styles.grow}>
          <Text style={styles.eyebrow}>REGISTRO DE COMIDA</Text>
          <Text style={styles.title}>¿Qué comiste?</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Busca, ajusta la porción y guarda. Así de simple.</Text>
      <Card style={styles.dateCard}>
        <ChoiceGroup
          control={control}
          name="mealType"
          label="Momento del día"
          options={mealTypes.map((type) => ({ label: mealLabels[type], value: type }))}
        />
        <DatePickerField
          control={control}
          name="eatenDate"
          label="Fecha de la comida"
          minYear={2020}
        />
      </Card>
      <View style={styles.searchBox}>
        <Search size={20} color={colors.primary} />
        <TextInput
          accessibilityLabel="Buscar alimento"
          value={query}
          onChangeText={setQuery}
          placeholder="Pollo, arroz, yogur…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => setQuery("")}
          >
            <X size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {searchNotice ? <Text style={styles.hint}>{searchNotice}</Text> : null}
      {query.trim().length >= 2 ? (
        <Card>
          <Text style={styles.sectionTitle}>
            {searching ? "Buscando alimentos…" : `${results.length} resultados`}
          </Text>
          {results.map((food) => (
            <Pressable
              key={`${food.source}-${food.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Añadir ${food.name}`}
              onPress={() => addFood(food)}
              style={styles.foodResult}
            >
              <View style={styles.grow}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.hint}>
                  {food.brand ? `${food.brand} · ` : ""}
                  {food.servingLabel} · {calculateFoodMacros(food, food.servingG).calories} kcal
                  {food.isEstimated ? " · estimado" : ""}
                </Text>
              </View>
              <View style={styles.smallPlus}>
                <Plus size={18} color={colors.primary} />
              </View>
            </Pressable>
          ))}
          {!searching && results.length === 0 ? (
            <Text style={styles.hint}>
              Prueba otro nombre o ingresa los valores de la etiqueta abajo.
            </Text>
          ) : null}
        </Card>
      ) : (
        <View style={styles.suggestions}>
          <Text style={styles.sectionTitle}>
            {recentFoods.length ? "Tus alimentos recientes" : "Para empezar"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {suggestions.map((food) => (
              <Pressable
                key={food.id}
                accessibilityRole="button"
                accessibilityLabel={`Añadir ${food.name}`}
                style={styles.foodChip}
                onPress={() => addFood(food)}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={styles.chipText}>{food.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setShowManual((value) => !value);
          setError(null);
        }}
        style={styles.manualToggle}
      >
        <Plus size={16} color={colors.primary} />
        <Text style={styles.link}>
          {showManual ? "Cerrar entrada manual" : "Ingresar alimento o etiqueta manualmente"}
        </Text>
      </Pressable>
      {showManual ? (
        <Card>
          <Text style={styles.sectionTitle}>Datos de tu porción</Text>
          <Text style={styles.hint}>
            Escribe los valores de lo que comiste. Los macros vacíos cuentan como cero.
          </Text>
          <TextInput
            accessibilityLabel="Nombre del alimento manual"
            style={styles.input}
            placeholder="Nombre del alimento"
            placeholderTextColor={colors.muted}
            maxLength={160}
            value={manual.name}
            onChangeText={(value) => setManual((current) => ({ ...current, name: value }))}
          />
          <TextInput
            accessibilityLabel="Porción manual"
            style={styles.input}
            placeholder="Porción: 1 pote, 150 g…"
            placeholderTextColor={colors.muted}
            maxLength={160}
            value={manual.portion}
            onChangeText={(value) => setManual((current) => ({ ...current, portion: value }))}
          />
          <View style={styles.manualGrid}>
            {macroKeys.map((key) => (
              <View key={key} style={styles.manualField}>
                <Text style={styles.label}>{macroLabels[key]}</Text>
                <TextInput
                  accessibilityLabel={macroLabels[key]}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={manual[key]}
                  onChangeText={(value) => setManual((current) => ({ ...current, [key]: value }))}
                />
              </View>
            ))}
          </View>
          <AppButton
            label="Añadir a esta comida"
            icon={Plus}
            variant="secondary"
            onPress={addManual}
          />
        </Card>
      ) : null}
      {count > 0 ? (
        <Card>
          <View style={styles.row}>
            <Text style={[styles.sectionTitle, styles.grow]}>Tu plato</Text>
            <Text style={styles.hint}>{count} alimentos</Text>
          </View>
          {selectedFoods.map((item) => (
            <View key={item.id} style={styles.selectedItem}>
              <View style={styles.row}>
                <Text style={[styles.foodName, styles.grow]}>{item.food.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${item.food.name}`}
                  style={styles.remove}
                  onPress={() =>
                    setSelectedFoods((items) => items.filter((food) => food.id !== item.id))
                  }
                >
                  <Trash2 size={17} color={colors.danger} />
                </Pressable>
              </View>
              <QuantitySelector
                food={item.food}
                quantity={item.quantity}
                unitLabel={item.unitLabel}
                onChange={(next) =>
                  setSelectedFoods((items) =>
                    items.map((food) => (food.id === item.id ? { ...food, ...next } : food)),
                  )
                }
              />
            </View>
          ))}
          {manualItems.map((item) => (
            <View key={item.id} style={[styles.selectedItem, styles.row]}>
              <View style={styles.grow}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.hint}>
                  {item.portion} · {item.macros.calories} kcal · manual
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${item.name}`}
                style={styles.remove}
                onPress={() =>
                  setManualItems((items) => items.filter((food) => food.id !== item.id))
                }
              >
                <Trash2 size={17} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          <TextInput
            accessibilityLabel="Nombre opcional de la comida"
            style={styles.input}
            placeholder="Nombre opcional: almuerzo post entreno…"
            placeholderTextColor={colors.muted}
            maxLength={160}
            value={name}
            onChangeText={setName}
          />
        </Card>
      ) : (
        <View style={styles.empty}>
          <UtensilMark />
          <Text style={styles.emptyTitle}>Tu plato empieza aquí</Text>
          <Text style={styles.hint}>Añade el primer alimento desde la búsqueda.</Text>
        </View>
      )}
      <Card style={styles.totalCard}>
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text style={styles.eyebrow}>TOTAL DE ESTA COMIDA</Text>
            <Text style={styles.total}>
              {Math.round(totals.calories)} <Text style={styles.totalUnit}>kcal</Text>
            </Text>
          </View>
          <Text style={styles.totalMacros}>
            P {Math.round(totals.proteinG)} g{`\n`}C {Math.round(totals.carbsG)} g · G{" "}
            {Math.round(totals.fatG)} g
          </Text>
        </View>
        <Text style={styles.hint}>
          {mealLabels[mealType]} · {formatLocalDate(selectedDate)}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          label="Guardar comida"
          icon={Check}
          loading={loading}
          disabled={count === 0}
          onPress={() => void save()}
        />
      </Card>
    </Screen>
  );
}

function UtensilMark() {
  const { colors } = useTheme();
  return <Plus size={26} color={colors.primary} />;
}
function suggestedMealType(): MealForm["mealType"] {
  const hour = new Date().getHours();
  return hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 19 ? "snack" : "dinner";
}
function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    grow: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", gap: 14 },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
      backgroundColor: c.surface,
    },
    eyebrow: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
    title: { color: c.text, fontSize: 30, fontWeight: "800", letterSpacing: -1, marginTop: 5 },
    subtitle: { color: c.muted, fontSize: 14, lineHeight: 21 },
    dateCard: { gap: 14 },
    searchBox: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 18,
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
    },
    searchInput: { flex: 1, minWidth: 0, color: c.text, fontSize: 16, paddingVertical: 16 },
    sectionTitle: { color: c.text, fontWeight: "800", fontSize: 17, letterSpacing: -0.3 },
    hint: { color: c.muted, fontSize: 12, lineHeight: 18 },
    foodResult: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    foodName: { color: c.text, fontSize: 14, lineHeight: 20, fontWeight: "700" },
    smallPlus: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestions: { gap: 12 },
    chipRow: { gap: 8 },
    foodChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 12,
    },
    chipText: { color: c.text, fontSize: 12, fontWeight: "600" },
    manualToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
    link: { color: c.primary, fontSize: 13, fontWeight: "700" },
    input: {
      color: c.text,
      fontSize: 14,
      backgroundColor: c.backgroundElevated,
      borderRadius: 12,
      paddingHorizontal: 12,
      minHeight: 46,
      borderWidth: 1,
      borderColor: c.border,
    },
    manualGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    manualField: { width: "47%", gap: 6 },
    label: { color: c.muted, fontSize: 12, fontWeight: "600" },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    selectedItem: { borderTopWidth: 1, borderColor: c.border, paddingTop: 12, gap: 8 },
    remove: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
    empty: { alignItems: "center", gap: 8, paddingVertical: 30 },
    emptyTitle: { color: c.text, fontSize: 16, fontWeight: "700" },
    totalCard: { gap: 12 },
    total: { color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
    totalUnit: { color: c.muted, fontSize: 15, fontWeight: "500" },
    totalMacros: { color: c.muted, fontSize: 12, lineHeight: 22, textAlign: "right" },
    error: { color: c.danger, fontSize: 13, lineHeight: 19 },
  });
}
