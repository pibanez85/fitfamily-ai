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

export default function MachinePhotoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const setPendingMachineAnalysis = useAppStore((state) => state.setPendingMachineAnalysis);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(source: "camera" | "library") {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    setStatus(source === "camera" ? "Abriendo camara..." : "Abriendo galería...");
    try {
      const upload = await pickAndUploadImageFromSource("machine-photos", profileId, source);
      if (!upload) {
        setStatus(null);
        return;
      }
      setStatus("Subiendo foto y preparando análisis...");
      const analysis = await api.ai.analyzeMachine(profileId, upload.signedUrl);
      setPendingMachineAnalysis(analysis);
      router.push("/machines/analysis");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo analizar la máquina.");
    } finally {
      setStatus(null);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Subir foto de máquina</Title>
      <Subtitle>Identificación, músculos, instrucciones y seguridad.</Subtitle>
      <Card>
        <BodyText>Fotografia la máquina completa si puedes, incluyendo agarres y ajustes visibles.</BodyText>
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
