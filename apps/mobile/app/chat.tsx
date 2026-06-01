import { Send } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { useActiveProfileId } from "@/lib/activeProfile";
import { api } from "@/services/api";
import { colors } from "@/theme/colors";

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatScreen() {
  const profileId = useActiveProfileId();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!profileId || !text.trim()) return;
    const userMessage = text.trim();
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
      <Subtitle>Usa perfil, objetivos, comidas, entrenos y metricas de los ultimos 30 dias.</Subtitle>
      <View style={styles.messages}>
        {messages.length === 0 ? (
          <BodyText>Pregunta algo como: "Como voy esta semana con fuerza y proteina?"</BodyText>
        ) : null}
        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}
          >
            <Text style={styles.bubbleText}>{message.content}</Text>
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
        <Pressable style={styles.send} onPress={send}>
          <Send size={20} color="#ffffff" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  messages: {
    gap: 10,
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
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
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
