import { router, type Href, usePathname } from "expo-router";
import { Bot, Dumbbell, Home, TrendingUp, Utensils } from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LucideProps } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";

const navItems: Array<{ label: string; href: Href; icon: ComponentType<LucideProps>; match: string[] }> = [
  { label: "Inicio", href: "/dashboard", icon: Home, match: ["/dashboard"] },
  { label: "Entreno", href: "/today", icon: Dumbbell, match: ["/today", "/workouts"] },
  { label: "Comida", href: "/meals", icon: Utensils, match: ["/meals"] },
  { label: "Avances", href: "/progress", icon: TrendingUp, match: ["/progress"] },
  { label: "Coach", href: "/chat", icon: Bot, match: ["/chat"] },
];

export function BottomNav() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      {navItems.map((item) => {
        const active = item.match.some((match) => pathname.startsWith(match));
        const Icon = item.icon;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={[styles.item, active ? styles.activeItem : null]}
          >
            <Icon size={20} color={active ? colors.primary : colors.muted} />
            <Text style={[styles.label, active ? styles.activeLabel : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    nav: {
      minHeight: 70,
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 6,
      paddingTop: 8,
      paddingBottom: 8,
    },
    item: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      borderRadius: 12,
    },
    activeItem: {
      backgroundColor: colors.surfaceStrong,
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
    },
    activeLabel: {
      color: colors.primary,
    },
  });
}
