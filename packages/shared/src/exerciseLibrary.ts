export const MUSCLE_GROUPS = [
  { id: "pecho", label: "Pecho" },
  { id: "espalda", label: "Espalda" },
  { id: "hombros", label: "Hombros" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "antebrazos", label: "Antebrazos" },
  { id: "core", label: "Core" },
  { id: "abdomen", label: "Abdomen" },
  { id: "oblicuos", label: "Oblicuos" },
  { id: "gluteos", label: "Gluteos" },
  { id: "cuadriceps", label: "Cuadriceps" },
  { id: "isquios", label: "Isquios" },
  { id: "aductores", label: "Aductores" },
  { id: "pantorrillas", label: "Gemelos" },
  { id: "trapecio", label: "Trapecio" },
  { id: "lumbar", label: "Lumbar" },
] as const;

export type MuscleGroupId = (typeof MUSCLE_GROUPS)[number]["id"];
export type ExerciseTier = "principal" | "excelente" | "accesorio" | "aislamiento" | "situacional";

export type ExerciseLibraryMeta = {
  name: string;
  bodyRegion: "superior" | "inferior" | "core";
  muscleGroupIds: MuscleGroupId[];
  movementPattern: string;
  equipment: string;
  scienceScore: number;
  tier: ExerciseTier;
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
  rationale: string;
  tags: string[];
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  category?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string | null;
  instructions?: string | null;
  safetyNotes?: string | null;
  createdAt?: string;
  normalizedName: string;
} & Omit<ExerciseLibraryMeta, "name" | "equipment"> & {
    libraryEquipment: string;
  };

const common = {
  defaultSets: 3,
  defaultReps: "8-12",
  defaultRestSeconds: 90,
};

export const EXERCISE_LIBRARY: ExerciseLibraryMeta[] = [
  meta("Sentadilla", "inferior", ["cuadriceps", "gluteos"], "sentadilla", "barra", 97, "principal", "Multiarticular de alta transferencia para piernas y fuerza general."),
  meta("Press de banca", "superior", ["pecho", "triceps"], "empuje horizontal", "barra", 96, "principal", "Base fuerte para pecho, triceps y fuerza de empuje."),
  meta("Peso muerto rumano", "inferior", ["isquios", "gluteos"], "bisagra", "barra o mancuernas", 95, "principal", "Excelente para cadena posterior con carga progresiva y control tecnico."),
  meta("Dominadas asistidas", "superior", ["espalda", "biceps"], "tiron vertical", "maquina o banda", 95, "principal", "Tiron vertical muy completo; la asistencia permite progresar con buena tecnica."),
  meta("Remo con barra", "superior", ["espalda", "biceps"], "tiron horizontal", "barra", 94, "principal", "Tiron horizontal pesado para espalda media y dorsales."),
  meta("Hip thrust", "inferior", ["gluteos"], "extension de cadera", "barra o maquina", 93, "principal", "Muy util para gluteos por alta tension en extension de cadera."),
  meta("Press militar con barra", "superior", ["hombros", "triceps"], "empuje vertical", "barra", 92, "principal", "Empuje vertical basico para hombros y estabilidad del tronco."),
  meta("Sentadilla frontal", "inferior", ["cuadriceps", "gluteos"], "sentadilla", "barra", 92, "excelente", "Gran estimulo de cuadriceps con torso mas vertical."),
  meta("Peso muerto convencional", "inferior", ["gluteos", "isquios", "espalda"], "bisagra", "barra", 92, "excelente", "Movimiento global potente, util si la tecnica esta consolidada."),
  meta("Trap bar deadlift", "inferior", ["gluteos", "cuadriceps", "isquios"], "bisagra", "trap bar", 91, "excelente", "Variacion amigable para fuerza total y piernas."),
  meta("Press inclinado con mancuernas", "superior", ["pecho", "hombros", "triceps"], "empuje inclinado", "mancuernas", 91, "excelente", "Buen rango y estabilidad para pecho superior."),
  meta("Press de hombros con mancuernas", "superior", ["hombros", "triceps"], "empuje vertical", "mancuernas", 90, "excelente", "Permite buen recorrido y ajuste natural de hombros."),
  meta("Jalon al pecho", "superior", ["espalda", "biceps"], "tiron vertical", "polea", 90, "excelente", "Tiron vertical estable y facil de progresar."),
  meta("Prensa de piernas", "inferior", ["cuadriceps", "gluteos"], "sentadilla guiada", "maquina", 90, "excelente", "Permite volumen de piernas con menor demanda tecnica que sentadilla."),
  meta("Split squat bulgaro", "inferior", ["cuadriceps", "gluteos"], "unilateral", "mancuernas", 89, "excelente", "Unilateral exigente y efectivo para piernas y estabilidad."),
  meta("Remo sentado en polea", "superior", ["espalda", "biceps"], "tiron horizontal", "polea", 88, "excelente", "Estable, progresable y muy util para espalda media."),
  meta("Remo pecho apoyado", "superior", ["espalda", "biceps"], "tiron horizontal", "maquina o banco", 88, "excelente", "Reduce fatiga lumbar y permite concentrar espalda."),
  meta("Curl femoral sentado", "inferior", ["isquios"], "flexion de rodilla", "maquina", 88, "excelente", "Aislamiento de isquios muy practico para hipertrofia."),
  meta("Hack squat", "inferior", ["cuadriceps", "gluteos"], "sentadilla guiada", "maquina", 88, "excelente", "Muy estable para cargar cuadriceps con seguridad."),
  meta("Jalon agarre neutro", "superior", ["espalda", "biceps"], "tiron vertical", "polea", 88, "excelente", "Agarre comodo para dorsales y brazo."),
  meta("Press en maquina convergente", "superior", ["pecho", "triceps"], "empuje horizontal", "maquina", 86, "excelente", "Estable para progresar pecho con menos demanda tecnica."),
  meta("Remo con mancuerna a una mano", "superior", ["espalda", "biceps"], "tiron horizontal", "mancuerna", 86, "excelente", "Permite trabajo unilateral y buen rango."),
  meta("Remo en maquina convergente", "superior", ["espalda", "biceps"], "tiron horizontal", "maquina", 86, "excelente", "Opcion estable y fuerte para espalda."),
  meta("Elevaciones laterales en polea", "superior", ["hombros"], "abduccion hombro", "polea", 86, "excelente", "Mantiene tension en deltoide lateral durante mas recorrido."),
  meta("Elevaciones laterales con mancuernas", "superior", ["hombros"], "abduccion hombro", "mancuernas", 85, "excelente", "Basico efectivo para deltoide lateral."),
  meta("Fondos en paralelas asistidos", "superior", ["pecho", "triceps"], "empuje vertical", "maquina o banda", 84, "accesorio", "Buen empuje si hombros lo toleran y tecnica es estable."),
  meta("Press inclinado en maquina", "superior", ["pecho", "hombros", "triceps"], "empuje inclinado", "maquina", 84, "accesorio", "Estable para pecho superior."),
  meta("Zancadas caminando", "inferior", ["cuadriceps", "gluteos"], "unilateral", "mancuernas", 84, "accesorio", "Unilateral practico para piernas, gluteos y control."),
  meta("Press cerrado", "superior", ["triceps", "pecho"], "empuje horizontal", "barra", 82, "accesorio", "Compuesto potente para triceps y empuje."),
  meta("Face pull", "superior", ["hombros", "espalda"], "tiron correctivo", "polea", 82, "accesorio", "Util para deltoide posterior y control escapular."),
  meta("Pallof press", "core", ["core"], "anti-rotacion", "polea o banda", 82, "accesorio", "Core anti-rotacion seguro y transferible."),
  meta("Press de piernas unilateral", "inferior", ["cuadriceps", "gluteos"], "unilateral", "maquina", 82, "accesorio", "Unilateral estable para corregir asimetrias."),
  meta("Sentadilla goblet", "inferior", ["cuadriceps", "gluteos"], "sentadilla", "mancuerna o kettlebell", 81, "accesorio", "Muy buena para aprender patron de sentadilla."),
  meta("Plancha", "core", ["core"], "anti-extension", "peso corporal", 80, "accesorio", "Base simple para control del tronco."),
  meta("Step-up con mancuernas", "inferior", ["cuadriceps", "gluteos"], "unilateral", "mancuernas", 80, "accesorio", "Unilateral funcional y escalable."),
  meta("Glute bridge", "inferior", ["gluteos"], "extension de cadera", "peso corporal o barra", 80, "accesorio", "Alternativa simple para aprender extension de cadera."),
  meta("Curl con barra", "superior", ["biceps"], "flexion codo", "barra", 78, "aislamiento", "Aislamiento clasico y progresable para biceps."),
  meta("Extension de triceps en polea", "superior", ["triceps"], "extension codo", "polea", 78, "aislamiento", "Aislamiento estable para triceps."),
  meta("Dead bug", "core", ["core"], "anti-extension", "peso corporal", 78, "accesorio", "Core seguro para control lumbar."),
  meta("Farmer carry", "core", ["core", "espalda"], "carga transportada", "mancuernas", 78, "accesorio", "Trabaja agarre, core y postura."),
  meta("Sentadilla smith", "inferior", ["cuadriceps", "gluteos"], "sentadilla guiada", "maquina", 78, "accesorio", "Util si se ajusta la posicion y no molesta."),
  meta("Extension de cuadriceps", "inferior", ["cuadriceps"], "extension rodilla", "maquina", 76, "aislamiento", "Buen complemento para cuadriceps despues de compuestos."),
  meta("Elevacion de piernas colgado", "core", ["core"], "flexion cadera", "barra", 76, "aislamiento", "Exigente para abdomen y flexores de cadera."),
  meta("Elevacion de gemelos de pie", "inferior", ["pantorrillas"], "flexion plantar", "maquina", 76, "aislamiento", "Basico para gastrocnemio."),
  meta("Kettlebell swing", "inferior", ["gluteos", "isquios"], "bisagra dinamica", "kettlebell", 76, "accesorio", "Potencia de cadera si la tecnica esta bien aprendida."),
  meta("Crunch en polea", "core", ["core"], "flexion tronco", "polea", 75, "aislamiento", "Permite progresar carga en abdomen."),
  meta("Curl inclinado con mancuernas", "superior", ["biceps"], "flexion codo", "mancuernas", 75, "aislamiento", "Buen estiramiento para biceps."),
  meta("Curl femoral acostado", "inferior", ["isquios"], "flexion rodilla", "maquina", 82, "aislamiento", "Aislamiento efectivo de isquios."),
  meta("Curl predicador", "superior", ["biceps"], "flexion codo", "banco predicador", 74, "aislamiento", "Aislamiento estable para biceps."),
  meta("Extension francesa", "superior", ["triceps"], "extension codo", "barra o mancuernas", 74, "aislamiento", "Buen trabajo de cabeza larga del triceps con control."),
  meta("Pajaro con mancuernas", "superior", ["hombros", "espalda"], "abduccion horizontal", "mancuernas", 74, "aislamiento", "Deltoide posterior y espalda alta."),
  meta("Elevacion de gemelos sentado", "inferior", ["pantorrillas"], "flexion plantar", "maquina", 74, "aislamiento", "Complementa gemelos de pie con rodilla flexionada."),
  meta("Curl martillo", "superior", ["biceps"], "flexion codo", "mancuernas", 73, "aislamiento", "Buen complemento para braquial y antebrazo."),
  meta("Aperturas en polea", "superior", ["pecho"], "aduccion hombro", "polea", 72, "aislamiento", "Aislamiento de pecho con tension constante."),
  meta("Pull through en polea", "inferior", ["gluteos", "isquios"], "bisagra", "polea", 72, "accesorio", "Bisagra amigable para aprender extension de cadera."),
  meta("Pullover en polea", "superior", ["espalda"], "extension hombro", "polea", 70, "aislamiento", "Aisla dorsales sin tanta fatiga de biceps."),
  meta("Patada de gluteo en polea", "inferior", ["gluteos"], "extension cadera", "polea", 70, "aislamiento", "Complemento para gluteos, no reemplaza compuestos."),
  meta("Buenos dias", "inferior", ["isquios", "gluteos"], "bisagra", "barra", 70, "situacional", "Util pero tecnico; mejor reservarlo para usuarios con experiencia."),
  meta("Abduccion de cadera en maquina", "inferior", ["gluteos"], "abduccion cadera", "maquina", 69, "aislamiento", "Complemento para gluteo medio."),
  meta("Pec deck", "superior", ["pecho"], "aduccion hombro", "maquina", 68, "aislamiento", "Aislamiento facil de ejecutar para pecho."),
  meta("Encogimientos de hombros", "superior", ["espalda"], "elevacion escapular", "mancuernas o barra", 65, "aislamiento", "Complemento para trapecio, no prioridad general."),
  meta("Curl concentrado", "superior", ["biceps"], "flexion codo", "mancuerna", 62, "aislamiento", "Util como finalizador, menos prioritario que curls progresables."),
  meta("Aduccion de cadera en maquina", "inferior", ["gluteos"], "aduccion cadera", "maquina", 58, "situacional", "Puede servir como accesorio, no es base de rutina."),
  meta("Elevacion frontal con mancuernas", "superior", ["hombros"], "flexion hombro", "mancuernas", 56, "situacional", "Deltoide anterior ya suele recibir mucho trabajo con presses."),
  meta("Fondos en banco", "superior", ["triceps"], "empuje", "banco", 55, "situacional", "Puede molestar hombros; priorizar polea o press cerrado."),
  meta("Abdominales en maquina", "core", ["core"], "flexion tronco", "maquina", 55, "situacional", "Opcion valida, pero no siempre necesaria."),
  meta("Remo al menton", "superior", ["hombros"], "tiron vertical", "barra o polea", 52, "situacional", "Puede molestar hombros; usar con rango y agarre comodos."),
  meta("Patada de triceps con mancuerna", "superior", ["triceps"], "extension codo", "mancuerna", 50, "situacional", "Finalizador, menos facil de progresar que polea."),
  meta("Press tras nuca", "superior", ["hombros", "triceps"], "empuje vertical", "barra", 25, "situacional", "No se recomienda por defecto; evitar si hay molestia o poca movilidad."),
];

export function normalizeExerciseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const metaByName = new Map(EXERCISE_LIBRARY.map((item) => [normalizeExerciseName(item.name), item]));

export function getExerciseLibraryMeta(name: string): ExerciseLibraryMeta | null {
  return metaByName.get(normalizeExerciseName(name)) ?? null;
}

export function enrichExerciseRecord<T extends { id: string; name: string }>(exercise: T): T & ExerciseCatalogItem {
  const metaData = getExerciseLibraryMeta(exercise.name);
  const fallback = metaData ?? {
    ...common,
    name: exercise.name,
    bodyRegion: "superior" as const,
    muscleGroupIds: [] as MuscleGroupId[],
    movementPattern: "general",
    equipment: "variable",
    scienceScore: 45,
    tier: "situacional" as const,
    rationale: "Ejercicio disponible en el catalogo, sin ranking curado todavia.",
    tags: [],
  };

  return {
    ...exercise,
    ...fallback,
    normalizedName: normalizeExerciseName(exercise.name),
    libraryEquipment: fallback.equipment,
  };
}

export function sortExercisesByEvidence<T extends { id: string; name: string }>(
  exercises: T[],
): Array<T & ExerciseCatalogItem> {
  return exercises
    .map(enrichExerciseRecord)
    .sort((a, b) => b.scienceScore - a.scienceScore || a.name.localeCompare(b.name));
}

function meta(
  name: string,
  bodyRegion: ExerciseLibraryMeta["bodyRegion"],
  muscleGroupIds: MuscleGroupId[],
  movementPattern: string,
  equipment: string,
  scienceScore: number,
  tier: ExerciseTier,
  rationale: string,
  overrides: Partial<Pick<ExerciseLibraryMeta, "defaultSets" | "defaultReps" | "defaultRestSeconds">> = {},
): ExerciseLibraryMeta {
  return {
    ...common,
    ...overrides,
    name,
    bodyRegion,
    muscleGroupIds,
    movementPattern,
    equipment,
    scienceScore,
    tier,
    rationale,
    tags: [bodyRegion, movementPattern, equipment, ...muscleGroupIds],
  };
}
