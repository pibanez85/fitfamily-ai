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
      minWidth: 76,
      borderRadius: radius.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 9,
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
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: -0.4,
    },
    label: {
      color: colors.muted,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });
}
