import type { PropsWithChildren, ReactNode, Ref } from "react";
import { router, usePathname } from "expo-router";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Leaf, Users } from "lucide-react-native";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/theme/theme";
import { isDemoMode } from "@/config/env";
import { useAppStore } from "@/store/appStore";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  scrollRef?: Ref<ScrollView>;
  overlay?: ReactNode;
}>;
export function Screen({ children, scroll = true, scrollRef, overlay }: ScreenProps) {
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const profile = useAppStore((state) => state.activeProfile());
  const publicPage = ["/", "/login", "/register", "/forgot-password", "/reset-password"].includes(
    pathname,
  );
  const showNavigation = !publicPage && !pathname.startsWith("/profiles");
  const desktop = width >= 1000;
  const detail =
    pathname.split("/").filter(Boolean).length > 1 && !pathname.startsWith("/profiles");
  const contentStyle = [
    styles.content,
    { paddingHorizontal: desktop ? 38 : 20 },
    publicPage ? { maxWidth: 520, paddingTop: 45 } : null,
  ];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />
      <View style={styles.frame}>
        {showNavigation && desktop ? <BottomNav vertical /> : null}
        <View style={styles.main}>
          {!publicPage ? (
            <View
              style={[
                styles.topbar,
                { borderColor: colors.border, paddingHorizontal: desktop ? 38 : 20 },
              ]}
            >
              <View style={styles.row}>
                {detail ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Volver"
                    onPress={() =>
                      router.canGoBack() ? router.back() : router.navigate("/dashboard")
                    }
                    style={styles.back}
                  >
                    <ChevronLeft size={21} color={colors.text} />
                  </Pressable>
                ) : (
                  <Leaf size={18} color={colors.primary} />
                )}
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {desktop ? "Un poco mejor, cada día" : "fitfamily."}
                </Text>
                {isDemoMode ? (
                  <Text
                    style={[
                      styles.demo,
                      { backgroundColor: colors.primarySoft, color: colors.primary },
                    ]}
                  >
                    DEMO LOCAL
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cambiar perfil familiar"
                onPress={() => router.navigate("/profiles")}
                style={styles.row}
              >
                <Users size={17} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                  {profile?.displayName ?? "Mi familia"}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.body}>
            {scroll ? (
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={contentStyle}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={contentStyle}>{children}</View>
            )}
            {overlay ? (
              <View style={styles.overlay} pointerEvents="box-none">
                {overlay}
              </View>
            ) : null}
          </View>
          {showNavigation && !desktop ? <BottomNav /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  frame: { flex: 1, flexDirection: "row" },
  main: { flex: 1, minWidth: 0 },
  body: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 9 },
  topbar: {
    minHeight: 66,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  content: {
    flexGrow: 1,
    gap: 20,
    paddingTop: 28,
    paddingBottom: 36,
    maxWidth: 1380,
    width: "100%",
    alignSelf: "center",
  },
  overlay: { position: "absolute", left: 18, right: 18, bottom: 10 },
  back: { padding: 6 },
  demo: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5, padding: 5, borderRadius: 5 },
});
