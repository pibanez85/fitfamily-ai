import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

export default function FoodAnalysisScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const analysis = useAppStore((state) => state.pendingFoodAnalysis);

  if (!analysis) {
    return (
      <Screen>
        <EmptyState title="Sin análisis activo" body="Sube una foto de comida para ver resultados." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{analysis.estimatedMealName}</Title>
      <Subtitle>Confianza: {Math.round(analysis.confidence * 100)}%</Subtitle>
      <Card>
        <Text style={styles.total}>{analysis.totals.calories} kcal</Text>
        <BodyText>
          P {analysis.totals.proteinG}g · C {analysis.totals.carbsG}g · G {analysis.totals.fatG}g · Fibra {analysis.totals.fiberG}g
        </BodyText>
      </Card>
      {analysis.items.map((item) => (
        <Card key={`${item.name}-${item.estimatedPortion}`}>
          <Text style={styles.item}>{item.name}</Text>
          <BodyText>
            {item.estimatedPortion} · {item.calories} kcal · confianza {Math.round(item.confidence * 100)}%
          </BodyText>
        </Card>
      ))}
      <BodyText style={styles.disclaimer}>{analysis.disclaimer}</BodyText>
      <AppButton label="Corregir y guardar" icon={Check} onPress={() => router.push("/meals/confirm")} />
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    total: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    item: {
      color: colors.text,
      fontWeight: "900",
    },
    disclaimer: {
      color: colors.warning,
    },
  });
}
