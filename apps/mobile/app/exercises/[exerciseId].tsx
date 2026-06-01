import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  BadgePlus,
  Bot,
  Dumbbell,
  Heart,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import type { ExerciseCatalogItem } from "@fitfamily-ai/shared";
import { MUSCLE_GROUPS, type MuscleGroupId } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { MuscleMap } from "@/components/MuscleMap";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { getExerciseMedia } from "@/services/exerciseMedia";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type DetailParams = {
  exerciseId?: string;
  exerciseName?: string;
  workoutId?: string;
  workoutDayId?: string;
  returnTo?: string;
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ExerciseDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<DetailParams>();
  const exerciseId = normalizeParam(params.exerciseId);
  const fallbackName = normalizeParam(params.exerciseName);
  const profileId = useActiveProfileId();

  const [exercise, setExercise] = useState<ExerciseCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [favoritePrepared, setFavoritePrepared] = useState(false);

  useEffect(() => {
    if (!exerciseId) {
      setLoading(false);
      setError("Ejercicio no encontrado.");
      return;
    }
    let alive = true;
    setLoading(true);
    api.workouts
      .exerciseDetail(exerciseId)
      .then((data) => {
        if (alive) setExercise(data);
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : "No pude cargar el ejercicio.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [exerciseId]);

  async function askAi() {
    if (!profileId || !exercise) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const result = await api.ai.chat(
        profileId,
        [
          `Explicame como ejecutar este ejercicio de forma practica y segura: ${exercise.name}.`,
          `Musculos principales: ${labelMuscles(exercise.muscleGroupIds).join(", ")}.`,
          `Equipo: ${exercise.libraryEquipment}. Patron: ${exercise.movementPattern}.`,
          "Incluye pasos, errores comunes, alternativas si no tengo la maquina y una advertencia de seguridad breve.",
          "Si menciono dolor, lesion o sintomas preocupantes, recomienda consultar a un profesional.",
        ].join("\n"),
      );
      setAiAnswer(result.message.content);
    } catch (caught) {
      setAiAnswer(caught instanceof Error ? caught.message : "No pude consultar a la IA.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <LoadingState label="Cargando detalle del ejercicio..." />;

  if (!exercise) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <EmptyState title={fallbackName ?? "Ejercicio"} body={error ?? "No pude abrir este ejercicio."} />
      </Screen>
    );
  }

  const primaryMuscles = labelMuscles(exercise.muscleGroupIds.length ? exercise.muscleGroupIds : muscleIdsFromText(exercise.primaryMuscles));
  const secondaryMuscles = exercise.secondaryMuscles?.length ? exercise.secondaryMuscles : inferSecondaryMuscles(exercise);
  const steps = buildInstructionSteps(exercise);
  const mistakes = buildCommonMistakes(exercise);
  const safety = buildSafetyTips(exercise);
  const variants = buildVariants(exercise);
  const alternatives = buildAlternatives(exercise);
  const selectedMuscle = exercise.muscleGroupIds[0] ?? "all";

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Detalles del ejercicio</Text>
        <Pressable onPress={() => setFavoritePrepared((current) => !current)} style={styles.backButton}>
          <Heart size={20} color={favoritePrepared ? colors.accent : colors.text} fill={favoritePrepared ? colors.accent : "transparent"} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.equipmentLabel}>{exercise.libraryEquipment.toUpperCase()}</Text>
        <Title>{exercise.name}</Title>
        <Subtitle>{exercise.rationale}</Subtitle>
        <View style={styles.badgeRow}>
          <View style={styles.scoreBadge}>
            <Sparkles size={16} color={colors.energy} />
            <Text style={styles.scoreText}>{exercise.scienceScore}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Dumbbell size={16} color={colors.primary} />
            <Text style={styles.scoreText}>{tierLabel(exercise.tier)}</Text>
          </View>
        </View>
      </View>

      <ExerciseMediaPlaceholder exercise={exercise} />

      <Card>
        <Text style={styles.sectionTitle}>Series sugeridas</Text>
        <View style={styles.seriesTable}>
          {[1, 2, 3].map((setNumber) => (
            <View key={setNumber} style={styles.seriesRow}>
              <Text style={styles.seriesLabel}>Serie {setNumber}</Text>
              <Text style={styles.seriesMetric}>{exercise.defaultReps} rep</Text>
              <Text style={styles.seriesMetric}>{exercise.defaultRestSeconds} seg</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Descripcion del ejercicio</Text>
        <InfoRow icon={Dumbbell} title="Partes del cuerpo" value={primaryMuscles.join(", ") || "General"} />
        <InfoRow icon={ShieldCheck} title="Capacidad" value={tierLabel(exercise.tier)} />
        <InfoRow icon={RefreshCcw} title="Equipamiento" value={exercise.libraryEquipment} />
      </Card>

      <MuscleMap selected={selectedMuscle} onSelect={() => undefined} />

      <InfoList title="Instrucciones paso a paso" items={steps} />
      <InfoList title="Errores comunes" items={mistakes} />
      <InfoList title="Consejos de seguridad" items={safety} />
      <InfoList title="Variantes" items={variants} />
      <InfoList title="Alternativas si no tienes la maquina" items={alternatives} />

      <Card>
        <Text style={styles.sectionTitle}>Musculos trabajados</Text>
        <View style={styles.muscleTags}>
          {primaryMuscles.map((muscle) => (
            <Text key={`primary-${muscle}`} style={styles.primaryTag}>{muscle}</Text>
          ))}
          {secondaryMuscles.map((muscle) => (
            <Text key={`secondary-${muscle}`} style={styles.secondaryTag}>{muscle}</Text>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionGrid}>
          <AppButton label="Preguntar a IA" icon={Bot} loading={aiLoading} onPress={askAi} />
          <AppButton label="Agregar a rutina" icon={BadgePlus} variant="secondary" onPress={() => router.push("/workouts/create")} />
          <AppButton label="Reemplazar ejercicio actual" icon={RefreshCcw} variant="secondary" onPress={() => router.back()} />
        </View>
        {aiAnswer ? <Text style={styles.aiAnswer}>{aiAnswer}</Text> : null}
        {favoritePrepared ? (
          <BodyText style={styles.preparedText}>Favoritos queda preparado en UI; falta tabla/endpoint para persistirlo.</BodyText>
        ) : null}
      </Card>
    </Screen>
  );
}

function ExerciseMediaPlaceholder({ exercise }: { exercise: ExerciseCatalogItem }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const media = getExerciseMedia(exercise.name);

  if (media) {
    return (
      <View style={styles.mediaBox}>
        <Image
          source={{ uri: media.uri }}
          resizeMode="contain"
          style={styles.mediaImage}
          accessibilityLabel={`Demostracion animada de ${exercise.name}`}
        />
        <View style={styles.mediaFooter}>
          <Text style={styles.mediaExerciseName}>{exercise.name}</Text>
          <Text style={styles.mediaSubtitle}>Demostracion de prueba: {media.sourceName}</Text>
          <Text style={styles.mediaAttribution}>{media.attribution}</Text>
          <Text style={styles.mediaLicense}>{media.licenseNote}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mediaBox}>
      <Svg width="100%" height={210} viewBox="0 0 360 210">
        <Defs>
          <LinearGradient id="mediaBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.surfaceStrong} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.backgroundElevated} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="mediaAccent" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.energy} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={360} height={210} rx={18} fill="url(#mediaBg)" />
        <Circle cx={74} cy={98} r={26} fill={colors.surfaceMuted} />
        <Path
          d="M101 110 C132 92 174 92 204 111 C223 123 245 123 262 111"
          stroke="url(#mediaAccent)"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M77 126 L113 176 M142 119 L121 177 M207 121 L233 177" stroke={colors.subtle} strokeWidth={10} strokeLinecap="round" />
        <Path d="M53 102 L31 88 M95 102 L122 86 M262 111 L315 82" stroke={colors.energy} strokeWidth={9} strokeLinecap="round" />
      </Svg>
      <View style={styles.mediaOverlay}>
        <Text style={styles.mediaTitle}>GIF / animacion pendiente</Text>
        <Text style={styles.mediaSubtitle}>
          Preparado para cargar `mediaUrl` o `gifUrl` licenciado desde Storage/CDN.
        </Text>
      </View>
      <View style={styles.mediaFooter}>
        <Text style={styles.mediaExerciseName}>{exercise.name}</Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Dumbbell;
  title: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.infoRow}>
      <Icon size={21} color={colors.text} />
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={`${title}-${item}`} style={styles.bulletRow}>
          <Text style={styles.bulletNumber}>{index + 1}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

function labelMuscles(ids: MuscleGroupId[]): string[] {
  return ids.map((id) => MUSCLE_GROUPS.find((muscle) => muscle.id === id)?.label ?? id);
}

function muscleIdsFromText(values?: string[]): MuscleGroupId[] {
  if (!values) return [];
  return values
    .map((value) => value.toLowerCase())
    .map((value) => MUSCLE_GROUPS.find((muscle) => muscle.label.toLowerCase() === value || muscle.id === value)?.id)
    .filter((value): value is MuscleGroupId => Boolean(value));
}

function inferSecondaryMuscles(exercise: ExerciseCatalogItem): string[] {
  if (exercise.muscleGroupIds.includes("pecho")) return ["Triceps", "Hombros"];
  if (exercise.muscleGroupIds.includes("espalda")) return ["Biceps", "Trapecio"];
  if (exercise.muscleGroupIds.includes("cuadriceps")) return ["Gluteos", "Core"];
  if (exercise.muscleGroupIds.includes("gluteos")) return ["Isquios", "Lumbar"];
  return [];
}

function buildInstructionSteps(exercise: ExerciseCatalogItem): string[] {
  const base = exercise.instructions?.trim();
  return [
    "Ajusta la posicion y el equipo antes de cargar peso.",
    base || exercise.rationale,
    "Inicia cada repeticion con control, manteniendo el tronco estable.",
    "Vuelve a la posicion inicial sin perder tension ni compensar con impulso.",
  ];
}

function buildCommonMistakes(exercise: ExerciseCatalogItem): string[] {
  return [
    "Usar demasiado peso y perder rango de movimiento.",
    "Acelerar la bajada o perder control en la fase dificil.",
    exercise.tier === "situacional"
      ? "Forzar el ejercicio aunque genere molestia articular."
      : "No registrar carga, repeticiones o sensacion para progresar.",
  ];
}

function buildSafetyTips(exercise: ExerciseCatalogItem): string[] {
  return [
    exercise.safetyNotes || "Calienta con una o dos series livianas antes de las series efectivas.",
    "Detente ante dolor agudo, mareo o sintomas raros y consulta a un profesional.",
    "Prioriza tecnica estable antes de aumentar el peso.",
  ];
}

function buildVariants(exercise: ExerciseCatalogItem): string[] {
  return [
    `${exercise.name} con carga mas ligera y tempo controlado.`,
    `${exercise.name} unilateral si necesitas corregir diferencias.`,
    `${exercise.name} en maquina, polea o mancuernas segun disponibilidad.`,
  ];
}

function buildAlternatives(exercise: ExerciseCatalogItem): string[] {
  if (exercise.muscleGroupIds.includes("pecho")) return ["Press con mancuernas", "Press en maquina", "Flexiones controladas"];
  if (exercise.muscleGroupIds.includes("espalda")) return ["Remo con mancuerna", "Jalon al pecho", "Remo sentado en polea"];
  if (exercise.muscleGroupIds.includes("cuadriceps")) return ["Prensa de piernas", "Sentadilla goblet", "Split squat bulgaro"];
  if (exercise.muscleGroupIds.includes("gluteos")) return ["Hip thrust", "Glute bridge", "Pull through en polea"];
  return ["Mancuernas", "Polea", "Peso corporal con rango controlado"];
}

function tierLabel(tier: string): string {
  switch (tier) {
    case "principal":
      return "Principal";
    case "excelente":
      return "Excelente";
    case "accesorio":
      return "Accesorio";
    case "aislamiento":
      return "Aislamiento";
    default:
      return "Situacional";
  }
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    backButton: {
      width: 46,
      height: 46,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: { color: colors.text, fontWeight: "900", fontSize: 17 },
    hero: { gap: 8 },
    equipmentLabel: { color: colors.muted, fontSize: 13, fontWeight: "900", letterSpacing: 0 },
    badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    scoreText: { color: colors.text, fontWeight: "900", fontSize: 14 },
    mediaBox: {
      borderRadius: radius.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
    },
    mediaImage: {
      width: "100%",
      height: 340,
      backgroundColor: colors.surfaceStrong,
    },
    mediaOverlay: { position: "absolute", left: 16, right: 16, bottom: 42, gap: 3 },
    mediaTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
    mediaSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
    mediaFooter: { gap: 4, padding: 14 },
    mediaExerciseName: { color: colors.text, fontWeight: "900", fontSize: 15 },
    mediaAttribution: { color: colors.muted, fontSize: 11.5, lineHeight: 16 },
    mediaLicense: { color: colors.warning, fontSize: 11, fontWeight: "800", lineHeight: 15 },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
    seriesTable: { gap: 8 },
    seriesRow: {
      minHeight: 48,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 8,
    },
    seriesLabel: { flex: 1, color: colors.text, fontWeight: "800" },
    seriesMetric: {
      minWidth: 74,
      color: colors.text,
      fontWeight: "900",
      textAlign: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      paddingVertical: 7,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    infoText: { flex: 1, gap: 2 },
    infoTitle: { color: colors.muted, fontSize: 13, fontWeight: "800" },
    infoValue: { color: colors.text, fontSize: 16, fontWeight: "900" },
    bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    bulletNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      textAlign: "center",
      textAlignVertical: "center",
      color: colors.onPrimary,
      backgroundColor: colors.primary,
      fontWeight: "900",
      overflow: "hidden",
    },
    bulletText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
    muscleTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    primaryTag: {
      color: colors.onPrimary,
      backgroundColor: colors.energy,
      borderRadius: radius.pill,
      paddingHorizontal: 11,
      paddingVertical: 7,
      fontWeight: "900",
      fontSize: 12,
    },
    secondaryTag: {
      color: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: 11,
      paddingVertical: 7,
      fontWeight: "900",
      fontSize: 12,
    },
    actionGrid: { gap: 9 },
    aiAnswer: {
      color: colors.text,
      backgroundColor: colors.backgroundElevated,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      lineHeight: 19,
    },
    preparedText: { color: colors.muted, fontSize: 12.5 },
  });
}
