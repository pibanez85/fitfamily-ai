import { router, useLocalSearchParams } from "expo-router";
import type { ScrollView } from "react-native";
import {
  Bell,
  Bot,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Eye,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateWorkoutLogInput, ExerciseCatalogItem, MuscleGroupId } from "@fitfamily-ai/shared";
import { MUSCLE_GROUPS } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { notifyRestFinished } from "@/services/restTimerFeedback";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type WorkoutDetail = {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  workoutDays?: WorkoutDayDetail[];
};

type WorkoutDayDetail = {
  id: string;
  name: string;
  dayIndex: number;
  workoutDayExercises?: WorkoutDayExerciseDetail[];
};

type WorkoutDayExerciseDetail = {
  id: string;
  exerciseId?: string;
  targetSets?: number | null;
  targetReps?: string | null;
  restSeconds?: number | null;
  targetWeight?: number | null;
  notes?: string | null;
  exercises?: {
    id?: string;
    name?: string;
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string | null;
    instructions?: string | null;
    safetyNotes?: string | null;
  } | null;
};

type ExerciseLogDraft = {
  workoutDayExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetRestSeconds: number;
  targetWeight: string;
  primaryMuscleIds: MuscleGroupId[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  tier: string;
  scienceScore: number;
  plannedNotes: string;
  exerciseNote: string;
  completed: boolean;
  sets: SetDraft[];
};

type SetDraft = {
  reps: string;
  weight: string;
  rpe: string;
  restSeconds: string;
  notes: string;
  done: boolean;
};

type AiExerciseState = {
  loading: boolean;
  response?: string;
  applied?: "today" | "permanent";
  error?: string;
};

const quickAiActions = [
  { label: "No tengo maquina", prompt: "No tengo esta maquina. Dame una alternativa equivalente para hoy." },
  { label: "Baja intensidad", prompt: "Estoy cansado. Baja la intensidad de este ejercicio para hoy sin perder el objetivo." },
  { label: "Poco tiempo", prompt: "Tengo poco tiempo. Resume este ejercicio o dime como hacerlo mas eficiente." },
  { label: "Molestia", prompt: "Tengo una molestia. Dime que evitar y cuando deberia consultar a un profesional." },
  { label: "Con mancuernas", prompt: "Reemplaza este ejercicio por una opcion con mancuernas." },
];

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function WorkoutLogScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    workoutId?: string;
    workoutDayId?: string;
    dayIndex?: string;
  }>();
  const profileId = useActiveProfileId();
  const activeWorkoutId = useAppStore((state) => state.getActiveWorkoutId(profileId));
  const routeWorkoutId = normalizeParam(params.workoutId);
  const routeWorkoutDayId = normalizeParam(params.workoutDayId);
  const routeDayIndex = Number(normalizeParam(params.dayIndex) ?? "0");
  const workoutId = routeWorkoutId || activeWorkoutId;

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(Number.isFinite(routeDayIndex) ? routeDayIndex : 0);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogDraft[]>([]);
  const [aiStates, setAiStates] = useState<Record<string, AiExerciseState>>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [effort, setEffort] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLabel, setTimerLabel] = useState<string | null>(null);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState("90");
  const [timerFinished, setTimerFinished] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!workoutId) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    Promise.all([api.workouts.detail(workoutId), api.workouts.exercises()])
      .then(([workoutData, exerciseCatalog]) => {
        if (!alive) return;
        const detail = workoutData as unknown as WorkoutDetail;
        const sortedDays = sortDays(detail.workoutDays ?? []);
        const initialIndex = findInitialDayIndex(sortedDays, routeWorkoutDayId, routeDayIndex);
        setWorkout(detail);
        setCatalog(exerciseCatalog);
        setSelectedDayIndex(initialIndex);
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : "No pude cargar la rutina.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [routeDayIndex, routeWorkoutDayId, workoutId]);

  const sortedDays = useMemo(() => sortDays(workout?.workoutDays ?? []), [workout]);
  const selectedDay = sortedDays[selectedDayIndex] ?? sortedDays[0];
  const completedExercises = exerciseLogs.filter((exercise) => exercise.completed).length;
  const totalSets = exerciseLogs.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const aiInstructions = useMemo(() => extractAiInstructions(workout?.description), [workout?.description]);

  useEffect(() => {
    if (!selectedDay) {
      setExerciseLogs([]);
      return;
    }
    setExerciseLogs(buildExerciseLogs(selectedDay, catalog));
    setAiStates({});
    setTimerFinished(false);
  }, [catalog, selectedDay]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          setTimerFinished(true);
          void notifyRestFinished(timerLabel ?? "Descanso terminado");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerLabel, timerRunning]);

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<SetDraft>) {
    // Al completar una serie, el descanso arranca solo con el tiempo
    // configurado para ese ejercicio (visible en el cronometro flotante).
    if (patch.done === true) {
      const exercise = exerciseLogs[exerciseIndex];
      const set = exercise?.sets[setIndex];
      if (exercise && set) {
        startRest(
          parseIntOrNull(set.restSeconds) ?? exercise.targetRestSeconds,
          `${exercise.exerciseName} - serie ${setIndex + 1}`,
        );
      }
    }
    setExerciseLogs((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) => (j === setIndex ? { ...set, ...patch } : set)),
            }
          : exercise,
      ),
    );
  }

  function updateExerciseNote(exerciseIndex: number, exerciseNote: string) {
    setExerciseLogs((current) =>
      current.map((exercise, i) => (i === exerciseIndex ? { ...exercise, exerciseNote } : exercise)),
    );
  }

  function addSet(exerciseIndex: number) {
    setExerciseLogs((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, createSetDraft(exercise.targetReps, exercise.targetWeight, exercise.targetRestSeconds)],
            }
          : exercise,
      ),
    );
  }

  function removeSet(exerciseIndex: number) {
    setExerciseLogs((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex && exercise.sets.length > 1
          ? { ...exercise, sets: exercise.sets.slice(0, -1) }
          : exercise,
      ),
    );
  }

  function completeExercise(exerciseIndex: number) {
    setExerciseLogs((current) =>
      current.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const nextCompleted = !exercise.completed;
        return {
          ...exercise,
          completed: nextCompleted,
          sets: exercise.sets.map((set) => ({ ...set, done: nextCompleted ? true : set.done })),
        };
      }),
    );
  }

  function startRest(seconds: number, label: string) {
    setTimerSeconds(seconds);
    setTimerLabel(label);
    setTimerRunning(seconds > 0);
    setTimerFinished(false);
  }

  function extendTimer(seconds: number) {
    setTimerSeconds((current) => current + seconds);
    setTimerFinished(false);
    setTimerRunning(true);
  }

  function pauseTimer() {
    setTimerRunning(false);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerLabel(null);
    setTimerFinished(false);
  }

  function skipTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerFinished(true);
    void notifyRestFinished("Descanso saltado manualmente");
  }

  async function askExerciseAi(exerciseIndex: number, userPrompt: string) {
    if (!profileId || !workout || !selectedDay) return;
    const exercise = exerciseLogs[exerciseIndex];
    if (!exercise) return;
    setAiStates((current) => ({
      ...current,
      [exercise.workoutDayExerciseId]: { loading: true },
    }));
    try {
      const result = await api.ai.chat(
        profileId,
        [
          "Actua como coach de entrenamiento seguro, claro y practico.",
          `Rutina: ${workout.name}. Objetivo: ${workout.goal ?? "no definido"}. Dia: ${selectedDay.name}.`,
          aiInstructions ? `Instrucciones personales del usuario: ${aiInstructions}` : "Sin instrucciones personales guardadas.",
          `Ejercicio actual: ${exercise.exerciseName}. Musculos: ${exercise.primaryMuscles.join(", ")}. Equipo: ${exercise.equipment}.`,
          `Plan: ${exercise.targetSets} series x ${exercise.targetReps}, descanso ${exercise.targetRestSeconds}s.`,
          `Solicitud del usuario: ${userPrompt}`,
          "Entrega una sugerencia concreta. Diferencia ajuste solo por hoy vs cambio permanente. No diagnostiques. Si hay dolor, lesion o sintomas preocupantes, recomienda profesional.",
        ].join("\n"),
      );
      setAiStates((current) => ({
        ...current,
        [exercise.workoutDayExerciseId]: { loading: false, response: result.message.content },
      }));
    } catch (caught) {
      setAiStates((current) => ({
        ...current,
        [exercise.workoutDayExerciseId]: {
          loading: false,
          error: caught instanceof Error ? caught.message : "No pude consultar a la IA.",
        },
      }));
    }
  }

  function applyAiForToday(exerciseIndex: number) {
    const exercise = exerciseLogs[exerciseIndex];
    if (!exercise) return;
    const suggestion = aiStates[exercise.workoutDayExerciseId]?.response;
    if (!suggestion) return;
    const note = `Ajuste IA solo por hoy: ${compactText(suggestion, 420)}`;
    updateExerciseNote(exerciseIndex, appendNote(exercise.exerciseNote, note));
    setAiStates((current) => ({
      ...current,
      [exercise.workoutDayExerciseId]: { ...current[exercise.workoutDayExerciseId], loading: false, response: suggestion, applied: "today" },
    }));
  }

  function confirmApplyPermanent(exerciseIndex: number) {
    const exercise = exerciseLogs[exerciseIndex];
    if (!exercise) return;
    Alert.alert(
      "Aplicar a rutina base",
      "Guardare la sugerencia como nota permanente dentro de la descripcion de esta rutina. No reemplaza automaticamente el ejercicio hasta que editemos el constructor completo.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aplicar", onPress: () => void applyAiPermanently(exerciseIndex) },
      ],
    );
  }

  async function applyAiPermanently(exerciseIndex: number) {
    const exercise = exerciseLogs[exerciseIndex];
    if (!workout || !exercise) return;
    const suggestion = aiStates[exercise.workoutDayExerciseId]?.response;
    if (!suggestion) return;
    const permanentNote = [
      "Ajuste IA para rutina base:",
      `${exercise.exerciseName}: ${compactText(suggestion, 520)}`,
    ].join("\n");
    const nextDescription = compactText(appendNote(workout.description ?? "", permanentNote), 1900);
    try {
      await api.workouts.update(workout.id, { description: nextDescription });
      setWorkout({ ...workout, description: nextDescription });
      setAiStates((current) => ({
        ...current,
        [exercise.workoutDayExerciseId]: { ...current[exercise.workoutDayExerciseId], loading: false, response: suggestion, applied: "permanent" },
      }));
    } catch (caught) {
      setAiStates((current) => ({
        ...current,
        [exercise.workoutDayExerciseId]: {
          ...current[exercise.workoutDayExerciseId],
          loading: false,
          response: suggestion,
          error: caught instanceof Error ? caught.message : "No pude guardar el ajuste permanente.",
        },
      }));
    }
  }

  async function save() {
    if (!profileId || !workout || !selectedDay) return;

    const sets = exerciseLogs.flatMap((exercise) =>
      exercise.sets
        .map((set, index) => ({
          exercise,
          set,
          index,
        }))
        .filter(({ set }) => set.done || set.reps.trim() || set.weight.trim() || set.rpe.trim())
        .map(({ exercise, set, index }) => ({
          exerciseId: exercise.exerciseId,
          setIndex: index + 1,
          reps: parseIntOrNull(set.reps),
          weight: parseFloatOrNull(set.weight),
          rpe: parseFloatOrNull(set.rpe),
          restSeconds: parseIntOrNull(set.restSeconds),
          notes: appendNote(set.notes.trim(), exercise.exerciseNote.trim()) || null,
        })),
    );

    if (sets.some((set) => !set.exerciseId)) {
      setError("Hay un ejercicio sin ID valido. Vuelve a crear la rutina desde el catalogo actualizado.");
      return;
    }

    if (sets.length === 0) {
      setError("Registra al menos una serie antes de guardar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateWorkoutLogInput = {
        startedAt,
        endedAt: new Date().toISOString(),
        perceivedEffort: parseIntOrNull(effort),
        notes: notes.trim() || null,
        workoutId: workout.id,
        workoutDayId: selectedDay.id,
        sets,
      };
      await api.workouts.createLog(profileId, payload);
      router.replace("/workouts/history");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el entrenamiento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Cargando entrenamiento..." />;
  }

  if (!workoutId || !workout) {
    return (
      <Screen>
        <Title>Registrar entrenamiento</Title>
        <Card>
          <EmptyState
            title="No hay rutina activa"
            body="Marca una rutina como activa o entra a una rutina y elige el dia que vas a registrar."
          />
          <AppButton label="Ir a rutinas" icon={Play} onPress={() => router.push("/workouts")} />
        </Card>
      </Screen>
    );
  }

  const timerVisible = timerRunning || timerSeconds > 0 || timerFinished;

  return (
    <Screen
      scrollRef={scrollRef}
      overlay={
        timerVisible ? (
          <FloatingRestTimer
            seconds={timerSeconds}
            running={timerRunning}
            finished={timerFinished}
            label={timerLabel}
            onToggle={() => setTimerRunning((current) => (timerSeconds > 0 ? !current : false))}
            onExtend={() => extendTimer(30)}
            onDismiss={resetTimer}
          />
        ) : null
      }
    >
      <Title>Entrenar hoy</Title>
      <Subtitle>
        {workout.name}
        {selectedDay ? ` - ${selectedDay.name}` : ""}
      </Subtitle>

      <WorkoutSessionHero
        workout={workout}
        selectedDay={selectedDay}
        exerciseCount={exerciseLogs.length}
        totalSets={totalSets}
        completedExercises={completedExercises}
      />

      <RestTimerCard
        seconds={timerSeconds}
        running={timerRunning}
        label={timerLabel}
        defaultRestSeconds={defaultRestSeconds}
        finished={timerFinished}
        onDefaultRestChange={setDefaultRestSeconds}
        onStart={() => setTimerRunning(timerSeconds > 0)}
        onPause={pauseTimer}
        onReset={resetTimer}
        onSkip={skipTimer}
        onPreset={(seconds) => startRest(seconds, "Descanso libre")}
      />

      <Card>
        <Text style={styles.sectionTitle}>Dia de rutina</Text>
        <View style={styles.daySelector}>
          {sortedDays.map((day, index) => {
            const active = index === selectedDayIndex;
            return (
              <Pressable
                key={day.id}
                onPress={() => setSelectedDayIndex(index)}
                style={[styles.dayChip, active ? styles.dayChipActive : null]}
              >
                <Text style={[styles.dayChipText, active ? styles.dayChipTextActive : null]}>
                  D{index + 1} - {day.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {aiInstructions ? <Text style={styles.aiContext}>IA considera: {aiInstructions}</Text> : null}
      </Card>

      {exerciseLogs.length === 0 ? (
        <Card>
          <EmptyState
            title="Este dia no tiene ejercicios"
            body="Vuelve a editar la rutina o crea una nueva con ejercicios para este dia."
          />
        </Card>
      ) : null}

      {exerciseLogs.map((exercise, exerciseIndex) => (
        <ExerciseLogCard
          key={exercise.workoutDayExerciseId}
          exercise={exercise}
          exerciseIndex={exerciseIndex}
          aiState={aiStates[exercise.workoutDayExerciseId]}
          onUpdateSet={updateSet}
          onUpdateExerciseNote={updateExerciseNote}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onComplete={completeExercise}
          onStartRest={startRest}
          onAskAi={askExerciseAi}
          onApplyToday={applyAiForToday}
          onApplyPermanent={confirmApplyPermanent}
        />
      ))}

      <Card>
        <Text style={styles.sectionTitle}>Cierre del entrenamiento</Text>
        <View style={styles.finishGrid}>
          <View style={styles.finishCell}>
            <Text style={styles.label}>Esfuerzo general 1-10</Text>
            <TextInput
              value={effort}
              onChangeText={setEffort}
              keyboardType="numeric"
              placeholder="7"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        </View>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Como te sentiste, molestias, energia, ajustes..."
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.notes]}
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Guardar entrenamiento" icon={Save} loading={saving} onPress={save} />
      </Card>
    </Screen>
  );
}

function WorkoutSessionHero({
  workout,
  selectedDay,
  exerciseCount,
  totalSets,
  completedExercises,
}: {
  workout: WorkoutDetail;
  selectedDay: WorkoutDayDetail | undefined;
  exerciseCount: number;
  totalSets: number;
  completedExercises: number;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <View>
          <Text style={styles.heroLabel}>{workout.goal ?? "Rutina activa"}</Text>
          <Text style={styles.heroTitle}>{selectedDay?.name ?? workout.name}</Text>
          <Text style={styles.heroSubtitle}>Registra tus series sin distracciones.</Text>
        </View>
        <View style={styles.heroBadge}>
          <Zap size={16} color={colors.energy} />
          <Text style={styles.heroBadgeText}>{completedExercises}/{exerciseCount}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatTile icon={Dumbbell} value={String(exerciseCount)} label="Ejercicios" />
        <StatTile icon={Timer} value={String(totalSets)} label="Series" />
        <StatTile icon={CheckCircle2} value={String(completedExercises)} label="Completados" />
      </View>
    </Card>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.statTile}>
      <Icon size={17} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RestTimerCard({
  seconds,
  running,
  label,
  defaultRestSeconds,
  finished,
  onDefaultRestChange,
  onStart,
  onPause,
  onReset,
  onSkip,
  onPreset,
}: {
  seconds: number;
  running: boolean;
  label: string | null;
  defaultRestSeconds: string;
  finished: boolean;
  onDefaultRestChange: (value: string) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onPreset: (seconds: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const customSeconds = parseIntOrNull(defaultRestSeconds) ?? 90;
  return (
    <Card style={[styles.timerCard, finished ? styles.timerCardDone : null]}>
      <View style={styles.timerHeader}>
        <View style={styles.timerIcon}>
          {finished ? <Bell size={20} color={colors.onPrimary} /> : <Timer size={20} color={colors.onPrimary} />}
        </View>
        <View style={styles.timerTextCol}>
          <Text style={styles.timerTitle}>{finished ? "Descanso terminado" : "Cronometro de descanso"}</Text>
          <Text style={styles.timerSubtitle}>{label ?? "Configurable por ejercicio o serie"}</Text>
        </View>
        <View style={styles.defaultRestBox}>
          <Text style={styles.defaultRestLabel}>Base</Text>
          <TextInput
            value={defaultRestSeconds}
            onChangeText={onDefaultRestChange}
            keyboardType="numeric"
            placeholder="90"
            placeholderTextColor={colors.muted}
            style={styles.defaultRestInput}
          />
        </View>
      </View>
      <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
      <View style={styles.timerControls}>
        <Pressable onPress={running ? onPause : onStart} style={styles.timerButton}>
          {running ? <Pause size={18} color={colors.text} /> : <Play size={18} color={colors.text} />}
          <Text style={styles.timerButtonText}>{running ? "Pausar" : "Iniciar"}</Text>
        </Pressable>
        <Pressable onPress={onReset} style={styles.timerButton}>
          <RotateCcw size={18} color={colors.text} />
          <Text style={styles.timerButtonText}>Reiniciar</Text>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.timerButton}>
          <CheckCircle2 size={18} color={colors.text} />
          <Text style={styles.timerButtonText}>Saltar</Text>
        </Pressable>
      </View>
      <View style={styles.presetRow}>
        {[60, 90, 120, 180, customSeconds].filter(uniqueNumbers).map((preset) => (
          <Pressable key={preset} onPress={() => onPreset(preset)} style={styles.presetPill}>
            <Clock3 size={14} color={colors.primary} />
            <Text style={styles.presetText}>{preset}s</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

// Chip flotante: mantiene el descanso a la vista aunque el usuario este
// registrando el ultimo ejercicio de una pantalla larga.
function FloatingRestTimer({
  seconds,
  running,
  finished,
  label,
  onToggle,
  onExtend,
  onDismiss,
}: {
  seconds: number;
  running: boolean;
  finished: boolean;
  label: string | null;
  onToggle: () => void;
  onExtend: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.floatingTimer, finished ? styles.floatingTimerDone : null]}>
      <View style={styles.floatingTimerIcon}>
        {finished ? <Bell size={18} color={colors.onPrimary} /> : <Timer size={18} color={colors.onPrimary} />}
      </View>
      <View style={styles.floatingTimerTextCol}>
        <Text style={styles.floatingTimerValue}>{finished ? "¡Listo!" : formatTime(seconds)}</Text>
        {label ? (
          <Text style={styles.floatingTimerLabel} numberOfLines={1}>
            {finished ? "Siguiente serie" : label}
          </Text>
        ) : null}
      </View>
      {finished ? null : (
        <>
          <Pressable onPress={onToggle} hitSlop={6} style={styles.floatingTimerButton}>
            {running ? <Pause size={17} color={colors.text} /> : <Play size={17} color={colors.text} />}
          </Pressable>
          <Pressable onPress={onExtend} hitSlop={6} style={styles.floatingTimerButton}>
            <Text style={styles.floatingTimerExtend}>+30s</Text>
          </Pressable>
        </>
      )}
      <Pressable onPress={onDismiss} hitSlop={6} style={styles.floatingTimerButton}>
        <CheckCircle2 size={17} color={finished ? colors.energy : colors.text} />
      </Pressable>
    </View>
  );
}

function ExerciseLogCard({
  exercise,
  exerciseIndex,
  aiState,
  onUpdateSet,
  onUpdateExerciseNote,
  onAddSet,
  onRemoveSet,
  onComplete,
  onStartRest,
  onAskAi,
  onApplyToday,
  onApplyPermanent,
}: {
  exercise: ExerciseLogDraft;
  exerciseIndex: number;
  aiState: AiExerciseState | undefined;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<SetDraft>) => void;
  onUpdateExerciseNote: (exerciseIndex: number, note: string) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number) => void;
  onComplete: (exerciseIndex: number) => void;
  onStartRest: (seconds: number, label: string) => void;
  onAskAi: (exerciseIndex: number, prompt: string) => void;
  onApplyToday: (exerciseIndex: number) => void;
  onApplyPermanent: (exerciseIndex: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (exercise.completed) {
    return (
      <Card style={styles.exerciseCollapsedCard}>
        <Pressable onPress={() => onComplete(exerciseIndex)} style={styles.exerciseCollapsedRow}>
          <View style={[styles.exerciseNumber, styles.exerciseNumberDone]}>
            <Text style={styles.exerciseNumberText}>{exerciseIndex + 1}</Text>
          </View>
          <Text style={styles.exerciseCollapsedName}>{exercise.exerciseName}</Text>
          <View style={styles.exerciseCollapsedCheck}>
            <CheckCircle2 size={20} color={colors.onPrimary} />
          </View>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card style={[styles.exerciseCard, exercise.completed ? styles.exerciseCardDone : null]}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseNumber}>
          <Text style={styles.exerciseNumberText}>{exerciseIndex + 1}</Text>
        </View>
        <View style={styles.exerciseTitleCol}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseTarget}>
            {exercise.primaryMuscles.join(", ") || "General"} - {exercise.equipment}
          </Text>
        </View>
        <Pressable onPress={() => onComplete(exerciseIndex)} style={[styles.completeButton, exercise.completed ? styles.completeButtonOn : null]}>
          <CheckCircle2 size={19} color={exercise.completed ? colors.onPrimary : colors.text} />
        </Pressable>
      </View>

      <View style={styles.planGrid}>
        <PlanPill label="Plan" value={`${exercise.targetSets} x ${exercise.targetReps || "reps"}`} />
        <PlanPill label="Peso" value={exercise.targetWeight ? `${exercise.targetWeight} kg` : "Libre"} />
        <PlanPill label="RPE" value="0-10" />
        <PlanPill label="Descanso" value={`${exercise.targetRestSeconds} seg`} />
      </View>

      <View style={styles.exerciseActionsRow}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/exercises/[exerciseId]",
              params: { exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseName, returnTo: "workout-log" },
            })
          }
          style={styles.toolButton}
        >
          <Eye size={16} color={colors.primary} />
          <Text style={styles.toolButtonText}>Detalle</Text>
        </Pressable>
        <Pressable
          onPress={() => onAskAi(exerciseIndex, "Dame una alternativa equivalente y segura para este ejercicio.")}
          style={styles.toolButton}
        >
          <Bot size={16} color={colors.primary} />
          <Text style={styles.toolButtonText}>IA alternativa</Text>
        </Pressable>
      </View>

      {exercise.sets.map((set, setIndex) => (
        <View
          key={`${exercise.workoutDayExerciseId}-${setIndex}`}
          style={[styles.setBox, set.done ? styles.setBoxDone : null]}
        >
          {set.done ? (
            <Pressable
              onPress={() => onUpdateSet(exerciseIndex, setIndex, { done: !set.done })}
              style={styles.setCollapsedRow}
            >
              <View style={styles.setCollapsedIcon}>
                <CheckCircle2 size={18} color={colors.onPrimary} />
              </View>
              <Text style={styles.setCollapsedTitle}>Serie {setIndex + 1} completada</Text>
              <Text style={styles.setCollapsedMeta}>
                {set.reps || "-"} reps{set.weight ? ` - ${set.weight} kg` : ""}{set.rpe ? ` - RPE ${set.rpe}` : ""}
              </Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.setHeader}>
                <Pressable
                  onPress={() => onUpdateSet(exerciseIndex, setIndex, { done: !set.done })}
                  style={styles.doneButton}
                >
                  <CheckCircle2 size={17} color={colors.muted} />
                  <Text style={styles.doneText}>Serie {setIndex + 1}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    onStartRest(Number(set.restSeconds) || exercise.targetRestSeconds, `${exercise.exerciseName} - serie ${setIndex + 1}`)
                  }
                  style={styles.restButton}
                >
                  <Timer size={15} color={colors.primary} />
                  <Text style={styles.restButtonText}>Descanso</Text>
                </Pressable>
              </View>
              <View style={styles.setInputs}>
                <SetInput label="Reps" value={set.reps} onChange={(value) => onUpdateSet(exerciseIndex, setIndex, { reps: value })} />
                <SetInput label="Kg" value={set.weight} onChange={(value) => onUpdateSet(exerciseIndex, setIndex, { weight: value })} />
                <SetInput label="RPE" value={set.rpe} onChange={(value) => onUpdateSet(exerciseIndex, setIndex, { rpe: value })} />
                <SetInput label="Desc." value={set.restSeconds} onChange={(value) => onUpdateSet(exerciseIndex, setIndex, { restSeconds: value })} />
              </View>
              <TextInput
                value={set.notes}
                onChangeText={(value) => onUpdateSet(exerciseIndex, setIndex, { notes: value })}
                placeholder="Nota de esta serie"
                placeholderTextColor={colors.muted}
                style={styles.setNotes}
              />
            </>
          )}
        </View>
      ))}

      <View style={styles.setActions}>
        <Pressable onPress={() => onAddSet(exerciseIndex)} style={styles.setAction}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.setActionText}>Agregar serie</Text>
        </Pressable>
        <Pressable onPress={() => onRemoveSet(exerciseIndex)} style={styles.setAction}>
          <Minus size={16} color={colors.primary} />
          <Text style={styles.setActionText}>Quitar ultima</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Notas del ejercicio</Text>
      <TextInput
        value={exercise.exerciseNote}
        onChangeText={(value) => onUpdateExerciseNote(exerciseIndex, value)}
        placeholder="Ajustes de hoy, molestias, cambio temporal..."
        placeholderTextColor={colors.muted}
        style={styles.exerciseNotes}
        multiline
      />

      <View style={styles.aiQuickGrid}>
        {quickAiActions.map((action) => (
          <Pressable key={action.label} onPress={() => onAskAi(exerciseIndex, action.prompt)} style={styles.aiQuickChip}>
            <Sparkles size={13} color={colors.energy} />
            <Text style={styles.aiQuickText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {aiState?.loading ? <LoadingState label="La IA esta revisando este ejercicio..." /> : null}
      {aiState?.error ? <Text style={styles.error}>{aiState.error}</Text> : null}
      {aiState?.response ? (
        <View style={styles.aiBox}>
          <Text style={styles.aiTitle}>Sugerencia IA</Text>
          <Text style={styles.aiResponse}>{aiState.response}</Text>
          <View style={styles.aiApplyRow}>
            <Pressable onPress={() => onApplyToday(exerciseIndex)} style={styles.aiApplyButton}>
              <RefreshCcw size={15} color={colors.onPrimary} />
              <Text style={styles.aiApplyText}>Solo por hoy</Text>
            </Pressable>
            <Pressable onPress={() => onApplyPermanent(exerciseIndex)} style={[styles.aiApplyButton, styles.aiApplySecondary]}>
              <Save size={15} color={colors.primary} />
              <Text style={[styles.aiApplyText, styles.aiApplyTextSecondary]}>Rutina base</Text>
            </Pressable>
          </View>
          {aiState.applied ? (
            <Text style={styles.appliedText}>
              Aplicado: {aiState.applied === "today" ? "solo en este entrenamiento" : "nota permanente en la rutina"}.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function PlanPill({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.planPill}>
      <Text style={styles.planLabel}>{label}</Text>
      <Text style={styles.planValue}>{value}</Text>
    </View>
  );
}

function SetInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.setInputCell}>
      <Text style={styles.setInputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="-"
        placeholderTextColor={colors.muted}
        style={styles.setInput}
      />
    </View>
  );
}

function sortDays(days: WorkoutDayDetail[]): WorkoutDayDetail[] {
  return days.slice().sort((a, b) => a.dayIndex - b.dayIndex);
}

function findInitialDayIndex(days: WorkoutDayDetail[], workoutDayId?: string, dayIndex?: number): number {
  const byId = workoutDayId ? days.findIndex((day) => day.id === workoutDayId) : -1;
  if (byId >= 0) return byId;
  if (Number.isFinite(dayIndex) && dayIndex !== undefined && dayIndex >= 0 && dayIndex < days.length) {
    return dayIndex;
  }
  return 0;
}

function buildExerciseLogs(day: WorkoutDayDetail, catalog: ExerciseCatalogItem[]): ExerciseLogDraft[] {
  return (day.workoutDayExercises ?? []).map((entry) => {
    const name = entry.exercises?.name ?? "Ejercicio";
    const exerciseId = entry.exerciseId ?? entry.exercises?.id ?? findExerciseIdByName(catalog, name);
    const catalogItem = catalog.find((exercise) => exercise.id === exerciseId) ?? findExerciseByName(catalog, name);
    const targetSets = Math.max(1, entry.targetSets ?? catalogItem?.defaultSets ?? 3);
    const targetReps = entry.targetReps ?? catalogItem?.defaultReps ?? "8-10";
    const targetRestSeconds = entry.restSeconds ?? catalogItem?.defaultRestSeconds ?? 90;
    const targetWeight = entry.targetWeight ? String(entry.targetWeight) : "";
    const primaryMuscleIds = catalogItem?.muscleGroupIds.length
      ? catalogItem.muscleGroupIds
      : muscleIdsFromText(entry.exercises?.primaryMuscles);
    return {
      workoutDayExerciseId: entry.id,
      exerciseId,
      exerciseName: name,
      targetSets,
      targetReps,
      targetRestSeconds,
      targetWeight,
      primaryMuscleIds,
      primaryMuscles: labelMuscles(primaryMuscleIds),
      secondaryMuscles:
        entry.exercises?.secondaryMuscles?.length
          ? entry.exercises.secondaryMuscles
          : inferSecondaryMuscles(catalogItem),
      equipment: catalogItem?.libraryEquipment ?? entry.exercises?.equipment ?? "Variable",
      tier: catalogItem?.tier ?? "situacional",
      scienceScore: catalogItem?.scienceScore ?? 45,
      plannedNotes: entry.notes ?? "",
      exerciseNote: entry.notes ?? "",
      completed: false,
      sets: Array.from({ length: targetSets }, () => createSetDraft(targetReps, targetWeight, targetRestSeconds)),
    };
  });
}

function createSetDraft(targetReps: string, targetWeight: string, restSeconds: number): SetDraft {
  return {
    reps: inferReps(targetReps),
    weight: targetWeight,
    rpe: "",
    restSeconds: String(restSeconds),
    notes: "",
    done: false,
  };
}

function inferReps(targetReps: string): string {
  const match = targetReps.match(/\d+/);
  return match?.[0] ?? "";
}

function findExerciseIdByName(catalog: ExerciseCatalogItem[], name: string): string {
  return findExerciseByName(catalog, name)?.id ?? "";
}

function findExerciseByName(catalog: ExerciseCatalogItem[], name: string): ExerciseCatalogItem | undefined {
  const normalized = name.toLowerCase().trim();
  return catalog.find((exercise) => exercise.name.toLowerCase().trim() === normalized);
}

function muscleIdsFromText(values?: string[]): MuscleGroupId[] {
  if (!values) return [];
  return values
    .map((value) => value.toLowerCase())
    .map((value) => MUSCLE_GROUPS.find((muscle) => muscle.id === value || muscle.label.toLowerCase() === value)?.id)
    .filter((value): value is MuscleGroupId => Boolean(value));
}

function labelMuscles(ids: MuscleGroupId[]): string[] {
  return ids.map((id) => MUSCLE_GROUPS.find((muscle) => muscle.id === id)?.label ?? id);
}

function inferSecondaryMuscles(exercise?: ExerciseCatalogItem): string[] {
  if (!exercise) return [];
  if (exercise.muscleGroupIds.includes("pecho")) return ["Triceps", "Hombros"];
  if (exercise.muscleGroupIds.includes("espalda")) return ["Biceps", "Trapecio"];
  if (exercise.muscleGroupIds.includes("cuadriceps")) return ["Gluteos", "Core"];
  if (exercise.muscleGroupIds.includes("gluteos")) return ["Isquios", "Lumbar"];
  if (exercise.muscleGroupIds.includes("hombros")) return ["Trapecio", "Triceps"];
  return [];
}

function extractAiInstructions(description?: string | null): string {
  if (!description) return "";
  const marker = "Instrucciones personales para IA:";
  const index = description.indexOf(marker);
  if (index < 0) return "";
  return description.slice(index + marker.length).split("\nDuracion:")[0]?.trim() ?? "";
}

function appendNote(current: string, addition: string): string {
  const cleanCurrent = current.trim();
  const cleanAddition = addition.trim();
  if (!cleanCurrent) return cleanAddition;
  if (!cleanAddition) return cleanCurrent;
  return `${cleanCurrent}\n${cleanAddition}`;
}

function compactText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function uniqueNumbers(value: number, index: number, array: number[]): boolean {
  return Number.isFinite(value) && value > 0 && array.indexOf(value) === index;
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

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rest}`;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
    label: { color: colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 5 },
    heroCard: { gap: 14, backgroundColor: colors.backgroundElevated },
    heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    heroLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
    heroTitle: { color: colors.text, fontSize: 26, fontWeight: "900", marginTop: 3 },
    heroSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    heroBadgeText: { color: colors.text, fontWeight: "900" },
    statsRow: { flexDirection: "row", gap: 8 },
    statTile: {
      flex: 1,
      minHeight: 72,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    statValue: { color: colors.text, fontSize: 20, fontWeight: "900" },
    statLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    floatingTimer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 8,
    },
    floatingTimerDone: { borderColor: colors.energy, backgroundColor: colors.energySoft },
    floatingTimerIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    floatingTimerTextCol: { flex: 1, gap: 1 },
    floatingTimerValue: { color: colors.text, fontSize: 19, fontWeight: "900", fontVariant: ["tabular-nums"] },
    floatingTimerLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
    floatingTimerButton: {
      minWidth: 38,
      minHeight: 38,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    floatingTimerExtend: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    timerCard: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    timerCardDone: { borderColor: colors.energy, backgroundColor: colors.energySoft },
    timerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    timerIcon: {
      width: 42,
      height: 42,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    timerTextCol: { flex: 1 },
    timerTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
    timerSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
    defaultRestBox: { width: 66, gap: 3 },
    defaultRestLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textAlign: "center" },
    defaultRestInput: {
      minHeight: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      color: colors.text,
      textAlign: "center",
      fontWeight: "900",
      paddingHorizontal: 6,
    },
    timerValue: {
      color: colors.text,
      fontSize: 44,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 0,
    },
    timerControls: { flexDirection: "row", gap: 8 },
    timerButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    timerButtonText: { color: colors.text, fontWeight: "900", fontSize: 12 },
    presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    presetPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: colors.backgroundElevated,
    },
    presetText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    daySelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dayChip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dayChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    dayChipText: { color: colors.text, fontWeight: "800", fontSize: 12 },
    dayChipTextActive: { color: colors.onPrimary },
    aiContext: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundElevated,
      padding: 10,
    },
    exerciseCard: { gap: 12, backgroundColor: colors.surface },
    exerciseCardDone: { borderColor: colors.success },
    exerciseCollapsedCard: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.backgroundElevated,
      borderColor: colors.success,
    },
    exerciseCollapsedRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    exerciseCollapsedName: {
      flex: 1,
      color: colors.text,
      fontSize: 17,
      fontWeight: "900",
    },
    exerciseCollapsedCheck: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success,
    },
    exerciseHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    exerciseNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.energy,
    },
    exerciseNumberDone: { backgroundColor: colors.success },
    exerciseNumberText: { color: colors.onPrimary, fontWeight: "900" },
    exerciseTitleCol: { flex: 1, gap: 2 },
    exerciseName: { color: colors.text, fontSize: 18, fontWeight: "900" },
    exerciseTarget: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
    completeButton: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    completeButtonOn: { backgroundColor: colors.success, borderColor: colors.success },
    planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    planPill: {
      flexGrow: 1,
      minWidth: "45%",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 10,
      gap: 2,
    },
    planLabel: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    planValue: { color: colors.text, fontSize: 14, fontWeight: "900" },
    exerciseActionsRow: { flexDirection: "row", gap: 8 },
    toolButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.backgroundElevated,
    },
    toolButtonText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    setBox: {
      gap: 8,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      padding: 10,
    },
    setBoxDone: {
      borderColor: colors.success,
      backgroundColor: colors.surface,
      paddingVertical: 8,
    },
    setCollapsedRow: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    setCollapsedIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success,
    },
    setCollapsedTitle: {
      flex: 1,
      color: colors.text,
      fontWeight: "900",
      fontSize: 13.5,
    },
    setCollapsedMeta: {
      color: colors.muted,
      fontWeight: "800",
      fontSize: 12,
    },
    setHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
    doneButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: colors.surface,
    },
    doneButtonActive: { borderColor: colors.success, backgroundColor: colors.success },
    doneText: { color: colors.text, fontWeight: "900", fontSize: 12 },
    doneTextActive: { color: colors.onPrimary },
    restButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    restButtonText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    setInputs: { flexDirection: "row", gap: 6 },
    setInputCell: { flex: 1, gap: 4 },
    setInputLabel: { color: colors.muted, fontSize: 10.5, fontWeight: "800", textAlign: "center" },
    setInput: {
      minHeight: 42,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: "900",
      textAlign: "center",
      paddingHorizontal: 6,
    },
    setNotes: {
      minHeight: 38,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      paddingHorizontal: 10,
    },
    setActions: { flexDirection: "row", gap: 8 },
    setAction: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    setActionText: { color: colors.primary, fontWeight: "900", fontSize: 12 },
    exerciseNotes: {
      minHeight: 68,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      textAlignVertical: "top",
    },
    aiQuickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    aiQuickChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    aiQuickText: { color: colors.text, fontWeight: "800", fontSize: 11 },
    aiBox: {
      gap: 9,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      padding: 12,
    },
    aiTitle: { color: colors.text, fontWeight: "900", fontSize: 15 },
    aiResponse: { color: colors.text, fontSize: 13.5, lineHeight: 19 },
    aiApplyRow: { flexDirection: "row", gap: 8 },
    aiApplyButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    aiApplySecondary: { backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.primary },
    aiApplyText: { color: colors.onPrimary, fontWeight: "900", fontSize: 12 },
    aiApplyTextSecondary: { color: colors.primary },
    appliedText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
    finishGrid: { flexDirection: "row", gap: 8 },
    finishCell: { flex: 1 },
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
    notes: { minHeight: 76, paddingVertical: 10, textAlignVertical: "top" },
    error: { color: colors.danger, fontSize: 13 },
  });
}
