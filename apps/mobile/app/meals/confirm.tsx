import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ChoiceGroup, type ChoiceOption } from "@/components/ChoiceGroup";
import { FormField } from "@/components/FormField";
import { MetricPill } from "@/components/MetricPill";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

const ConfirmMealSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
  calories: z.string().min(1),
  proteinG: z.string().min(1),
  carbsG: z.string().min(1),
  fatG: z.string().min(1),
  fiberG: z.string().min(1),
  notes: z.string().optional(),
});

type ConfirmMealForm = z.infer<typeof ConfirmMealSchema>;

export default function ConfirmMealScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const analysis = useAppStore((state) => state.pendingFoodAnalysis);
  const setPendingFoodAnalysis = useAppStore((state) => state.setPendingFoodAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, watch } = useForm<ConfirmMealForm>({
    resolver: zodResolver(ConfirmMealSchema),
    values: {
      name: analysis?.estimatedMealName ?? "",
      mealType: "other",
      calories: String(analysis?.totals.calories ?? ""),
      proteinG: String(analysis?.totals.proteinG ?? ""),
      carbsG: String(analysis?.totals.carbsG ?? ""),
      fatG: String(analysis?.totals.fatG ?? ""),
      fiberG: String(analysis?.totals.fiberG ?? ""),
      notes: analysis ? `Guardado desde análisis IA ${analysis.analysisId}` : "",
    },
  });

  if (!analysis) {
    return (
      <Screen>
        <EmptyState title="Sin comida pendiente" />
      </Screen>
    );
  }

  async function save(values: ConfirmMealForm) {
    if (!profileId || !analysis) return;
    setLoading(true);
    setError(null);
    try {
      await api.meals.create(profileId, {
        mealType: values.mealType,
        eatenAt: new Date().toISOString(),
        name: values.name,
        calories: toNumber(values.calories),
        proteinG: toNumber(values.proteinG),
        carbsG: toNumber(values.carbsG),
        fatG: toNumber(values.fatG),
        fiberG: toNumber(values.fiberG),
        notes: values.notes || null,
        items: analysis.items.map((item) => ({
          name: item.name,
          estimatedPortion: item.estimatedPortion,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          fiberG: item.fiberG,
          confidence: item.confidence,
        })),
      });
      setPendingFoodAnalysis(null);
      router.replace("/meals");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Confirmar comida</Title>
      <Subtitle>La IA estima. Tu mandas: corrige los totales antes de guardar.</Subtitle>

      <Card style={styles.summaryCard}>
        <Text style={styles.name}>{watch("name") || analysis.estimatedMealName}</Text>
        <View style={styles.metrics}>
          <MetricPill label="kcal" value={watch("calories") || "0"} tone="energy" />
          <MetricPill label="proteína" value={`${watch("proteinG") || "0"}g`} tone="primary" />
          <MetricPill label="carbos" value={`${watch("carbsG") || "0"}g`} />
          <MetricPill label="grasas" value={`${watch("fatG") || "0"}g`} />
        </View>
      </Card>

      <Card>
        <FormField control={control} name="name" label="Nombre" />
        <ChoiceGroup control={control} name="mealType" label="Tipo de comida" options={mealTypeOptions} />
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <FormField control={control} name="calories" label="Calorías" keyboardType="numeric" />
          </View>
          <View style={styles.gridItem}>
            <FormField control={control} name="proteinG" label="Proteína g" keyboardType="numeric" />
          </View>
          <View style={styles.gridItem}>
            <FormField control={control} name="carbsG" label="Carbos g" keyboardType="numeric" />
          </View>
          <View style={styles.gridItem}>
            <FormField control={control} name="fatG" label="Grasas g" keyboardType="numeric" />
          </View>
          <View style={styles.gridItem}>
            <FormField control={control} name="fiberG" label="Fibra g" keyboardType="numeric" />
          </View>
        </View>
        <FormField control={control} name="notes" label="Notas" multiline />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Detectado por IA</Text>
        {analysis.items.map((item) => (
          <BodyText key={`${item.name}-${item.estimatedPortion}`} style={styles.item}>
            {item.name} - {item.estimatedPortion} - {item.calories} kcal - confianza{" "}
            {Math.round(item.confidence * 100)}%
          </BodyText>
        ))}
        <BodyText style={styles.disclaimer}>{analysis.disclaimer}</BodyText>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Guardar comida" icon={Save} loading={loading} onPress={handleSubmit(save)} />
      </Card>
    </Screen>
  );
}

function toNumber(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

const mealTypeOptions: ChoiceOption[] = [
  { label: "Desayuno", value: "breakfast" },
  { label: "Almuerzo", value: "lunch" },
  { label: "Cena", value: "dinner" },
  { label: "Colacion", value: "snack" },
  { label: "Otro", value: "other" },
];

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    summaryCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    name: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 20,
    },
    metrics: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    gridItem: {
      width: "48%",
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    item: {
      color: colors.muted,
      fontSize: 13,
    },
    disclaimer: {
      color: colors.warning,
      fontSize: 13,
    },
    error: {
      color: colors.danger,
    },
  });
}
