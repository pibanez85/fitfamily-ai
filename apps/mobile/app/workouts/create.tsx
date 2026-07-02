import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateWorkoutInput, ExerciseCatalogItem, MuscleGroupId } from "@fitfamily-ai/shared";
import { MUSCLE_GROUPS } from "@fitfamily-ai/shared";
import { AIHelperCard } from "@/components/AIHelperCard";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { MuscleMap } from "@/components/MuscleMap";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type WizardStep = 1 | 2 | 3 | 4;

type DayExerciseDraft = {
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  targetSets: string;
  targetReps: string;
  restSeconds: string;
  targetWeight: string;
  notes: string;
  score: number;
  tier: string;
  muscles: string[];
};

type DayDraft = {
  dayIndex: number;
  name: string;
  exercises: DayExerciseDraft[];
};

type WorkoutEditorDetail = {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  workoutDays?: Array<{
    id: string;
    name: string;
    dayIndex: number;
    workoutDayExercises?: Array<{
      id: string;
      exerciseId?: string | null;
      orderIndex?: number | null;
      targetSets?: number | null;
      targetReps?: string | null;
      targetWeight?: number | null;
      restSeconds?: number | null;
      notes?: string | null;
      exercises?: { id?: string; name?: string } | null;
    }>;
  }>;
};

type WorkoutEditorDay = NonNullable<WorkoutEditorDetail["workoutDays"]>[number];
type WorkoutEditorExerciseEntry = NonNullable<WorkoutEditorDay["workoutDayExercises"]>[number];

type GoalValue =
  | "fuerza"
  | "hipertrofia"
  | "resistencia"
  | "salud-general"
  | "perdida-grasa"
  | "recomposicion"
  | "otro";

type DurationValue = "permanente" | "4-semanas" | "6-semanas" | "8-semanas" | "personalizada";

type ExperienceLevel = "new" | "returning" | "intermediate" | "advanced";

type BodyPreset = "all" | "upper" | "lower" | "core";

const goalOptions: Array<{ value: GoalValue; label: string; helper: string }> = [
  { value: "fuerza", label: "Fuerza", helper: "Prioriza compuestos, cargas y descansos largos." },
  { value: "hipertrofia", label: "Hipertrofia", helper: "Volumen balanceado y progresion clara." },
  { value: "resistencia", label: "Resistencia", helper: "Mas repeticiones y descansos cortos." },
  { value: "salud-general", label: "Salud general", helper: "Base segura, completa y sostenible." },
  { value: "perdida-grasa", label: "Perdida de grasa", helper: "Fuerza + volumen eficiente." },
  { value: "recomposicion", label: "Recomposicion", helper: "Mantener fuerza y sumar musculo." },
  { value: "otro", label: "Otro", helper: "Personalizable." },
];

const durationOptions: Array<{ value: DurationValue; label: string; helper: string }> = [
  { value: "permanente", label: "Permanente", helper: "Hasta que la cambies" },
  { value: "4-semanas", label: "4 semanas", helper: "Bloque corto" },
  { value: "6-semanas", label: "6 semanas", helper: "Bloque clasico" },
  { value: "8-semanas", label: "8 semanas", helper: "Bloque largo" },
  { value: "personalizada", label: "Personalizada", helper: "La defines despues" },
];

const frequencyOptions = [2, 3, 4, 5, 6] as const;

const experienceOptions: Array<{ value: ExperienceLevel; label: string; helper: string }> = [
  { value: "new", label: "Estoy partiendo", helper: "Primeras 2 semanas livianas, tecnica y adaptacion." },
  { value: "returning", label: "Vuelvo al gym", helper: "Volumen moderado para retomar sin apurarse." },
  { value: "intermediate", label: "Intermedio", helper: "Progresion normal con ejercicios principales." },
  { value: "advanced", label: "Avanzado", helper: "Mas volumen si ya dominas la tecnica." },
];

const aiPromptChips = [
  "Sugiere una rutina completa segun mi objetivo",
  "Estoy recien iniciando, hazla liviana 2 semanas",
  "Hazla segura para volver al gimnasio",
  "Prioriza ejercicios efectivos y faciles de progresar",
  "Dame una version para entrenar con mi hija",
];

const bodyPresetLabels: Array<{ value: BodyPreset; label: string }> = [
  { value: "all", label: "Top ciencia" },
  { value: "upper", label: "Tren superior" },
  { value: "lower", label: "Tren inferior" },
  { value: "core", label: "Core" },
];

function dayNameTemplates(frequency: number): string[] {
  switch (frequency) {
    case 2:
      return ["Full body A", "Full body B"];
    case 3:
      return ["Empuje", "Tiron", "Pierna"];
    case 4:
      return ["Superior A", "Inferior A", "Superior B", "Inferior B"];
    case 5:
      return ["Pecho", "Espalda", "Pierna", "Hombros", "Brazos/Core"];
    case 6:
      return ["Empuje 1", "Tiron 1", "Pierna 1", "Empuje 2", "Tiron 2", "Pierna 2"];
    default:
      return Array.from({ length: frequency }, (_, i) => `Dia ${i + 1}`);
  }
}

function focusTemplates(frequency: number): MuscleGroupId[][] {
  switch (frequency) {
    case 2:
      return [
        ["cuadriceps", "pecho", "espalda", "gluteos", "core"],
        ["isquios", "hombros", "espalda", "gluteos", "triceps"],
      ];
    case 3:
      return [
        ["pecho", "hombros", "triceps"],
        ["espalda", "biceps", "core"],
        ["cuadriceps", "gluteos", "isquios", "pantorrillas"],
      ];
    case 4:
      return [
        ["pecho", "espalda", "hombros"],
        ["cuadriceps", "gluteos", "isquios"],
        ["espalda", "pecho", "biceps", "triceps"],
        ["gluteos", "cuadriceps", "pantorrillas", "core"],
      ];
    case 5:
      return [
        ["pecho", "triceps"],
        ["espalda", "biceps"],
        ["cuadriceps", "gluteos", "isquios"],
        ["hombros", "core"],
        ["biceps", "triceps", "pantorrillas"],
      ];
    case 6:
      return [
        ["pecho", "hombros", "triceps"],
        ["espalda", "biceps"],
        ["cuadriceps", "gluteos", "isquios"],
        ["pecho", "hombros", "triceps"],
        ["espalda", "biceps", "core"],
        ["gluteos", "cuadriceps", "pantorrillas"],
      ];
    default:
      return [];
  }
}

export default function CreateWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const editingWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const isEditMode = Boolean(editingWorkoutId);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const setActiveWorkout = useAppStore((state) => state.setActiveWorkout);

  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [goal, setGoal] = useState<GoalValue>("fuerza");
  const [duration, setDuration] = useState<DurationValue>("6-semanas");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("returning");
  const [frequency, setFrequency] = useState<number>(3);
  const [days, setDays] = useState<DayDraft[]>(() => buildEmptyDays(3));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [exerciseCatalog, setExerciseCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroupId | "all">("all");
  const [bodyPreset, setBodyPreset] = useState<BodyPreset>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activateOnSave, setActivateOnSave] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [hydratedWorkoutId, setHydratedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingExercises(true);
    api.workouts
      .exercises()
      .then((list) => {
        if (alive) setExerciseCatalog(list);
      })
      .catch(() => {
        if (alive) setExerciseCatalog([]);
      })
      .finally(() => {
        if (alive) setLoadingExercises(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!editingWorkoutId || loadingExercises || hydratedWorkoutId === editingWorkoutId) return;

    let alive = true;
    setLoadingWorkout(true);
    setError(null);
    api.workouts
      .detail(editingWorkoutId)
      .then((workout) => {
        if (!alive) return;
        const detail = workout as unknown as WorkoutEditorDetail;
        const nextGoal = goalValueFromLabel(detail.goal);
        const sortedDays = buildDraftDaysFromWorkout(detail, exerciseCatalog, nextGoal, experienceLevel);

        setName(detail.name);
        setDescription(detail.description ?? "");
        setGoal(nextGoal);
        setFrequency(sortedDays.length || 3);
        setDays(sortedDays.length ? sortedDays : buildEmptyDays(3));
        setSelectedDayIndex(0);
        setStep(3);
        setHydratedWorkoutId(editingWorkoutId);
      })
      .catch((caught) => {
        if (!alive) return;
        setError(caught instanceof Error ? caught.message : "No pude cargar la rutina para editar.");
        setHydratedWorkoutId(editingWorkoutId);
      })
      .finally(() => {
        if (alive) setLoadingWorkout(false);
      });

    return () => {
      alive = false;
    };
  }, [editingWorkoutId, exerciseCatalog, experienceLevel, hydratedWorkoutId, loadingExercises]);

  const goalLabel = goalOptions.find((option) => option.value === goal)?.label ?? "Objetivo";
  const durationLabel = durationOptions.find((option) => option.value === duration)?.label ?? "Duracion";
  const selectedDay = days[selectedDayIndex] ?? days[0];

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exerciseCatalog
      .filter((exercise) => {
        const matchesMuscle = exerciseMatchesMuscle(exercise, selectedMuscle);
        const matchesPreset =
          bodyPreset === "all" ||
          (bodyPreset === "upper" && exercise.bodyRegion === "superior") ||
          (bodyPreset === "lower" && exercise.bodyRegion === "inferior") ||
          (bodyPreset === "core" && exercise.bodyRegion === "core");
        const searchable = [
          exercise.name,
          exercise.libraryEquipment,
          exercise.movementPattern,
          exercise.tier,
          ...(exercise.primaryMuscles ?? []),
          ...(exercise.secondaryMuscles ?? []),
          ...exercise.tags,
        ]
          .join(" ")
          .toLowerCase();
        return matchesMuscle && matchesPreset && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => b.scienceScore - a.scienceScore || a.name.localeCompare(b.name))
      .slice(0, 24);
  }, [bodyPreset, exerciseCatalog, query, selectedMuscle]);

  function applyFrequency(value: number) {
    setFrequency(value);
    setSelectedDayIndex(0);
    const templates = dayNameTemplates(value);
    setDays((current) => {
      const next: DayDraft[] = [];
      for (let i = 0; i < value; i += 1) {
        next.push(
          current[i]
            ? { ...current[i]!, dayIndex: i, name: current[i]!.name || templates[i] || `Dia ${i + 1}` }
            : { dayIndex: i, name: templates[i] ?? `Dia ${i + 1}`, exercises: [] },
        );
      }
      return next;
    });
  }

  function setDayName(index: number, value: string) {
    setDays((current) => current.map((day, i) => (i === index ? { ...day, name: value } : day)));
  }

  function addExerciseToSelectedDay(exercise: ExerciseCatalogItem) {
    if (!selectedDay) return;
    setDays((current) =>
      current.map((day, i) =>
        i === selectedDayIndex
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                createExerciseDraft(exercise, day.exercises.length, goal, experienceLevel),
              ],
            }
          : day,
      ),
    );
  }

  function updateExercise(exerciseIndex: number, patch: Partial<DayExerciseDraft>) {
    setDays((current) =>
      current.map((day, i) =>
        i === selectedDayIndex
          ? {
              ...day,
              exercises: day.exercises.map((entry, j) =>
                j === exerciseIndex ? { ...entry, ...patch } : entry,
              ),
            }
          : day,
      ),
    );
  }

  function removeExercise(exerciseIndex: number) {
    setDays((current) =>
      current.map((day, i) =>
        i === selectedDayIndex
          ? {
              ...day,
              exercises: day.exercises
                .filter((_, j) => j !== exerciseIndex)
                .map((entry, j) => ({ ...entry, orderIndex: j })),
            }
          : day,
      ),
    );
  }

  function moveExercise(exerciseIndex: number, direction: -1 | 1) {
    setDays((current) =>
      current.map((day, i) => {
        if (i !== selectedDayIndex) return day;
        const target = exerciseIndex + direction;
        if (target < 0 || target >= day.exercises.length) return day;
        const next = [...day.exercises];
        const a = next[exerciseIndex]!;
        const b = next[target]!;
        next[exerciseIndex] = b;
        next[target] = a;
        return { ...day, exercises: next.map((entry, j) => ({ ...entry, orderIndex: j })) };
      }),
    );
  }

  function applyEvidenceTemplate(targetStep: WizardStep = 3) {
    const suggestedDays = buildSuggestedWorkoutDays(exerciseCatalog, frequency, goal, experienceLevel);
    setDays(suggestedDays);
    setSelectedDayIndex(0);
    if (!name.trim()) setName(`${goalLabel} ${frequency} dias ${experienceLabel(experienceLevel)}`);
    if (!description.trim()) {
      setDescription(
        [
          "Plantilla generada desde el catalogo priorizando ejercicios multiarticulares, seguros y progresables.",
          experienceLevel === "new" || experienceLevel === "returning"
            ? "Primeras 2 semanas: trabaja liviano, deja 2-3 repeticiones en reserva y prioriza tecnica."
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    setStep(targetStep);
  }

  async function generateCompleteWorkoutWithAi() {
    if (loadingExercises || exerciseCatalog.length === 0) {
      setAiResponse("Estoy cargando el catalogo de ejercicios. Intenta nuevamente en unos segundos.");
      return;
    }

    setAiLoading(true);
    setAiResponse(null);
    setError(null);

    const suggestedDays = buildSuggestedWorkoutDays(exerciseCatalog, frequency, goal, experienceLevel);
    setDays(suggestedDays);
    setSelectedDayIndex(0);
    if (!name.trim()) setName(`${goalLabel} ${frequency} dias ${experienceLabel(experienceLevel)}`);
    setDescription(
      [
        "Rutina creada automaticamente por FitFamily AI usando el catalogo priorizado por ejercicios efectivos, seguros y progresables.",
        experienceLevel === "new" || experienceLevel === "returning"
          ? "Primeras 2 semanas: fase liviana de adaptacion, tecnica limpia, RPE 6-7 y 2-3 repeticiones en reserva."
          : "Progresion sugerida: cuando completes el rango alto de repeticiones con buena tecnica, sube levemente la carga.",
        aiInstructions.trim() ? `Contexto personal considerado:\n${aiInstructions.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    try {
      if (!profileId) return;
      const summary = suggestedDays
        .map(
          (day) =>
            `${day.name}: ${day.exercises
              .map((exercise) => `${exercise.exerciseName} ${exercise.targetSets}x${exercise.targetReps}`)
              .join(", ")}`,
        )
        .join("\n");
      const result = await api.ai.chat(
        profileId,
        [
          "Revisa esta rutina generada automaticamente por FitFamily AI antes de guardarla.",
          `Objetivo: ${goalLabel}. Frecuencia: ${frequency} dias por semana. Duracion: ${durationLabel}.`,
          `Nivel declarado: ${experienceLabel(experienceLevel)}.`,
          aiInstructions.trim()
            ? `Instrucciones personales del usuario: ${aiInstructions.trim()}`
            : "Sin instrucciones personales adicionales.",
          `Rutina propuesta:\n${summary}`,
          "Entrega una revision breve en espanol: por que sirve, como partir la primera semana y advertencias de seguridad. Si el usuario menciona dolor o lesion, recomienda profesional.",
        ].join("\n"),
      );
      setAiResponse(result.message.content);
    } catch (caught) {
      setAiResponse(
        caught instanceof Error
          ? `La rutina quedo creada como borrador, pero no pude obtener la revision IA: ${caught.message}`
          : "La rutina quedo creada como borrador, pero no pude obtener la revision IA.",
      );
    } finally {
      setAiLoading(false);
      setStep(4);
    }
  }

  async function askAi(prompt: string) {
    if (!profileId) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const topExercises = exerciseCatalog
        .slice(0, 18)
        .map((exercise) => `${exercise.name} (${exercise.tier}, score ${exercise.scienceScore})`)
        .join(", ");
      const result = await api.ai.chat(
        profileId,
        [
          prompt,
          `Objetivo: ${goalLabel}. Frecuencia: ${frequency} dias por semana. Duracion: ${durationLabel}.`,
          `Nivel declarado: ${experienceLabel(experienceLevel)}.`,
          aiInstructions.trim()
            ? `Instrucciones personales para la IA: ${aiInstructions.trim()}`
            : "El usuario no agrego instrucciones personales adicionales.",
          `Usa prioridad de ejercicios efectivos y seguros. Catalogo top disponible: ${topExercises}.`,
          experienceLevel === "new" || experienceLevel === "returning"
            ? "Si esta iniciando o volviendo al gimnasio, la rutina debe partir liviana por 2 semanas, con foco en tecnica y tolerancia."
            : "Puede usar progresion normal si la tecnica ya esta dominada.",
          "Responde con una propuesta por dias, series, repeticiones, descansos y una nota de seguridad. No inventes datos de salud.",
        ].join("\n"),
      );
      setAiResponse(result.message.content);
    } catch (caught) {
      setAiResponse(caught instanceof Error ? caught.message : "No pude obtener una sugerencia IA.");
    } finally {
      setAiLoading(false);
    }
  }

  function canAdvanceFromStep(currentStep: number): boolean {
    if (currentStep === 1) return name.trim().length > 0;
    if (currentStep === 2) return days.length === frequency && days.every((day) => day.name.trim().length > 0);
    if (currentStep === 3) return days.some((day) => day.exercises.length > 0);
    return true;
  }

  async function save(startAfterSave = false) {
    if (!profileId) return;
    setError(null);
    setSaving(true);
    try {
      const payload: CreateWorkoutInput = {
        name: name.trim(),
        description: isEditMode
          ? description.trim() || null
          : [
              description.trim(),
              `Nivel declarado: ${experienceLabel(experienceLevel)}`,
              aiInstructions.trim() ? `Instrucciones personales para IA:\n${aiInstructions.trim()}` : "",
              `Duracion: ${durationLabel}`,
            ]
              .filter(Boolean)
              .join("\n") || null,
        goal: goalLabel,
        days: days.map((day) => ({
          dayIndex: day.dayIndex,
          name: day.name.trim() || `Dia ${day.dayIndex + 1}`,
          notes: null,
          exercises: day.exercises.map((entry, index) => ({
            exerciseId: entry.exerciseId,
            orderIndex: index,
            targetSets: parseIntOrNull(entry.targetSets),
            targetReps: entry.targetReps.trim() || null,
            restSeconds: parseIntOrNull(entry.restSeconds),
            targetWeight: parseFloatOrNull(entry.targetWeight),
            notes: entry.notes.trim() || null,
          })),
        })),
      };

      const saved =
        isEditMode && editingWorkoutId
          ? await api.workouts.update(editingWorkoutId, payload)
          : await api.workouts.create(profileId, payload);
      if (activateOnSave) setActiveWorkout(profileId, saved.id);
      if (startAfterSave) {
        router.replace({ pathname: "/workouts/log", params: { workoutId: saved.id } });
      } else {
        router.replace("/workouts");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Title>{isEditMode ? "Editar rutina" : "Crear rutina"}</Title>
      <Subtitle>
        {isEditMode
          ? "Modifica dias, ejercicios, series, repeticiones, descanso y notas de tu rutina."
          : "Construye una rutina con ejercicios priorizados por efectividad, seguridad y facilidad de progresion."}
      </Subtitle>
      <StepIndicator step={step} />
      {loadingWorkout ? <LoadingState label="Cargando rutina..." /> : null}

      {step === 1 ? (
        <View style={styles.stack}>
          <Card>
            <Text style={styles.sectionTitle}>1. Nombre y objetivo</Text>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: Fuerza 3 dias, Hipertrofia full body"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Text style={styles.label}>Descripcion opcional</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Para que es y como se ejecuta"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.inputMultiline]}
              multiline
            />
            <Text style={styles.label}>Instrucciones personales para la IA</Text>
            <TextInput
              value={aiInstructions}
              onChangeText={setAiInstructions}
              placeholder="Cuentale a la IA que ejercicios te gustan, que maquinas tienes disponibles, cuanto tiempo tienes, como te sientes y cualquier molestia o preferencia que deba considerar."
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.aiInstructionsInput]}
              multiline
            />
            <Text style={styles.aiInstructionsHint}>
              Esto se guarda con la rutina y se usa como contexto cuando pides sugerencias. Si hay dolor o lesion,
              la IA debe responder con cautela y recomendar apoyo profesional.
            </Text>
            <Text style={styles.label}>Objetivo</Text>
            <View style={styles.optionGrid}>
              {goalOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setGoal(option.value)}
                  style={[styles.optionCard, goal === option.value ? styles.optionActive : null]}
                >
                  <Text style={[styles.optionTitle, goal === option.value ? styles.optionTitleActive : null]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionHelper}>{option.helper}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Duracion</Text>
            <View style={styles.durationCol}>
              {durationOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setDuration(option.value)}
                  style={[styles.durationRow, duration === option.value ? styles.durationActive : null]}
                >
                  <View style={styles.durationText}>
                    <Text style={styles.durationLabel}>{option.label}</Text>
                    <Text style={styles.durationHelper}>{option.helper}</Text>
                  </View>
                  {duration === option.value ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Punto de partida</Text>
            <View style={styles.optionGrid}>
              {experienceOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setExperienceLevel(option.value)}
                  style={[styles.optionCard, experienceLevel === option.value ? styles.optionActive : null]}
                >
                  <Text style={[styles.optionTitle, experienceLevel === option.value ? styles.optionTitleActive : null]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionHelper}>{option.helper}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.aiInstructionsHint}>
              Si estas recien iniciando, la app baja volumen e intensidad para una fase de adaptacion antes de progresar.
            </Text>
            <Text style={styles.label}>Dias por semana</Text>
            <View style={styles.chipsRow}>
              {frequencyOptions.map((value) => (
                <Pressable
                  key={`quick-${value}`}
                  onPress={() => applyFrequency(value)}
                  style={[styles.chip, frequency === value ? styles.chipActive : null]}
                >
                  <Text style={[styles.chipText, frequency === value ? styles.chipTextActive : null]}>
                    {value} dias
                  </Text>
                </Pressable>
              ))}
            </View>
            <AppButton
              label="IA arma mi rutina completa"
              icon={Sparkles}
              loading={aiLoading}
              disabled={loadingExercises}
              onPress={generateCompleteWorkoutWithAi}
            />
          </Card>

          <AIHelperCard
            title="Coach IA para partir mejor"
            subtitle="Pidele una rutina completa. La app la deja como borrador para revisar antes de guardar."
            chips={aiPromptChips}
            onAsk={askAi}
            response={aiResponse}
            loading={aiLoading}
            actions={
              aiResponse && !aiLoading
                ? [
                    {
                      label: "Aplicar rutina sugerida",
                      variant: "primary",
                      onPress: () => applyEvidenceTemplate(4),
                    },
                    { label: "Descartar", variant: "ghost", onPress: () => setAiResponse(null) },
                  ]
                : []
            }
          />
        </View>
      ) : null}

      {step === 2 ? (
        <Card>
          <Text style={styles.sectionTitle}>2. Frecuencia y dias</Text>
          <Text style={styles.label}>Dias por semana</Text>
          <View style={styles.chipsRow}>
            {frequencyOptions.map((value) => (
              <Pressable
                key={value}
                onPress={() => applyFrequency(value)}
                style={[styles.chip, frequency === value ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, frequency === value ? styles.chipTextActive : null]}>
                  {value} dias
                </Text>
              </Pressable>
            ))}
          </View>
          <AppButton
            label="Generar rutina completa sugerida"
            icon={Sparkles}
            variant="secondary"
            onPress={() => applyEvidenceTemplate()}
          />
          <Text style={styles.label}>Nombres de los dias</Text>
          {days.map((day, index) => (
            <View key={day.dayIndex} style={styles.dayNameRow}>
              <Text style={styles.dayNumber}>D{index + 1}</Text>
              <TextInput
                value={day.name}
                onChangeText={(value) => setDayName(index, value)}
                style={[styles.input, styles.dayNameInput]}
                placeholder={`Dia ${index + 1}`}
                placeholderTextColor={colors.muted}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {step === 3 ? (
        <View style={styles.stack}>
          <Text style={styles.sectionTitle}>3. Ejercicios por dia</Text>
          {loadingExercises ? <LoadingState label="Cargando ejercicios..." /> : null}
          {!loadingExercises && exerciseCatalog.length === 0 ? (
            <EmptyState
              title="Sin ejercicios disponibles"
              body="Carga el seed de ejercicios en Supabase para construir tus dias."
            />
          ) : null}

          <Card>
            <Text style={styles.label}>Dia que estas editando</Text>
            <View style={styles.chipsRow}>
              {days.map((day, index) => {
                const active = index === selectedDayIndex;
                return (
                  <Pressable
                    key={day.dayIndex}
                    onPress={() => setSelectedDayIndex(index)}
                    style={[styles.chip, active ? styles.chipActive : null]}
                  >
                    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                      D{index + 1} - {day.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {selectedDay ? (
            <SelectedDayCard
              day={selectedDay}
              onUpdate={updateExercise}
              onRemove={removeExercise}
              onMove={moveExercise}
            />
          ) : null}

          <MuscleMap
            selected={selectedMuscle}
            onSelect={(muscle) => {
              setSelectedMuscle(muscle);
              setBodyPreset("all");
            }}
          />

          <Card>
            <Text style={styles.sectionTitle}>Biblioteca de ejercicios</Text>
            <BodyText style={styles.muted}>
              Ordenada por prioridad practica: compuestos progresables primero, accesorios despues, ejercicios
              situacionales al final.
            </BodyText>
            <View style={styles.chipsRow}>
              {bodyPresetLabels.map((preset) => (
                <Pressable
                  key={preset.value}
                  onPress={() => {
                    setBodyPreset(preset.value);
                    if (preset.value !== "all") setSelectedMuscle("all");
                  }}
                  style={[styles.chip, bodyPreset === preset.value ? styles.chipActive : null]}
                >
                  <Text style={[styles.chipText, bodyPreset === preset.value ? styles.chipTextActive : null]}>
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.searchRow}>
              <Search size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por ejercicio, musculo o equipo"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.exerciseList}>
              {filteredExercises.map((exercise) => {
                const alreadyAdded = Boolean(
                  selectedDay?.exercises.some((entry) => entry.exerciseId === exercise.id),
                );
                return (
                  <ExerciseSuggestionCard
                    key={exercise.id}
                    exercise={exercise}
                    disabled={alreadyAdded}
                    onAdd={() => addExerciseToSelectedDay(exercise)}
                  />
                );
              })}
            </View>
          </Card>
        </View>
      ) : null}

      {step === 4 ? (
        <Card>
          <Text style={styles.sectionTitle}>4. Revisar y guardar</Text>
          <BodyText>
            <Text style={styles.bold}>{name || "Sin nombre"}</Text> - {goalLabel} - {durationLabel}
          </BodyText>
          {aiResponse ? (
            <View style={styles.aiReviewBox}>
              <Text style={styles.aiReviewTitle}>Revision IA</Text>
              <BodyText>{aiResponse}</BodyText>
            </View>
          ) : null}
          {days.map((day, index) => (
            <View key={day.dayIndex} style={styles.reviewDay}>
              <Text style={styles.reviewDayTitle}>
                Dia {index + 1} - {day.name}
              </Text>
              {day.exercises.length === 0 ? (
                <BodyText style={{ color: colors.muted }}>Sin ejercicios.</BodyText>
              ) : (
                day.exercises.map((entry) => (
                  <BodyText key={`${entry.exerciseId}-${entry.orderIndex}`}>
                    {entry.exerciseName}: {entry.targetSets || "?"} series x {entry.targetReps || "?"} reps
                    {entry.restSeconds ? ` - descanso ${entry.restSeconds}s` : ""}
                    {entry.targetWeight ? ` - ${entry.targetWeight} kg` : ""}
                  </BodyText>
                ))
              )}
            </View>
          ))}
          <Pressable onPress={() => setActivateOnSave((current) => !current)} style={styles.activeToggle}>
            <View style={[styles.checkbox, activateOnSave ? styles.checkboxOn : null]}>
              {activateOnSave ? <Check size={14} color={colors.onPrimary} /> : null}
            </View>
            <Text style={styles.activeText}>Marcar como rutina activa al guardar</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label={isEditMode ? "Guardar cambios" : "Guardar rutina"}
            icon={Save}
            loading={saving}
            onPress={() => save(false)}
          />
          <AppButton
            label="Guardar y empezar entrenamiento"
            icon={Sparkles}
            variant="secondary"
            disabled={saving}
            onPress={() => save(true)}
          />
        </Card>
      ) : null}

      <View style={styles.navRow}>
        <Pressable
          disabled={step === 1}
          onPress={() => setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current))}
          style={[styles.navButton, step === 1 ? styles.navDisabled : null]}
        >
          <ArrowLeft size={18} color={step === 1 ? colors.muted : colors.text} />
          <Text style={[styles.navText, step === 1 ? styles.navTextDisabled : null]}>Atras</Text>
        </Pressable>
        {step < 4 ? (
          <Pressable
            disabled={!canAdvanceFromStep(step)}
            onPress={() => setStep((current) => ((current + 1) as WizardStep))}
            style={[styles.navButton, styles.navPrimary, !canAdvanceFromStep(step) ? styles.navDisabled : null]}
          >
            <Text style={[styles.navText, styles.navTextPrimary]}>Siguiente</Text>
            <ArrowRight size={18} color={colors.onPrimary} />
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

function SelectedDayCard({
  day,
  onUpdate,
  onRemove,
  onMove,
}: {
  day: DayDraft;
  onUpdate: (exerciseIndex: number, patch: Partial<DayExerciseDraft>) => void;
  onRemove: (exerciseIndex: number) => void;
  onMove: (exerciseIndex: number, direction: -1 | 1) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card>
      <Text style={styles.dayHeader}>{day.name}</Text>
      {day.exercises.length === 0 ? (
        <BodyText style={styles.muted}>Selecciona un musculo o busca un ejercicio para agregarlo.</BodyText>
      ) : null}
      {day.exercises.map((entry, index) => (
        <View key={`${entry.exerciseId}-${index}`} style={styles.exerciseBox}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseTitleCol}>
              <Text style={styles.exerciseName}>{entry.exerciseName}</Text>
              <Text style={styles.exerciseMeta}>
                Score {entry.score} - {tierLabel(entry.tier)} - {entry.muscles.join(", ")}
              </Text>
            </View>
            <View style={styles.exerciseActions}>
              <Pressable onPress={() => onMove(index, -1)} style={styles.iconBtn}>
                <ChevronUp size={16} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => onMove(index, 1)} style={styles.iconBtn}>
                <ChevronDown size={16} color={colors.text} />
              </Pressable>
              <Pressable onPress={() => onRemove(index)} style={styles.iconBtn}>
                <Trash2 size={16} color={colors.danger} />
              </Pressable>
            </View>
          </View>
          <View style={styles.exerciseInputs}>
            <EditCell label="Series" value={entry.targetSets} numeric onChange={(value) => onUpdate(index, { targetSets: value })} />
            <EditCell label="Reps" value={entry.targetReps} onChange={(value) => onUpdate(index, { targetReps: value })} />
            <EditCell label="Descanso" value={entry.restSeconds} numeric onChange={(value) => onUpdate(index, { restSeconds: value })} />
            <EditCell label="Peso kg" value={entry.targetWeight} numeric onChange={(value) => onUpdate(index, { targetWeight: value })} />
          </View>
          <TextInput
            value={entry.notes}
            onChangeText={(value) => onUpdate(index, { notes: value })}
            placeholder="Notas opcionales"
            placeholderTextColor={colors.muted}
            style={styles.notesInput}
          />
        </View>
      ))}
    </Card>
  );
}

function ExerciseSuggestionCard({
  exercise,
  disabled,
  onAdd,
}: {
  exercise: ExerciseCatalogItem;
  disabled?: boolean;
  onAdd: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.suggestionCard}>
      <View style={styles.suggestionTop}>
        <View style={styles.exerciseTitleCol}>
          <Text style={styles.suggestionName}>{exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise.movementPattern} - {exercise.libraryEquipment}
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{exercise.scienceScore}</Text>
        </View>
      </View>
      <Text style={styles.rationale}>{exercise.rationale}</Text>
      <View style={styles.tagRow}>
        <Text style={styles.tag}>{tierLabel(exercise.tier)}</Text>
        {exercise.muscleGroupIds.slice(0, 3).map((muscle) => (
          <Text key={muscle} style={styles.tag}>
            {muscleLabel(muscle)}
          </Text>
        ))}
      </View>
      <Pressable
        disabled={disabled}
        onPress={onAdd}
        style={[styles.addButton, disabled ? styles.addButtonDisabled : null]}
      >
        {disabled ? <Check size={15} color={colors.muted} /> : <Plus size={15} color={colors.onPrimary} />}
        <Text style={[styles.addButtonText, disabled ? styles.addButtonTextDisabled : null]}>
          {disabled ? "Ya agregado" : "Agregar al dia"}
        </Text>
      </Pressable>
    </View>
  );
}

function EditCell({
  label,
  value,
  numeric,
  onChange,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        style={styles.cellInput}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function StepIndicator({ step }: { step: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const labels = ["Objetivo", "Dias", "Ejercicios", "Guardar"];
  return (
    <View style={styles.stepRow}>
      {labels.map((label, index) => {
        const active = index + 1 === step;
        const done = index + 1 < step;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, active ? styles.stepDotActive : null, done ? styles.stepDotDone : null]}>
              <Text style={[styles.stepDotText, active || done ? styles.stepDotTextActive : null]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, active ? styles.stepLabelActive : null]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function buildDraftDaysFromWorkout(
  workout: WorkoutEditorDetail,
  catalog: ExerciseCatalogItem[],
  goal: GoalValue,
  experienceLevel: ExperienceLevel,
): DayDraft[] {
  return (workout.workoutDays ?? [])
    .slice()
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((day, dayIndex) => ({
      dayIndex,
      name: day.name || `Dia ${dayIndex + 1}`,
      exercises: (day.workoutDayExercises ?? [])
        .slice()
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((entry, exerciseIndex) =>
          createExerciseDraftFromWorkoutEntry(entry, exerciseIndex, catalog, goal, experienceLevel),
        ),
    }));
}

function createExerciseDraftFromWorkoutEntry(
  entry: WorkoutEditorExerciseEntry,
  orderIndex: number,
  catalog: ExerciseCatalogItem[],
  goal: GoalValue,
  experienceLevel: ExperienceLevel,
): DayExerciseDraft {
  const exerciseId = entry.exerciseId ?? entry.exercises?.id ?? "";
  const catalogItem = catalog.find((exercise) => exercise.id === exerciseId);
  const base = catalogItem
    ? createExerciseDraft(catalogItem, orderIndex, goal, experienceLevel)
    : {
        exerciseId,
        exerciseName: entry.exercises?.name ?? "Ejercicio",
        orderIndex,
        targetSets: "",
        targetReps: "",
        restSeconds: "",
        targetWeight: "",
        notes: "",
        score: 45,
        tier: "situacional",
        muscles: [],
      };

  return {
    ...base,
    exerciseId,
    exerciseName: catalogItem?.name ?? entry.exercises?.name ?? base.exerciseName,
    orderIndex,
    targetSets: entry.targetSets == null ? "" : String(entry.targetSets),
    targetReps: entry.targetReps ?? "",
    restSeconds: entry.restSeconds == null ? "" : String(entry.restSeconds),
    targetWeight: entry.targetWeight == null ? "" : String(entry.targetWeight),
    notes: entry.notes ?? "",
  };
}

function buildEmptyDays(frequency: number): DayDraft[] {
  return dayNameTemplates(frequency).map((dayName, index) => ({
    dayIndex: index,
    name: dayName,
    exercises: [],
  }));
}

function buildSuggestedWorkoutDays(
  catalog: ExerciseCatalogItem[],
  frequency: number,
  goal: GoalValue,
  experienceLevel: ExperienceLevel,
): DayDraft[] {
  const templates = dayNameTemplates(frequency);
  const focuses = focusTemplates(frequency);
  const usedByName = new Set<string>();

  return templates.map((dayName, index) => {
    const focus = focuses[index] ?? [];
    const selected = pickExercisesForFocus(catalog, focus, usedByName, frequency >= 5 ? 4 : 5);
    return {
      dayIndex: index,
      name: dayName,
      exercises: selected.map((exercise, exerciseIndex) =>
        createExerciseDraft(exercise, exerciseIndex, goal, experienceLevel),
      ),
    };
  });
}

function pickExercisesForFocus(
  catalog: ExerciseCatalogItem[],
  focus: MuscleGroupId[],
  usedByName: Set<string>,
  count: number,
): ExerciseCatalogItem[] {
  const selected: ExerciseCatalogItem[] = [];
  const candidates = catalog
    .filter((exercise) => focus.some((muscle) => exercise.muscleGroupIds.includes(muscle)))
    .sort((a, b) => b.scienceScore - a.scienceScore);

  for (const exercise of candidates) {
    const key = exercise.normalizedName;
    const patternAlreadyUsed = selected.some((item) => item.movementPattern === exercise.movementPattern);
    if (usedByName.has(key) && selected.length < 3) continue;
    if (patternAlreadyUsed && selected.length < Math.min(3, count)) continue;
    selected.push(exercise);
    usedByName.add(key);
    if (selected.length >= count) break;
  }

  return selected;
}

function createExerciseDraft(
  exercise: ExerciseCatalogItem,
  orderIndex: number,
  goal: GoalValue,
  experienceLevel: ExperienceLevel,
): DayExerciseDraft {
  const strength = goal === "fuerza";
  const endurance = goal === "resistencia";
  const adaptiveStart = experienceLevel === "new" || experienceLevel === "returning";
  const advanced = experienceLevel === "advanced";
  const baseSets = strength && exercise.tier === "principal" ? 4 : exercise.defaultSets;
  const sets = adaptiveStart ? Math.min(3, baseSets) : advanced ? Math.min(5, baseSets + 1) : baseSets;
  const reps = adaptiveStart ? "10-12" : strength ? "4-6" : endurance ? "12-15" : exercise.defaultReps;
  const rest = adaptiveStart
    ? Math.max(90, exercise.defaultRestSeconds)
    : strength
      ? Math.max(120, exercise.defaultRestSeconds)
      : endurance
        ? 60
        : exercise.defaultRestSeconds;
  const safetyNote = adaptiveStart
    ? "Primeras 2 semanas liviano: RPE 6-7, tecnica limpia y 2-3 reps en reserva."
    : "";
  const situationalNote = exercise.tier === "situacional" ? "Usar solo si no genera molestias y la tecnica es solida." : "";

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    orderIndex,
    targetSets: String(sets),
    targetReps: reps,
    restSeconds: String(rest),
    targetWeight: "",
    notes: [safetyNote, situationalNote].filter(Boolean).join(" "),
    score: exercise.scienceScore,
    tier: exercise.tier,
    muscles: exercise.muscleGroupIds.map(muscleLabel),
  };
}

function experienceLabel(level: ExperienceLevel): string {
  return experienceOptions.find((option) => option.value === level)?.label ?? "Intermedio";
}

function goalValueFromLabel(value?: string | null): GoalValue {
  const normalized = value?.trim().toLowerCase();
  return (
    goalOptions.find((option) => option.value === normalized || option.label.toLowerCase() === normalized)
      ?.value ?? "otro"
  );
}

function muscleLabel(id: MuscleGroupId): string {
  return MUSCLE_GROUPS.find((muscle) => muscle.id === id)?.label ?? id;
}

function exerciseMatchesMuscle(exercise: ExerciseCatalogItem, selected: MuscleGroupId | "all"): boolean {
  if (selected === "all") return true;
  if (exercise.muscleGroupIds.includes(selected)) return true;
  const aliases: Partial<Record<MuscleGroupId, MuscleGroupId[]>> = {
    abdomen: ["core"],
    oblicuos: ["core"],
    lumbar: ["espalda", "core"],
    trapecio: ["espalda", "hombros"],
    antebrazos: ["biceps", "espalda"],
    aductores: ["cuadriceps", "gluteos"],
  };
  return (aliases[selected] ?? []).some((muscle) => exercise.muscleGroupIds.includes(muscle));
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

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    stack: { gap: 14 },
    stepRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    stepItem: { flex: 1, alignItems: "center", gap: 4 },
    stepDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
    },
    stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    stepDotDone: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    stepDotText: { color: colors.muted, fontWeight: "900", fontSize: 13 },
    stepDotTextActive: { color: colors.onPrimary },
    stepLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    stepLabelActive: { color: colors.primary },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900", marginBottom: 4 },
    label: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 8 },
    muted: { color: colors.muted },
    input: {
      minHeight: 46,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      color: colors.text,
      fontSize: 15,
    },
    inputMultiline: { minHeight: 74, textAlignVertical: "top", paddingVertical: 10 },
    aiInstructionsInput: { minHeight: 118, textAlignVertical: "top", paddingVertical: 12 },
    aiInstructionsHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    optionGrid: { gap: 8 },
    optionCard: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
      gap: 2,
    },
    optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    optionTitle: { color: colors.text, fontWeight: "900", fontSize: 14 },
    optionTitleActive: { color: colors.primary },
    optionHelper: { color: colors.muted, fontSize: 12, lineHeight: 16 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    chipText: { color: colors.text, fontWeight: "800", fontSize: 13 },
    chipTextActive: { color: colors.onPrimary },
    durationCol: { gap: 8 },
    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
    },
    durationActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    durationText: { flex: 1 },
    durationLabel: { color: colors.text, fontWeight: "900", fontSize: 14 },
    durationHelper: { color: colors.muted, fontSize: 12 },
    dayNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dayNumber: { width: 36, textAlign: "center", color: colors.primary, fontWeight: "900" },
    dayNameInput: { flex: 1 },
    dayHeader: { color: colors.text, fontSize: 16, fontWeight: "900" },
    exerciseBox: {
      gap: 8,
      padding: 10,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
    },
    exerciseHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    exerciseTitleCol: { flex: 1, gap: 2 },
    exerciseName: { color: colors.text, fontWeight: "900", fontSize: 15 },
    exerciseMeta: { color: colors.muted, fontSize: 12, lineHeight: 16 },
    exerciseActions: { flexDirection: "row", gap: 6 },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceMuted,
    },
    exerciseInputs: { flexDirection: "row", gap: 6 },
    cell: { flex: 1, gap: 4 },
    cellLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    cellInput: {
      minHeight: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
    },
    notesInput: {
      minHeight: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      color: colors.text,
      fontSize: 13,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 10,
    },
    searchInput: { flex: 1, minHeight: 42, color: colors.text, fontSize: 14 },
    exerciseList: { gap: 10 },
    suggestionCard: {
      gap: 10,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 12,
    },
    suggestionTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    suggestionName: { color: colors.text, fontSize: 15, fontWeight: "900" },
    scoreBadge: {
      minWidth: 44,
      height: 36,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.energySoft,
      borderWidth: 1,
      borderColor: colors.energy,
    },
    scoreText: { color: colors.energy, fontWeight: "900" },
    rationale: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tag: {
      color: colors.primary,
      fontWeight: "800",
      fontSize: 11,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    addButton: {
      minHeight: 42,
      borderRadius: radius.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
    },
    addButtonDisabled: { backgroundColor: colors.surfaceMuted },
    addButtonText: { color: colors.onPrimary, fontWeight: "900", fontSize: 13 },
    addButtonTextDisabled: { color: colors.muted },
    reviewDay: { gap: 4 },
    reviewDayTitle: { color: colors.text, fontWeight: "900" },
    aiReviewBox: {
      gap: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      padding: 12,
    },
    aiReviewTitle: { color: colors.primary, fontSize: 13, fontWeight: "900" },
    bold: { fontWeight: "900" },
    activeToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundElevated,
    },
    checkboxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
    activeText: { color: colors.text, fontWeight: "800" },
    error: { color: colors.danger, fontSize: 13 },
    navRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 8 },
    navButton: {
      flex: 1,
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
    },
    navPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    navDisabled: { opacity: 0.5 },
    navText: { color: colors.text, fontWeight: "900" },
    navTextDisabled: { color: colors.muted },
    navTextPrimary: { color: colors.onPrimary },
  });
}
