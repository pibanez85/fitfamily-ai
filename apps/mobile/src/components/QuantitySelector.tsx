import { useMemo } from "react";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  calculateFoodMacros,
  describeServing,
  gramsFor,
  unitsFor,
  type FoodCatalogItem,
} from "@/data/foodCatalog";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type QuantitySelectorProps = {
  food: FoodCatalogItem;
  quantity: number;
  unitLabel: string;
  onChange: (next: { quantity: number; unitLabel: string; grams: number }) => void;
};

export function QuantitySelector({ food, quantity, unitLabel, onChange }: QuantitySelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const units = unitsFor(food);
  const isWeight = unitLabel === "g" || unitLabel === "ml";
  const step = isWeight ? 10 : 1;
  const grams = gramsFor(food, quantity, unitLabel);
  const macros = calculateFoodMacros(food, grams);

  function emit(nextQuantity: number, nextUnit: string) {
    const safeQuantity = Math.max(nextQuantity, 0);
    onChange({
      quantity: safeQuantity,
      unitLabel: nextUnit,
      grams: gramsFor(food, safeQuantity, nextUnit),
    });
  }

  function changeUnit(nextUnit: string) {
    const next = nextUnit === "g" || nextUnit === "ml" ? Math.round(grams) || food.servingG : 1;
    emit(next, nextUnit);
  }

  return (
    <View style={styles.container}>
      <View style={styles.unitRow}>
        {units.map((unit) => {
          const active = unit.label === unitLabel;
          return (
            <Pressable
              key={unit.label}
              onPress={() => changeUnit(unit.label)}
              style={[styles.unitChip, active ? styles.unitChipActive : null]}
            >
              <Text style={[styles.unitText, active ? styles.unitTextActive : null]}>{unit.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stepperRow}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => emit(Math.max(quantity - step, 0), unitLabel)}
          accessibilityLabel="Disminuir cantidad"
        >
          <Minus size={18} color={colors.text} />
        </Pressable>
        <TextInput
          style={styles.qtyInput}
          value={String(quantity)}
          onChangeText={(text) => {
            const parsed = Number(text.replace(",", "."));
            emit(Number.isFinite(parsed) ? parsed : 0, unitLabel);
          }}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Pressable
          style={styles.stepBtn}
          onPress={() => emit(quantity + step, unitLabel)}
          accessibilityLabel="Aumentar cantidad"
        >
          <Plus size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.previewBox}>
        <Text style={styles.summary}>{describeServing(food, quantity, unitLabel)}</Text>
        <Text style={styles.macros}>
          {macros.calories} kcal - P {macros.proteinG} g - C {macros.carbsG} g - G {macros.fatG} g
          {food.estimated ? " - estimado" : ""}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: { gap: 9 },
    unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    unitChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    unitChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    unitText: { color: colors.muted, fontWeight: "800", fontSize: 13 },
    unitTextActive: { color: colors.onPrimary },
    stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepBtn: {
      width: 46,
      height: 46,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    qtyInput: {
      flex: 1,
      // En web los <input> tienen ancho minimo intrinseco (~266px) y sin esto
      // empujan el boton "+" fuera de la tarjeta en pantallas angostas.
      minWidth: 0,
      minHeight: 46,
      textAlign: "center",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 19,
      fontWeight: "900",
    },
    previewBox: {
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 3,
    },
    summary: { color: colors.text, fontSize: 14, fontWeight: "900" },
    macros: { color: colors.muted, fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
  });
}
