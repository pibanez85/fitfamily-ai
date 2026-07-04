import type { ComponentType } from "react";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import type { LucideProps } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  icon: Icon = Sparkles,
}: {
  title: string;
  body?: string;
  icon?: ComponentType<LucideProps>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconTile}
      >
        <Icon size={22} color={colors.onPrimary} />
      </LinearGradient>
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
      gap: 12,
      padding: 28,
    },
    empty: {
      alignItems: "center",
      gap: 8,
      padding: 22,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      backgroundColor: colors.surfaceMuted,
    },
    iconTile: {
      width: 46,
      height: 46,
      borderRadius: radius.sm + 2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    title: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      textAlign: "center",
    },
    text: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
