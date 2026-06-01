export const FOOD_SOURCES = ["local", "open_food_facts", "usda", "ai_estimate", "user_custom"] as const;

export type FoodSource = (typeof FOOD_SOURCES)[number];

export type MacroTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodUnit = {
  label: string;
  grams: number;
};

export type ServingOption = {
  label: string;
  quantity: number;
  unit: string;
  gramsEquivalent: number;
  description?: string;
};

export type FoodCatalogItem = {
  id: string;
  source: FoodSource;
  sourceId?: string | null;
  name: string;
  brand?: string | null;
  category: string;
  country?: string | null;
  aliases?: string[];
  servingOptions: ServingOption[];
  baseQuantity: number;
  baseUnit: string;
  gramsPerBaseUnit: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g?: number | null;
  sodiumPer100g?: number | null;
  barcode?: string | null;
  imageUrl?: string | null;
  isVerified: boolean;
  isEstimated: boolean;
  createdAt?: string;
  updatedAt?: string;
  servingLabel: string;
  servingG: number;
  per100g: MacroTotals;
  units: FoodUnit[];
  estimated?: boolean;
};

export type FoodSearchResponse = {
  query: string;
  results: FoodCatalogItem[];
  sources: FoodSource[];
  cached: boolean;
};

export type SelectedFoodItem = {
  id: string;
  food: FoodCatalogItem;
  quantity: number;
  unitLabel: string;
  grams: number;
};

type FoodInput = {
  id: string;
  name: string;
  category: string;
  aliases?: string[];
  servingLabel: string;
  servingG: number;
  per100g: MacroTotals;
  units: FoodUnit[];
  isVerified?: boolean;
  isEstimated?: boolean;
  sourceId?: string;
  sugarPer100g?: number;
  sodiumPer100g?: number;
};

const GRAM_UNIT: FoodUnit = { label: "g", grams: 1 };

function localFood(input: FoodInput): FoodCatalogItem {
  return {
    id: input.id,
    source: "local",
    sourceId: input.sourceId ?? input.id,
    name: input.name,
    brand: null,
    category: input.category,
    country: "CL",
    aliases: input.aliases ?? [],
    servingOptions: input.units.map((unit) => ({
      label: servingLabelFor(unit.label, unit.grams),
      quantity: unit.label === "g" || unit.label === "ml" ? unit.grams : 1,
      unit: unit.label,
      gramsEquivalent: unit.grams,
      description: `${unit.label} aprox. ${Math.round(unit.grams)} g`,
    })),
    baseQuantity: 100,
    baseUnit: "g",
    gramsPerBaseUnit: 100,
    caloriesPer100g: input.per100g.calories,
    proteinPer100g: input.per100g.proteinG,
    carbsPer100g: input.per100g.carbsG,
    fatPer100g: input.per100g.fatG,
    fiberPer100g: input.per100g.fiberG,
    sugarPer100g: input.sugarPer100g ?? null,
    sodiumPer100g: input.sodiumPer100g ?? null,
    barcode: null,
    imageUrl: null,
    isVerified: input.isVerified ?? false,
    isEstimated: input.isEstimated ?? true,
    servingLabel: input.servingLabel,
    servingG: input.servingG,
    per100g: input.per100g,
    units: input.units.some((unit) => unit.label === "g") ? input.units : [...input.units, GRAM_UNIT],
    estimated: input.isEstimated ?? true,
  };
}

const baseFoodCatalog: FoodCatalogItem[] = [
  localFood({
    id: "egg",
    name: "Huevo entero",
    category: "Proteinas",
    servingLabel: "2 huevos medianos",
    servingG: 100,
    per100g: { calories: 143, proteinG: 12.6, carbsG: 0.7, fatG: 9.5, fiberG: 0 },
    units: [{ label: "huevo mediano", grams: 50 }, { label: "unidad", grams: 50 }, GRAM_UNIT],
    aliases: ["huevo", "huevos", "huevito"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "marraqueta",
    name: "Pan marraqueta",
    category: "Carbohidratos",
    servingLabel: "1 marraqueta",
    servingG: 100,
    per100g: { calories: 270, proteinG: 8.5, carbsG: 55, fatG: 1.5, fiberG: 2.7 },
    units: [{ label: "marraqueta", grams: 100 }, { label: "1/2 marraqueta", grams: 50 }, { label: "unidad", grams: 100 }, GRAM_UNIT],
    aliases: ["marraqueta", "pan batido", "pan frances", "pan francés", "pan"],
  }),
  localFood({
    id: "hallulla",
    name: "Hallulla",
    category: "Carbohidratos",
    servingLabel: "1 hallulla",
    servingG: 100,
    per100g: { calories: 305, proteinG: 8, carbsG: 53, fatG: 6.5, fiberG: 2.4 },
    units: [{ label: "hallulla", grams: 100 }, { label: "unidad", grams: 100 }, GRAM_UNIT],
    aliases: ["hallulla", "pan"],
  }),
  localFood({
    id: "bread-loaf",
    name: "Pan de molde",
    category: "Carbohidratos",
    servingLabel: "2 rebanadas",
    servingG: 56,
    per100g: { calories: 265, proteinG: 9, carbsG: 49, fatG: 3.6, fiberG: 2.7 },
    units: [{ label: "rebanada", grams: 28 }, { label: "porcion", grams: 56 }, GRAM_UNIT],
    aliases: ["pan de molde", "pan molde"],
  }),
  localFood({
    id: "rice",
    name: "Arroz blanco cocido",
    category: "Carbohidratos",
    servingLabel: "1 taza cocida",
    servingG: 160,
    per100g: { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4 },
    units: [{ label: "taza", grams: 160 }, { label: "plato", grams: 250 }, GRAM_UNIT],
    aliases: ["arroz", "arroz cocido"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "pasta",
    name: "Fideos cocidos",
    category: "Carbohidratos",
    servingLabel: "1 taza cocida",
    servingG: 140,
    per100g: { calories: 158, proteinG: 5.8, carbsG: 31, fatG: 0.9, fiberG: 1.8 },
    units: [{ label: "taza", grams: 140 }, { label: "plato", grams: 220 }, GRAM_UNIT],
    aliases: ["fideos", "tallarines", "pasta"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "potato-boiled",
    name: "Papa cocida",
    category: "Carbohidratos",
    servingLabel: "1 papa mediana",
    servingG: 170,
    per100g: { calories: 87, proteinG: 1.9, carbsG: 20, fatG: 0.1, fiberG: 1.8 },
    units: [{ label: "papa mediana", grams: 170 }, { label: "taza", grams: 160 }, GRAM_UNIT],
    aliases: ["papa", "papas", "papa cocida"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "potato-baked",
    name: "Papa al horno",
    category: "Carbohidratos",
    servingLabel: "1 papa mediana",
    servingG: 180,
    per100g: { calories: 93, proteinG: 2.5, carbsG: 21, fatG: 0.1, fiberG: 2.2 },
    units: [{ label: "papa mediana", grams: 180 }, GRAM_UNIT],
    aliases: ["papa al horno", "papa asada"],
  }),
  localFood({
    id: "mashed-potato",
    name: "Pure de papa",
    category: "Carbohidratos",
    servingLabel: "1 taza",
    servingG: 210,
    per100g: { calories: 106, proteinG: 1.8, carbsG: 15.8, fatG: 4.2, fiberG: 1.3 },
    units: [{ label: "taza", grams: 210 }, { label: "plato", grams: 280 }, GRAM_UNIT],
    aliases: ["pure", "puré", "pure de papa", "puré de papa"],
  }),
  localFood({
    id: "chicken-breast",
    name: "Pechuga de pollo cocida",
    category: "Proteinas",
    servingLabel: "1 filete mediano",
    servingG: 150,
    per100g: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0 },
    units: [{ label: "filete", grams: 150 }, { label: "porcion", grams: 150 }, GRAM_UNIT],
    aliases: ["pollo", "pechuga", "pechuga pollo"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "chicken-leg",
    name: "Pollo trutro cocido",
    category: "Proteinas",
    servingLabel: "1 trutro mediano",
    servingG: 140,
    per100g: { calories: 209, proteinG: 26, carbsG: 0, fatG: 10.9, fiberG: 0 },
    units: [{ label: "trutro", grams: 140 }, { label: "porcion", grams: 140 }, GRAM_UNIT],
    aliases: ["trutro", "pierna pollo", "pollo"],
  }),
  localFood({
    id: "ground-beef",
    name: "Carne molida cocida",
    category: "Proteinas",
    servingLabel: "1 porcion",
    servingG: 120,
    per100g: { calories: 215, proteinG: 26, carbsG: 0, fatG: 12, fiberG: 0 },
    units: [{ label: "porcion", grams: 120 }, GRAM_UNIT],
    aliases: ["carne molida", "molida", "vacuno molido"],
  }),
  localFood({
    id: "posta",
    name: "Posta cocida",
    category: "Proteinas",
    servingLabel: "1 bistec",
    servingG: 150,
    per100g: { calories: 217, proteinG: 27, carbsG: 0, fatG: 11, fiberG: 0 },
    units: [{ label: "bistec", grams: 150 }, { label: "porcion", grams: 120 }, GRAM_UNIT],
    aliases: ["posta", "carne", "vacuno", "bistec"],
  }),
  localFood({
    id: "tuna-water",
    name: "Atun en agua drenado",
    category: "Proteinas",
    servingLabel: "1 lata drenada",
    servingG: 120,
    per100g: { calories: 116, proteinG: 26, carbsG: 0, fatG: 1, fiberG: 0 },
    units: [{ label: "lata", grams: 120 }, { label: "porcion", grams: 120 }, GRAM_UNIT],
    aliases: ["atun", "atún", "atun al agua"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "jurel",
    name: "Jurel al natural drenado",
    category: "Proteinas",
    servingLabel: "1 porcion",
    servingG: 120,
    per100g: { calories: 143, proteinG: 23, carbsG: 0, fatG: 5.5, fiberG: 0 },
    units: [{ label: "porcion", grams: 120 }, { label: "lata", grams: 250 }, GRAM_UNIT],
    aliases: ["jurel", "jurel en lata"],
  }),
  localFood({
    id: "whole-milk",
    name: "Leche entera",
    category: "Lacteos",
    servingLabel: "1 vaso",
    servingG: 200,
    per100g: { calories: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, fiberG: 0 },
    units: [{ label: "vaso", grams: 200 }, { label: "taza", grams: 240 }, { label: "ml", grams: 1 }],
    aliases: ["leche", "leche entera"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "skim-milk",
    name: "Leche descremada",
    category: "Lacteos",
    servingLabel: "1 vaso",
    servingG: 200,
    per100g: { calories: 34, proteinG: 3.4, carbsG: 5, fatG: 0.1, fiberG: 0 },
    units: [{ label: "vaso", grams: 200 }, { label: "taza", grams: 240 }, { label: "ml", grams: 1 }],
    aliases: ["leche descremada", "leche"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "natural-yogurt",
    name: "Yogur natural",
    category: "Lacteos",
    servingLabel: "1 pote",
    servingG: 170,
    per100g: { calories: 73, proteinG: 10, carbsG: 3.6, fatG: 1.9, fiberG: 0 },
    units: [{ label: "pote", grams: 170 }, { label: "taza", grams: 245 }, GRAM_UNIT],
    aliases: ["yogur", "yogurt", "yogur natural"],
  }),
  localFood({
    id: "fresh-cheese",
    name: "Queso fresco",
    category: "Lacteos",
    servingLabel: "1 rebanada",
    servingG: 40,
    per100g: { calories: 264, proteinG: 18, carbsG: 3, fatG: 20, fiberG: 0 },
    units: [{ label: "rebanada", grams: 40 }, { label: "trozo", grams: 50 }, GRAM_UNIT],
    aliases: ["queso", "queso fresco"],
  }),
  localFood({
    id: "quesillo",
    name: "Quesillo",
    category: "Lacteos",
    servingLabel: "1 rebanada gruesa",
    servingG: 50,
    per100g: { calories: 145, proteinG: 16, carbsG: 4, fatG: 7, fiberG: 0 },
    units: [{ label: "rebanada", grams: 50 }, { label: "porcion", grams: 80 }, GRAM_UNIT],
    aliases: ["quesillo"],
  }),
  localFood({
    id: "avocado",
    name: "Palta",
    category: "Grasas",
    servingLabel: "1/2 palta",
    servingG: 75,
    per100g: { calories: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 },
    units: [{ label: "1/2 unidad", grams: 75 }, { label: "unidad", grams: 150 }, GRAM_UNIT],
    aliases: ["palta", "aguacate"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "banana",
    name: "Platano",
    category: "Frutas",
    servingLabel: "1 unidad mediana",
    servingG: 120,
    per100g: { calories: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, fiberG: 2.6 },
    units: [{ label: "unidad", grams: 120 }, GRAM_UNIT],
    aliases: ["platano", "plátano", "banana"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "apple",
    name: "Manzana",
    category: "Frutas",
    servingLabel: "1 unidad mediana",
    servingG: 180,
    per100g: { calories: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, fiberG: 2.4 },
    units: [{ label: "unidad", grams: 180 }, GRAM_UNIT],
    aliases: ["manzana"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "orange",
    name: "Naranja",
    category: "Frutas",
    servingLabel: "1 unidad mediana",
    servingG: 150,
    per100g: { calories: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, fiberG: 2.4 },
    units: [{ label: "unidad", grams: 150 }, GRAM_UNIT],
    aliases: ["naranja"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "tomato",
    name: "Tomate",
    category: "Verduras",
    servingLabel: "1 unidad",
    servingG: 120,
    per100g: { calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 },
    units: [{ label: "unidad", grams: 120 }, GRAM_UNIT],
    aliases: ["tomate"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "lettuce",
    name: "Lechuga",
    category: "Verduras",
    servingLabel: "1 plato",
    servingG: 70,
    per100g: { calories: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, fiberG: 1.3 },
    units: [{ label: "plato", grams: 70 }, GRAM_UNIT],
    aliases: ["lechuga"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "chilean-salad",
    name: "Ensalada chilena",
    category: "Verduras",
    servingLabel: "1 plato",
    servingG: 180,
    per100g: { calories: 28, proteinG: 0.9, carbsG: 4.2, fatG: 1, fiberG: 1.5 },
    units: [{ label: "plato", grams: 180 }, { label: "porcion", grams: 180 }, GRAM_UNIT],
    aliases: ["ensalada", "ensalada chilena", "tomate cebolla"],
  }),
  localFood({
    id: "beans",
    name: "Porotos cocidos",
    category: "Legumbres",
    servingLabel: "1 taza",
    servingG: 170,
    per100g: { calories: 127, proteinG: 8.7, carbsG: 23, fatG: 0.5, fiberG: 6.4 },
    units: [{ label: "taza", grams: 170 }, { label: "plato", grams: 250 }, GRAM_UNIT],
    aliases: ["porotos", "frijoles"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "lentils",
    name: "Lentejas cocidas",
    category: "Legumbres",
    servingLabel: "1 taza",
    servingG: 200,
    per100g: { calories: 116, proteinG: 9, carbsG: 20, fatG: 0.4, fiberG: 7.9 },
    units: [{ label: "taza", grams: 200 }, { label: "plato", grams: 280 }, GRAM_UNIT],
    aliases: ["lentejas"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "chickpeas",
    name: "Garbanzos cocidos",
    category: "Legumbres",
    servingLabel: "1 taza",
    servingG: 165,
    per100g: { calories: 164, proteinG: 8.9, carbsG: 27, fatG: 2.6, fiberG: 7.6 },
    units: [{ label: "taza", grams: 165 }, { label: "plato", grams: 250 }, GRAM_UNIT],
    aliases: ["garbanzos"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "oats",
    name: "Avena",
    category: "Carbohidratos",
    servingLabel: "1/2 taza seca",
    servingG: 40,
    per100g: { calories: 389, proteinG: 16.9, carbsG: 66, fatG: 6.9, fiberG: 10.6 },
    units: [{ label: "1/2 taza", grams: 40 }, { label: "cucharada", grams: 15 }, GRAM_UNIT],
    aliases: ["avena"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "oil",
    name: "Aceite",
    category: "Grasas",
    servingLabel: "1 cucharada",
    servingG: 14,
    per100g: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 },
    units: [{ label: "cucharada", grams: 14 }, { label: "cucharadita", grams: 5 }, GRAM_UNIT],
    aliases: ["aceite", "aceite vegetal", "aceite oliva"],
    isVerified: true,
    isEstimated: false,
  }),
  localFood({
    id: "butter",
    name: "Mantequilla",
    category: "Grasas",
    servingLabel: "1 cucharadita",
    servingG: 5,
    per100g: { calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, fiberG: 0 },
    units: [{ label: "cucharadita", grams: 5 }, { label: "cucharada", grams: 14 }, GRAM_UNIT],
    aliases: ["mantequilla"],
  }),
  localFood({
    id: "mayonnaise",
    name: "Mayonesa",
    category: "Grasas",
    servingLabel: "1 cucharada",
    servingG: 14,
    per100g: { calories: 680, proteinG: 1, carbsG: 1, fatG: 75, fiberG: 0 },
    units: [{ label: "cucharada", grams: 14 }, { label: "cucharadita", grams: 5 }, GRAM_UNIT],
    aliases: ["mayo", "mayonesa"],
  }),
  localFood({
    id: "soda",
    name: "Bebida azucarada",
    category: "Bebidas",
    servingLabel: "1 vaso",
    servingG: 250,
    per100g: { calories: 42, proteinG: 0, carbsG: 10.6, fatG: 0, fiberG: 0 },
    units: [{ label: "vaso", grams: 250 }, { label: "lata", grams: 350 }, { label: "ml", grams: 1 }],
    aliases: ["bebida", "gaseosa", "coca cola", "fanta", "sprite"],
  }),
  localFood({
    id: "juice",
    name: "Jugo",
    category: "Bebidas",
    servingLabel: "1 vaso",
    servingG: 250,
    per100g: { calories: 45, proteinG: 0.5, carbsG: 10.5, fatG: 0.1, fiberG: 0.2 },
    units: [{ label: "vaso", grams: 250 }, { label: "ml", grams: 1 }],
    aliases: ["jugo", "zumo"],
  }),
  localFood({
    id: "empanada-pino",
    name: "Empanada de pino",
    category: "Platos chilenos",
    servingLabel: "1 unidad",
    servingG: 220,
    per100g: { calories: 260, proteinG: 10, carbsG: 29, fatG: 12, fiberG: 2 },
    units: [{ label: "unidad", grams: 220 }, { label: "1/2 unidad", grams: 110 }, GRAM_UNIT],
    aliases: ["empanada", "empanada pino", "pino"],
  }),
  localFood({
    id: "cazuela",
    name: "Cazuela",
    category: "Platos chilenos",
    servingLabel: "1 plato",
    servingG: 450,
    per100g: { calories: 82, proteinG: 6, carbsG: 9, fatG: 2.5, fiberG: 1.4 },
    units: [{ label: "plato", grams: 450 }, { label: "tazon", grams: 350 }, GRAM_UNIT],
    aliases: ["cazuela", "cazuela pollo", "cazuela vacuno"],
  }),
  localFood({
    id: "completo",
    name: "Completo",
    category: "Platos chilenos",
    servingLabel: "1 completo",
    servingG: 220,
    per100g: { calories: 285, proteinG: 8.5, carbsG: 25, fatG: 17, fiberG: 2 },
    units: [{ label: "unidad", grams: 220 }, { label: "completo", grams: 220 }, GRAM_UNIT],
    aliases: ["completo", "hot dog", "italiano"],
  }),
  localFood({
    id: "sushi",
    name: "Sushi mixto",
    category: "Platos frecuentes",
    servingLabel: "8 piezas",
    servingG: 240,
    per100g: { calories: 160, proteinG: 6, carbsG: 26, fatG: 4, fiberG: 1 },
    units: [{ label: "pieza", grams: 30 }, { label: "8 piezas", grams: 240 }, GRAM_UNIT],
    aliases: ["sushi", "roll", "hand roll"],
  }),
  localFood({
    id: "churrasco",
    name: "Churrasco italiano",
    category: "Platos chilenos",
    servingLabel: "1 sandwich",
    servingG: 320,
    per100g: { calories: 285, proteinG: 13, carbsG: 24, fatG: 15, fiberG: 2.5 },
    units: [{ label: "sandwich", grams: 320 }, { label: "1/2 sandwich", grams: 160 }, GRAM_UNIT],
    aliases: ["churrasco", "churrasco italiano", "sandwich"],
  }),
  localFood({
    id: "charquican",
    name: "Charquican",
    category: "Platos chilenos",
    servingLabel: "1 plato",
    servingG: 350,
    per100g: { calories: 105, proteinG: 5, carbsG: 15, fatG: 3.2, fiberG: 2.8 },
    units: [{ label: "plato", grams: 350 }, { label: "taza", grams: 220 }, GRAM_UNIT],
    aliases: ["charquican", "charquicán"],
  }),
  localFood({
    id: "vegetable-tortilla",
    name: "Tortilla de verduras",
    category: "Platos frecuentes",
    servingLabel: "1 porcion",
    servingG: 180,
    per100g: { calories: 145, proteinG: 7, carbsG: 8, fatG: 9, fiberG: 2.2 },
    units: [{ label: "porcion", grams: 180 }, { label: "1/2 tortilla", grams: 250 }, GRAM_UNIT],
    aliases: ["tortilla", "tortilla verduras", "tortilla de verduras"],
  }),
  localFood({
    id: "whey",
    name: "Proteina whey",
    category: "Suplementos",
    servingLabel: "1 scoop",
    servingG: 30,
    per100g: { calories: 400, proteinG: 80, carbsG: 8, fatG: 6, fiberG: 0 },
    units: [{ label: "scoop", grams: 30 }, GRAM_UNIT],
    aliases: ["whey", "proteina", "proteína", "suplemento"],
    isVerified: false,
    isEstimated: true,
  }),
];

const extraFoodInputs: FoodInput[] = [
  { id: "pan-batido", name: "Pan batido", category: "Panes", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 270, proteinG: 8.5, carbsG: 55, fatG: 1.5, fiberG: 2.7 }, units: [{ label: "unidad", grams: 100 }, { label: "1/2 unidad", grams: 50 }, GRAM_UNIT], aliases: ["marraqueta", "pan frances", "pan"] },
  { id: "pan-frances", name: "Pan frances", category: "Panes", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 270, proteinG: 8.5, carbsG: 55, fatG: 1.5, fiberG: 2.7 }, units: [{ label: "unidad", grams: 100 }, { label: "1/2 unidad", grams: 50 }, GRAM_UNIT], aliases: ["marraqueta", "pan batido", "pan"] },
  { id: "pan-amasado", name: "Pan amasado", category: "Panes", servingLabel: "1 unidad", servingG: 110, per100g: { calories: 310, proteinG: 8, carbsG: 54, fatG: 7, fiberG: 2.4 }, units: [{ label: "unidad", grams: 110 }, { label: "1/2 unidad", grams: 55 }, GRAM_UNIT], aliases: ["pan casero", "pan"] },
  { id: "pan-molde-blanco", name: "Pan de molde blanco", category: "Panes", servingLabel: "2 rebanadas", servingG: 56, per100g: { calories: 265, proteinG: 9, carbsG: 49, fatG: 3.6, fiberG: 2.7 }, units: [{ label: "rebanada", grams: 28 }, { label: "porcion", grams: 56 }, GRAM_UNIT], aliases: ["pan molde", "pan blanco"] },
  { id: "pan-molde-integral", name: "Pan de molde integral", category: "Panes", servingLabel: "2 rebanadas", servingG: 60, per100g: { calories: 247, proteinG: 13, carbsG: 41, fatG: 4.2, fiberG: 7 }, units: [{ label: "rebanada", grams: 30 }, { label: "porcion", grams: 60 }, GRAM_UNIT], aliases: ["pan integral", "pan molde integral"] },
  { id: "pan-pita", name: "Pan pita", category: "Panes", servingLabel: "1 unidad", servingG: 60, per100g: { calories: 275, proteinG: 9, carbsG: 56, fatG: 1.2, fiberG: 2.2 }, units: [{ label: "unidad", grams: 60 }, GRAM_UNIT], aliases: ["pita", "pan arabe"] },
  { id: "tortilla-mexicana", name: "Tortilla mexicana", category: "Panes", servingLabel: "1 unidad", servingG: 45, per100g: { calories: 310, proteinG: 8, carbsG: 50, fatG: 8, fiberG: 3 }, units: [{ label: "unidad", grams: 45 }, GRAM_UNIT], aliases: ["wrap", "tortilla", "masa mexicana"] },
  { id: "dobladita", name: "Dobladita", category: "Panes", servingLabel: "1 unidad", servingG: 90, per100g: { calories: 320, proteinG: 8, carbsG: 49, fatG: 10, fiberG: 2 }, units: [{ label: "unidad", grams: 90 }, GRAM_UNIT], aliases: ["pan dobladita", "dobladitas"] },
  { id: "sopaipilla", name: "Sopaipilla", category: "Panes", servingLabel: "1 unidad", servingG: 65, per100g: { calories: 330, proteinG: 6, carbsG: 42, fatG: 15, fiberG: 2 }, units: [{ label: "unidad", grams: 65 }, GRAM_UNIT], aliases: ["sopaipa"] },
  { id: "empanada-queso", name: "Empanada de queso", category: "Panes", servingLabel: "1 unidad", servingG: 160, per100g: { calories: 310, proteinG: 11, carbsG: 28, fatG: 18, fiberG: 1.5 }, units: [{ label: "unidad", grams: 160 }, GRAM_UNIT], aliases: ["empanada queso", "empanada frita"] },
  { id: "churrasca", name: "Churrasca", category: "Panes", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 300, proteinG: 8, carbsG: 52, fatG: 7, fiberG: 2.5 }, units: [{ label: "unidad", grams: 100 }, GRAM_UNIT], aliases: ["pan churrasca"] },

  { id: "brown-rice", name: "Arroz integral cocido", category: "Cereales y arroz", servingLabel: "1 taza cocida", servingG: 160, per100g: { calories: 112, proteinG: 2.6, carbsG: 23, fatG: 0.9, fiberG: 1.8 }, units: [{ label: "taza", grams: 160 }, GRAM_UNIT], aliases: ["arroz integral"] },
  { id: "white-rice-cooked", name: "Arroz blanco cocido", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 160, per100g: { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4 }, units: [{ label: "taza", grams: 160 }, { label: "plato", grams: 250 }, GRAM_UNIT], aliases: ["arroz", "arroz cocido"] },
  { id: "tallarines-cocidos", name: "Tallarines cocidos", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 140, per100g: { calories: 158, proteinG: 5.8, carbsG: 31, fatG: 0.9, fiberG: 1.8 }, units: [{ label: "taza", grams: 140 }, { label: "plato", grams: 220 }, GRAM_UNIT], aliases: ["fideos", "pasta"] },
  { id: "pasta-integral", name: "Pasta integral cocida", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 140, per100g: { calories: 150, proteinG: 6, carbsG: 30, fatG: 1.1, fiberG: 3.9 }, units: [{ label: "taza", grams: 140 }, GRAM_UNIT], aliases: ["fideos integrales", "tallarines integrales"] },
  { id: "cereal-maiz", name: "Cereal de maiz", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 30, per100g: { calories: 370, proteinG: 7, carbsG: 84, fatG: 1, fiberG: 3 }, units: [{ label: "taza", grams: 30 }, { label: "porcion", grams: 30 }, GRAM_UNIT], aliases: ["corn flakes", "cereal"] },
  { id: "granola", name: "Granola", category: "Cereales y arroz", servingLabel: "1/2 taza", servingG: 50, per100g: { calories: 450, proteinG: 10, carbsG: 64, fatG: 16, fiberG: 7 }, units: [{ label: "1/2 taza", grams: 50 }, { label: "cucharada", grams: 12 }, GRAM_UNIT], aliases: ["granola cereal"] },
  { id: "quinoa-cocida", name: "Quinoa cocida", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 185, per100g: { calories: 120, proteinG: 4.4, carbsG: 21.3, fatG: 1.9, fiberG: 2.8 }, units: [{ label: "taza", grams: 185 }, GRAM_UNIT], aliases: ["quinua"] },
  { id: "mote-cocido", name: "Mote cocido", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 170, per100g: { calories: 125, proteinG: 4, carbsG: 27, fatG: 0.6, fiberG: 3 }, units: [{ label: "taza", grams: 170 }, GRAM_UNIT], aliases: ["mote trigo"] },
  { id: "choclo-cocido", name: "Choclo cocido", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 165, per100g: { calories: 96, proteinG: 3.4, carbsG: 21, fatG: 1.5, fiberG: 2.4 }, units: [{ label: "taza", grams: 165 }, { label: "coronta", grams: 120 }, GRAM_UNIT], aliases: ["maiz", "choclo"] },
  { id: "papas-fritas", name: "Papas fritas", category: "Cereales y arroz", servingLabel: "1 porcion", servingG: 120, per100g: { calories: 312, proteinG: 3.4, carbsG: 41, fatG: 15, fiberG: 3.8 }, units: [{ label: "porcion", grams: 120 }, { label: "plato", grams: 180 }, GRAM_UNIT], aliases: ["papas fritas caseras", "fritas"] },
  { id: "camote-cocido", name: "Camote cocido", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 200, per100g: { calories: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, fiberG: 3 }, units: [{ label: "taza", grams: 200 }, GRAM_UNIT], aliases: ["batata", "camote"] },
  { id: "zapallo-cocido", name: "Zapallo cocido", category: "Cereales y arroz", servingLabel: "1 taza", servingG: 200, per100g: { calories: 45, proteinG: 1, carbsG: 11, fatG: 0.1, fiberG: 2 }, units: [{ label: "taza", grams: 200 }, GRAM_UNIT], aliases: ["zapallo", "calabaza"] },

  { id: "posta-negra", name: "Posta negra cocida", category: "Carnes", servingLabel: "1 bistec", servingG: 150, per100g: { calories: 210, proteinG: 28, carbsG: 0, fatG: 10, fiberG: 0 }, units: [{ label: "bistec", grams: 150 }, { label: "porcion", grams: 120 }, GRAM_UNIT], aliases: ["posta negra", "vacuno"] },
  { id: "posta-rosada", name: "Posta rosada cocida", category: "Carnes", servingLabel: "1 bistec", servingG: 150, per100g: { calories: 205, proteinG: 29, carbsG: 0, fatG: 9, fiberG: 0 }, units: [{ label: "bistec", grams: 150 }, GRAM_UNIT], aliases: ["posta rosada", "vacuno"] },
  { id: "asiento", name: "Asiento cocido", category: "Carnes", servingLabel: "1 bistec", servingG: 150, per100g: { calories: 215, proteinG: 28, carbsG: 0, fatG: 11, fiberG: 0 }, units: [{ label: "bistec", grams: 150 }, GRAM_UNIT], aliases: ["asiento picana", "vacuno"] },
  { id: "lomo-liso", name: "Lomo liso", category: "Carnes", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 240, proteinG: 27, carbsG: 0, fatG: 14, fiberG: 0 }, units: [{ label: "porcion", grams: 150 }, { label: "bistec", grams: 150 }, GRAM_UNIT], aliases: ["lomo", "vacuno"] },
  { id: "filete-vacuno", name: "Filete de vacuno", category: "Carnes", servingLabel: "1 medallon", servingG: 150, per100g: { calories: 190, proteinG: 29, carbsG: 0, fatG: 8, fiberG: 0 }, units: [{ label: "medallon", grams: 150 }, GRAM_UNIT], aliases: ["filete", "vacuno"] },
  { id: "plateada", name: "Plateada cocida", category: "Carnes", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 285, proteinG: 25, carbsG: 0, fatG: 20, fiberG: 0 }, units: [{ label: "porcion", grams: 150 }, GRAM_UNIT], aliases: ["plateada", "vacuno"] },
  { id: "osobuco", name: "Osobuco cocido", category: "Carnes", servingLabel: "1 porcion", servingG: 180, per100g: { calories: 230, proteinG: 25, carbsG: 0, fatG: 14, fiberG: 0 }, units: [{ label: "porcion", grams: 180 }, GRAM_UNIT], aliases: ["osso buco", "vacuno"] },
  { id: "carne-mechada", name: "Carne mechada", category: "Carnes", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 235, proteinG: 27, carbsG: 1, fatG: 13, fiberG: 0 }, units: [{ label: "porcion", grams: 150 }, GRAM_UNIT], aliases: ["mechada", "vacuno"] },
  { id: "hamburguesa-casera", name: "Hamburguesa casera", category: "Carnes", servingLabel: "1 unidad", servingG: 120, per100g: { calories: 245, proteinG: 22, carbsG: 2, fatG: 16, fiberG: 0 }, units: [{ label: "unidad", grams: 120 }, GRAM_UNIT], aliases: ["hamburguesa", "burger"] },
  { id: "vienesa", name: "Vienesa", category: "Carnes", servingLabel: "1 unidad", servingG: 50, per100g: { calories: 290, proteinG: 11, carbsG: 3, fatG: 25, fiberG: 0 }, units: [{ label: "unidad", grams: 50 }, GRAM_UNIT], aliases: ["salchicha", "vienesa completo"] },
  { id: "longaniza", name: "Longaniza", category: "Carnes", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 330, proteinG: 16, carbsG: 2, fatG: 29, fiberG: 0 }, units: [{ label: "unidad", grams: 100 }, GRAM_UNIT], aliases: ["longanicilla", "chorizo"] },
  { id: "prieta", name: "Prieta", category: "Carnes", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 300, proteinG: 14, carbsG: 9, fatG: 23, fiberG: 1 }, units: [{ label: "unidad", grams: 100 }, GRAM_UNIT], aliases: ["morcilla"] },

  { id: "tuto-pollo", name: "Tuto de pollo cocido", category: "Pollo y pavo", servingLabel: "1 tuto", servingG: 120, per100g: { calories: 209, proteinG: 26, carbsG: 0, fatG: 10.9, fiberG: 0 }, units: [{ label: "tuto", grams: 120 }, GRAM_UNIT], aliases: ["pollo", "trutro", "pierna pollo"] },
  { id: "pollo-asado", name: "Pollo asado", category: "Pollo y pavo", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 215, proteinG: 27, carbsG: 0, fatG: 11, fiberG: 0 }, units: [{ label: "porcion", grams: 150 }, GRAM_UNIT], aliases: ["pollo rostizado", "pollo"] },
  { id: "pollo-cocido", name: "Pollo cocido", category: "Pollo y pavo", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 190, proteinG: 29, carbsG: 0, fatG: 7, fiberG: 0 }, units: [{ label: "porcion", grams: 150 }, GRAM_UNIT], aliases: ["pollo hervido", "pollo"] },
  { id: "pollo-apanado", name: "Pollo apanado", category: "Pollo y pavo", servingLabel: "1 porcion", servingG: 150, per100g: { calories: 260, proteinG: 22, carbsG: 16, fatG: 13, fiberG: 1 }, units: [{ label: "porcion", grams: 150 }, GRAM_UNIT], aliases: ["pollo empanizado", "milanesa pollo"] },
  { id: "pavo-cocido", name: "Pavo cocido", category: "Pollo y pavo", servingLabel: "1 porcion", servingG: 120, per100g: { calories: 135, proteinG: 29, carbsG: 0, fatG: 1.5, fiberG: 0 }, units: [{ label: "porcion", grams: 120 }, GRAM_UNIT], aliases: ["pavo"] },
  { id: "pechuga-pavo", name: "Pechuga de pavo", category: "Pollo y pavo", servingLabel: "1 porcion", servingG: 120, per100g: { calories: 135, proteinG: 29, carbsG: 0, fatG: 1.5, fiberG: 0 }, units: [{ label: "porcion", grams: 120 }, GRAM_UNIT], aliases: ["pavo", "pechuga pavo"] },
  { id: "jamon-pavo", name: "Jamon de pavo", category: "Pollo y pavo", servingLabel: "2 laminas", servingG: 40, per100g: { calories: 105, proteinG: 17, carbsG: 3, fatG: 3, fiberG: 0 }, units: [{ label: "lamina", grams: 20 }, { label: "porcion", grams: 40 }, GRAM_UNIT], aliases: ["jamon pavo", "fiambre pavo"] },

  { id: "atun-aceite", name: "Atun en aceite drenado", category: "Pescados y mariscos", servingLabel: "1 lata drenada", servingG: 120, per100g: { calories: 190, proteinG: 25, carbsG: 0, fatG: 9, fiberG: 0 }, units: [{ label: "lata", grams: 120 }, GRAM_UNIT], aliases: ["atun aceite", "atún en aceite"] },
  { id: "salmon-cocido", name: "Salmon cocido", category: "Pescados y mariscos", servingLabel: "1 filete", servingG: 150, per100g: { calories: 206, proteinG: 22, carbsG: 0, fatG: 12, fiberG: 0 }, units: [{ label: "filete", grams: 150 }, GRAM_UNIT], aliases: ["salmon", "salmón"] },
  { id: "reineta", name: "Reineta cocida", category: "Pescados y mariscos", servingLabel: "1 filete", servingG: 150, per100g: { calories: 110, proteinG: 22, carbsG: 0, fatG: 2, fiberG: 0 }, units: [{ label: "filete", grams: 150 }, GRAM_UNIT], aliases: ["reineta"] },
  { id: "merluza", name: "Merluza cocida", category: "Pescados y mariscos", servingLabel: "1 filete", servingG: 150, per100g: { calories: 105, proteinG: 21, carbsG: 0, fatG: 2, fiberG: 0 }, units: [{ label: "filete", grams: 150 }, GRAM_UNIT], aliases: ["merluza", "pescada"] },
  { id: "congrio", name: "Congrio cocido", category: "Pescados y mariscos", servingLabel: "1 filete", servingG: 150, per100g: { calories: 120, proteinG: 22, carbsG: 0, fatG: 3, fiberG: 0 }, units: [{ label: "filete", grams: 150 }, GRAM_UNIT], aliases: ["congrio"] },
  { id: "camarones", name: "Camarones cocidos", category: "Pescados y mariscos", servingLabel: "1 taza", servingG: 120, per100g: { calories: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3, fiberG: 0 }, units: [{ label: "taza", grams: 120 }, { label: "porcion", grams: 100 }, GRAM_UNIT], aliases: ["camaron", "shrimp"] },
  { id: "choritos", name: "Choritos cocidos", category: "Pescados y mariscos", servingLabel: "1 taza", servingG: 150, per100g: { calories: 86, proteinG: 12, carbsG: 4, fatG: 2.2, fiberG: 0 }, units: [{ label: "taza", grams: 150 }, GRAM_UNIT], aliases: ["mejillones", "choritos"] },
  { id: "machas", name: "Machas cocidas", category: "Pescados y mariscos", servingLabel: "1 porcion", servingG: 120, per100g: { calories: 90, proteinG: 15, carbsG: 5, fatG: 1.5, fiberG: 0 }, units: [{ label: "porcion", grams: 120 }, GRAM_UNIT], aliases: ["machas"] },
  { id: "mariscos-surtidos", name: "Mariscos surtidos", category: "Pescados y mariscos", servingLabel: "1 taza", servingG: 150, per100g: { calories: 95, proteinG: 16, carbsG: 4, fatG: 2, fiberG: 0 }, units: [{ label: "taza", grams: 150 }, GRAM_UNIT], aliases: ["surtido mariscos", "mariscos"] },

  { id: "egg-white", name: "Clara de huevo", category: "Huevos", servingLabel: "3 claras", servingG: 100, per100g: { calories: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2, fiberG: 0 }, units: [{ label: "clara", grams: 33 }, { label: "porcion", grams: 100 }, GRAM_UNIT], aliases: ["clara", "claras", "huevo"] },
  { id: "egg-yolk", name: "Yema de huevo", category: "Huevos", servingLabel: "1 yema", servingG: 17, per100g: { calories: 322, proteinG: 16, carbsG: 3.6, fatG: 27, fiberG: 0 }, units: [{ label: "yema", grams: 17 }, GRAM_UNIT], aliases: ["yema", "huevo"] },
  { id: "egg-scrambled", name: "Huevo revuelto", category: "Huevos", servingLabel: "2 huevos", servingG: 110, per100g: { calories: 168, proteinG: 11, carbsG: 1.5, fatG: 13, fiberG: 0 }, units: [{ label: "porcion", grams: 110 }, { label: "huevo", grams: 55 }, GRAM_UNIT], aliases: ["huevos revueltos", "revuelto"] },
  { id: "egg-boiled", name: "Huevo duro", category: "Huevos", servingLabel: "1 unidad", servingG: 50, per100g: { calories: 155, proteinG: 13, carbsG: 1.1, fatG: 11, fiberG: 0 }, units: [{ label: "unidad", grams: 50 }, { label: "huevo", grams: 50 }, GRAM_UNIT], aliases: ["huevo cocido", "huevo duro"] },
  { id: "omelette-simple", name: "Omelette simple", category: "Huevos", servingLabel: "1 omelette", servingG: 120, per100g: { calories: 170, proteinG: 12, carbsG: 1.5, fatG: 13, fiberG: 0 }, units: [{ label: "omelette", grams: 120 }, GRAM_UNIT], aliases: ["omelet", "tortilla huevo"] },

  { id: "semi-skim-milk", name: "Leche semidescremada", category: "Lacteos", servingLabel: "1 vaso", servingG: 200, per100g: { calories: 50, proteinG: 3.4, carbsG: 4.8, fatG: 1.9, fiberG: 0 }, units: [{ label: "vaso", grams: 200 }, { label: "taza", grams: 240 }, { label: "ml", grams: 1 }], aliases: ["leche semi", "leche"] },
  { id: "lactose-free-milk", name: "Leche sin lactosa", category: "Lacteos", servingLabel: "1 vaso", servingG: 200, per100g: { calories: 45, proteinG: 3.2, carbsG: 4.8, fatG: 1.4, fiberG: 0 }, units: [{ label: "vaso", grams: 200 }, { label: "ml", grams: 1 }], aliases: ["sin lactosa", "leche"] },
  { id: "protein-yogurt", name: "Yogur protein", category: "Lacteos", servingLabel: "1 pote", servingG: 155, per100g: { calories: 75, proteinG: 10, carbsG: 6, fatG: 1, fiberG: 0 }, units: [{ label: "pote", grams: 155 }, GRAM_UNIT], aliases: ["yogur proteico", "protein yogurt"] },
  { id: "greek-yogurt", name: "Yogur griego", category: "Lacteos", servingLabel: "1 pote", servingG: 170, per100g: { calories: 73, proteinG: 10, carbsG: 3.6, fatG: 1.9, fiberG: 0 }, units: [{ label: "pote", grams: 170 }, { label: "taza", grams: 245 }, GRAM_UNIT], aliases: ["yogur griego", "yogurt griego"] },
  { id: "queso-gauda", name: "Queso gauda", category: "Lacteos", servingLabel: "1 lamina", servingG: 25, per100g: { calories: 356, proteinG: 25, carbsG: 2, fatG: 27, fiberG: 0 }, units: [{ label: "lamina", grams: 25 }, GRAM_UNIT], aliases: ["gauda", "queso gouda"] },
  { id: "queso-mantecoso", name: "Queso mantecoso", category: "Lacteos", servingLabel: "1 lamina", servingG: 25, per100g: { calories: 360, proteinG: 22, carbsG: 2, fatG: 29, fiberG: 0 }, units: [{ label: "lamina", grams: 25 }, GRAM_UNIT], aliases: ["mantecoso", "queso"] },
  { id: "queso-crema", name: "Queso crema", category: "Lacteos", servingLabel: "1 cucharada", servingG: 15, per100g: { calories: 342, proteinG: 6, carbsG: 4, fatG: 34, fiberG: 0 }, units: [{ label: "cucharada", grams: 15 }, GRAM_UNIT], aliases: ["cream cheese"] },
  { id: "crema", name: "Crema", category: "Lacteos", servingLabel: "1 cucharada", servingG: 15, per100g: { calories: 340, proteinG: 2, carbsG: 3, fatG: 35, fiberG: 0 }, units: [{ label: "cucharada", grams: 15 }, { label: "taza", grams: 240 }, GRAM_UNIT], aliases: ["crema de leche"] },
  { id: "manjar", name: "Manjar", category: "Lacteos", servingLabel: "1 cucharada", servingG: 20, per100g: { calories: 315, proteinG: 6, carbsG: 55, fatG: 7, fiberG: 0 }, units: [{ label: "cucharada", grams: 20 }, GRAM_UNIT], aliases: ["dulce de leche"] },

  { id: "mandarin", name: "Mandarina", category: "Frutas", servingLabel: "1 unidad", servingG: 90, per100g: { calories: 53, proteinG: 0.8, carbsG: 13, fatG: 0.3, fiberG: 1.8 }, units: [{ label: "unidad", grams: 90 }, GRAM_UNIT], aliases: ["mandarina"] },
  { id: "pear", name: "Pera", category: "Frutas", servingLabel: "1 unidad", servingG: 170, per100g: { calories: 57, proteinG: 0.4, carbsG: 15, fatG: 0.1, fiberG: 3.1 }, units: [{ label: "unidad", grams: 170 }, GRAM_UNIT], aliases: ["pera"] },
  { id: "strawberry", name: "Frutilla", category: "Frutas", servingLabel: "1 taza", servingG: 150, per100g: { calories: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2 }, units: [{ label: "taza", grams: 150 }, { label: "unidad", grams: 12 }, GRAM_UNIT], aliases: ["frutilla", "fresa"] },
  { id: "blueberry", name: "Arandanos", category: "Frutas", servingLabel: "1 taza", servingG: 140, per100g: { calories: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3, fiberG: 2.4 }, units: [{ label: "taza", grams: 140 }, GRAM_UNIT], aliases: ["arandano", "berries"] },
  { id: "raspberry", name: "Frambuesa", category: "Frutas", servingLabel: "1 taza", servingG: 120, per100g: { calories: 52, proteinG: 1.2, carbsG: 12, fatG: 0.7, fiberG: 6.5 }, units: [{ label: "taza", grams: 120 }, GRAM_UNIT], aliases: ["frambuesas", "berries"] },
  { id: "grape", name: "Uva", category: "Frutas", servingLabel: "1 taza", servingG: 150, per100g: { calories: 69, proteinG: 0.7, carbsG: 18, fatG: 0.2, fiberG: 0.9 }, units: [{ label: "taza", grams: 150 }, GRAM_UNIT], aliases: ["uvas"] },
  { id: "kiwi", name: "Kiwi", category: "Frutas", servingLabel: "1 unidad", servingG: 75, per100g: { calories: 61, proteinG: 1.1, carbsG: 15, fatG: 0.5, fiberG: 3 }, units: [{ label: "unidad", grams: 75 }, GRAM_UNIT], aliases: ["kiwi"] },
  { id: "melon", name: "Melon", category: "Frutas", servingLabel: "1 taza", servingG: 160, per100g: { calories: 34, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, fiberG: 0.9 }, units: [{ label: "taza", grams: 160 }, { label: "trozo", grams: 120 }, GRAM_UNIT], aliases: ["melon"] },
  { id: "watermelon", name: "Sandia", category: "Frutas", servingLabel: "1 taza", servingG: 150, per100g: { calories: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2, fiberG: 0.4 }, units: [{ label: "taza", grams: 150 }, { label: "trozo", grams: 250 }, GRAM_UNIT], aliases: ["sandia"] },
  { id: "pineapple", name: "Pina", category: "Frutas", servingLabel: "1 taza", servingG: 165, per100g: { calories: 50, proteinG: 0.5, carbsG: 13, fatG: 0.1, fiberG: 1.4 }, units: [{ label: "taza", grams: 165 }, { label: "rodaja", grams: 80 }, GRAM_UNIT], aliases: ["pina", "piña", "anana"] },
  { id: "peach", name: "Durazno", category: "Frutas", servingLabel: "1 unidad", servingG: 150, per100g: { calories: 39, proteinG: 0.9, carbsG: 9.5, fatG: 0.3, fiberG: 1.5 }, units: [{ label: "unidad", grams: 150 }, GRAM_UNIT], aliases: ["durazno", "melocoton"] },
  { id: "plum", name: "Ciruela", category: "Frutas", servingLabel: "1 unidad", servingG: 65, per100g: { calories: 46, proteinG: 0.7, carbsG: 11, fatG: 0.3, fiberG: 1.4 }, units: [{ label: "unidad", grams: 65 }, GRAM_UNIT], aliases: ["ciruela"] },
  { id: "lemon", name: "Limon", category: "Frutas", servingLabel: "1 unidad", servingG: 60, per100g: { calories: 29, proteinG: 1.1, carbsG: 9, fatG: 0.3, fiberG: 2.8 }, units: [{ label: "unidad", grams: 60 }, { label: "cucharada jugo", grams: 15 }, GRAM_UNIT], aliases: ["limon", "limón"] },

  { id: "onion", name: "Cebolla", category: "Verduras", servingLabel: "1/2 unidad", servingG: 55, per100g: { calories: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7 }, units: [{ label: "unidad", grams: 110 }, { label: "1/2 unidad", grams: 55 }, GRAM_UNIT], aliases: ["cebolla"] },
  { id: "carrot", name: "Zanahoria", category: "Verduras", servingLabel: "1 unidad", servingG: 70, per100g: { calories: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2, fiberG: 2.8 }, units: [{ label: "unidad", grams: 70 }, { label: "taza", grams: 120 }, GRAM_UNIT], aliases: ["zanahoria"] },
  { id: "cucumber", name: "Pepino", category: "Verduras", servingLabel: "1/2 unidad", servingG: 100, per100g: { calories: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5 }, units: [{ label: "1/2 unidad", grams: 100 }, { label: "unidad", grams: 200 }, GRAM_UNIT], aliases: ["pepino"] },
  { id: "beetroot", name: "Betarraga", category: "Verduras", servingLabel: "1 unidad", servingG: 100, per100g: { calories: 43, proteinG: 1.6, carbsG: 10, fatG: 0.2, fiberG: 2.8 }, units: [{ label: "unidad", grams: 100 }, { label: "taza", grams: 135 }, GRAM_UNIT], aliases: ["betarraga", "remolacha"] },
  { id: "broccoli", name: "Brocoli cocido", category: "Verduras", servingLabel: "1 taza", servingG: 150, per100g: { calories: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4, fiberG: 3.3 }, units: [{ label: "taza", grams: 150 }, GRAM_UNIT], aliases: ["brocoli", "brócoli"] },
  { id: "cauliflower", name: "Coliflor cocida", category: "Verduras", servingLabel: "1 taza", servingG: 125, per100g: { calories: 25, proteinG: 1.9, carbsG: 5, fatG: 0.3, fiberG: 2 }, units: [{ label: "taza", grams: 125 }, GRAM_UNIT], aliases: ["coliflor"] },
  { id: "cabbage", name: "Repollo", category: "Verduras", servingLabel: "1 taza", servingG: 90, per100g: { calories: 25, proteinG: 1.3, carbsG: 5.8, fatG: 0.1, fiberG: 2.5 }, units: [{ label: "taza", grams: 90 }, GRAM_UNIT], aliases: ["repollo"] },
  { id: "spinach", name: "Espinaca", category: "Verduras", servingLabel: "1 taza", servingG: 30, per100g: { calories: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, fiberG: 2.2 }, units: [{ label: "taza", grams: 30 }, GRAM_UNIT], aliases: ["espinaca"] },
  { id: "chard", name: "Acelga", category: "Verduras", servingLabel: "1 taza cocida", servingG: 175, per100g: { calories: 19, proteinG: 1.8, carbsG: 3.7, fatG: 0.2, fiberG: 1.6 }, units: [{ label: "taza", grams: 175 }, GRAM_UNIT], aliases: ["acelga"] },
  { id: "zucchini", name: "Zapallo italiano", category: "Verduras", servingLabel: "1 unidad", servingG: 180, per100g: { calories: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fiberG: 1 }, units: [{ label: "unidad", grams: 180 }, { label: "taza", grams: 120 }, GRAM_UNIT], aliases: ["zucchini", "zapallo italiano"] },
  { id: "bell-pepper", name: "Pimenton", category: "Verduras", servingLabel: "1 unidad", servingG: 120, per100g: { calories: 31, proteinG: 1, carbsG: 6, fatG: 0.3, fiberG: 2.1 }, units: [{ label: "unidad", grams: 120 }, { label: "taza", grams: 90 }, GRAM_UNIT], aliases: ["pimenton", "pimiento"] },
  { id: "mushrooms", name: "Champinones", category: "Verduras", servingLabel: "1 taza", servingG: 70, per100g: { calories: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fiberG: 1 }, units: [{ label: "taza", grams: 70 }, GRAM_UNIT], aliases: ["champiñones", "hongos"] },
  { id: "green-beans", name: "Porotos verdes", category: "Verduras", servingLabel: "1 taza", servingG: 125, per100g: { calories: 31, proteinG: 1.8, carbsG: 7, fatG: 0.2, fiberG: 3.4 }, units: [{ label: "taza", grams: 125 }, GRAM_UNIT], aliases: ["porotos verdes", "ejotes"] },
  { id: "celery", name: "Apio", category: "Verduras", servingLabel: "1 taza", servingG: 100, per100g: { calories: 16, proteinG: 0.7, carbsG: 3, fatG: 0.2, fiberG: 1.6 }, units: [{ label: "taza", grams: 100 }, { label: "tallo", grams: 40 }, GRAM_UNIT], aliases: ["apio"] },
  { id: "garlic", name: "Ajo", category: "Verduras", servingLabel: "1 diente", servingG: 3, per100g: { calories: 149, proteinG: 6.4, carbsG: 33, fatG: 0.5, fiberG: 2.1 }, units: [{ label: "diente", grams: 3 }, GRAM_UNIT], aliases: ["ajo"] },

  { id: "porotos-granados", name: "Porotos granados", category: "Legumbres", servingLabel: "1 plato", servingG: 350, per100g: { calories: 105, proteinG: 5.5, carbsG: 18, fatG: 1.8, fiberG: 4.5 }, units: [{ label: "plato", grams: 350 }, { label: "taza", grams: 220 }, GRAM_UNIT], aliases: ["granados", "porotos con mazamorra"] },
  { id: "peas", name: "Arvejas", category: "Legumbres", servingLabel: "1 taza", servingG: 160, per100g: { calories: 84, proteinG: 5.4, carbsG: 15, fatG: 0.4, fiberG: 5.5 }, units: [{ label: "taza", grams: 160 }, GRAM_UNIT], aliases: ["arvejas", "guisantes"] },
  { id: "habas", name: "Habas cocidas", category: "Legumbres", servingLabel: "1 taza", servingG: 170, per100g: { calories: 110, proteinG: 7.6, carbsG: 20, fatG: 0.4, fiberG: 5.4 }, units: [{ label: "taza", grams: 170 }, GRAM_UNIT], aliases: ["habas"] },

  { id: "almonds", name: "Almendras", category: "Frutos secos", servingLabel: "1 punado", servingG: 28, per100g: { calories: 579, proteinG: 21, carbsG: 22, fatG: 50, fiberG: 12.5 }, units: [{ label: "punado", grams: 28 }, GRAM_UNIT], aliases: ["almendras"] },
  { id: "walnuts", name: "Nueces", category: "Frutos secos", servingLabel: "1 punado", servingG: 28, per100g: { calories: 654, proteinG: 15, carbsG: 14, fatG: 65, fiberG: 6.7 }, units: [{ label: "punado", grams: 28 }, GRAM_UNIT], aliases: ["nueces"] },
  { id: "peanuts", name: "Mani", category: "Frutos secos", servingLabel: "1 punado", servingG: 28, per100g: { calories: 567, proteinG: 26, carbsG: 16, fatG: 49, fiberG: 8.5 }, units: [{ label: "punado", grams: 28 }, GRAM_UNIT], aliases: ["mani", "cacahuate"] },
  { id: "cashews", name: "Castanas de caju", category: "Frutos secos", servingLabel: "1 punado", servingG: 28, per100g: { calories: 553, proteinG: 18, carbsG: 30, fatG: 44, fiberG: 3.3 }, units: [{ label: "punado", grams: 28 }, GRAM_UNIT], aliases: ["caju", "cashew"] },
  { id: "pistachios", name: "Pistachos", category: "Frutos secos", servingLabel: "1 punado", servingG: 28, per100g: { calories: 560, proteinG: 20, carbsG: 28, fatG: 45, fiberG: 10 }, units: [{ label: "punado", grams: 28 }, GRAM_UNIT], aliases: ["pistacho"] },
  { id: "chia", name: "Semillas de chia", category: "Frutos secos", servingLabel: "1 cucharada", servingG: 12, per100g: { calories: 486, proteinG: 17, carbsG: 42, fatG: 31, fiberG: 34 }, units: [{ label: "cucharada", grams: 12 }, GRAM_UNIT], aliases: ["chia", "chía"] },
  { id: "flaxseed", name: "Semillas de linaza", category: "Frutos secos", servingLabel: "1 cucharada", servingG: 10, per100g: { calories: 534, proteinG: 18, carbsG: 29, fatG: 42, fiberG: 27 }, units: [{ label: "cucharada", grams: 10 }, GRAM_UNIT], aliases: ["linaza"] },
  { id: "sunflower-seeds", name: "Semillas de maravilla", category: "Frutos secos", servingLabel: "1 cucharada", servingG: 10, per100g: { calories: 584, proteinG: 21, carbsG: 20, fatG: 51, fiberG: 8.6 }, units: [{ label: "cucharada", grams: 10 }, GRAM_UNIT], aliases: ["maravilla", "semillas girasol"] },

  { id: "olive-oil", name: "Aceite de oliva", category: "Aceites y grasas", servingLabel: "1 cucharada", servingG: 14, per100g: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 }, units: [{ label: "cucharada", grams: 14 }, { label: "cucharadita", grams: 5 }, GRAM_UNIT], aliases: ["aceite oliva"] },
  { id: "vegetable-oil", name: "Aceite vegetal", category: "Aceites y grasas", servingLabel: "1 cucharada", servingG: 14, per100g: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 }, units: [{ label: "cucharada", grams: 14 }, { label: "cucharadita", grams: 5 }, GRAM_UNIT], aliases: ["aceite"] },
  { id: "margarine", name: "Margarina", category: "Aceites y grasas", servingLabel: "1 cucharadita", servingG: 5, per100g: { calories: 717, proteinG: 0.2, carbsG: 0.7, fatG: 80, fiberG: 0 }, units: [{ label: "cucharadita", grams: 5 }, { label: "cucharada", grams: 14 }, GRAM_UNIT], aliases: ["margarina"] },
  { id: "peanut-butter", name: "Mantequilla de mani", category: "Aceites y grasas", servingLabel: "1 cucharada", servingG: 16, per100g: { calories: 588, proteinG: 25, carbsG: 20, fatG: 50, fiberG: 6 }, units: [{ label: "cucharada", grams: 16 }, GRAM_UNIT], aliases: ["mantequilla mani", "peanut butter"] },

  { id: "water", name: "Agua", category: "Bebidas", servingLabel: "1 vaso", servingG: 250, per100g: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "vaso", grams: 250 }, { label: "ml", grams: 1 }], aliases: ["agua"] },
  { id: "cola-normal", name: "Bebida cola normal", category: "Bebidas", servingLabel: "1 lata", servingG: 350, per100g: { calories: 42, proteinG: 0, carbsG: 10.6, fatG: 0, fiberG: 0 }, units: [{ label: "lata", grams: 350 }, { label: "vaso", grams: 250 }, { label: "ml", grams: 1 }], aliases: ["coca", "coca cola", "cola", "bebida"] },
  { id: "cola-zero", name: "Bebida cola zero", category: "Bebidas", servingLabel: "1 lata", servingG: 350, per100g: { calories: 1, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "lata", grams: 350 }, { label: "vaso", grams: 250 }, { label: "ml", grams: 1 }], aliases: ["coca zero", "cola zero", "bebida zero"] },
  { id: "gaseosa-zero", name: "Bebida gaseosa zero", category: "Bebidas", servingLabel: "1 lata", servingG: 350, per100g: { calories: 1, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "lata", grams: 350 }, { label: "ml", grams: 1 }], aliases: ["sprite zero", "fanta zero", "bebida zero"] },
  { id: "coffee", name: "Cafe", category: "Bebidas", servingLabel: "1 taza", servingG: 200, per100g: { calories: 1, proteinG: 0.1, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "taza", grams: 200 }, { label: "ml", grams: 1 }], aliases: ["cafe", "café"] },
  { id: "tea", name: "Te", category: "Bebidas", servingLabel: "1 taza", servingG: 200, per100g: { calories: 1, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "taza", grams: 200 }, { label: "ml", grams: 1 }], aliases: ["te", "té"] },
  { id: "chocolate-milk", name: "Leche con chocolate", category: "Bebidas", servingLabel: "1 vaso", servingG: 200, per100g: { calories: 82, proteinG: 3.4, carbsG: 12, fatG: 2, fiberG: 0.5 }, units: [{ label: "vaso", grams: 200 }, { label: "ml", grams: 1 }], aliases: ["leche chocolate", "chocolatada"] },
  { id: "isotonic-drink", name: "Bebida isotonica", category: "Bebidas", servingLabel: "1 botella", servingG: 500, per100g: { calories: 24, proteinG: 0, carbsG: 6, fatG: 0, fiberG: 0 }, units: [{ label: "botella", grams: 500 }, { label: "ml", grams: 1 }], aliases: ["gatorade", "powerade", "isotonica"] },

  { id: "cazuela-vacuno", name: "Cazuela de vacuno", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 480, per100g: { calories: 88, proteinG: 7, carbsG: 9, fatG: 2.8, fiberG: 1.4 }, units: [{ label: "plato", grams: 480 }, GRAM_UNIT], aliases: ["cazuela vacuno"] },
  { id: "cazuela-pollo", name: "Cazuela de pollo", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 450, per100g: { calories: 82, proteinG: 6, carbsG: 9, fatG: 2.5, fiberG: 1.4 }, units: [{ label: "plato", grams: 450 }, GRAM_UNIT], aliases: ["cazuela pollo"] },
  { id: "pastel-choclo", name: "Pastel de choclo", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 350, per100g: { calories: 160, proteinG: 8, carbsG: 20, fatG: 6, fiberG: 2 }, units: [{ label: "plato", grams: 350 }, GRAM_UNIT], aliases: ["pastel choclo"] },
  { id: "humitas", name: "Humitas", category: "Comidas chilenas", servingLabel: "1 unidad", servingG: 220, per100g: { calories: 150, proteinG: 4, carbsG: 28, fatG: 3, fiberG: 2.5 }, units: [{ label: "unidad", grams: 220 }, GRAM_UNIT], aliases: ["humita"] },
  { id: "porotos-riendas", name: "Porotos con riendas", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 400, per100g: { calories: 135, proteinG: 6, carbsG: 22, fatG: 2.5, fiberG: 5 }, units: [{ label: "plato", grams: 400 }, GRAM_UNIT], aliases: ["porotos con tallarines", "riendas"] },
  { id: "lentejas-arroz", name: "Lentejas con arroz", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 380, per100g: { calories: 130, proteinG: 6, carbsG: 23, fatG: 1.5, fiberG: 5 }, units: [{ label: "plato", grams: 380 }, GRAM_UNIT], aliases: ["lentejas arroz"] },
  { id: "garbanzos-guisados", name: "Garbanzos guisados", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 350, per100g: { calories: 145, proteinG: 7, carbsG: 23, fatG: 3, fiberG: 6 }, units: [{ label: "plato", grams: 350 }, GRAM_UNIT], aliases: ["guiso garbanzos"] },
  { id: "carbonada", name: "Carbonada", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 420, per100g: { calories: 90, proteinG: 6, carbsG: 12, fatG: 2.2, fiberG: 1.8 }, units: [{ label: "plato", grams: 420 }, GRAM_UNIT], aliases: ["carbonada chilena"] },
  { id: "completo-italiano", name: "Completo italiano", category: "Comidas chilenas", servingLabel: "1 unidad", servingG: 250, per100g: { calories: 290, proteinG: 8, carbsG: 24, fatG: 18, fiberG: 2.5 }, units: [{ label: "unidad", grams: 250 }, GRAM_UNIT], aliases: ["completo", "italiano"] },
  { id: "completo-dinamico", name: "Completo dinamico", category: "Comidas chilenas", servingLabel: "1 unidad", servingG: 260, per100g: { calories: 300, proteinG: 8, carbsG: 25, fatG: 19, fiberG: 2.5 }, units: [{ label: "unidad", grams: 260 }, GRAM_UNIT], aliases: ["completo dinamico"] },
  { id: "chacarero", name: "Chacarero", category: "Comidas chilenas", servingLabel: "1 sandwich", servingG: 330, per100g: { calories: 250, proteinG: 14, carbsG: 25, fatG: 11, fiberG: 3 }, units: [{ label: "sandwich", grams: 330 }, GRAM_UNIT], aliases: ["sandwich chacarero"] },
  { id: "barros-luco", name: "Barros luco", category: "Comidas chilenas", servingLabel: "1 sandwich", servingG: 300, per100g: { calories: 295, proteinG: 16, carbsG: 25, fatG: 15, fiberG: 2 }, units: [{ label: "sandwich", grams: 300 }, GRAM_UNIT], aliases: ["barros luco"] },
  { id: "ensalada-surtida", name: "Ensalada surtida", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 220, per100g: { calories: 35, proteinG: 1.2, carbsG: 6, fatG: 0.8, fiberG: 2.2 }, units: [{ label: "plato", grams: 220 }, GRAM_UNIT], aliases: ["ensalada mixta", "ensalada"] },
  { id: "tortilla-papas", name: "Tortilla de papas", category: "Comidas chilenas", servingLabel: "1 porcion", servingG: 180, per100g: { calories: 190, proteinG: 6, carbsG: 18, fatG: 10, fiberG: 2 }, units: [{ label: "porcion", grams: 180 }, GRAM_UNIT], aliases: ["tortilla española", "tortilla papas"] },
  { id: "pantrucas", name: "Pantrucas", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 420, per100g: { calories: 105, proteinG: 6, carbsG: 16, fatG: 2, fiberG: 1 }, units: [{ label: "plato", grams: 420 }, GRAM_UNIT], aliases: ["pancutras"] },
  { id: "sopaipillas-pasadas", name: "Sopaipillas pasadas", category: "Comidas chilenas", servingLabel: "2 unidades", servingG: 180, per100g: { calories: 280, proteinG: 4, carbsG: 52, fatG: 7, fiberG: 2 }, units: [{ label: "unidad", grams: 90 }, { label: "porcion", grams: 180 }, GRAM_UNIT], aliases: ["sopaipillas chancaca"] },
  { id: "caldillo-congrio", name: "Caldillo de congrio", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 420, per100g: { calories: 80, proteinG: 8, carbsG: 7, fatG: 2, fiberG: 1 }, units: [{ label: "plato", grams: 420 }, GRAM_UNIT], aliases: ["caldillo"] },
  { id: "arroz-pollo", name: "Arroz con pollo", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 350, per100g: { calories: 155, proteinG: 10, carbsG: 21, fatG: 3.5, fiberG: 1 }, units: [{ label: "plato", grams: 350 }, GRAM_UNIT], aliases: ["pollo con arroz"] },
  { id: "pollo-papas", name: "Pollo con papas", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 380, per100g: { calories: 160, proteinG: 13, carbsG: 17, fatG: 5, fiberG: 2 }, units: [{ label: "plato", grams: 380 }, GRAM_UNIT], aliases: ["pollo papas"] },
  { id: "carne-arroz", name: "Carne con arroz", category: "Comidas chilenas", servingLabel: "1 plato", servingG: 350, per100g: { calories: 180, proteinG: 13, carbsG: 22, fatG: 5, fiberG: 1 }, units: [{ label: "plato", grams: 350 }, GRAM_UNIT], aliases: ["bistec arroz"] },

  { id: "galletas-agua", name: "Galletas de agua", category: "Snacks", servingLabel: "6 unidades", servingG: 36, per100g: { calories: 430, proteinG: 10, carbsG: 72, fatG: 10, fiberG: 3 }, units: [{ label: "unidad", grams: 6 }, { label: "porcion", grams: 36 }, GRAM_UNIT], aliases: ["galletas agua", "crackers"] },
  { id: "galletas-dulces", name: "Galletas dulces", category: "Snacks", servingLabel: "4 unidades", servingG: 40, per100g: { calories: 480, proteinG: 6, carbsG: 68, fatG: 20, fiberG: 2 }, units: [{ label: "unidad", grams: 10 }, { label: "porcion", grams: 40 }, GRAM_UNIT], aliases: ["galletas"] },
  { id: "chocolate", name: "Chocolate", category: "Snacks", servingLabel: "1 barra pequena", servingG: 30, per100g: { calories: 540, proteinG: 6, carbsG: 58, fatG: 31, fiberG: 5 }, units: [{ label: "barra", grams: 30 }, { label: "cuadrado", grams: 10 }, GRAM_UNIT], aliases: ["chocolate"] },
  { id: "helado", name: "Helado", category: "Snacks", servingLabel: "1 taza", servingG: 130, per100g: { calories: 207, proteinG: 3.5, carbsG: 24, fatG: 11, fiberG: 0.7 }, units: [{ label: "taza", grams: 130 }, { label: "bola", grams: 65 }, GRAM_UNIT], aliases: ["helado"] },
  { id: "queque", name: "Queque", category: "Snacks", servingLabel: "1 rebanada", servingG: 70, per100g: { calories: 360, proteinG: 6, carbsG: 52, fatG: 14, fiberG: 1 }, units: [{ label: "rebanada", grams: 70 }, GRAM_UNIT], aliases: ["bizcocho", "queque"] },
  { id: "kuchen", name: "Kuchen", category: "Snacks", servingLabel: "1 trozo", servingG: 100, per100g: { calories: 300, proteinG: 5, carbsG: 42, fatG: 13, fiberG: 2 }, units: [{ label: "trozo", grams: 100 }, GRAM_UNIT], aliases: ["kuchen"] },
  { id: "alfajor", name: "Alfajor", category: "Snacks", servingLabel: "1 unidad", servingG: 50, per100g: { calories: 420, proteinG: 6, carbsG: 60, fatG: 17, fiberG: 2 }, units: [{ label: "unidad", grams: 50 }, GRAM_UNIT], aliases: ["alfajor"] },
  { id: "barra-cereal", name: "Barra de cereal", category: "Snacks", servingLabel: "1 unidad", servingG: 25, per100g: { calories: 390, proteinG: 6, carbsG: 72, fatG: 8, fiberG: 5 }, units: [{ label: "unidad", grams: 25 }, GRAM_UNIT], aliases: ["barra cereal"] },
  { id: "papas-bolsa", name: "Papas fritas de bolsa", category: "Snacks", servingLabel: "1 porcion", servingG: 30, per100g: { calories: 536, proteinG: 7, carbsG: 53, fatG: 34, fiberG: 4 }, units: [{ label: "porcion", grams: 30 }, { label: "bolsa pequena", grams: 45 }, GRAM_UNIT], aliases: ["chips", "papas bolsa"] },
  { id: "ramitas", name: "Ramitas", category: "Snacks", servingLabel: "1 porcion", servingG: 30, per100g: { calories: 500, proteinG: 8, carbsG: 62, fatG: 24, fiberG: 3 }, units: [{ label: "porcion", grams: 30 }, GRAM_UNIT], aliases: ["ramitas"] },
  { id: "cabritas", name: "Cabritas", category: "Snacks", servingLabel: "1 taza", servingG: 25, per100g: { calories: 380, proteinG: 12, carbsG: 78, fatG: 4, fiberG: 15 }, units: [{ label: "taza", grams: 25 }, { label: "porcion", grams: 40 }, GRAM_UNIT], aliases: ["palomitas", "popcorn"] },
  { id: "frutos-secos-mix", name: "Frutos secos mix", category: "Snacks", servingLabel: "1 punado", servingG: 30, per100g: { calories: 580, proteinG: 18, carbsG: 22, fatG: 48, fiberG: 8 }, units: [{ label: "punado", grams: 30 }, GRAM_UNIT], aliases: ["mix frutos secos"] },

  { id: "whey-isolate", name: "Proteina isolate", category: "Suplementos", servingLabel: "1 scoop", servingG: 30, per100g: { calories: 365, proteinG: 86, carbsG: 3, fatG: 1, fiberG: 0 }, units: [{ label: "scoop", grams: 30 }, GRAM_UNIT], aliases: ["isolate", "aislada", "proteina aislada"] },
  { id: "creatine", name: "Creatina", category: "Suplementos", servingLabel: "1 scoop", servingG: 5, per100g: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, units: [{ label: "scoop", grams: 5 }, { label: "g", grams: 1 }], aliases: ["creatina monohidratada"] },
  { id: "pre-workout", name: "Pre entreno", category: "Suplementos", servingLabel: "1 scoop", servingG: 10, per100g: { calories: 120, proteinG: 0, carbsG: 30, fatG: 0, fiberG: 0 }, units: [{ label: "scoop", grams: 10 }, GRAM_UNIT], aliases: ["pre entreno", "preworkout"] },
  { id: "protein-drink", name: "Bebida proteica", category: "Suplementos", servingLabel: "1 botella", servingG: 330, per100g: { calories: 60, proteinG: 8, carbsG: 4, fatG: 1, fiberG: 0 }, units: [{ label: "botella", grams: 330 }, { label: "ml", grams: 1 }], aliases: ["shake proteico", "bebida protein"] },
  { id: "protein-bar", name: "Barra proteica", category: "Suplementos", servingLabel: "1 barra", servingG: 60, per100g: { calories: 350, proteinG: 33, carbsG: 32, fatG: 12, fiberG: 10 }, units: [{ label: "barra", grams: 60 }, GRAM_UNIT], aliases: ["barra protein", "protein bar"] },
];

export const foodCatalog: FoodCatalogItem[] = [...baseFoodCatalog, ...extraFoodInputs.map(localFood)];

export function searchFoods(query: string, limit = 18): FoodCatalogItem[] {
  const normalized = normalize(query);
  if (!normalized) return foodCatalog.slice(0, limit);

  return foodCatalog
    .map((food) => {
      const haystack = normalize(
        [
          food.name,
          food.brand ?? "",
          food.category,
          food.servingLabel,
          food.units.map((unit) => unit.label).join(" "),
          food.servingOptions.map((option) => `${option.label} ${option.unit}`).join(" "),
          (food.aliases ?? []).join(" "),
        ].join(" "),
      );
      const starts = haystack.startsWith(normalized) ? 30 : 0;
      const contains = haystack.includes(normalized) ? 15 : 0;
      const words = normalized.split(/\s+/).filter(Boolean);
      const wordScore = words.reduce((score, word) => score + (haystack.includes(word) ? 4 : 0), 0);
      const fuzzy = contains ? 0 : fuzzyScore(haystack, normalized);
      return { food, score: starts + contains + wordScore + fuzzy };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map((item) => item.food);
}

export function unitsFor(food: FoodCatalogItem): FoodUnit[] {
  if (food.units && food.units.length > 0) return food.units;
  return [{ label: "porcion", grams: food.servingG }, GRAM_UNIT];
}

export function gramsFor(food: FoodCatalogItem, quantity: number, unitLabel: string): number {
  const unit = unitsFor(food).find((item) => item.label === unitLabel) ?? unitsFor(food)[0]!;
  return Math.max(quantity, 0) * unit.grams;
}

export function describeServing(food: FoodCatalogItem, quantity: number, unitLabel: string): string {
  const grams = gramsFor(food, quantity, unitLabel);
  const qty = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
  if (unitLabel === "g" || unitLabel === "ml") {
    return `${Math.round(grams)} ${unitLabel}`;
  }
  return `${qty} ${unitLabel}${quantity !== 1 && !unitLabel.includes("/") ? "s" : ""} aprox. ${Math.round(grams)} g`;
}

export function calculateFoodMacros(food: FoodCatalogItem, grams: number): MacroTotals {
  const factor = Math.max(grams, 0) / 100;
  return {
    calories: round(food.caloriesPer100g * factor, 0),
    proteinG: round(food.proteinPer100g * factor, 1),
    carbsG: round(food.carbsPer100g * factor, 1),
    fatG: round(food.fatPer100g * factor, 1),
    fiberG: round(food.fiberPer100g * factor, 1),
  };
}

export function sumSelectedFoods(items: SelectedFoodItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (totals, item) => {
      const macros = calculateFoodMacros(item.food, item.grams);
      return {
        calories: totals.calories + macros.calories,
        proteinG: round(totals.proteinG + macros.proteinG, 1),
        carbsG: round(totals.carbsG + macros.carbsG, 1),
        fatG: round(totals.fatG + macros.fatG, 1),
        fiberG: round(totals.fiberG + macros.fiberG, 1),
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

export function normalizeFoodText(value: string): string {
  return normalize(value);
}

function servingLabelFor(label: string, grams: number): string {
  if (label === "g") return "100 g";
  if (label === "ml") return "100 ml";
  return `1 ${label} aprox. ${Math.round(grams)} g`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function fuzzyScore(haystack: string, needle: string): number {
  const needles = needle.split(/\s+/).filter((word) => word.length >= 5);
  if (needles.length === 0) return 0;
  const words = haystack.split(/\s+/).filter((word) => word.length >= 4);
  const matched = needles.filter((needleWord) =>
    words.some(
      (word) =>
        word[0] === needleWord[0] &&
        Math.abs(word.length - needleWord.length) <= 2 &&
        levenshtein(word, needleWord) <= 2,
    ),
  ).length;
  return matched === needles.length ? 5 : 0;
}

function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(previous[j]! + 1, previous[j - 1]! + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[b.length]!;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
