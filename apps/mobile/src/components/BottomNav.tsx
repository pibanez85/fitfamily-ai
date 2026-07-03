import { router, type Href, usePathname } from "expo-router";
import { Bot, Dumbbell, Home, TrendingUp, Utensils } from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import type { LucideProps } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

const navItems: Array<{ label: string; href: Href; icon: ComponentType<LucideProps>; match: string[] }> = [
  { label: "Inicio", href: "/dashboard", icon: Home, match: ["/dashboard"] },
  { label: "Entreno", href: "/today", icon: Dumbbell, match: ["/today", "/workouts"] },
  { label: "Comida", href: "/meals", icon: Utensils, match: ["/meals"] },
  { label: "Avances", href: "/progress", icon: TrendingUp, match: ["/progress"] },
  { label: "Coach", href: "/chat", icon: Bot, match: ["/chat"] },
];

export function BottomNav() {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pathname = usePathname();

  const items = navItems.map((item) => {
    const active = item.match.some((match) => pathname.startsWith(match));
    const Icon = item.icon;
    return (
      <Pressable
        key={item.label}
        accessibilityRole="button"
        onPress={() => router.push(item.href)}
        style={[styles.item, active ? styles.activeItem : null]}
      >
        <Icon size={20} color={active ? colors.primary : colors.muted} strokeWidth={active ? 2.4 : 2} />
        <Text style={[styles.label, active ? styles.activeLabel : null]}>{item.label}</Text>
      </Pressable>
    );
  });

  // En Android el blur nativo es costoso/incompleto: usamos vidrio simulado.
  if (Platform.OS === "android") {
    return <View style={[styles.nav, styles.navSolid]}>{items}</View>;
  }

  return (
    <BlurView intensity={40} tint={mode === "dark" ? "dark" : "light"} style={styles.nav}>
      {items}
    </BlurView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    nav: {
      flexDirection: "row",
      marginHorizontal: 14,
      marginBottom: 10,
      marginTop: 2,
      padding: 6,
      gap: 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: 0.35,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    navSolid: {
      backgroundColor: colors.backgroundElevated,
    },
    item: {
      flex: 1,
      minHeight: 54,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      borderRadius: radius.lg - 8,
    },
    activeItem: {
      backgroundColor: colors.primarySoft,
    },
    label: {
      color: colors.muted,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    activeLabel: {
      color: colors.primary,
    },
  });
}
