import { router, useFocusEffect } from "expo-router";
import { Beef, Camera, Dumbbell, Flame, Ruler, Scale, Settings, Utensils, Watch } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { DashboardResponse } from "@fitfamily-ai/shared";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";
import { gymImages } from "@/theme/images";

// Solo accesos que no estan ya en la barra inferior (Entreno, Comida, Coach).
const actions = [
  { label: "Rutina de hoy", href: "/today", icon: Dumbbell },
  { label: "Foto comida", href: "/meals/photo", icon: Camera },
  { label: "Foto máquina", href: "/machines/photo", icon: Camera },
  { label: "Peso y medidas", href: "/body-metrics", icon: Ruler },
  { label: "Reloj", href: "/wearables", icon: Watch },
  { label: "Ajustes", href: "/settings", icon: Settings },
] as const;

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profile = useAppStore((state) => state.activeProfile());
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let alive = true;
      setLoading(true);
      api
        .dashboard(profileId)
        .then((data) => {
          if (alive) setDashboard(data);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [profileId]),
  );

  return (
    <Screen>
      <ImageBackground source={{ uri: gymImages.weights }} imageStyle={styles.heroImage} style={styles.hero}>
        <LinearGradient
          colors={["rgba(4, 8, 16, 0.1)", "rgba(4, 8, 16, 0.55)", "rgba(4, 8, 16, 0.92)"]}
          style={styles.heroOverlay}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroPillRow}>
            <Text style={styles.heroPill}>Family training</Text>
            <Text style={styles.heroPillAccent}>AI ready</Text>
          </View>
          <Text style={styles.heroTitle}>{profile ? `Hola, ${profile.displayName}` : "FitFamily AI"}</Text>
          <Text style={styles.heroSubtitle}>Fuerza, nutrición y progreso en una vista clara.</Text>
          {dashboard ? (
            <View style={styles.heroStats}>
              <HeroStat label="Entrenos" value={String(dashboard.workoutsLast7Days)} />
              <HeroStat label="Comidas" value={String(dashboard.mealsLast7Days)} />
              <HeroStat label="Prote" value={dashboard.averageProteinG ? `${dashboard.averageProteinG}g` : "s/d"} />
            </View>
          ) : null}
        </View>
      </ImageBackground>

      {loading ? <LoadingState /> : null}
      {dashboard ? (
        <View style={styles.statsGrid}>
          <Stat icon={Dumbbell} tint={colors.primary} label="Entrenos 7d" value={String(dashboard.workoutsLast7Days)} />
          <Stat icon={Utensils} tint={colors.energy} label="Comidas 7d" value={String(dashboard.mealsLast7Days)} />
          <Stat icon={Flame} tint={colors.accent} label="Kcal/día" value={dashboard.averageCalories?.toString() ?? "s/d"} />
          <Stat icon={Beef} tint={colors.success} label="Proteína/día" value={dashboard.averageProteinG ? `${dashboard.averageProteinG}g` : "s/d"} />
        </View>
      ) : null}
      {dashboard?.latestWeightKg ? (
        <Card style={styles.weightCard}>
          <View style={styles.weightIcon}>
            <Scale size={19} color={colors.primary} />
          </View>
          <View style={styles.weightText}>
            <Text style={styles.cardTitle}>Último peso</Text>
            <BodyText style={styles.weightValue}>{dashboard.latestWeightKg} kg</BodyText>
          </View>
        </Card>
      ) : null}
      {dashboard?.alerts.length ? (
        <Card>
          <Text style={styles.cardTitle}>Alertas simples</Text>
          {dashboard.alerts.map((alert) => (
            <BodyText key={alert}>{alert}</BodyText>
          ))}
        </Card>
      ) : null}
      {!loading && !dashboard ? <EmptyState title="Sin datos" body="Registra entrenamientos o comidas para alimentar el dashboard." /> : null}
      <View>
        <Title style={styles.sectionTitle}>Accesos rápidos</Title>
        <Subtitle>Registra lo importante con pocos toques.</Subtitle>
      </View>
      <View style={styles.actionGrid}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Pressable
              key={action.href}
              style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
              onPress={() => router.push(action.href)}
            >
              <View style={styles.actionIcon}>
                <Icon size={20} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function Stat({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: typeof Dumbbell;
  tint: string;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${tint}1f` }]}>
        <Icon size={17} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

// El hero va sobre una foto oscura: sus textos usan colores fijos claros
// para mantener contraste en ambos temas.
function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    hero: {
      minHeight: 270,
      overflow: "hidden",
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: "flex-end",
    },
    heroImage: {
      borderRadius: 24,
    },
    heroOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    heroContent: {
      gap: 13,
      padding: 18,
    },
    heroPillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    heroPill: {
      alignSelf: "flex-start",
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: "rgba(248, 250, 252, 0.12)",
      color: "#f8fafc",
      fontSize: 12,
      fontWeight: "900",
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    heroPillAccent: {
      alignSelf: "flex-start",
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: "#facc15",
      color: "#111827",
      fontSize: 12,
      fontWeight: "900",
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    heroTitle: {
      color: "#f8fafc",
      fontSize: 34,
      fontWeight: "900",
      lineHeight: 38,
    },
    heroSubtitle: {
      color: "#dbeafe",
      fontSize: 15,
      lineHeight: 21,
      maxWidth: 270,
    },
    heroStats: {
      flexDirection: "row",
      gap: 8,
    },
    heroStat: {
      minWidth: 82,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(248, 250, 252, 0.14)",
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    heroStatValue: {
      color: "#2dd4bf",
      fontSize: 20,
      fontWeight: "900",
    },
    heroStatLabel: {
      color: "#9aa8bc",
      fontSize: 11,
      fontWeight: "800",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    stat: {
      width: "47%",
      gap: 4,
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    statValue: {
      color: colors.text,
      fontSize: 25,
      fontWeight: "900",
      letterSpacing: -0.8,
    },
    statLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
    },
    weightCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    weightIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySoft,
    },
    weightText: {
      flex: 1,
      gap: 1,
    },
    weightValue: {
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    cardTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginTop: 2,
      marginBottom: 2,
    },
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    action: {
      flexBasis: "30%",
      flexGrow: 1,
      minHeight: 84,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 10,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    actionPressed: {
      opacity: 0.7,
      borderColor: colors.accent,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySoft,
    },
    actionText: {
      color: colors.text,
      fontWeight: "800",
      textAlign: "center",
      fontSize: 12,
    },
  });
}
