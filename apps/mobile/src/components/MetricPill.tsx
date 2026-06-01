import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

type MetricPillProps = {
  label: string;
  value: string;
  tone?: "primary" | "energy" | "neutral";
};

export function MetricPill({ label, value, tone = "neutral" }: MetricPillProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.pill, tone === "primary" ? styles.primary : tone === "energy" ? styles.energy : null]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    pill: {
      minWidth: 74,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 2,
    },
    primary: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    energy: {
      borderColor: colors.energy,
      backgroundColor: colors.energySoft,
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
