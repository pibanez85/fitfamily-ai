import { router, useFocusEffect, type Href } from "expo-router";
import {
  Beef,
  Bot,
  Camera,
  ChevronRight,
  Dumbbell,
  Flame,
  Ruler,
  Scale,
  Settings,
  Utensils,
  Watch,
} from "lucide-react-native";
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

type DashboardIcon = typeof Dumbbell;
type ActionTone = "primary" | "energy" | "accent" | "success" | "neutral";
type DashboardAction = {
  label: string;
  description: string;
  href: Href;
  icon: DashboardIcon;
  tone: ActionTone;
};

const actions = [
  {
    label: "Rutina de hoy",
    description: "Entrena o adapta",
    href: "/today",
    icon: Dumbbell,
    tone: "primary",
  },
  {
    label: "Registrar comida",
    description: "Macros y porciones",
    href: "/meals/new",
    icon: Utensils,
    tone: "energy",
  },
  {
    label: "Foto comida",
    description: "Estimar con IA",
    href: "/meals/photo",
    icon: Camera,
    tone: "accent",
  },
  {
    label: "Peso y medidas",
    description: "Actualizar progreso",
    href: "/body-metrics",
    icon: Ruler,
    tone: "success",
  },
  {
    label: "Reloj",
    description: "Conectar salud",
    href: "/wearables",
    icon: Watch,
    tone: "primary",
  },
  {
    label: "Ajustes",
    description: "Tema y cuenta",
    href: "/settings",
    icon: Settings,
    tone: "neutral",
  },
] satisfies DashboardAction[];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const profile = useAppStore((state) => state.activeProfile());
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const nextAction = useMemo(() => buildNextAction(dashboard), [dashboard]);

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
      <ImageBackground
        source={{ uri: gymImages.weights }}
        imageStyle={styles.heroImage}
        style={styles.hero}
      >
        <LinearGradient
          colors={["rgba(4, 8, 16, 0.1)", "rgba(4, 8, 16, 0.55)", "rgba(4, 8, 16, 0.92)"]}
          style={styles.heroOverlay}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroPillRow}>
            <Text style={styles.heroPill}>Entreno familiar</Text>
            <Text style={styles.heroPillAccent}>Coach IA</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {profile ? `Hola, ${profile.displayName}` : "FitFamily AI"}
          </Text>
          <Text style={styles.heroSubtitle}>Una vista simple para decidir tu próximo paso.</Text>
          {dashboard ? (
            <View style={styles.heroStats}>
              <HeroStat label="Entrenos" value={String(dashboard.workoutsLast7Days)} />
              <HeroStat label="Comidas" value={String(dashboard.mealsLast7Days)} />
              <HeroStat
                label="Prote"
                value={dashboard.averageProteinG ? `${dashboard.averageProteinG}g` : "s/d"}
              />
            </View>
          ) : null}
        </View>
      </ImageBackground>

      {loading ? <LoadingState /> : null}
      {!loading && dashboard && nextAction ? (
        <DailyPlanCard dashboard={dashboard} action={nextAction} />
      ) : null}
      {dashboard ? (
        <View style={styles.statsGrid}>
          <Stat
            icon={Dumbbell}
            tint={colors.primary}
            label="Entrenos 7d"
            value={String(dashboard.workoutsLast7Days)}
          />
          <Stat
            icon={Utensils}
            tint={colors.energy}
            label="Comidas 7d"
            value={String(dashboard.mealsLast7Days)}
          />
          <Stat
            icon={Flame}
            tint={colors.accent}
            label="Kcal/día"
            value={dashboard.averageCalories?.toString() ?? "s/d"}
          />
          <Stat
            icon={Beef}
            tint={colors.success}
            label="Proteína/día"
            value={dashboard.averageProteinG ? `${dashboard.averageProteinG}g` : "s/d"}
          />
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
      {!loading && !dashboard ? (
        <EmptyState
          title="Sin datos"
          body="Registra entrenamientos o comidas para alimentar el dashboard."
        />
      ) : null}
      <View>
        <Title style={styles.sectionTitle}>Accesos rápidos</Title>
        <Subtitle>Registra lo importante con pocos toques.</Subtitle>
      </View>
      <View style={styles.actionGrid}>
        {actions.map((action) => {
          return <QuickAction key={action.href.toString()} action={action} />;
        })}
      </View>
    </Screen>
  );
}

function DailyPlanCard({
  dashboard,
  action,
}: {
  dashboard: DashboardResponse;
  action: DashboardAction;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Icon = action.icon;
  const tint = toneColor(action.tone, colors);
  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={[styles.planIcon, { backgroundColor: `${tint}1f` }]}>
          <Icon size={20} color={tint} />
        </View>
        <View style={styles.planText}>
          <Text style={styles.planEyebrow}>Plan de hoy</Text>
          <Text style={styles.planTitle}>{action.label}</Text>
          <Text style={styles.planDescription}>{action.description}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${action.label}`}
          style={styles.planCta}
          onPress={() => router.push(action.href)}
        >
          <ChevronRight size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
      <View style={styles.signalRow}>
        <Signal
          label="Entrenos 7d"
          value={String(dashboard.workoutsLast7Days)}
          active={dashboard.workoutsLast7Days > 0}
        />
        <Signal
          label="Comidas 7d"
          value={String(dashboard.mealsLast7Days)}
          active={dashboard.mealsLast7Days > 0}
        />
        <Signal
          label="Peso"
          value={dashboard.latestWeightKg ? `${dashboard.latestWeightKg} kg` : "pend."}
          active={Boolean(dashboard.latestWeightKg)}
        />
      </View>
    </Card>
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

function QuickAction({ action }: { action: DashboardAction }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Icon = action.icon;
  const tint = toneColor(action.tone, colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action.label}: ${action.description}`}
      style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
      onPress={() => router.push(action.href)}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${tint}1f` }]}>
        <Icon size={20} color={tint} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionText} numberOfLines={2}>
          {action.label}
        </Text>
        <Text style={styles.actionDescription} numberOfLines={2}>
          {action.description}
        </Text>
      </View>
    </Pressable>
  );
}

function Signal({ label, value, active }: { label: string; value: string; active: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.signal, active ? styles.signalActive : null]}>
      <Text style={[styles.signalValue, active ? styles.signalValueActive : null]}>{value}</Text>
      <Text style={styles.signalLabel}>{label}</Text>
    </View>
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

function buildNextAction(dashboard: DashboardResponse | null): DashboardAction | null {
  if (!dashboard) return null;
  if (dashboard.workoutsLast7Days === 0) {
    return {
      label: "Empieza tu rutina activa",
      description: "Abre el entrenamiento de hoy y registra la primera sesión de la semana.",
      href: "/today",
      icon: Dumbbell,
      tone: "primary",
    };
  }
  if (dashboard.mealsLast7Days === 0) {
    return {
      label: "Registra tu primera comida",
      description: "Agrega una comida rápida para que los macros empiecen a tener sentido.",
      href: "/meals/new",
      icon: Utensils,
      tone: "energy",
    };
  }
  if (!dashboard.latestWeightKg) {
    return {
      label: "Agrega tu punto de partida",
      description: "Registra peso y medidas para ver progreso real en las próximas semanas.",
      href: "/body-metrics",
      icon: Scale,
      tone: "success",
    };
  }
  return {
    label: "Pide una recomendación",
    description: "Pregunta al Coach IA qué ajustar hoy según tus registros recientes.",
    href: "/chat",
    icon: Bot,
    tone: "accent",
  };
}

function toneColor(tone: ActionTone, colors: ColorPalette) {
  if (tone === "energy") return colors.energy;
  if (tone === "accent") return colors.accent;
  if (tone === "success") return colors.success;
  if (tone === "neutral") return colors.muted;
  return colors.primary;
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
    planCard: {
      gap: 14,
      borderColor: colors.primarySoft,
      backgroundColor: colors.backgroundElevated,
    },
    planHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    planIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    planText: {
      flex: 1,
      gap: 2,
    },
    planEyebrow: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    planTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    planDescription: {
      color: colors.muted,
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: "700",
    },
    planCta: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    signalRow: {
      flexDirection: "row",
      gap: 8,
    },
    signal: {
      flex: 1,
      minHeight: 58,
      justifyContent: "center",
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    signalActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    signalValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
    },
    signalValueActive: {
      color: colors.primary,
    },
    signalLabel: {
      color: colors.muted,
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
      letterSpacing: 0,
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
      letterSpacing: 0,
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
      flexBasis: "47%",
      flexGrow: 1,
      minHeight: 98,
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
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
    },
    actionCopy: {
      gap: 2,
    },
    actionText: {
      color: colors.text,
      fontWeight: "900",
      fontSize: 13,
      lineHeight: 17,
    },
    actionDescription: {
      color: colors.muted,
      fontWeight: "700",
      fontSize: 11.5,
      lineHeight: 15,
    },
  });
}
