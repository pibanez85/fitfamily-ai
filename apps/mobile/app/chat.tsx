import { Send, Sparkles } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import type { ColorPalette } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
};

// Preguntas de ejemplo tocables para partir sin pensar que escribir.
const suggestions = [
  "Como voy esta semana con fuerza y proteína?",
  "Que puedo mejorar de mi rutina actual?",
  "Dame ideas de cena alta en proteína",
  "Me duele un poco el hombro, que hago?",
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const profileId = useActiveProfileId();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(prompt?: string) {
    const userMessage = (prompt ?? text).trim();
    if (!profileId || !userMessage) return;
    setText("");
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const result = await api.ai.chat(profileId, userMessage, threadId);
      setThreadId(result.threadId);
      setMessages((current) => [...current, result.message]);
    } catch (caught) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: caught instanceof Error ? caught.message : "No pude responder ahora.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Chat con IA</Title>
      <Subtitle>Usa perfil, objetivos, comidas, entrenos y métricas de los últimos 30 días.</Subtitle>
      <View style={styles.messages}>
        {messages.length === 0 ? (
          <View style={styles.suggestionsBox}>
            <BodyText>Toca una pregunta para partir o escribe la tuya:</BodyText>
            <View style={styles.suggestionsRow}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  accessibilityRole="button"
                  onPress={() => void send(suggestion)}
                  style={styles.suggestionChip}
                >
                  <Sparkles size={13} color={colors.energy} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}
          >
            <Text style={message.role === "user" ? styles.userBubbleText : styles.bubbleText}>
              {message.content}
            </Text>
          </View>
        ))}
        {loading ? <BodyText>Respondiendo...</BodyText> : null}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escribe tu pregunta"
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar pregunta"
          style={styles.send}
          onPress={() => void send()}
        >
          <Send size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    messages: {
      gap: 10,
    },
    suggestionsBox: {
      gap: 10,
    },
    suggestionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    suggestionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    suggestionText: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 12.5,
    },
    bubble: {
      maxWidth: "88%",
      borderRadius: 8,
      padding: 12,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
    },
    assistantBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: {
      color: colors.text,
      lineHeight: 20,
    },
    userBubbleText: {
      color: colors.onPrimary,
      lineHeight: 20,
    },
    inputRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-end",
    },
    input: {
      flex: 1,
      minWidth: 0,
      minHeight: 46,
      maxHeight: 120,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 12,
    },
    send: {
      width: 46,
      height: 46,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
  });
}
