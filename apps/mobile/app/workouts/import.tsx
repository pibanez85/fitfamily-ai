import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Check, ChevronDown, ChevronUp, FileText, Import } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  buildDefinitionRoutine,
  DEFINITION_ROUTINE,
  DEFINITION_ROUTINE_CATALOG_ADDITIONS,
  isDefinitionRoutine,
  normalizeExerciseName,
  type ExerciseCatalogItem,
  type Workout,
} from "@fitfamily-ai/shared";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { radius, type ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

export default function ImportDefinitionRoutineScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profileName = useAppStore(
    (state) => state.profiles.find((profile) => profile.id === profileId)?.displayName,
  );
  const [catalog, setCatalog] = useState<ExerciseCatalogItem[]>([]);
  const [existing, setExisting] = useState<Workout | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [unilateralSets, setUnilateralSets] = useState<2 | 3>(3);
  const [expandedDay, setExpandedDay] = useState<string | null>("lunes");
  const [reviewed, setReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setCatalog([]);
      setExisting(null);
      setChoices({});
      setUnilateralSets(3);
      setReviewed(false);
      setError(null);
      setLoading(true);
      if (!profileId)
        return () => {
          alive = false;
        };
      void Promise.all([api.workouts.exercises(), api.workouts.list(profileId)])
        .then(([exercises, workouts]) => {
          if (!alive) return;
          setCatalog(exercises);
          setExisting(workouts.find(isDefinitionRoutine) ?? null);
        })
        .catch((caught: unknown) => {
          if (alive)
            setError(
              caught instanceof Error ? caught.message : "No pudimos preparar la vista previa.",
            );
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId, reload]),
  );

  const options = useMemo(
    () => ({ exerciseChoices: choices, unilateralSets }),
    [choices, unilateralSets],
  );
  const preview = useMemo(() => buildDefinitionRoutine(catalog, options), [catalog, options]);
  const addableNames = new Set(
    DEFINITION_ROUTINE_CATALOG_ADDITIONS.map((exercise) => exercise.name),
  );
  const unavailable = preview.missingExercises.filter((name) => !addableNames.has(name));
  const canImport =
    !loading && catalog.length > 0 && unavailable.length === 0 && preview.issues.length === 0;

  function openRoutine(workout: Workout, targetProfile: string) {
    if (useAppStore.getState().activeProfileId !== targetProfile) return;
    useAppStore.getState().setActiveWorkout(targetProfile, workout.id);
    router.replace(`/workouts/${workout.id}`);
  }

  async function importRoutine() {
    if (!profileId || savingRef.current) return;
    if (existing) {
      openRoutine(existing, profileId);
      return;
    }
    if (!reviewed || !canImport) return;
    const targetProfile = profileId;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      // Recheck before a retry or a second visit to avoid copying an existing import.
      const workouts = await api.workouts.list(targetProfile);
      if (useAppStore.getState().activeProfileId !== targetProfile) return;
      const previous = workouts.find(isDefinitionRoutine);
      if (previous) {
        setExisting(previous);
        openRoutine(previous, targetProfile);
        return;
      }
      // The explicit import button is the first action that can add catalog records.
      const preparedCatalog = preview.missingExercises.length
        ? await api.workouts.prepareDefinitionRoutine()
        : catalog;
      if (useAppStore.getState().activeProfileId !== targetProfile) return;
      setCatalog(preparedCatalog);
      const prepared = buildDefinitionRoutine(preparedCatalog, options);
      if (!prepared.workout)
        throw new Error(
          [
            ...prepared.issues,
            prepared.missingExercises.length
              ? `Faltan ejercicios: ${prepared.missingExercises.join(", ")}.`
              : "",
          ]
            .filter(Boolean)
            .join(" "),
        );
      const created = await api.workouts.create(targetProfile, prepared.workout);
      if (useAppStore.getState().activeProfileId !== targetProfile) return;
      setExisting(created);
      openRoutine(created, targetProfile);
    } catch (caught) {
      if (useAppStore.getState().activeProfileId === targetProfile) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No pudimos importar la rutina. Puedes volver a intentarlo.",
        );
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Screen>
      <AppButton
        label="Mis rutinas"
        icon={ArrowLeft}
        variant="ghost"
        onPress={() => router.back()}
      />
      <View style={styles.source}>
        <FileText size={16} color={colors.primary} />
        <Text style={styles.eyebrow}>DESDE TU PDF</Text>
      </View>
      <Title>Tu rutina, lista para entrenar.</Title>
      <Subtitle>5 días · 39 ejercicios · Prioridad brazos y hombros</Subtitle>
      <Card style={styles.summary}>
        <Text style={styles.cardTitle}>Una semana con estructura</Text>
        <BodyText>{DEFINITION_ROUTINE.goal}</BodyText>
        <View style={styles.week}>
          {DEFINITION_ROUTINE.weeklySchedule.map((day) => (
            <View key={day.weekday} style={styles.weekRow}>
              <Text style={[styles.weekday, !day.training && styles.restText]}>{day.weekday}</Text>
              <Text style={[styles.session, !day.training && styles.restText]}>{day.session}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.helper}>
          RIR 1-2 en todas las series: termina con 1-2 repeticiones en reserva. Mantuvimos la prensa
          unilateral y el trabajo posterior sin peso muerto rumano.
        </Text>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? (
        <Card>
          <Text style={styles.error}>{error}</Text>
          <AppButton
            label="Volver a cargar"
            variant="secondary"
            disabled={saving}
            onPress={() => setReload((value) => value + 1)}
          />
        </Card>
      ) : null}
      {existing ? (
        <Card style={styles.summary}>
          <Text style={styles.cardTitle}>Esta rutina ya está en {profileName ?? "tu perfil"}</Text>
          <BodyText>
            Tu copia y sus cambios se conservan. Puedes abrirla y seguir entrenando.
          </BodyText>
          <AppButton label="Abrir mi rutina" icon={Check} onPress={() => void importRoutine()} />
        </Card>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Revisa tus cinco sesiones</Text>
            <Text style={styles.helper}>
              El PDF ofrece alternativas y deja algunas variantes abiertas. Aquí puedes elegir las
              que usas.
            </Text>
          </View>
          {DEFINITION_ROUTINE.days.map((day) => {
            const expanded = expandedDay === day.key;
            return (
              <Card key={day.key}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setExpandedDay(expanded ? null : day.key)}
                  style={styles.dayHeader}
                >
                  <View style={styles.flex}>
                    <Text style={styles.eyebrow}>{day.weekday.toUpperCase()}</Text>
                    <Text style={styles.cardTitle}>{day.name}</Text>
                    <Text style={styles.helper}>{day.exercises.length} ejercicios</Text>
                  </View>
                  {expanded ? (
                    <ChevronUp color={colors.primary} size={22} />
                  ) : (
                    <ChevronDown color={colors.primary} size={22} />
                  )}
                </Pressable>
                {expanded ? (
                  <>
                    <BodyText>{day.introduction}</BodyText>
                    {day.exercises.map((exercise, index) => {
                      const selected = choices[exercise.key] ?? exercise.catalogNames[0]!;
                      const ranged = exercise.sets[0] !== exercise.sets[1];
                      const sets = ranged ? unilateralSets : exercise.sets[0];
                      return (
                        <View key={exercise.key} style={styles.exercise}>
                          <View style={styles.exerciseTitle}>
                            <Text style={styles.index}>{String(index + 1).padStart(2, "0")}</Text>
                            <Text style={styles.exerciseName}>{exercise.sourceName}</Text>
                          </View>
                          <Text style={styles.prescription}>
                            {sets} series × {exercise.reps} · RIR {exercise.rir}
                          </Text>
                          {ranged ? (
                            <>
                              <Text style={styles.helper}>
                                Tu PDF indica 2-3 series por pierna.
                              </Text>
                              <View style={styles.chips}>
                                {([2, 3] as const).map((count) => (
                                  <Pressable
                                    key={count}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: unilateralSets === count }}
                                    disabled={saving}
                                    onPress={() => {
                                      setUnilateralSets(count);
                                      setReviewed(false);
                                    }}
                                    style={[
                                      styles.chip,
                                      unilateralSets === count && styles.selectedChip,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.chipText,
                                        unilateralSets === count && styles.selectedText,
                                      ]}
                                    >
                                      {count} series
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </>
                          ) : null}
                          {exercise.choiceReason ? (
                            <>
                              <Text style={styles.helper}>{exercise.choiceReason}</Text>
                              <View style={styles.chips}>
                                {exercise.catalogNames.map((name) => {
                                  const available = catalog.some(
                                    (item) =>
                                      normalizeExerciseName(item.name) ===
                                      normalizeExerciseName(name),
                                  );
                                  return (
                                    <Pressable
                                      key={name}
                                      accessibilityRole="radio"
                                      accessibilityState={{
                                        checked: selected === name,
                                        disabled: !available || saving,
                                      }}
                                      disabled={!available || saving}
                                      onPress={() => {
                                        setChoices((current) => ({
                                          ...current,
                                          [exercise.key]: name,
                                        }));
                                        setReviewed(false);
                                      }}
                                      style={[
                                        styles.chip,
                                        selected === name && styles.selectedChip,
                                        !available && styles.unavailable,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.chipText,
                                          selected === name && styles.selectedText,
                                        ]}
                                      >
                                        {name}
                                        {!available && !loading ? " · no disponible" : ""}
                                      </Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </>
                          ) : normalizeExerciseName(selected) !==
                            normalizeExerciseName(exercise.sourceName) ? (
                            <Text style={styles.helper}>En tu catálogo: {selected}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                    <Text style={styles.guidance}>{day.guidance}</Text>
                  </>
                ) : null}
              </Card>
            );
          })}
          <Card>
            <Text style={styles.cardTitle}>Antes de empezar</Text>
            <BodyText>
              Sin cargas ni descansos inventados: tu PDF no los fija. Podrás ajustarlos al entrenar.
            </BodyText>
            <Text style={styles.helper}>{DEFINITION_ROUTINE.principles[2]}</Text>
            <Text style={styles.helper}>{DEFINITION_ROUTINE.sourceGuidelines[2]}</Text>
            {!loading && preview.missingExercises.some((name) => addableNames.has(name)) ? (
              <Text style={styles.helper}>
                Al importar se añadirán al catálogo las variantes de tu PDF que faltan:{" "}
                {preview.missingExercises.filter((name) => addableNames.has(name)).join(", ")}.
              </Text>
            ) : null}
            {!loading && unavailable.length ? (
              <Text style={styles.error}>
                Faltan ejercicios en tu catálogo: {unavailable.join(", ")}. Revisa que esté cargado
                el catálogo completo.
              </Text>
            ) : null}
            {!loading && preview.issues.length ? (
              <Text style={styles.error}>{preview.issues.join(" ")}</Text>
            ) : null}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: reviewed }}
              disabled={saving || loading}
              onPress={() => setReviewed((value) => !value)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, reviewed && styles.checked]}>
                {reviewed ? <Check size={17} color={colors.onPrimary} /> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                He revisado las variantes y las series para mi rutina.
              </Text>
            </Pressable>
            <AppButton
              label={`Importar para ${profileName ?? "mi perfil"}`}
              icon={Import}
              loading={saving}
              disabled={!reviewed || !canImport}
              onPress={() => void importRoutine()}
            />
            <Text style={styles.helper}>
              Se guardará como tu rutina activa. Cada entrenamiento quedará separado en el
              historial.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    source: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
    summary: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
    cardTitle: { color: colors.text, fontWeight: "800", fontSize: 19, lineHeight: 26 },
    helper: { color: colors.muted, fontSize: 13, lineHeight: 20 },
    week: { gap: 9, paddingVertical: 8 },
    weekRow: { flexDirection: "row", gap: 12 },
    weekday: { color: colors.text, width: 90, fontWeight: "700", fontSize: 13 },
    session: { color: colors.text, flex: 1, fontSize: 13 },
    restText: { color: colors.muted },
    sectionHeader: { gap: 5, paddingTop: 10 },
    dayHeader: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 65 },
    flex: { flex: 1, gap: 4 },
    exercise: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 9 },
    exerciseTitle: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    index: { color: colors.primary, fontWeight: "800", fontSize: 13, lineHeight: 22 },
    exerciseName: { color: colors.text, fontWeight: "700", fontSize: 15, lineHeight: 22, flex: 1 },
    prescription: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 44,
      justifyContent: "center",
    },
    selectedChip: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
    selectedText: { color: colors.primaryDark },
    unavailable: { opacity: 0.5 },
    guidance: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 21,
      backgroundColor: colors.surfaceMuted,
      padding: 14,
      borderRadius: radius.sm,
    },
    checkboxRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
    checkbox: {
      width: 25,
      height: 25,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: { backgroundColor: colors.primary },
    checkboxLabel: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1, fontWeight: "600" },
    error: { color: colors.danger, fontSize: 13, lineHeight: 20 },
  });
}
