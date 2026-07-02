import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Mail, Send } from "lucide-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Platform, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/services/authErrors";
import { withTimeout } from "@/services/asyncUtils";
import { colors } from "@/theme/colors";

const ForgotPasswordSchema = z.object({
  email: z.email("Email invalido"),
});

type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>;

function getResetRedirectUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/reset-password`;
  }

  return "fitfamilyai://reset-password";
}

export default function ForgotPasswordScreen() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordForm) {
    setError(null);
    setNotice(null);
    setStatus("Enviando correo de recuperacion...");
    setLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      const redirectTo = getResetRedirectUrl();
      const { error: resetError } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, { redirectTo }),
        20000,
        "Supabase no respondio a tiempo. Revisa internet en el celular o intenta nuevamente.",
      );
      if (resetError) throw resetError;

      setNotice(
        "Listo. Revisa tu correo y abre el enlace de recuperacion desde este celular para crear una clave nueva.",
      );
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setStatus(null);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Recuperar clave</Title>
      <Subtitle>Te enviaremos un correo seguro para crear una clave nueva.</Subtitle>

      <Card>
        <View style={styles.iconBox}>
          <Mail size={22} color={colors.primary} />
        </View>
        <BodyText>
          Escribe el email de tu cuenta. Si existe en Supabase, recibiras un enlace para cambiar la clave.
        </BodyText>
        <FormField
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Enviar enlace" icon={Send} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>

      <Link href="/login" style={styles.link}>
        Volver a iniciar sesion
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  notice: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    color: colors.energy,
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    fontWeight: "800",
    textAlign: "center",
  },
});
