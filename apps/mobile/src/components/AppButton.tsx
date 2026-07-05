import type { ComponentType } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { LucideProps } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  icon?: ComponentType<LucideProps>;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  variant = "primary",
  loading = false,
  disabled,
  icon: Icon,
  style,
  ...props
}: AppButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const isFilled = variant === "primary" || variant === "danger";
  const contentColor = isFilled ? colors.onPrimary : variant === "secondary" ? colors.text : colors.primary;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : Icon ? (
        <Icon size={18} color={contentColor} />
      ) : null}
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primaryShadow : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "danger" ? styles.danger : null,
        variant === "ghost" ? styles.ghost : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    base: {
      minHeight: 50,
      borderRadius: radius.sm + 2,
      overflow: "hidden",
      justifyContent: "center",
    },
    row: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    gradientFill: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    primaryShadow: {
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    secondary: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
    disabled: {
      opacity: 0.55,
    },
    label: {
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.1,
    },
  });
}
