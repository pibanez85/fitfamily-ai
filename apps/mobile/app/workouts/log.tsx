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
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type {
  CreateWorkoutLogInput,
  ExerciseCatalogItem,
  MuscleGroupId,
} from "@fitfamily-ai/shared";
import { MUSCLE_GROUPS } from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import {
  completedSessionSets,
  emptyRestClock,
  parseSessionEffort,
  remainingRestSeconds,
  validStoredSet,
  validateCompletedSet,
  workoutDraftKey,
  type RestClock,
} from "@/lib/workoutSession";
import { api } from "@/services/api";
import { deviceStorage } from "@/services/localStorage";
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
  {
    label: "No tengo maquina",
    prompt: "No tengo esta maquina. Dame una alternativa equivalente para hoy.",
  },
  {
    label: "Baja intensidad",
    prompt: "Estoy cansado. Baja la intensidad de este ejercicio para hoy sin perder el objetivo.",
  },
  {
    label: "Poco tiempo",
    prompt: "Tengo poco tiempo. Resume este ejercicio o dime como hacerlo mas eficiente.",
  },
  {
    label: "Molestia",
    prompt: "Tengo una molestia. Dime que evitar y cuando deberia consultar a un profesional.",
  },
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
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    Number.isFinite(routeDayIndex) ? routeDayIndex : 0,
  );
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogDraft[]>([]);
  const [aiStates, setAiStates] = useState<Record<string, AiExerciseState>>({});
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [effort, setEffort] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restClock, setRestClock] = useState<RestClock>(emptyRestClock);
  const [clockNow, setClockNow] = useState(Date.now());
  const timerSeconds = remainingRestSeconds(restClock, clockNow);
  const timerRunning = restClock.deadline !== null;
  const timerLabel = restClock.label;
  const [defaultRestSeconds, setDefaultRestSeconds] = useState("90");
  const [timerFinished, setTimerFinished] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [draftReady, setDraftReady] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const draftWrites = useRef(Promise.resolve());
  const sessionSaved = useRef(false);
  const saveInFlight = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!workoutId) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setWorkout(null);
    setError(null);
    Promise.all([api.workouts.detail(workoutId), api.workouts.exercises()])
      .then(([workoutData, exerciseCatalog]) => {
        if (!alive) return;
        if (workoutData.profileId !== profileId)
          throw new Error(
            "Esta rutina pertenece a otro perfil. Abre las rutinas de tu perfil actual.",
          );
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
  }, [routeDayIndex, routeWorkoutDayId, workoutId, profileId]);

  const sortedDays = useMemo(() => sortDays(workout?.workoutDays ?? []), [workout]);
  const selectedDay = sortedDays[selectedDayIndex] ?? sortedDays[0];
  const completedExercises = exerciseLogs.filter(
    (exercise) => exercise.sets.length > 0 && exercise.sets.every((set) => set.done),
  ).length;
  const completedSets = exerciseLogs.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.done).length,
    0,
  );
  const draftKey =
    profileId && workoutId && selectedDay
      ? workoutDraftKey(profileId, workoutId, selectedDay.id)
      : null;
  const totalSets = exerciseLogs.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const aiInstructions = useMemo(
    () => extractAiInstructions(workout?.description),
    [workout?.description],
  );

  useEffect(() => {
    if (!selectedDay || !draftKey) {
      setExerciseLogs([]);
      return;
    }
    let alive = true;
    setDraftReady(null);
    setDraftMessage(null);
    sessionSaved.current = false;
    const fresh = buildExerciseLogs(selectedDay, catalog);
    setExerciseLogs(fresh);
    setStartedAt(new Date().toISOString());
    setEffort("");
    setNotes("");
    setRestClock(emptyRestClock);
    setAiStates({});
    setTimerFinished(false);
    void draftWrites.current
      .then(() => deviceStorage.getItem(draftKey))
      .then((stored) => {
        if (!alive || !stored) return;
        const draft = JSON.parse(stored);
        if (
          draft.version !== 1 ||
          !Array.isArray(draft.exercises) ||
          typeof draft.startedAt !== "string" ||
          !Number.isFinite(Date.parse(draft.startedAt))
        )
          return;
        setExerciseLogs(
          fresh.map((exercise) => {
            const saved = draft.exercises.find(
              (entry: { workoutDayExerciseId?: string }) =>
                entry.workoutDayExerciseId === exercise.workoutDayExerciseId,
            );
            return saved &&
              Array.isArray(saved.sets) &&
              saved.sets.length > 0 &&
              saved.sets.every(validStoredSet)
              ? {
                  ...exercise,
                  sets: saved.sets,
                  exerciseNote:
                    typeof saved.exerciseNote === "string"
                      ? saved.exerciseNote
                      : exercise.exerciseNote,
                }
              : exercise;
          }),
        );
        setStartedAt(draft.startedAt);
        setEffort(typeof draft.effort === "string" ? draft.effort : "");
        setNotes(typeof draft.notes === "string" ? draft.notes : "");
        if (
          draft.restClock &&
          (draft.restClock.deadline === null || Number.isFinite(draft.restClock.deadline)) &&
          Number.isFinite(draft.restClock.pausedSeconds)
        ) {
          setRestClock({
            ...draft.restClock,
            label: typeof draft.restClock.label === "string" ? draft.restClock.label : null,
          });
          setClockNow(Date.now());
        }
        setDraftMessage(
          `Borrador recuperado del ${new Date(draft.startedAt).toLocaleDateString("es-CL")}. Puedes continuarlo o empezar de nuevo.`,
        );
      })
      .catch(() => {
        if (alive) setDraftMessage("No pudimos recuperar el borrador local.");
      })
      .finally(() => {
        if (alive) setDraftReady(draftKey);
      });
    return () => {
      alive = false;
    };
  }, [catalog, selectedDay, draftKey]);

  useEffect(() => {
    if (!draftKey || draftReady !== draftKey || sessionSaved.current) return;
    const value = JSON.stringify({
      version: 1,
      startedAt,
      effort,
      notes,
      restClock,
      exercises: exerciseLogs.map(({ workoutDayExerciseId, exerciseNote, sets }) => ({
        workoutDayExerciseId,
        exerciseNote,
        sets,
      })),
    });
    draftWrites.current = draftWrites.current
      .then(() => deviceStorage.setItem(draftKey, value))
      .catch(() =>
        setDraftMessage(
          "No pudimos guardar el borrador en este dispositivo. Mantén la pantalla abierta hasta guardar el entrenamiento.",
        ),
      );
  }, [draftKey, draftReady, startedAt, effort, notes, restClock, exerciseLogs]);

  useEffect(() => {
    if (!timerRunning) return;
    const tick = () => {
      const now = Date.now();
      setClockNow(now);
      if (remainingRestSeconds(restClock, now) === 0) {
        setRestClock((current) => ({ ...current, deadline: null, pausedSeconds: 0 }));
        setTimerFinished(true);
        void notifyRestFinished(timerLabel ?? "Descanso terminado");
      }
    };
    tick();
    const id = setInterval(tick, 500);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") tick();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [restClock, timerLabel, timerRunning]);

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<SetDraft>) {
    // Al completar una serie, el descanso arranca solo con el tiempo
    // configurado para ese ejercicio (visible en el cronometro flotante).
    if (patch.done === true) {
      const exercise = exerciseLogs[exerciseIndex];
      const set = exercise?.sets[setIndex];
      if (exercise && set) {
        const invalid = validateCompletedSet({ ...set, ...patch });
        if (invalid) {
          setError(`${exercise.exerciseName}, serie ${setIndex + 1}: ${invalid}`);
          return;
        }
        setError(null);
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
              sets: exercise.sets.map((set, j) =>
                j === setIndex ? { ...set, ...patch, done: patch.done ?? false } : set,
              ),
            }
          : exercise,
      ),
    );
  }

  function updateExerciseNote(exerciseIndex: number, exerciseNote: string) {
    setExerciseLogs((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, exerciseNote } : exercise,
      ),
    );
  }

  function addSet(exerciseIndex: number) {
    setExerciseLogs((current) =>
      current.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, createSetDraft(exercise.targetRestSeconds)],
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

  function startRest(seconds: number, label: string) {
    const now = Date.now();
    setClockNow(now);
    setRestClock({ deadline: seconds > 0 ? now + seconds * 1000 : null, pausedSeconds: 0, label });
    setTimerFinished(false);
  }

  function extendTimer(seconds: number) {
    startRest(remainingRestSeconds(restClock) + seconds, timerLabel ?? "Descanso");
  }

  function pauseTimer() {
    setRestClock((current) => ({
      ...current,
      pausedSeconds: remainingRestSeconds(current),
      deadline: null,
    }));
  }

  function resetTimer() {
    setRestClock(emptyRestClock);
    setTimerFinished(false);
  }

  function skipTimer() {
    setRestClock(emptyRestClock);
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
          aiInstructions
            ? `Instrucciones personales del usuario: ${aiInstructions}`
            : "Sin instrucciones personales guardadas.",
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
      [exercise.workoutDayExerciseId]: {
        ...current[exercise.workoutDayExerciseId],
        loading: false,
        response: suggestion,
        applied: "today",
      },
    }));
  }

  function confirmApplyPermanent(exerciseIndex: number) {
    const exercise = exerciseLogs[exerciseIndex];
    if (!exercise) return;
    Alert.alert(
      "Guardar consejo como nota",
      "Este consejo se agregará a la descripción de tu rutina. Para reemplazar el ejercicio o cambiar series, abre el editor de rutina.",
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
        [exercise.workoutDayExerciseId]: {
          ...current[exercise.workoutDayExerciseId],
          loading: false,
          response: suggestion,
          applied: "permanent",
        },
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
    if (!profileId || !workout || !selectedDay || saveInFlight.current || draftReady !== draftKey)
      return;
    saveInFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const sets = completedSessionSets(exerciseLogs);
      if (sets.length === 0)
        throw new Error("Marca al menos una serie como realizada antes de guardar.");
      const payload: CreateWorkoutLogInput = {
        startedAt,
        endedAt: new Date().toISOString(),
        perceivedEffort: parseSessionEffort(effort),
        notes: notes.trim() || null,
        workoutId: workout.id,
        workoutDayId: selectedDay.id,
        sets,
      };
      await api.workouts.createLog(profileId, payload);
      sessionSaved.current = true;
      await draftWrites.current;
      if (draftKey) await deviceStorage.removeItem(draftKey).catch(() => undefined);
      router.replace("/workouts/history");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el entrenamiento.");
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  function restartSession() {
    if (!selectedDay) return;
    setExerciseLogs(buildExerciseLogs(selectedDay, catalog));
    setStartedAt(new Date().toISOString());
    setEffort("");
    setNotes("");
    setAiStates({});
    resetTimer();
    setDraftMessage(null);
    setError(null);
  }

  if (loading) {
    return <LoadingState label="Cargando entrenamiento..." />;
  }

  if (!workoutId || !workout) {
    return (
      <Screen>
        <Title>Registrar entrenamiento</Title>
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
            onToggle={() =>
              timerRunning ? pauseTimer() : startRest(timerSeconds, timerLabel ?? "Descanso")
            }
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

      <Pressable
        onPress={() => setShowTimerSettings((current) => !current)}
        style={styles.restButton}
      >
        <Timer size={17} color={colors.primary} />
        <Text style={styles.restButtonText}>
          {showTimerSettings
            ? "Ocultar descanso"
            : "Descanso automático al completar cada serie · Ajustar"}
        </Text>
      </Pressable>
      {showTimerSettings ? (
        <RestTimerCard
          seconds={timerSeconds}
          running={timerRunning}
          label={timerLabel}
          defaultRestSeconds={defaultRestSeconds}
          finished={timerFinished}
          onDefaultRestChange={setDefaultRestSeconds}
          onStart={() =>
            startRest(
              timerSeconds || parseIntOrNull(defaultRestSeconds) || 90,
              timerLabel ?? "Descanso libre",
            )
          }
          onPause={pauseTimer}
          onReset={resetTimer}
          onSkip={skipTimer}
          onPreset={(seconds) => startRest(seconds, "Descanso libre")}
        />
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Dia de rutina</Text>
        <View style={styles.daySelector}>
          {sortedDays.map((day, index) => {
            const active = index === selectedDayIndex;
            return (
              <Pressable
                key={day.id}
                disabled={saving || draftReady !== draftKey}
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
        <Text style={styles.exerciseTarget}>
          {completedSets} de {totalSets} series realizadas · Solo se guardan las marcadas ✓.
        </Text>
        {draftMessage ? <Text style={styles.aiContext}>{draftMessage}</Text> : null}
        {draftMessage?.startsWith("Borrador recuperado") ? (
          <AppButton label="Empezar sesión nueva" variant="secondary" onPress={restartSession} />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      {exerciseLogs.length === 0 ? (
        <Card>
          <EmptyState
            title="Este dia no tiene ejercicios"
            body="Vuelve a editar la rutina o crea una nueva con ejercicios para este dia."
          />
        </Card>
      ) : null}

      {draftReady !== draftKey ? (
        <LoadingState label="Recuperando tu sesión..." />
      ) : (
        exerciseLogs.map((exercise, exerciseIndex) => (
          <ExerciseLogCard
            key={exercise.workoutDayExerciseId}
            exercise={exercise}
            exerciseIndex={exerciseIndex}
            aiState={aiStates[exercise.workoutDayExerciseId]}
            onUpdateSet={updateSet}
            onUpdateExerciseNote={updateExerciseNote}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onStartRest={startRest}
            onAskAi={askExerciseAi}
            onApplyToday={applyAiForToday}
            onApplyPermanent={confirmApplyPermanent}
          />
        ))
      )}

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
        <AppButton
          label={`Finalizar · Guardar ${completedSets} series`}
          icon={Save}
          loading={saving}
          disabled={draftReady !== draftKey || completedSets === 0}
          onPress={save}
        />
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
          <Text style={styles.heroBadgeText}>
            {completedExercises}/{exerciseCount}
          </Text>
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

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Dumbbell;
  value: string;
  label: string;
}) {
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
          {finished ? (
            <Bell size={20} color={colors.onPrimary} />
          ) : (
            <Timer size={20} color={colors.onPrimary} />
          )}
        </View>
        <View style={styles.timerTextCol}>
          <Text style={styles.timerTitle}>
            {finished ? "Descanso terminado" : "Cronometro de descanso"}
          </Text>
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
          {running ? (
            <Pause size={18} color={colors.text} />
          ) : (
            <Play size={18} color={colors.text} />
          )}
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
        {finished ? (
          <Bell size={18} color={colors.onPrimary} />
        ) : (
          <Timer size={18} color={colors.onPrimary} />
        )}
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
            {running ? (
              <Pause size={17} color={colors.text} />
            ) : (
              <Play size={17} color={colors.text} />
            )}
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

  onStartRest: (seconds: number, label: string) => void;
  onAskAi: (exerciseIndex: number, prompt: string) => void;
  onApplyToday: (exerciseIndex: number) => void;
  onApplyPermanent: (exerciseIndex: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const done = exercise.sets.filter((set) => set.done).length;
  return (
    <Card
      style={[styles.exerciseCard, done === exercise.sets.length ? styles.exerciseCardDone : null]}
    >
      <View style={styles.exerciseHeader}>
        <View
          style={[
            styles.exerciseNumber,
            done === exercise.sets.length ? styles.exerciseNumberDone : null,
          ]}
        >
          <Text style={styles.exerciseNumberText}>{exerciseIndex + 1}</Text>
        </View>
        <View style={styles.exerciseTitleCol}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseTarget}>
            {exercise.targetSets} series × {exercise.targetReps} · {exercise.targetRestSeconds}s
            descanso
          </Text>
        </View>
        <Text style={styles.heroBadgeText}>
          {done}/{exercise.sets.length}
        </Text>
      </View>
      {exercise.plannedNotes ? (
        <Text style={styles.exerciseTarget}>{exercise.plannedNotes}</Text>
      ) : null}
      <View style={styles.seriesTableHeader}>
        <Text style={styles.seriesNumber}>SERIE</Text>
        <Text style={styles.seriesColumn}>KG</Text>
        <Text style={styles.seriesColumn}>REPS</Text>
        <Text style={styles.seriesCheckLabel}>HECHA</Text>
      </View>
      {exercise.sets.map((set, setIndex) => (
        <View
          key={`${exercise.workoutDayExerciseId}-${setIndex}`}
          style={[styles.seriesRow, set.done ? styles.setBoxDone : null]}
        >
          <Text style={styles.seriesNumber}>{setIndex + 1}</Text>
          <TextInput
            accessibilityLabel={`${exercise.exerciseName}, serie ${setIndex + 1}, kilos`}
            value={set.weight}
            onChangeText={(weight) => onUpdateSet(exerciseIndex, setIndex, { weight })}
            keyboardType="decimal-pad"
            placeholder={exercise.targetWeight || "—"}
            placeholderTextColor={colors.muted}
            style={styles.seriesInput}
          />
          <TextInput
            accessibilityLabel={`${exercise.exerciseName}, serie ${setIndex + 1}, repeticiones`}
            value={set.reps}
            onChangeText={(reps) => onUpdateSet(exerciseIndex, setIndex, { reps })}
            keyboardType="number-pad"
            placeholder={exercise.targetReps}
            placeholderTextColor={colors.muted}
            style={styles.seriesInput}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: set.done }}
            accessibilityLabel={`Completar ${exercise.exerciseName}, serie ${setIndex + 1}`}
            onPress={() => onUpdateSet(exerciseIndex, setIndex, { done: !set.done })}
            style={[styles.seriesCheck, set.done ? styles.completeButtonOn : null]}
          >
            <CheckCircle2 size={23} color={set.done ? colors.onPrimary : colors.muted} />
          </Pressable>
        </View>
      ))}
      <View style={styles.setActions}>
        <Pressable
          accessibilityLabel={`Añadir serie a ${exercise.exerciseName}`}
          onPress={() => onAddSet(exerciseIndex)}
          style={styles.setAction}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.setActionText}>Serie</Text>
        </Pressable>
        {exercise.sets.length > 1 && !exercise.sets[exercise.sets.length - 1]?.done ? (
          <Pressable onPress={() => onRemoveSet(exerciseIndex)} style={styles.setAction}>
            <Minus size={16} color={colors.primary} />
            <Text style={styles.setActionText}>Quitar última</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setDetailsOpen((current) => !current)} style={styles.setAction}>
          <Text style={styles.setActionText}>{detailsOpen ? "Menos" : "Detalles"}</Text>
        </Pressable>
      </View>
      {detailsOpen ? (
        <View style={styles.detailStack}>
          <Text style={styles.exerciseTarget}>
            {exercise.primaryMuscles.join(", ")} · {exercise.equipment}
          </Text>
          <AppButton
            label="Ver técnica del ejercicio"
            icon={Eye}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/exercises/[exerciseId]",
                params: {
                  exerciseId: exercise.exerciseId,
                  exerciseName: exercise.exerciseName,
                  returnTo: "workout-log",
                },
              })
            }
          />
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setBox}>
              <Text style={styles.label}>Serie {setIndex + 1} · datos opcionales</Text>
              <View style={styles.setInputs}>
                <SetInput
                  label="RPE 0–10"
                  value={set.rpe}
                  onChange={(rpe) => onUpdateSet(exerciseIndex, setIndex, { rpe })}
                />
                <SetInput
                  label="Descanso (s)"
                  value={set.restSeconds}
                  onChange={(restSeconds) => onUpdateSet(exerciseIndex, setIndex, { restSeconds })}
                />
              </View>
              <TextInput
                value={set.notes}
                onChangeText={(notes) => onUpdateSet(exerciseIndex, setIndex, { notes })}
                placeholder="Nota de esta serie"
                placeholderTextColor={colors.muted}
                style={styles.setNotes}
              />
            </View>
          ))}
          <TextInput
            value={exercise.exerciseNote}
            onChangeText={(note) => onUpdateExerciseNote(exerciseIndex, note)}
            placeholder="Notas del ejercicio"
            placeholderTextColor={colors.muted}
            style={styles.exerciseNotes}
            multiline
          />
          <AppButton
            label={`Descansar ${exercise.targetRestSeconds}s`}
            icon={Timer}
            variant="secondary"
            onPress={() => onStartRest(exercise.targetRestSeconds, exercise.exerciseName)}
          />
        </View>
      ) : null}
      <Pressable onPress={() => setAiOpen((current) => !current)} style={styles.aiDisclosure}>
        <Sparkles size={16} color={colors.primary} />
        <Text style={styles.toolButtonText}>
          {aiOpen ? "Cerrar ayuda IA" : "Necesito un ajuste o una alternativa"}
        </Text>
      </Pressable>
      {aiOpen ? (
        <View style={styles.detailStack}>
          <View style={styles.aiQuickGrid}>
            {quickAiActions.map((action) => (
              <Pressable
                key={action.label}
                disabled={aiState?.loading}
                onPress={() => onAskAi(exerciseIndex, action.prompt)}
                style={styles.aiQuickChip}
              >
                <Text style={styles.aiQuickText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="Escribe exactamente qué necesitas cambiar"
            placeholderTextColor={colors.muted}
            style={styles.exerciseNotes}
            multiline
          />
          <AppButton
            label="Consultar ajuste"
            icon={Bot}
            loading={aiState?.loading ?? false}
            disabled={!customPrompt.trim()}
            onPress={() => onAskAi(exerciseIndex, customPrompt.trim())}
          />
          {aiState?.error ? <Text style={styles.error}>{aiState.error}</Text> : null}
          {aiState?.response ? (
            <View style={styles.aiBox}>
              <Text style={styles.aiResponse}>{aiState.response}</Text>
              <Text style={styles.exerciseTarget}>
                Guardar el consejo añade una nota. Para cambiar ejercicios o series, abre el editor.
              </Text>
              <AppButton
                label="Guardar consejo en esta sesión"
                variant="secondary"
                onPress={() => onApplyToday(exerciseIndex)}
              />
              <AppButton
                label="Guardar consejo en la rutina"
                variant="secondary"
                onPress={() => onApplyPermanent(exerciseIndex)}
              />
              <AppButton
                label="Abrir editor de rutina"
                variant="ghost"
                onPress={() => router.push("/workouts")}
              />
              {aiState.applied ? (
                <Text style={styles.appliedText}>
                  Consejo guardado como nota{" "}
                  {aiState.applied === "today" ? "de esta sesión" : "de la rutina"}.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
function SetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
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

function findInitialDayIndex(
  days: WorkoutDayDetail[],
  workoutDayId?: string,
  dayIndex?: number,
): number {
  const byId = workoutDayId ? days.findIndex((day) => day.id === workoutDayId) : -1;
  if (byId >= 0) return byId;
  if (
    Number.isFinite(dayIndex) &&
    dayIndex !== undefined &&
    dayIndex >= 0 &&
    dayIndex < days.length
  ) {
    return dayIndex;
  }
  return 0;
}

function buildExerciseLogs(
  day: WorkoutDayDetail,
  catalog: ExerciseCatalogItem[],
): ExerciseLogDraft[] {
  return (day.workoutDayExercises ?? []).map((entry) => {
    const name = entry.exercises?.name ?? "Ejercicio";
    const exerciseId =
      entry.exerciseId ?? entry.exercises?.id ?? findExerciseIdByName(catalog, name);
    const catalogItem =
      catalog.find((exercise) => exercise.id === exerciseId) ?? findExerciseByName(catalog, name);
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
      secondaryMuscles: entry.exercises?.secondaryMuscles?.length
        ? entry.exercises.secondaryMuscles
        : inferSecondaryMuscles(catalogItem),
      equipment: catalogItem?.libraryEquipment ?? entry.exercises?.equipment ?? "Variable",
      tier: catalogItem?.tier ?? "situacional",
      scienceScore: catalogItem?.scienceScore ?? 45,
      plannedNotes: entry.notes ?? "",
      exerciseNote: entry.notes ?? "",

      sets: Array.from({ length: targetSets }, () => createSetDraft(targetRestSeconds)),
    };
  });
}

function createSetDraft(restSeconds: number): SetDraft {
  return {
    reps: "",
    weight: "",
    rpe: "",
    restSeconds: String(restSeconds),
    notes: "",
    done: false,
  };
}

function findExerciseIdByName(catalog: ExerciseCatalogItem[], name: string): string {
  return findExerciseByName(catalog, name)?.id ?? "";
}

function findExerciseByName(
  catalog: ExerciseCatalogItem[],
  name: string,
): ExerciseCatalogItem | undefined {
  const normalized = name.toLowerCase().trim();
  return catalog.find((exercise) => exercise.name.toLowerCase().trim() === normalized);
}

function muscleIdsFromText(values?: string[]): MuscleGroupId[] {
  if (!values) return [];
  return values
    .map((value) => value.toLowerCase())
    .map(
      (value) =>
        MUSCLE_GROUPS.find((muscle) => muscle.id === value || muscle.label.toLowerCase() === value)
          ?.id,
    )
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
  return (
    description
      .slice(index + marker.length)
      .split("\nDuracion:")[0]
      ?.trim() ?? ""
  );
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
    detailStack: { gap: 10 },
    aiDisclosure: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
    seriesTableHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    seriesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    seriesNumber: {
      width: 40,
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
    },
    seriesColumn: {
      flex: 1,
      textAlign: "center",
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
    },
    seriesCheckLabel: {
      width: 48,
      textAlign: "center",
      color: colors.muted,
      fontSize: 10,
      fontWeight: "800",
    },
    seriesInput: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      borderRadius: 10,
      backgroundColor: colors.backgroundElevated,
      color: colors.text,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "800",
      borderWidth: 1,
      borderColor: colors.border,
    },
    seriesCheck: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
    label: { color: colors.muted, fontSize: 12, fontWeight: "800", marginBottom: 5 },
    heroCard: { gap: 14, backgroundColor: colors.backgroundElevated },
    heroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
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
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
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
    floatingTimerValue: {
      color: colors.text,
      fontSize: 19,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
    },
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
    setHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
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
    aiApplySecondary: {
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.primary,
    },
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
