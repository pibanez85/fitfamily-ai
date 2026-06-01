import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";

export function Title({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

export function Subtitle({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Text style={[styles.subtitle, style]} {...props}>
      {children}
    </Text>
  );
}

export function BodyText({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Text style={[styles.body, style]} {...props}>
      {children}
    </Text>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      fontSize: 29,
      fontWeight: "800",
      lineHeight: 35,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    body: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
  });
}
