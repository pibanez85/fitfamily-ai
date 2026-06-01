import { StyleSheet, Text } from "react-native";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useAppStore } from "@/store/appStore";
import { colors } from "@/theme/colors";

export default function MachineAnalysisScreen() {
  const analysis = useAppStore((state) => state.pendingMachineAnalysis);

  if (!analysis) {
    return (
      <Screen>
        <EmptyState title="Sin analisis activo" body="Sube una foto de maquina para ver resultados." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{analysis.machineName}</Title>
      <Subtitle>
        {analysis.difficulty} · confianza {Math.round(analysis.confidence * 100)}%
      </Subtitle>
      <Card>
        <Text style={styles.heading}>Ejercicios posibles</Text>
        {analysis.possibleExercises.map((item) => (
          <BodyText key={item}>- {item}</BodyText>
        ))}
      </Card>
      <Card>
        <Text style={styles.heading}>Musculos</Text>
        <BodyText>Principales: {analysis.primaryMuscles.join(", ") || "sin dato"}</BodyText>
        <BodyText>Secundarios: {analysis.secondaryMuscles.join(", ") || "sin dato"}</BodyText>
      </Card>
      <Card>
        <Text style={styles.heading}>Instrucciones</Text>
        {analysis.instructions.map((item) => (
          <BodyText key={item}>- {item}</BodyText>
        ))}
      </Card>
      <Card>
        <Text style={styles.heading}>Seguridad</Text>
        {analysis.safetyRecommendations.map((item) => (
          <BodyText key={item}>- {item}</BodyText>
        ))}
      </Card>
      <Card>
        <Text style={styles.heading}>Evitar si</Text>
        {analysis.avoidIf.map((item) => (
          <BodyText key={item}>- {item}</BodyText>
        ))}
      </Card>
      <BodyText style={styles.disclaimer}>{analysis.disclaimer}</BodyText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  disclaimer: {
    color: colors.warning,
  },
});
