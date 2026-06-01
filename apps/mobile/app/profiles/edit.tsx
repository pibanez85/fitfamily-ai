import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Dumbbell, Save, Utensils } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { ChoiceGroup, type ChoiceOption } from "@/components/ChoiceGroup";
import { DateOfBirthPicker } from "@/components/DateOfBirthPicker";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";

const ProfileFormSchema = z.object({
  displayName: z.string().min(1, "Nombre requerido"),
  birthdate: z
    .string()
    .optional()
    .refine((value) => !value || isReasonableBirthdate(value), "Revisa la fecha de nacimiento"),
  sex: z.string().optional(),
  heightCm: z.string().optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  dietStyle: z.string().optional(),
  trainingStyle: z.string().optional(),
});

type ProfileForm = z.infer<typeof ProfileFormSchema>;

function isReasonableBirthdate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
  const now = new Date();
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
    age -= 1;
  }
  return year >= 1900 && date.getTime() <= now.getTime() && age >= 0 && age <= 130;
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setProfiles = useAppStore((state) => state.setProfiles);
  const { control, handleSubmit } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      displayName: "",
      birthdate: "",
      sex: "",
      heightCm: "",
      goal: "ganar-fuerza",
      activityLevel: "moderado",
      dietStyle: "balanceado",
      trainingStyle: "fuerza",
    },
  });

  async function onSubmit(values: ProfileForm) {
    setError(null);
    setLoading(true);
    try {
      await api.profiles.create({
        displayName: values.displayName,
        birthdate: values.birthdate || null,
        sex: values.sex || null,
        heightCm: values.heightCm ? Number(values.heightCm) : null,
        goal: goalOptions.find((option) => option.value === values.goal)?.label ?? values.goal ?? null,
        activityLevel: values.activityLevel || null,
        dietaryPreferences: { style: values.dietStyle || "balanceado" },
        trainingPreferences: { style: values.trainingStyle || "fuerza" },
      });
      const profiles = await api.profiles.list();
      setProfiles(profiles);
      router.replace("/profiles");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Perfil familiar</Title>
      <Subtitle>Tu entrenador IA necesita contexto claro para recomendar mejor sin inventar datos.</Subtitle>
      <Card style={styles.coachCard}>
        <View style={styles.coachHeader}>
          <Dumbbell size={22} color={colors.energy} />
          <View style={styles.coachText}>
            <Text style={styles.coachTitle}>Configuracion de coach</Text>
            <BodyText style={styles.coachBody}>
              Con estos datos la app ajusta entrenamientos, nutricion y respuestas del chat.
            </BodyText>
          </View>
        </View>
      </Card>
      <Card>
        <FormField control={control} name="displayName" label="Nombre" />
        <DateOfBirthPicker control={control} name="birthdate" label="Fecha de nacimiento" />
        <ChoiceGroup control={control} name="sex" label="Sexo" options={sexOptions} />
        <FormField control={control} name="heightCm" label="Altura cm" keyboardType="numeric" />
      </Card>
      <Card>
        <ChoiceGroup control={control} name="goal" label="Objetivo principal" options={goalOptions} />
        <ChoiceGroup control={control} name="activityLevel" label="Nivel de ejercicio" options={activityOptions} />
      </Card>
      <Card>
        <View style={styles.sectionHeader}>
          <Utensils size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Preferencias</Text>
        </View>
        <ChoiceGroup control={control} name="dietStyle" label="Enfoque de comida" options={dietOptions} />
        <ChoiceGroup control={control} name="trainingStyle" label="Estilo de entrenamiento" options={trainingOptions} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Guardar perfil" icon={Save} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    coachCard: {
      borderColor: colors.energy,
      backgroundColor: colors.energySoft,
    },
    coachHeader: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    coachText: {
      flex: 1,
      gap: 2,
    },
    coachTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    coachBody: {
      color: colors.muted,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    error: {
      color: colors.danger,
      fontSize: 13,
    },
  });
}

const sexOptions: ChoiceOption[] = [
  { label: "Masculino", value: "masculino" },
  { label: "Femenino", value: "femenino" },
  { label: "Otro", value: "otro" },
  { label: "Prefiero no decir", value: "no-especificado" },
];

const activityOptions: ChoiceOption[] = [
  { label: "Bajo", value: "bajo", description: "0 a 1 entrenos por semana" },
  { label: "Ligero", value: "ligero", description: "2 entrenos por semana" },
  { label: "Moderado", value: "moderado", description: "3 a 4 entrenos por semana" },
  { label: "Alto", value: "alto", description: "5 o mas entrenos por semana" },
];

const goalOptions: ChoiceOption[] = [
  { label: "Ganar fuerza", value: "ganar-fuerza", description: "Prioriza progresion de cargas y tecnica" },
  { label: "Perder grasa", value: "perder-grasa", description: "Control de calorias, proteina y constancia" },
  { label: "Ganar musculo", value: "ganar-musculo", description: "Volumen, fuerza y superavit moderado" },
  { label: "Salud y energia", value: "salud-energia", description: "Rutina sostenible y comida balanceada" },
];

const dietOptions: ChoiceOption[] = [
  { label: "Balanceado", value: "balanceado" },
  { label: "Alto en proteina", value: "alto-proteina" },
  { label: "Control de peso", value: "control-peso" },
];

const trainingOptions: ChoiceOption[] = [
  { label: "Fuerza", value: "fuerza" },
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Resistencia", value: "resistencia" },
];
