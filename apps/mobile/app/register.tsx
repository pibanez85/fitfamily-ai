import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { Subtitle, Title } from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/services/authErrors";
import { withTimeout } from "@/services/asyncUtils";
import { useAppStore } from "@/store/appStore";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

const RegisterSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "Usa al menos 8 caracteres"),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAppStore((state) => state.setSession);
  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: RegisterForm) {
    setError(null);
    setNotice(null);
    setStatus(null);
    setLoading(true);
    try {
      setStatus("Creando cuenta en Supabase...");
      const { data, error: authError } = await withTimeout(
        supabase.auth.signUp({ email: values.email.trim().toLowerCase(), password: values.password }),
        20000,
        "Supabase no respondio a tiempo. Revisa internet en el celular o intenta nuevamente.",
      );
      if (authError) throw authError;

      if (data.session) {
        setSession(data.session);
        router.replace("/profiles/edit");
        return;
      }

      setNotice("Cuenta creada. Revisa tu correo para confirmar el email y despues inicia sesión.");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setStatus(null);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Crear cuenta</Title>
      <Subtitle>Tu cuenta protege tus datos; la app nunca guarda claves privadas.</Subtitle>
      <Card>
        <FormField
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <FormField control={control} name="password" label="Clave" secureTextEntry />
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Registrarme" icon={UserPlus} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>
      <Link href="/login" style={styles.link}>
        Ya tengo cuenta
      </Link>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
}
