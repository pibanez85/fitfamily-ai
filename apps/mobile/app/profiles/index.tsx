import { router, useFocusEffect } from "expo-router";
import { Check, Plus, UserRoundCheck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { Subtitle, Title } from "@/components/Typography";
import { api } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

export default function ProfilesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profiles = useAppStore((state) => state.profiles);
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const setProfiles = useAppStore((state) => state.setProfiles);
  const setActiveProfileId = useAppStore((state) => state.setActiveProfileId);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      setError(null);
      api.profiles
        .list()
        .then((data) => {
          if (alive) setProfiles(data);
        })
        .catch((caught) => {
          if (alive) {
            setError(caught instanceof Error ? caught.message : "No pude cargar los perfiles.");
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [setProfiles]),
  );

  return (
    <Screen>
      <Title>Perfiles familiares</Title>
      <Subtitle>Elige con quien entrenar o crea un perfil nuevo.</Subtitle>
      {loading ? <LoadingState /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && profiles.length === 0 ? (
        <EmptyState title="Sin perfiles" body="Crea el primer perfil familiar para comenzar." />
      ) : null}
      {profiles.map((profile) => {
        const selected = profile.id === activeProfileId;
        const initial = profile.displayName.trim().slice(0, 1).toUpperCase();
        return (
          <Pressable
            key={profile.id}
            onPress={() => {
              setActiveProfileId(profile.id);
              router.replace("/dashboard");
            }}
          >
            <Card style={[styles.profileCard, selected ? styles.selected : null]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatar, selected ? styles.avatarSelected : null]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.profileText}>
                  <Text style={styles.name}>{profile.displayName}</Text>
                  <Text style={styles.meta}>{profile.goal ?? "Sin objetivo definido"}</Text>
                </View>
                {selected ? (
                  <View style={styles.check}>
                    <Check size={16} color={colors.onPrimary} />
                  </View>
                ) : (
                  <UserRoundCheck size={22} color={colors.subtle} />
                )}
              </View>
            </Card>
          </Pressable>
        );
      })}
      <AppButton label="Crear perfil" icon={Plus} onPress={() => router.push("/profiles/edit")} />
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  profileCard: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileText: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.energy,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  });
}
