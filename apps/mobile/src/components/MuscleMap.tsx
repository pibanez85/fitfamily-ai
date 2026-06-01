import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { MUSCLE_GROUPS, type MuscleGroupId } from "@fitfamily-ai/shared";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type MuscleMapProps = {
  selected: MuscleGroupId | "all";
  onSelect: (muscle: MuscleGroupId | "all") => void;
};

type RegionShape = {
  id: MuscleGroupId;
  paths: string[];
};

// Center X coordinates for each view in viewBox 420x470
const FRONT_X = 300;
const BACK_X = 124;

// Build anatomically defined muscle regions parametrized by center X
const buildFrontRegions = (x: number): RegionShape[] => [
  {
    id: "hombros",
    paths: [
      // Right deltoid – wider cap matching extended arm position
      `M${x + 24} 118 C${x + 48} 112 ${x + 70} 126 ${x + 74} 150 C${x + 70} 161 ${x + 54} 158 ${x + 40} 148 C${x + 30} 140 ${x + 23} 129 ${x + 24} 118 Z`,
      // Left deltoid – mirror
      `M${x - 24} 118 C${x - 48} 112 ${x - 70} 126 ${x - 74} 150 C${x - 70} 161 ${x - 54} 158 ${x - 40} 148 C${x - 30} 140 ${x - 23} 129 ${x - 24} 118 Z`,
    ],
  },
  {
    id: "pecho",
    paths: [
      // Right pectoral – fits narrower torso
      `M${x + 2} 128 C${x + 16} 126 ${x + 36} 133 ${x + 44} 152 C${x + 48} 170 ${x + 38} 184 ${x + 20} 188 C${x + 10} 188 ${x + 4} 180 ${x + 2} 168 Z`,
      // Left pectoral – mirror
      `M${x - 2} 128 C${x - 16} 126 ${x - 36} 133 ${x - 44} 152 C${x - 48} 170 ${x - 38} 184 ${x - 20} 188 C${x - 10} 188 ${x - 4} 180 ${x - 2} 168 Z`,
    ],
  },
  {
    id: "abdomen",
    paths: [
      `M${x + 2} 194 C${x + 10} 193 ${x + 18} 194 ${x + 22} 198 L${x + 22} 213 C${x + 16} 216 ${x + 6} 216 ${x + 2} 213 Z`,
      `M${x - 2} 194 C${x - 10} 193 ${x - 18} 194 ${x - 22} 198 L${x - 22} 213 C${x - 16} 216 ${x - 6} 216 ${x - 2} 213 Z`,
      `M${x + 2} 217 C${x + 9} 216 ${x + 17} 217 ${x + 22} 221 L${x + 22} 236 C${x + 15} 239 ${x + 6} 239 ${x + 2} 236 Z`,
      `M${x - 2} 217 C${x - 9} 216 ${x - 17} 217 ${x - 22} 221 L${x - 22} 236 C${x - 15} 239 ${x - 6} 239 ${x - 2} 236 Z`,
      `M${x + 2} 240 C${x + 8} 239 ${x + 15} 240 ${x + 20} 244 L${x + 20} 259 C${x + 13} 262 ${x + 6} 262 ${x + 2} 259 Z`,
      `M${x - 2} 240 C${x - 8} 239 ${x - 15} 240 ${x - 20} 244 L${x - 20} 259 C${x - 13} 262 ${x - 6} 262 ${x - 2} 259 Z`,
    ],
  },
  {
    id: "oblicuos",
    paths: [
      `M${x + 22} 196 C${x + 34} 210 ${x + 40} 228 ${x + 38} 250 C${x + 30} 258 ${x + 24} 252 ${x + 22} 240 Z`,
      `M${x - 22} 196 C${x - 34} 210 ${x - 40} 228 ${x - 38} 250 C${x - 30} 258 ${x - 24} 252 ${x - 22} 240 Z`,
      `M${x + 4} 250 C${x + 14} 254 ${x + 22} 260 ${x + 26} 268 L${x + 18} 272 C${x + 12} 266 ${x + 6} 260 ${x + 2} 256 Z`,
      `M${x - 4} 250 C${x - 14} 254 ${x - 22} 260 ${x - 26} 268 L${x - 18} 272 C${x - 12} 266 ${x - 6} 260 ${x - 2} 256 Z`,
    ],
  },
  {
    id: "biceps",
    paths: [
      // Right bicep – shifted outward to match wider arm
      `M${x + 62} 152 C${x + 76} 158 ${x + 84} 178 ${x + 80} 206 C${x + 72} 213 ${x + 62} 202 ${x + 60} 184 C${x + 59} 170 ${x + 60} 158 ${x + 62} 152 Z`,
      // Left bicep – mirror
      `M${x - 62} 152 C${x - 76} 158 ${x - 84} 178 ${x - 80} 206 C${x - 72} 213 ${x - 62} 202 ${x - 60} 184 C${x - 59} 170 ${x - 60} 158 ${x - 62} 152 Z`,
    ],
  },
  {
    id: "triceps",
    paths: [
      // Right tricep – outer strip of extended arm
      `M${x + 78} 152 C${x + 87} 175 ${x + 87} 202 ${x + 80} 224 C${x + 76} 220 ${x + 74} 198 ${x + 76} 176 Z`,
      // Left tricep
      `M${x - 78} 152 C${x - 87} 175 ${x - 87} 202 ${x - 80} 224 C${x - 76} 220 ${x - 74} 198 ${x - 76} 176 Z`,
    ],
  },
  {
    id: "antebrazos",
    paths: [
      // Right forearm – matches wider arm position
      `M${x + 62} 222 C${x + 76} 240 ${x + 76} 272 ${x + 66} 298 C${x + 58} 292 ${x + 54} 270 ${x + 56} 240 Z`,
      // Left forearm
      `M${x - 62} 222 C${x - 76} 240 ${x - 76} 272 ${x - 66} 298 C${x - 58} 292 ${x - 54} 270 ${x - 56} 240 Z`,
    ],
  },
  {
    id: "cuadriceps",
    paths: [
      // Right vastus lateralis (outer sweep) – narrower leg
      `M${x + 22} 280 C${x + 40} 288 ${x + 46} 320 ${x + 38} 364 C${x + 28} 362 ${x + 22} 330 ${x + 22} 296 Z`,
      // Right rectus femoris (central)
      `M${x + 6} 280 C${x + 18} 286 ${x + 26} 322 ${x + 20} 368 C${x + 12} 362 ${x + 6} 326 ${x + 6} 292 Z`,
      // Left vastus lateralis
      `M${x - 22} 280 C${x - 40} 288 ${x - 46} 320 ${x - 38} 364 C${x - 28} 362 ${x - 22} 330 ${x - 22} 296 Z`,
      // Left rectus femoris
      `M${x - 6} 280 C${x - 18} 286 ${x - 26} 322 ${x - 20} 368 C${x - 12} 362 ${x - 6} 326 ${x - 6} 292 Z`,
    ],
  },
  {
    id: "aductores",
    paths: [
      `M${x + 2} 282 C${x + 12} 298 ${x + 18} 328 ${x + 12} 358 C${x + 5} 348 ${x + 2} 322 ${x + 2} 296 Z`,
      `M${x - 2} 282 C${x - 12} 298 ${x - 18} 328 ${x - 12} 358 C${x - 5} 348 ${x - 2} 322 ${x - 2} 296 Z`,
    ],
  },
  {
    id: "pantorrillas",
    paths: [
      `M${x + 14} 388 C${x + 34} 394 ${x + 40} 418 ${x + 32} 442 C${x + 24} 440 ${x + 18} 420 ${x + 14} 396 Z`,
      `M${x - 14} 388 C${x - 34} 394 ${x - 40} 418 ${x - 32} 442 C${x - 24} 440 ${x - 18} 420 ${x - 14} 396 Z`,
    ],
  },
];

const buildBackRegions = (x: number): RegionShape[] => [
  {
    id: "trapecio",
    paths: [
      `M${x - 14} 108 C${x - 34} 116 ${x - 44} 128 ${x - 24} 152 C${x - 10} 156 ${x + 10} 156 ${x + 24} 152 C${x + 44} 128 ${x + 34} 116 ${x + 14} 108 Z`,
    ],
  },
  {
    id: "hombros",
    paths: [
      // Right rear deltoid – wider cap to match extended arm
      `M${x + 24} 118 C${x + 48} 112 ${x + 70} 126 ${x + 74} 150 C${x + 70} 161 ${x + 54} 158 ${x + 40} 148 C${x + 30} 140 ${x + 23} 129 ${x + 24} 118 Z`,
      // Left rear deltoid – mirror
      `M${x - 24} 118 C${x - 48} 112 ${x - 70} 126 ${x - 74} 150 C${x - 70} 161 ${x - 54} 158 ${x - 40} 148 C${x - 30} 140 ${x - 23} 129 ${x - 24} 118 Z`,
    ],
  },
  {
    id: "espalda",
    paths: [
      // Right latissimus – V-taper wing, fits narrower torso
      `M${x + 20} 152 C${x + 44} 157 ${x + 54} 182 ${x + 50} 212 C${x + 40} 230 ${x + 22} 230 ${x + 12} 220 C${x + 10} 198 ${x + 12} 176 ${x + 20} 152 Z`,
      // Left lat
      `M${x - 20} 152 C${x - 44} 157 ${x - 54} 182 ${x - 50} 212 C${x - 40} 230 ${x - 22} 230 ${x - 12} 220 C${x - 10} 198 ${x - 12} 176 ${x - 20} 152 Z`,
      // Right teres major
      `M${x + 22} 156 C${x + 40} 164 ${x + 50} 180 ${x + 46} 196 C${x + 34} 196 ${x + 24} 184 ${x + 22} 170 Z`,
      // Left teres major
      `M${x - 22} 156 C${x - 40} 164 ${x - 50} 180 ${x - 46} 196 C${x - 34} 196 ${x - 24} 184 ${x - 22} 170 Z`,
      // Center spine groove (rhomboids)
      `M${x - 8} 152 C${x - 4} 180 ${x - 4} 210 ${x - 8} 228 L${x + 8} 228 C${x + 4} 210 ${x + 4} 180 ${x + 8} 152 Z`,
    ],
  },
  {
    id: "lumbar",
    paths: [
      `M${x - 12} 228 C${x - 6} 232 ${x + 6} 232 ${x + 12} 228 L${x + 16} 258 C${x + 8} 264 ${x - 8} 264 ${x - 16} 258 Z`,
    ],
  },
  {
    id: "triceps",
    paths: [
      // Right tricep horseshoe – shifted outward with wider arm
      `M${x + 62} 150 C${x + 80} 168 ${x + 84} 198 ${x + 76} 222 C${x + 66} 215 ${x + 62} 192 ${x + 60} 170 Z`,
      // Left tricep
      `M${x - 62} 150 C${x - 80} 168 ${x - 84} 198 ${x - 76} 222 C${x - 66} 215 ${x - 62} 192 ${x - 60} 170 Z`,
    ],
  },
  {
    id: "antebrazos",
    paths: [
      // Right forearm – matches wider arm
      `M${x + 62} 222 C${x + 76} 240 ${x + 76} 272 ${x + 66} 298 C${x + 58} 292 ${x + 54} 270 ${x + 56} 240 Z`,
      // Left forearm
      `M${x - 62} 222 C${x - 76} 240 ${x - 76} 272 ${x - 66} 298 C${x - 58} 292 ${x - 54} 270 ${x - 56} 240 Z`,
    ],
  },
  {
    id: "gluteos",
    paths: [
      // Right glute – fits narrower hip width
      `M${x + 2} 262 C${x + 26} 260 ${x + 46} 274 ${x + 42} 300 C${x + 32} 312 ${x + 14} 308 ${x + 2} 294 Z`,
      // Left glute
      `M${x - 2} 262 C${x - 26} 260 ${x - 46} 274 ${x - 42} 300 C${x - 32} 312 ${x - 14} 308 ${x - 2} 294 Z`,
    ],
  },
  {
    id: "isquios",
    paths: [
      // Right outer hamstring
      `M${x + 22} 300 C${x + 42} 308 ${x + 44} 340 ${x + 38} 370 C${x + 30} 366 ${x + 24} 334 ${x + 22} 308 Z`,
      // Right inner hamstring
      `M${x + 6} 298 C${x + 18} 308 ${x + 22} 342 ${x + 18} 372 C${x + 10} 364 ${x + 6} 330 ${x + 6} 304 Z`,
      // Left outer hamstring
      `M${x - 22} 300 C${x - 42} 308 ${x - 44} 340 ${x - 38} 370 C${x - 30} 366 ${x - 24} 334 ${x - 22} 308 Z`,
      // Left inner hamstring
      `M${x - 6} 298 C${x - 18} 308 ${x - 22} 342 ${x - 18} 372 C${x - 10} 364 ${x - 6} 330 ${x - 6} 304 Z`,
    ],
  },
  {
    id: "pantorrillas",
    paths: [
      `M${x + 14} 388 C${x + 36} 394 ${x + 42} 416 ${x + 34} 442 C${x + 24} 440 ${x + 18} 420 ${x + 14} 396 Z`,
      `M${x - 14} 388 C${x - 36} 394 ${x - 42} 416 ${x - 34} 442 C${x - 24} 440 ${x - 18} 420 ${x - 14} 396 Z`,
    ],
  },
];

const frontRegions: RegionShape[] = buildFrontRegions(FRONT_X);
const backRegions: RegionShape[] = buildBackRegions(BACK_X);

export function MuscleMap({ selected, onSelect }: MuscleMapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Mapa muscular</Text>
          <Text style={styles.subtitle}>Selecciona una zona para filtrar ejercicios</Text>
        </View>
        <Pressable
          onPress={() => onSelect("all")}
          style={[styles.allButton, selected === "all" ? styles.allButtonActive : null]}
        >
          <Text style={[styles.allText, selected === "all" ? styles.allTextActive : null]}>Todos</Text>
        </Pressable>
      </View>

      <View style={styles.figureShell}>
        <Svg width="100%" height={380} viewBox="0 0 420 470">
          <Defs>
            {/* Body base: dark charcoal, matches reference app aesthetic */}
            <LinearGradient id="bodyBase" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2e3340" stopOpacity="1" />
              <Stop offset="0.5" stopColor="#22272f" stopOpacity="1" />
              <Stop offset="1" stopColor="#161a20" stopOpacity="1" />
            </LinearGradient>
            {/* Idle muscles: barely distinguishable from dark body – subtle blue-gray tint */}
            <RadialGradient id="muscleIdle" cx="0.5" cy="0.35" r="0.75">
              <Stop offset="0" stopColor="#3c4354" stopOpacity="1" />
              <Stop offset="0.55" stopColor="#2c3040" stopOpacity="0.95" />
              <Stop offset="1" stopColor="#1e2230" stopOpacity="0.9" />
            </RadialGradient>
            {/* Active muscles: warm golden amber like reference image */}
            <LinearGradient id="muscleActive" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#e8b800" stopOpacity="1" />
              <Stop offset="0.45" stopColor="#c89200" stopOpacity="1" />
              <Stop offset="1" stopColor="#8a6000" stopOpacity="1" />
            </LinearGradient>
            {/* Subtle center glow behind figures */}
            <RadialGradient id="figureGlow" cx="0.5" cy="0.45" r="0.7">
              <Stop offset="0" stopColor="#1e2633" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#0b1018" stopOpacity="0" />
            </RadialGradient>
            {/* Glow halo around active muscle regions */}
            <RadialGradient id="activeGlow" cx="0.5" cy="0.5" r="0.6">
              <Stop offset="0" stopColor="#c89200" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#c89200" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x={0} y={0} width={420} height={470} rx={0} fill={colors.backgroundElevated} />
          <Ellipse cx={210} cy={230} rx={185} ry={215} fill="url(#figureGlow)" />

          <BodyBase side="back" />
          {backRegions.map((region) => (
            <MuscleRegion
              key={`back-${region.id}`}
              region={region}
              selected={selected}
              onSelect={onSelect}
            />
          ))}

          <BodyBase side="front" />
          {frontRegions.map((region) => (
            <MuscleRegion
              key={`front-${region.id}`}
              region={region}
              selected={selected}
              onSelect={onSelect}
            />
          ))}

          {/* Bottom labels */}
          <Path d="M94 37 L154 37" stroke={colors.border} strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
          <Path d="M270 37 L330 37" stroke={colors.border} strokeWidth={1.2} strokeLinecap="round" opacity={0.8} />
        </Svg>
      </View>

      <View style={styles.selectedRow}>
        <Text style={styles.selectedLabel}>Filtro activo</Text>
        <Text style={styles.selectedValue}>{selected === "all" ? "Todos los musculos" : muscleLabel(selected)}</Text>
      </View>

      <View style={styles.chips}>
        {MUSCLE_GROUPS.map((muscle) => {
          const active = selected === muscle.id;
          return (
            <Pressable
              key={muscle.id}
              onPress={() => onSelect(muscle.id)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{muscle.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BodyBase({ side }: { side: "front" | "back" }) {
  const x = side === "front" ? FRONT_X : BACK_X;

  return (
    <G>
      {/* Subtle ground shadow */}
      <Ellipse cx={x} cy={462} rx={42} ry={5} fill="#000" opacity={0.25} />

      {/* Head - oval with athletic jawline */}
      <Path
        d={`M${x - 20} 68 C${x - 22} 50 ${x - 14} 38 ${x} 38 C${x + 14} 38 ${x + 22} 50 ${x + 20} 68 C${x + 20} 82 ${x + 14} 92 ${x} 94 C${x - 14} 92 ${x - 20} 82 ${x - 20} 68 Z`}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.5}
      />

      {/* Ears suggestion */}
      <Ellipse cx={x - 21} cy={66} rx={2.5} ry={5} fill="url(#bodyBase)" stroke="#3a4252" strokeWidth={0.7} />
      <Ellipse cx={x + 21} cy={66} rx={2.5} ry={5} fill="url(#bodyBase)" stroke="#3a4252" strokeWidth={0.7} />

      {/* Neck - muscular sternocleidomastoid */}
      <Path
        d={`M${x - 12} 94 C${x - 14} 102 ${x - 14} 108 ${x - 12} 112 L${x + 12} 112 C${x + 14} 108 ${x + 14} 102 ${x + 12} 94 Z`}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.3}
      />

      {/* Torso – true V-taper: wide shoulders ±46, narrow waist ±30, slight hip ±40 */}
      <Path
        d={`
          M${x - 12} 112
          C${x - 28} 115 ${x - 42} 120 ${x - 46} 134
          C${x - 50} 150 ${x - 48} 170 ${x - 44} 192
          C${x - 38} 214 ${x - 34} 232 ${x - 30} 244
          C${x - 28} 256 ${x - 36} 268 ${x - 40} 278
          L${x - 40} 282
          L${x + 40} 282
          L${x + 40} 278
          C${x + 36} 268 ${x + 28} 256 ${x + 30} 244
          C${x + 34} 232 ${x + 38} 214 ${x + 44} 192
          C${x + 48} 170 ${x + 50} 150 ${x + 46} 134
          C${x + 42} 120 ${x + 28} 115 ${x + 12} 112 Z
        `}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.6}
      />

      {/* Right arm – extended outward ~20°, clearly separated from torso */}
      <Path
        d={`
          M${x + 44} 120
          C${x + 64} 124 ${x + 80} 138 ${x + 85} 158
          C${x + 88} 184 ${x + 84} 212 ${x + 76} 238
          C${x + 70} 260 ${x + 65} 280 ${x + 62} 300
          L${x + 62} 308
          C${x + 60} 314 ${x + 54} 314 ${x + 52} 308
          L${x + 54} 298
          L${x + 46} 296
          C${x + 50} 278 ${x + 56} 260 ${x + 62} 238
          C${x + 68} 212 ${x + 70} 184 ${x + 65} 158
          C${x + 62} 140 ${x + 54} 128 ${x + 44} 120 Z
        `}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.5}
      />

      {/* Left arm – mirror */}
      <Path
        d={`
          M${x - 44} 120
          C${x - 64} 124 ${x - 80} 138 ${x - 85} 158
          C${x - 88} 184 ${x - 84} 212 ${x - 76} 238
          C${x - 70} 260 ${x - 65} 280 ${x - 62} 300
          L${x - 62} 308
          C${x - 60} 314 ${x - 54} 314 ${x - 52} 308
          L${x - 54} 298
          L${x - 46} 296
          C${x - 50} 278 ${x - 56} 260 ${x - 62} 238
          C${x - 68} 212 ${x - 70} 184 ${x - 65} 158
          C${x - 62} 140 ${x - 54} 128 ${x - 44} 120 Z
        `}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.5}
      />

      {/* Right leg – connects at narrower hip (±40) */}
      <Path
        d={`
          M${x + 2} 280
          L${x + 40} 280
          C${x + 46} 305 ${x + 46} 340 ${x + 38} 368
          C${x + 34} 376 ${x + 32} 382 ${x + 30} 386
          C${x + 34} 400 ${x + 36} 420 ${x + 30} 442
          C${x + 26} 450 ${x + 22} 456 ${x + 18} 458
          L${x + 8} 460
          L${x + 6} 455
          C${x + 10} 442 ${x + 14} 422 ${x + 12} 402
          C${x + 10} 382 ${x + 6} 356 ${x + 4} 334
          C${x + 2} 314 ${x + 2} 296 ${x + 2} 280 Z
        `}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.5}
      />

      {/* Left leg – mirror */}
      <Path
        d={`
          M${x - 2} 280
          L${x - 40} 280
          C${x - 46} 305 ${x - 46} 340 ${x - 38} 368
          C${x - 34} 376 ${x - 32} 382 ${x - 30} 386
          C${x - 34} 400 ${x - 36} 420 ${x - 30} 442
          C${x - 26} 450 ${x - 22} 456 ${x - 18} 458
          L${x - 8} 460
          L${x - 6} 455
          C${x - 10} 442 ${x - 14} 422 ${x - 12} 402
          C${x - 10} 382 ${x - 6} 356 ${x - 4} 334
          C${x - 2} 314 ${x - 2} 296 ${x - 2} 280 Z
        `}
        fill="url(#bodyBase)"
        stroke="#3a4252"
        strokeWidth={1.5}
      />

      {/* Subtle anatomical detail lines */}
      <Path
        d={
          side === "front"
            ? // Front: jawline, neck cut, linea alba, knee creases
              `M${x - 12} 86 C${x - 6} 92 ${x + 6} 92 ${x + 12} 86 M${x - 6} 96 C${x - 3} 104 ${x + 3} 104 ${x + 6} 96 M${x} 130 L${x} 260 M${x - 28} 384 L${x - 14} 386 M${x + 28} 384 L${x + 14} 386`
            : // Back: spine groove, glute cleft, knee creases
              `M${x} 112 L${x} 260 M${x} 262 L${x} 296 M${x - 28} 384 L${x - 14} 386 M${x + 28} 384 L${x + 14} 386`
        }
        stroke="#4a5268"
        strokeWidth={0.8}
        opacity={0.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Collarbone hint (front only) */}
      {side === "front" ? (
        <Path
          d={`M${x - 30} 118 C${x - 18} 124 ${x - 6} 124 ${x} 122 C${x + 6} 124 ${x + 18} 124 ${x + 30} 118`}
          stroke="#4a5268"
          strokeWidth={1.0}
          opacity={0.55}
          fill="none"
          strokeLinecap="round"
        />
      ) : null}

      {/* Hidden circle anchor for legacy spacing */}
      <Circle cx={x} cy={66} r={0.1} fill="none" />
    </G>
  );
}

function MuscleRegion({
  region,
  selected,
  onSelect,
}: {
  region: RegionShape;
  selected: MuscleGroupId | "all";
  onSelect: (muscle: MuscleGroupId | "all") => void;
}) {
  const active = regionIsActive(region.id, selected);
  return (
    <G onPress={() => onSelect(region.id)}>
      {/* Glow halo behind active muscle */}
      {active && region.paths.map((path, index) => (
        <Path
          key={`${region.id}-glow-${index}`}
          d={path}
          fill="url(#activeGlow)"
          stroke="none"
          strokeWidth={0}
          opacity={0.7}
          transform="scale(1.12) translate(-5, -5)"
        />
      ))}
      {region.paths.map((path, index) => (
        <Path
          key={`${region.id}-${index}`}
          d={path}
          fill={active ? "url(#muscleActive)" : "url(#muscleIdle)"}
          stroke={active ? "#e8b800" : "#2e3545"}
          strokeWidth={active ? 1.8 : 0.7}
          opacity={active ? 1 : 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

function regionIsActive(regionId: MuscleGroupId, selected: MuscleGroupId | "all"): boolean {
  if (selected === "all") return false;
  if (regionId === selected) return true;
  const related: Partial<Record<MuscleGroupId, MuscleGroupId[]>> = {
    core: ["abdomen", "oblicuos", "lumbar"],
    abdomen: ["core"],
    oblicuos: ["core"],
    lumbar: ["core", "espalda"],
    trapecio: ["espalda"],
    antebrazos: ["biceps"],
  };
  return (related[selected] ?? []).includes(regionId);
}

function muscleLabel(id: MuscleGroupId): string {
  return MUSCLE_GROUPS.find((muscle) => muscle.id === id)?.label ?? id;
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      gap: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    subtitle: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 2,
    },
    allButton: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.backgroundElevated,
    },
    allButtonActive: {
      backgroundColor: colors.primary,
    },
    allText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 12,
    },
    allTextActive: {
      color: colors.onPrimary,
    },
    figureShell: {
      borderRadius: radius.md,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      alignItems: "center",
      // Extra dark background reinforces the reference app look
      // backgroundElevated should be very dark in the theme
    },
    selectedRow: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 2,
    },
    selectedLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    selectedValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    chipActive: {
      borderColor: colors.energy,
      backgroundColor: colors.energy,
    },
    chipText: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 12,
    },
    chipTextActive: {
      color: colors.onPrimary,
    },
  });
}
