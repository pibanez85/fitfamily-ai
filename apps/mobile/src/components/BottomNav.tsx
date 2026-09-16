import { router, type Href, usePathname } from "expo-router";
import {
  MessageCircle,
  Dumbbell,
  House,
  ChartNoAxesCombined,
  Utensils,
  Leaf,
  Settings,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";
import { useAppStore } from "@/store/appStore";

const items = [
  { label: "Mi día", href: "/dashboard", icon: House, paths: ["/dashboard"] },
  {
    label: "Entrenar",
    href: "/today",
    icon: Dumbbell,
    paths: ["/today", "/workouts", "/exercises"],
  },
  { label: "Nutrición", href: "/meals", icon: Utensils, paths: ["/meals"] },
  {
    label: "Progreso",
    href: "/progress",
    icon: ChartNoAxesCombined,
    paths: ["/progress", "/body-metrics"],
  },
  { label: "Mi coach", href: "/chat", icon: MessageCircle, paths: ["/chat", "/machines"] },
];
export function BottomNav({ vertical = false }: { vertical?: boolean }) {
  const { colors } = useTheme();
  const pathname = usePathname();
  const profile = useAppStore((state) => state.activeProfile());
  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: colors.surface, borderColor: colors.border },
        vertical ? styles.sidebar : styles.bottom,
      ]}
    >
      {vertical ? (
        <View style={styles.brand}>
          <Leaf size={29} color={colors.primary} />
          <Text style={[styles.brandText, { color: colors.text }]}>
            fitfamily<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>
      ) : null}
      {vertical ? (
        <Text style={[styles.caption, { color: colors.muted }]}>TU ESPACIO DE BIENESTAR</Text>
      ) : null}
      {items.map(({ label, href, icon: Icon, paths }) => {
        const active = paths.some((path) => pathname.startsWith(path));
        return (
          <Pressable
            key={href}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(href as Href)}
            style={({ pressed }) => [
              styles.item,
              vertical ? styles.sideItem : styles.bottomItem,
              {
                backgroundColor: active ? colors.primarySoft : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon
              size={vertical ? 21 : 22}
              color={active ? colors.primary : colors.muted}
              strokeWidth={active ? 2.2 : 1.7}
            />
            <Text
              style={[
                vertical ? styles.sideLabel : styles.label,
                {
                  color: active ? colors.primary : colors.muted,
                  fontWeight: active ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
            {vertical && active ? (
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            ) : null}
          </Pressable>
        );
      })}
      {vertical ? (
        <>
          <View style={styles.spacer} />
          <View style={[styles.familyNote, { backgroundColor: colors.background }]}>
            <Leaf size={21} color={colors.primary} />
            <Text style={[styles.noteTitle, { color: colors.text }]}>A tu ritmo. En familia.</Text>
            <Text style={[styles.note, { color: colors.muted }]}>
              Los pequeños hábitos también cuentan.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate("/settings")}
            style={styles.sideItem}
          >
            <Settings size={20} color={colors.muted} />
            <Text style={{ color: colors.muted }}>Ajustes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar perfil familiar"
            onPress={() => router.navigate("/profiles")}
            style={[styles.profile, { borderColor: colors.border }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {profile?.displayName[0] ?? "F"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {profile?.displayName ?? "Mi familia"}
              </Text>
              <Text style={[styles.label, { color: colors.muted }]}>Cambiar perfil</Text>
            </View>
            <Users size={18} color={colors.muted} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  nav: { gap: 6 },
  bottom: { flexDirection: "row", padding: 8, borderTopWidth: 1 },
  sidebar: { width: 226, padding: 20, borderRightWidth: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 19 },
  brandText: { fontSize: 26, fontWeight: "800", letterSpacing: -1.2 },
  caption: { fontSize: 9, letterSpacing: 1.4, marginTop: 32, marginBottom: 16, fontWeight: "700" },
  item: { borderRadius: 12 },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 53, gap: 5 },
  sideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 16,
  },
  label: { fontSize: 10 },
  sideLabel: { fontSize: 14, flex: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  spacer: { flex: 1, minHeight: 35 },
  familyNote: { borderRadius: 14, padding: 17, gap: 10, marginBottom: 18 },
  noteTitle: { fontSize: 12, fontWeight: "700" },
  note: { fontSize: 12, lineHeight: 19 },
  profile: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 4,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
