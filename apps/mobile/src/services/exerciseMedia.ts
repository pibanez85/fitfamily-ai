import { normalizeExerciseName } from "@fitfamily-ai/shared";

export type ExerciseMedia = {
  kind: "gif";
  uri: string;
  provider: "ExerciseDB Free";
  sourceName: string;
  attribution: string;
  licenseNote: string;
  productionReady: false;
};

const EXERCISE_DB_FREE_ATTRIBUTION =
  "Media de prueba por ExerciseDB Free / AscendAPI. Uso no comercial, con atribucion requerida.";

const EXERCISE_DB_FREE_LICENSE_NOTE =
  "Solo para prototipo y pruebas internas. Reemplazar por videos propios o licencia comercial antes de produccion.";

const exercisedbFreeMediaByName: Record<string, Omit<ExerciseMedia, "provider" | "attribution" | "licenseNote" | "productionReady">> = {
  [normalizeExerciseName("Press de banca")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    sourceName: "barbell bench press",
  },
  [normalizeExerciseName("Press de banca con mancuernas")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/SpYC0Kp.gif",
    sourceName: "dumbbell bench press",
  },
  [normalizeExerciseName("Peso muerto rumano")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/wQ2c4XD.gif",
    sourceName: "barbell romanian deadlift",
  },
  [normalizeExerciseName("Jalon al pecho")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/LEprlgG.gif",
    sourceName: "cable lat pulldown full range of motion",
  },
  [normalizeExerciseName("Prensa de piernas")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/10Z2DXU.gif",
    sourceName: "sled 45 degree leg press",
  },
  [normalizeExerciseName("Sentadilla smith")]: {
    kind: "gif",
    uri: "https://static.exercisedb.dev/media/jFtipLl.gif",
    sourceName: "smith squat",
  },
};

const aliasByName: Record<string, string> = {
  [normalizeExerciseName("BB Incline Chest Press")]: normalizeExerciseName("Press de banca"),
  [normalizeExerciseName("Press banca")]: normalizeExerciseName("Press de banca"),
  [normalizeExerciseName("Romanian deadlift")]: normalizeExerciseName("Peso muerto rumano"),
  [normalizeExerciseName("Lat pulldown")]: normalizeExerciseName("Jalon al pecho"),
  [normalizeExerciseName("Leg press")]: normalizeExerciseName("Prensa de piernas"),
};

export function getExerciseMedia(exerciseName: string): ExerciseMedia | null {
  const normalized = normalizeExerciseName(exerciseName);
  const media = exercisedbFreeMediaByName[normalized] ?? exercisedbFreeMediaByName[aliasByName[normalized] ?? ""];
  if (!media) return null;

  return {
    ...media,
    provider: "ExerciseDB Free",
    attribution: EXERCISE_DB_FREE_ATTRIBUTION,
    licenseNote: EXERCISE_DB_FREE_LICENSE_NOTE,
    productionReady: false,
  };
}
