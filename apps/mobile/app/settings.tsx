import { router } from "expo-router";
import { Bot, LogOut, Moon, ShieldCheck, Stethoscope, Sun, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { isDemoMode } from "@/config/env";
import { supabase } from "@/lib/supabase";
import { checkBackendHealth } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const setSession = useAppStore((state) => state.setSession);
  const setProfiles = useAppStore((state) => state.setProfiles);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfiles([]);
    router.replace("/login");
  }

  async function runDiagnostic() {
    setChecking(true);
    try {
      setDiagnostic(await checkBackendHealth());
    } finally {
      setChecking(false);
    }
  }

  return (
    <Screen>
      <Title>Configuración</Title>
      <Subtitle>Gestión familiar, sesión y apariencia.</Subtitle>

      <Card>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <BodyText style={styles.statusBody}>
          Elige el tema que prefieras. Toda la app soporta modo claro y oscuro.
        </BodyText>
        <View style={styles.segmented}>
          <Pressable
            onPress={() => setMode("dark")}
            style={[styles.segment, mode === "dark" ? styles.segmentActive : null]}
          >
            <Moon size={16} color={mode === "dark" ? colors.onPrimary : colors.text} />
            <Text style={[styles.segmentText, mode === "dark" ? styles.segmentTextActive : null]}>Oscuro</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("light")}
            style={[styles.segment, mode === "light" ? styles.segmentActive : null]}
          >
            <Sun size={16} color={mode === "light" ? colors.onPrimary : colors.text} />
            <Text style={[styles.segmentText, mode === "light" ? styles.segmentTextActive : null]}>Claro</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <Bot size={22} color={colors.primary} />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{isDemoMode ? "IA en modo demo" : "IA por backend"}</Text>
            <BodyText style={styles.statusBody}>
              {isDemoMode
                ? "Conecta Supabase y OpenAI para analizar fotos y conversar con tu historial real."
                : "OpenAI se activa en apps/api/.env; la clave nunca viaja dentro de la app."}
            </BodyText>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.statusRow}>
          <ShieldCheck size={20} color={colors.energy} />
          <BodyText style={styles.securityText}>
            Las claves privadas viven solo en el backend. En mobile solo se usa Supabase anon key.
          </BodyText>
        </View>
        <AppButton
          label="Probar backend e IA"
          icon={Stethoscope}
          variant="secondary"
          loading={checking}
          onPress={runDiagnostic}
        />
        {diagnostic ? <BodyText style={styles.diagnostic}>{diagnostic}</BodyText> : null}
        <AppButton label="Cambiar perfil" icon={Users} variant="secondary" onPress={() => router.push("/profiles")} />
        <AppButton label="Cerrar sesión" icon={LogOut} variant="danger" onPress={signOut} />
      </Card>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    segmented: {
      flexDirection: "row",
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElevated,
      overflow: "hidden",
    },
    segment: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 14,
    },
    segmentTextActive: {
      color: colors.onPrimary,
    },
    statusCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    statusIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundElevated,
    },
    statusText: {
      flex: 1,
      gap: 2,
    },
    statusTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    statusBody: {
      color: colors.muted,
    },
    securityText: {
      flex: 1,
    },
    diagnostic: {
      color: colors.energy,
      fontSize: 13,
    },
  });
}
