import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, type Href } from "expo-router";
import { LogIn, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { BrandHero } from "@/components/BrandHero";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Screen } from "@/components/Screen";
import { BodyText } from "@/components/Typography";
import { isDemoMode } from "@/config/env";
import { api } from "@/services/api";
import { getAuthErrorMessage } from "@/services/authErrors";
import { withTimeout } from "@/services/asyncUtils";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";
import { colors } from "@/theme/colors";

const LoginSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

type LoginForm = z.infer<typeof LoginSchema>;
const forgotPasswordHref = "/forgot-password" as Href;

export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const setSession = useAppStore((state) => state.setSession);
  const setProfiles = useAppStore((state) => state.setProfiles);
  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function enter() {
    setStatus("Cargando perfiles familiares...");
    const profiles = await api.profiles.list();
    setProfiles(profiles);
    router.replace(profiles.length > 0 ? "/profiles" : "/profiles/edit");
  }

  async function onSubmit(values: LoginForm) {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      setStatus("Limpiando sesion anterior...");
      await withTimeout(
        supabase.auth.signOut({ scope: "local" }),
        10000,
        "No pude limpiar la sesion anterior. Cierra Expo Go y vuelve a abrir la app.",
      );

      setStatus("Validando correo y clave en Supabase...");
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password: values.password }),
        20000,
        "Supabase no respondio a tiempo. Revisa internet en el celular o intenta nuevamente.",
      );
      if (authError) throw authError;
      if (data.session) setSession(data.session);
      setStatus("Sesion iniciada. Abriendo perfiles...");
      router.replace("/profiles");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function enterDemo() {
    setError(null);
    setStatus(null);
    setDemoLoading(true);
    try {
      if (!isDemoMode) {
        setStatus("Entrando con demo real...");
        await withTimeout(
          supabase.auth.signInWithPassword({ email: "demo@fitfamily.ai", password: "demo1234" }),
          20000,
          "La cuenta demo no respondio a tiempo.",
        );
      }
      await enter();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo entrar en modo demo.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <Screen>
      <BrandHero subtitle="Entrenamiento, comida y progreso familiar con IA util." />

      {isDemoMode ? (
        <Card style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.demoTitle}>Modo demo activo</Text>
          </View>
          <BodyText style={styles.demoText}>
            No hay credenciales configuradas, asi que la app corre con datos de ejemplo. Entra con un toque y
            explora todo sin configurar nada.
          </BodyText>
          <AppButton label="Entrar en modo demo" icon={Sparkles} loading={demoLoading} onPress={enterDemo} />
        </Card>
      ) : null}

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
        <Link href={forgotPasswordHref} style={styles.forgotLink}>
          Olvide mi clave
        </Link>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Iniciar sesion" icon={LogIn} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>

      <Link href="/register" style={styles.link}>
        Crear cuenta
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  status: {
    color: colors.energy,
    fontSize: 13,
    lineHeight: 18,
  },
  demoCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoTitle: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  demoText: {
    color: colors.primaryDark,
  },
  link: {
    color: colors.primary,
    fontWeight: "800",
    textAlign: "center",
  },
  forgotLink: {
    color: colors.primary,
    fontWeight: "800",
    textAlign: "right",
  },
});
