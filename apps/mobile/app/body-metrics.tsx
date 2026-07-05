import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

const MetricFormSchema = z.object({
  weightKg: z.string().optional(),
  waistCm: z.string().optional(),
  chestCm: z.string().optional(),
  hipCm: z.string().optional(),
  notes: z.string().optional(),
});

type MetricForm = z.infer<typeof MetricFormSchema>;

export default function BodyMetricsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useForm<MetricForm>({
    resolver: zodResolver(MetricFormSchema),
    defaultValues: { weightKg: "", waistCm: "", chestCm: "", hipCm: "", notes: "" },
  });

  async function onSubmit(values: MetricForm) {
    if (!profileId) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.bodyMetrics.create(profileId, {
        measuredAt: new Date().toISOString(),
        weightKg: values.weightKg ? Number(values.weightKg) : null,
        waistCm: values.waistCm ? Number(values.waistCm) : null,
        chestCm: values.chestCm ? Number(values.chestCm) : null,
        hipCm: values.hipCm ? Number(values.hipCm) : null,
        armCm: null,
        thighCm: null,
        bodyFatPercentage: null,
        notes: values.notes || null,
      });
      reset();
      setMessage("Métricas guardadas.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Métricas corporales</Title>
      <Subtitle>Peso y medidas para seguir progreso sin obsesionarse con un solo número.</Subtitle>
      <Card>
        <FormField control={control} name="weightKg" label="Peso kg" keyboardType="numeric" />
        <FormField control={control} name="waistCm" label="Cintura cm" keyboardType="numeric" />
        <FormField control={control} name="chestCm" label="Pecho cm" keyboardType="numeric" />
        <FormField control={control} name="hipCm" label="Cadera cm" keyboardType="numeric" />
        <FormField control={control} name="notes" label="Notas" multiline />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <AppButton label="Guardar métricas" icon={Save} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    message: {
      color: colors.primary,
    },
  });
}
