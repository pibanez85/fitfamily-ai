import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.text}>{body}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    center: {
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 24,
    },
    empty: {
      gap: 6,
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    title: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
    },
    text: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
