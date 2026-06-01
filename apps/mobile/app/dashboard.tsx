import { router, useFocusEffect } from "expo-router";
import {
  Bot,
  Camera,
  Dumbbell,
  ListChecks,
  Ruler,
  Settings,
  Utensils,
  Watch,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import type { DashboardResponse } from "@fitfamily-ai/shared";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { colors } from "@/theme/colors";
import { gymImages } from "@/theme/images";

const actions = [
  { label: "Rutina de hoy", href: "/today", icon: Dumbbell },
  { label: "Rutinas", href: "/workouts", icon: ListChecks },
  { label: "Comidas", href: "/meals", icon: Utensils },
  { label: "Foto comida", href: "/meals/photo", icon: Camera },
  { label: "Foto maquina", href: "/machines/photo", icon: Camera },
  { label: "Chat IA", href: "/chat", icon: Bot },
  { label: "Metricas", href: "/body-metrics", icon: Ruler },
  { label: "Reloj", href: "/wearables", icon: Watch },
  { label: "Ajustes", href: "/settings", icon: Settings },
] as const;

export default function DashboardScreen() {
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
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroPillRow}>
            <Text style={styles.heroPill}>Family training</Text>
            <Text style={styles.heroPillAccent}>AI ready</Text>
          </View>
          <Text style={styles.heroTitle}>{profile ? `Hola, ${profile.displayName}` : "FitFamily AI"}</Text>
          <Text style={styles.heroSubtitle}>Fuerza, nutricion y progreso en una vista clara.</Text>
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
          <Stat label="Entrenos 7d" value={String(dashboard.workoutsLast7Days)} />
          <Stat label="Comidas 7d" value={String(dashboard.mealsLast7Days)} />
          <Stat label="Kcal prom." value={dashboard.averageCalories?.toString() ?? "s/d"} />
          <Stat label="Prote prom." value={dashboard.averageProteinG ? `${dashboard.averageProteinG}g` : "s/d"} />
        </View>
      ) : null}
      {dashboard?.latestWeightKg ? (
        <Card>
          <Text style={styles.cardTitle}>Ultimo peso</Text>
          <BodyText>{dashboard.latestWeightKg} kg</BodyText>
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
        <Title style={styles.sectionTitle}>Accesos rapidos</Title>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(3, 7, 18, 0.64)",
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
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  heroPillAccent: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.energy,
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  heroTitle: {
    color: colors.text,
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
    color: colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  heroStatLabel: {
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
  },
  statValue: {
    color: colors.energy,
    fontSize: 26,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
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
    width: "47%",
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    color: colors.text,
    fontWeight: "800",
    textAlign: "center",
    fontSize: 13,
  },
});
