import { router } from "expo-router";
import { Camera, ImagePlus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { pickAndUploadImageFromSource } from "@/services/storage";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

export default function FoodPhotoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const setPendingFoodAnalysis = useAppStore((state) => state.setPendingFoodAnalysis);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(source: "camera" | "library") {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    setStatus(source === "camera" ? "Abriendo camara..." : "Abriendo galería...");
    try {
      const upload = await pickAndUploadImageFromSource("meal-photos", profileId, source);
      if (!upload) {
        setStatus(null);
        return;
      }
      setStatus("Subiendo foto y preparando análisis...");
      const analysis = await api.ai.analyzeFood(profileId, upload.signedUrl);
      setPendingFoodAnalysis(analysis);
      router.push("/meals/analysis");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo analizar la comida.");
    } finally {
      setStatus(null);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Subir foto de comida</Title>
      <Subtitle>Saca una foto a tu plato y la IA estima calorías y macros por ti.</Subtitle>
      <Card>
        <BodyText>
          Usa buena luz y encuadra el plato completo. Si hay salsas, aceites o ingredientes ocultos, agregalos
          despues al corregir.
        </BodyText>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <AppButton
            label="Sacar foto y analizar"
            icon={Camera}
            loading={loading}
            onPress={() => analyze("camera")}
            style={styles.action}
          />
          <AppButton
            label="Elegir desde galería"
            icon={ImagePlus}
            variant="secondary"
            disabled={loading}
            onPress={() => analyze("library")}
            style={styles.action}
          />
        </View>
      </Card>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    actions: {
      gap: 10,
    },
    action: {
      width: "100%",
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    status: {
      color: colors.energy,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
