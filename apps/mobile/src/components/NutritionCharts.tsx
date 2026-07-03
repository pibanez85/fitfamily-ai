import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { MacroTotals } from "@fitfamily-ai/shared";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type MacroDonutProps = {
  totals: MacroTotals;
  size?: number;
};

const macroColors = {
  protein: "#2dd4bf",
  carbs: "#facc15",
  fat: "#f43f5e",
};

export function MacroDonut({ totals, size = 152 }: MacroDonutProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const radiusValue = size * 0.38;
  const strokeWidth = size * 0.1;
  const circumference = 2 * Math.PI * radiusValue;
  const proteinKcal = totals.proteinG * 4;
  const carbsKcal = totals.carbsG * 4;
  const fatKcal = totals.fatG * 9;
  const total = Math.max(proteinKcal + carbsKcal + fatKcal, 1);
  const segments = [
    { key: "protein", label: "Proteina", value: proteinKcal, color: macroColors.protein },
    { key: "carbs", label: "Carbos", value: carbsKcal, color: macroColors.carbs },
    { key: "fat", label: "Grasas", value: fatKcal, color: macroColors.fat },
  ];
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radiusValue}
            stroke={colors.surfaceMuted}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {segments.map((segment) => {
            const dash = (segment.value / total) * circumference;
            const currentOffset = offset;
            offset += dash;
            return (
              <Circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={radiusValue}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                transform={`rotate(-90, ${size / 2}, ${size / 2})`}
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutValue}>{Math.round(totals.calories)}</Text>
          <Text style={styles.donutLabel}>kcal</Text>
        </View>
      </View>
      <View style={styles.legend}>
        <LegendDot color={macroColors.protein} label="Proteina" value={`${totals.proteinG} g`} />
        <LegendDot color={macroColors.carbs} label="Carbos" value={`${totals.carbsG} g`} />
        <LegendDot color={macroColors.fat} label="Grasas" value={`${totals.fatG} g`} />
      </View>
    </View>
  );
}

export function MacroProgress({
  label,
  value,
  goal,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {Math.round(value)}
          {unit} / {goal}
          {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MiniBarChart({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const max = Math.max(...values, 1);
  return (
    <View style={styles.barChart}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.barSlot}>
          <View style={[styles.bar, { height: `${Math.max((value / max) * 100, 5)}%`, backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    donutWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    donutCenter: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    donutValue: { color: colors.text, fontSize: 24, fontWeight: "900" },
    donutLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
    legend: { flex: 1, gap: 9 },
    legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: "800" },
    legendValue: { color: colors.text, fontSize: 12, fontWeight: "900" },
    progressBlock: { gap: 7 },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    progressLabel: { color: colors.text, fontWeight: "900", fontSize: 13 },
    progressValue: { color: colors.muted, fontWeight: "800", fontSize: 12 },
    progressTrack: {
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: radius.pill },
    barChart: {
      height: 88,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 7,
    },
    barSlot: {
      flex: 1,
      height: "100%",
      borderRadius: radius.pill,
      justifyContent: "flex-end",
      backgroundColor: colors.surfaceMuted,
      overflow: "hidden",
    },
    bar: { width: "100%", borderTopLeftRadius: radius.pill, borderTopRightRadius: radius.pill },
  });
}
