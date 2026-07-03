import type { PropsWithChildren, ReactNode, Ref } from "react";
import { useMemo } from "react";
import { usePathname } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  scrollRef?: Ref<ScrollView>;
  // Contenido flotante que queda fijo sobre el scroll, justo encima de la
  // barra de navegacion (ej: cronometro de descanso durante el entreno).
  overlay?: ReactNode;
}>;

export function Screen({ children, scroll = true, scrollRef, overlay }: ScreenProps) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pathname = usePathname();
  const showBottomNav = !["/", "/login", "/register"].includes(pathname) && !pathname.startsWith("/profiles");
  const barStyle = mode === "dark" ? "light-content" : "dark-content";

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={barStyle} />
        <View style={styles.body}>
          <View style={styles.content}>{children}</View>
          {overlay ? (
            <View style={styles.overlay} pointerEvents="box-none">
              {overlay}
            </View>
          ) : null}
        </View>
        {showBottomNav ? <BottomNav /> : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={barStyle} />
      <View style={styles.body}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {overlay ? (
          <View style={styles.overlay} pointerEvents="box-none">
            {overlay}
          </View>
        ) : null}
      </View>
      {showBottomNav ? <BottomNav /> : null}
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      gap: 16,
      paddingHorizontal: 18,
      paddingBottom: 24,
      paddingTop: 14,
    },
    overlay: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 10,
    },
  });
}
