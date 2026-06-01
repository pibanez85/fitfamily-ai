import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { pickAndUploadImage } from "@/services/storage";
import { useAppStore } from "@/store/appStore";
import { colors } from "@/theme/colors";

export default function FoodPhotoScreen() {
  const profileId = useActiveProfileId();
  const setPendingFoodAnalysis = useAppStore((state) => state.setPendingFoodAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const upload = await pickAndUploadImage("meal-photos", profileId);
      if (!upload) return;
      const analysis = await api.ai.analyzeFood(profileId, upload.signedUrl);
      setPendingFoodAnalysis(analysis);
      router.push("/meals/analysis");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo analizar la comida.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Subir foto de comida</Title>
      <Subtitle>La foto se sube a Supabase Storage y la IA corre solo desde el backend.</Subtitle>
      <Card>
        <BodyText>Usa buena luz y encuadre. Si hay salsas o aceites no visibles, corrige antes de guardar.</BodyText>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Elegir foto y analizar" icon={Camera} loading={loading} onPress={analyze} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
  },
});
