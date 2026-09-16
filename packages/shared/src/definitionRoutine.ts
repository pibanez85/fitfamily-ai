import { normalizeExerciseName } from "./exerciseLibrary";
import { CreateWorkoutSchema, uuidSchema } from "./schemas";
import type { CreateExerciseInput, CreateWorkoutInput } from "./types";

/** Transcription of the user's six-page PDF, not AI-generated training advice. */
export const DEFINITION_ROUTINE_SOURCE = "Rutina_Definicion_5_Dias.pdf";
export const DEFINITION_ROUTINE_MARKER = "[plantilla:rutina-definicion-5-dias:v1]";

export type DefinitionPrescription = {
  key: string;
  sourceName: string;
  sets: readonly [number, number];
  reps: string;
  rir: "1-2";
  catalogNames: readonly string[];
  choiceReason?: string;
};

export type DefinitionDay = {
  key: string;
  weekday: string;
  name: string;
  introduction: string;
  guidance: string;
  exercises: readonly DefinitionPrescription[];
};

function row(
  key: string,
  sourceName: string,
  sets: number | readonly [number, number],
  reps: string,
  catalogNames: string | readonly string[] = sourceName,
  choiceReason?: string,
): DefinitionPrescription {
  return {
    key,
    sourceName,
    sets: typeof sets === "number" ? [sets, sets] : sets,
    reps,
    rir: "1-2",
    catalogNames: typeof catalogNames === "string" ? [catalogNames] : catalogNames,
    ...(choiceReason ? { choiceReason } : {}),
  };
}

const genericChoice = "El PDF no especifica la variante; elige la que utilizas.";
const alternativeChoice = "El PDF permite estas alternativas; elige una.";
const lateralOptions = ["Elevaciones laterales con mancuernas", "Elevaciones laterales en polea"];
const calfOptions = ["Elevacion de gemelos de pie", "Elevacion de gemelos sentado"];
const abdominalOptions = [
  "Crunch en polea",
  "Abdominales en maquina",
  "Elevacion de piernas colgado",
];

export const DEFINITION_ROUTINE = {
  name: "Definición · 5 días · Prioridad brazos",
  goal: "Reducir grasa manteniendo masa muscular, con prioridad en brazos y hombros.",
  source: DEFINITION_ROUTINE_SOURCE,
  weeklySchedule: [
    { weekday: "Lunes", session: "Torso A", focus: "Fuerza + hipertrofia", training: true },
    { weekday: "Martes", session: "Piernas A", focus: "Cuádriceps", training: true },
    {
      weekday: "Miércoles",
      session: "Brazos + hombros",
      focus: "Prioridad brazos",
      training: true,
    },
    { weekday: "Jueves", session: "Descanso / cardio", focus: "Recuperación", training: false },
    { weekday: "Viernes", session: "Torso B", focus: "Volumen", training: true },
    { weekday: "Sábado", session: "Piernas B", focus: "Femoral + glúteos", training: true },
    { weekday: "Domingo", session: "Descanso", focus: "Recuperación", training: false },
  ],
  principles: [
    "La definición la produce principalmente el déficit calórico. En las pesas, el objetivo es mantener rendimiento, fuerza y masa muscular. No hace falta convertir toda la rutina en series livianas de 15-20 repeticiones.",
    "Intensidad: trabaja normalmente con 1-2 repeticiones en reserva (RIR).",
    "Progresión: cuando completes el extremo alto del rango con buena técnica, sube ligeramente la carga.",
    "Cardio: 3 sesiones semanales de 25-40 min a intensidad moderada.",
    "Recuperación: si cae el rendimiento durante varias sesiones, reduce antes volumen de cardio o series accesorias que la intensidad de los ejercicios principales.",
  ],
  sourceGuidelines: [
    "Déficit: como punto de partida, unas 300-500 kcal por debajo de mantenimiento.",
    "Proteína: aproximadamente 1.8-2.2 g por kg de peso corporal al día.",
    "Cardio: 25-40 min, 3 veces por semana. Preferentemente elíptica o caminata inclinada a intensidad moderada.",
    "Doble progresión: ejemplo 3 x 10-15. Mantiene la carga hasta alcanzar 15-15-15 con técnica sólida; luego aumenta el peso y vuelve a la parte baja del rango.",
  ],
  days: [
    {
      key: "lunes",
      weekday: "Lunes",
      name: "Torso A",
      introduction:
        "Sesión relativamente pesada de torso. Los brazos reciben un estímulo breve porque tienen un día propio.",
      guidance:
        "Prioriza técnica y progresión en press banca y remo. No lleves todas las series al fallo; queremos llegar con buena recuperación al resto de la semana.",
      exercises: [
        row("lunes-banca", "Press banca plano", 3, "6-8", "Press de banca"),
        row("lunes-remo", "Remo con apoyo de pecho", 3, "8-10", "Remo pecho apoyado"),
        row("lunes-inclinado", "Press inclinado con mancuernas", 3, "8-10"),
        row("lunes-jalon", "Jalon al pecho", 3, "8-12"),
        row("lunes-laterales", "Elevaciones laterales", 3, "12-20", lateralOptions, genericChoice),
        row("lunes-curl", "Curl con barra EZ", 2, "8-12"),
        row("lunes-triceps", "Triceps con cuerda", 2, "10-15"),
      ],
    },
    {
      key: "martes",
      weekday: "Martes",
      name: "Piernas A - Cuádriceps",
      introduction:
        "Trabajo de pierna con énfasis anterior y menor demanda de equilibrio gracias a la prensa unilateral.",
      guidance:
        "La prensa unilateral reemplaza las búlgaras: mantiene el trabajo por pierna, pero permite concentrarse mejor en fuerza y técnica sin tanta fatiga por estabilidad.",
      exercises: [
        row(
          "martes-sentadilla",
          "Hack squat o sentadilla",
          3,
          "6-10",
          ["Hack squat", "Sentadilla"],
          alternativeChoice,
        ),
        row("martes-prensa", "Prensa bilateral", 3, "10-12", "Prensa de piernas"),
        row(
          "martes-unilateral",
          "Prensa unilateral",
          [2, 3],
          "10-12 c/pierna",
          "Press de piernas unilateral",
        ),
        row("martes-extension", "Extension de cuadriceps", 2, "12-15"),
        row("martes-femoral", "Curl femoral sentado", 3, "10-15"),
        row("martes-gemelos", "Gemelos", 4, "10-15", calfOptions, genericChoice),
        row("martes-abdomen", "Abdomen", 3, "12-20", abdominalOptions, genericChoice),
      ],
    },
    {
      key: "miercoles",
      weekday: "Miércoles",
      name: "Brazos + hombros",
      introduction:
        "El cambio principal de la rutina: volumen directo suficiente para que bíceps y tríceps sean una prioridad real.",
      guidance:
        "Aproximadamente 8 series directas de bíceps y 8 de tríceps en esta sesión. El jueves queda como descanso o cardio moderado para recuperar.",
      exercises: [
        row(
          "miercoles-press",
          "Press militar maquina o mancuernas",
          3,
          "6-10",
          ["Press de hombros con mancuernas", "Press de hombros en maquina"],
          alternativeChoice,
        ),
        row(
          "miercoles-laterales",
          "Elevaciones laterales",
          4,
          "12-20",
          lateralOptions,
          genericChoice,
        ),
        row(
          "miercoles-pajaros",
          "Pajaros / deltoide posterior",
          3,
          "12-20",
          "Pajaro con mancuernas",
          genericChoice,
        ),
        row(
          "miercoles-inclinado",
          "Curl inclinado con mancuerna",
          3,
          "8-12",
          "Curl inclinado con mancuernas",
        ),
        row("miercoles-predicador", "Curl predicador", 3, "10-15"),
        row("miercoles-martillo", "Curl martillo", 2, "10-15"),
        row(
          "miercoles-cerrado",
          "Press cerrado o fondos",
          3,
          "6-10",
          ["Press cerrado", "Fondos en paralelas asistidos"],
          "El PDF permite press cerrado o fondos. La variante de fondos del catálogo utiliza asistencia.",
        ),
        row("miercoles-extension", "Extension de triceps sobre cabeza", 3, "10-15"),
        row("miercoles-triceps", "Triceps en polea", 2, "12-15", "Extension de triceps en polea"),
      ],
    },
    {
      key: "viernes",
      weekday: "Viernes",
      name: "Torso B",
      introduction:
        "Segundo estímulo de torso, más orientado a volumen y control que a cargas máximas.",
      guidance:
        "Busca repeticiones limpias y tensión constante. Este día suma volumen semanal sin competir con el trabajo pesado del lunes.",
      exercises: [
        row("viernes-inclinado", "Press inclinado en maquina", 3, "8-12"),
        row(
          "viernes-jalon",
          "Dominadas o jalon",
          3,
          "6-10",
          ["Jalon al pecho", "Dominadas asistidas"],
          "El PDF permite dominadas o jalón. La variante de dominadas del catálogo utiliza asistencia.",
        ),
        row("viernes-remo", "Remo sentado en polea", 3, "8-12"),
        row(
          "viernes-aperturas",
          "Aperturas en polea o maquina",
          2,
          "12-15",
          ["Aperturas en polea", "Pec deck"],
          alternativeChoice,
        ),
        row("viernes-laterales", "Elevacion lateral", 3, "12-20", lateralOptions, genericChoice),
        row("viernes-facepull", "Face pull / deltoide posterior", 2, "12-20", "Face pull"),
        row("viernes-curl", "Curl en polea", 2, "10-15"),
        row("viernes-triceps", "Triceps en polea", 2, "10-15", "Extension de triceps en polea"),
      ],
    },
    {
      key: "sabado",
      weekday: "Sábado",
      name: "Piernas B - Femoral + glúteos",
      introduction:
        "Trabajo posterior sin peso muerto rumano, reduciendo la demanda lumbar y manteniendo un estímulo alto de femoral y glúteo.",
      guidance:
        "El curl femoral sentado pesado reemplaza el peso muerto rumano. Combinado con curl acostado, hip thrust y prensa alta cubre muy bien femoral y glúteo con menos fatiga sistémica.",
      exercises: [
        row("sabado-femoral", "Curl femoral sentado", 4, "8-12"),
        row("sabado-prensa", "Prensa con pies altos", 3, "8-12"),
        row("sabado-hipthrust", "Hip thrust", 3, "8-12"),
        row("sabado-acostado", "Curl femoral acostado", 3, "10-15"),
        row("sabado-aductores", "Aductores", 3, "12-15", "Aduccion de cadera en maquina"),
        row("sabado-extension", "Extension de cuadriceps", 2, "12-15"),
        row("sabado-gemelos", "Gemelos", 3, "12-20", calfOptions, genericChoice),
        row("sabado-abdomen", "Abdomen", 3, "12-20", abdominalOptions, genericChoice),
      ],
    },
  ] satisfies readonly DefinitionDay[],
};

/** Additional exact variants needed by the PDF; persisted only by an explicit API action. */
export const DEFINITION_ROUTINE_CATALOG_ADDITIONS: readonly CreateExerciseInput[] = [
  {
    name: "Curl con barra EZ",
    category: "strength",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    equipment: "barra EZ",
    instructions:
      "Flexiona los codos con la barra EZ manteniendo los brazos estables y el recorrido controlado.",
  },
  {
    name: "Triceps con cuerda",
    category: "strength",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "polea con cuerda",
    instructions:
      "Extiende los codos con la cuerda desde una polea alta, manteniendo los brazos cerca del cuerpo.",
  },
  {
    name: "Extension de triceps sobre cabeza",
    category: "strength",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
    equipment: "polea o mancuerna",
    instructions:
      "Con los brazos elevados sobre la cabeza, flexiona y extiende los codos con control. El PDF no especifica implemento.",
  },
  {
    name: "Curl en polea",
    category: "strength",
    primaryMuscles: ["biceps"],
    secondaryMuscles: [],
    equipment: "polea",
    instructions: "Flexiona los codos desde una polea baja sin balancear el tronco.",
  },
  {
    name: "Prensa con pies altos",
    category: "strength",
    primaryMuscles: ["gluteos", "cuadriceps"],
    secondaryMuscles: ["isquios"],
    equipment: "maquina",
    instructions:
      "Coloca ambos pies en la parte alta de la plataforma y realiza el recorrido manteniendo la pelvis apoyada.",
  },
];

export type DefinitionRoutineOptions = {
  exerciseChoices?: Record<string, string>;
  unilateralSets?: 2 | 3;
};

export type DefinitionRoutineSelection = {
  key: string;
  sourceName: string;
  selectedName: string;
  reason: string;
};

/** Build atomically: no partial routine, invented IDs, fuzzy matches or silent replacements. */
export function buildDefinitionRoutine(
  catalog: readonly { id: string; name: string }[],
  options: DefinitionRoutineOptions = {},
): {
  workout: CreateWorkoutInput | null;
  missingExercises: string[];
  issues: string[];
  selections: DefinitionRoutineSelection[];
} {
  const missing = new Set<string>();
  const issues: string[] = [];
  const selections: DefinitionRoutineSelection[] = [];
  const knownKeys = new Set(
    DEFINITION_ROUTINE.days.flatMap((day) => day.exercises.map((exercise) => exercise.key)),
  );
  for (const key of Object.keys(options.exerciseChoices ?? {})) {
    if (!knownKeys.has(key)) issues.push(`Elección desconocida: ${key}.`);
  }
  const unilateralSets = options.unilateralSets ?? 3;
  if (unilateralSets !== 2 && unilateralSets !== 3)
    issues.push("La prensa unilateral debe tener 2 o 3 series.");

  const days = DEFINITION_ROUTINE.days.map((day, dayIndex) => ({
    dayIndex,
    name: `${day.weekday} · ${day.name}`,
    notes: `${day.introduction}\n${day.guidance}`,
    exercises: day.exercises.flatMap((prescription, orderIndex) => {
      const selectedName =
        options.exerciseChoices?.[prescription.key] ?? prescription.catalogNames[0]!;
      if (
        !prescription.catalogNames.some(
          (name) => normalizeExerciseName(name) === normalizeExerciseName(selectedName),
        )
      ) {
        issues.push(
          `${prescription.sourceName}: la variante «${selectedName}» no está contemplada en la plantilla.`,
        );
        return [];
      }
      const matches = catalog.filter(
        (item) => normalizeExerciseName(item.name) === normalizeExerciseName(selectedName),
      );
      const uniqueIds = new Set(matches.map((item) => item.id));
      if (uniqueIds.size > 1) {
        issues.push(`El catálogo contiene más de un identificador para «${selectedName}».`);
        return [];
      }
      const exercise = matches[0];
      if (!exercise) {
        missing.add(selectedName);
        return [];
      }
      if (!uuidSchema.safeParse(exercise.id).success) {
        issues.push(`Identificador inválido para «${selectedName}».`);
        return [];
      }
      if (prescription.choiceReason) {
        selections.push({
          key: prescription.key,
          sourceName: prescription.sourceName,
          selectedName: exercise.name,
          reason: prescription.choiceReason,
        });
      }
      const isRange = prescription.sets[0] !== prescription.sets[1];
      const sets = isRange ? unilateralSets : prescription.sets[0];
      const notes = [
        `PDF: ${prescription.sourceName}. RIR ${prescription.rir}.`,
        ...(prescription.choiceReason
          ? [`Variante elegida: ${exercise.name}. ${prescription.choiceReason}`]
          : []),
        ...(isRange
          ? [`El PDF indica ${prescription.sets.join("-")} series; se han elegido ${sets}.`]
          : []),
      ].join(" ");
      return [
        {
          exerciseId: exercise.id,
          orderIndex,
          targetSets: sets,
          targetReps: prescription.reps,
          restSeconds: null,
          targetWeight: null,
          notes,
        },
      ];
    }),
  }));

  if (missing.size || issues.length)
    return { workout: null, missingExercises: [...missing], issues, selections };
  const workout = CreateWorkoutSchema.parse({
    name: DEFINITION_ROUTINE.name,
    goal: DEFINITION_ROUTINE.goal,
    description: [
      `Fuente: ${DEFINITION_ROUTINE_SOURCE}. ${DEFINITION_ROUTINE_MARKER}`,
      "Lunes: Torso A. Martes: Piernas A. Miércoles: Brazos + hombros. Jueves: descanso / cardio. Viernes: Torso B. Sábado: Piernas B. Domingo: descanso.",
      ...DEFINITION_ROUTINE.principles,
      ...DEFINITION_ROUTINE.sourceGuidelines,
    ].join("\n"),
    days,
  });
  return { workout, missingExercises: [], issues: [], selections };
}

export function isDefinitionRoutine(workout: { description?: string | null | undefined }): boolean {
  return workout.description?.includes(DEFINITION_ROUTINE_MARKER) ?? false;
}
