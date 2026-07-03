import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useTheme } from "@/theme/theme";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";

export type AIHelperAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

type AIHelperCardProps = {
  title: string;
  subtitle?: string;
  chips: string[];
  onAsk: (prompt: string) => void;
  response?: string | null;
  loading?: boolean;
  actions?: AIHelperAction[];
};

/**
 * Tarjeta reutilizable de asistencia IA contextual.
 * - chips: preguntas/prompts rápidos.
 * - onAsk(prompt): el caller envia el prompt al backend (api.ai.chat) con el contexto que corresponda.
 * - response/loading: estado de la respuesta para mostrar al usuario.
 * - actions: botones que el caller renderiza cuando la respuesta es aplicable
 *   (ej. "Aplicar solo hoy", "Aplicar a rutina base", "Descartar"). Nunca se aplica
 *   ningun cambio automaticamente sin confirmacion del usuario.
 */
export function AIHelperCard({
  title,
  subtitle,
  chips,
  onAsk,
  response,
  loading,
  actions,
}: AIHelperCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Sparkles size={18} color={colors.onPrimary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => onAsk(prompt)}
              style={styles.chip}
              accessibilityRole="button"
            >
              <Text style={styles.chipText} numberOfLines={2}>
                {prompt}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Pensando con tu contexto...</Text>
        </View>
      ) : null}

      {response && !loading ? <Text style={styles.response}>{response}</Text> : null}

      {actions && actions.length > 0 && !loading ? (
        <View style={styles.actions}>
          {actions.map((action) => {
            const variant = action.variant ?? "secondary";
            return (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  variant === "primary" ? styles.actionPrimary : null,
                  variant === "ghost" ? styles.actionGhost : null,
                ]}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    variant === "primary" ? styles.actionLabelPrimary : null,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        Sugerencias orientativas. Confirma cualquier cambio antes de aplicarlo.
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      gap: 12,
      padding: 16,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    header: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    headerText: { flex: 1, gap: 2 },
    title: { color: colors.text, fontSize: 16, fontWeight: "900" },
    subtitle: { color: colors.muted, fontSize: 13 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: "100%",
    },
    chipText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
    loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    loadingText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    response: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    actionButton: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.backgroundElevated,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionGhost: { backgroundColor: "transparent", borderColor: colors.border },
    actionLabel: { color: colors.primary, fontWeight: "900", fontSize: 13 },
    actionLabelPrimary: { color: colors.onPrimary },
    disclaimer: { color: colors.muted, fontSize: 11.5, lineHeight: 15 },
  });
}
