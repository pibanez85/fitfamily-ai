import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { Link, router } from "expo-router";
import { KeyRound, ShieldCheck } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { LoadingState } from "@/components/StateViews";
import { Screen } from "@/components/Screen";
import { BodyText, Subtitle, Title } from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { getAuthErrorMessage } from "@/services/authErrors";
import { withTimeout } from "@/services/asyncUtils";
import type { ColorPalette } from "@/theme/colors";
import { useTheme } from "@/theme/theme";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Usa al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma la clave"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las claves no coinciden",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;

function readRecoveryParams(url: string) {
  const params = new URLSearchParams();
  const query = url.includes("?") ? url.split("?")[1]?.split("#")[0] : "";
  const hash = url.includes("#") ? url.split("#")[1] : "";

  for (const part of [query, hash]) {
    if (!part) continue;
    new URLSearchParams(part).forEach((value, key) => params.set(key, value));
  }

  return params;
}

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState("Validando enlace de recuperación...");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const consumedUrl = useRef<string | null>(null);
  const { control, handleSubmit } = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let alive = true;

    async function consume(url: string | null) {
      if (!url || consumedUrl.current === url) {
        if (alive) {
          setReady(true);
          setStatus("");
        }
        return;
      }

      consumedUrl.current = url;
      try {
        const params = readRecoveryParams(url);
        const code = params.get("code");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            20000,
            "No pude validar el enlace de recuperación a tiempo.",
          );
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await withTimeout(
            supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
            20000,
            "No pude abrir la sesión de recuperación a tiempo.",
          );
          if (sessionError) throw sessionError;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            throw new Error("Abre esta pantalla desde el enlace que llega a tu correo.");
          }
        }

        if (alive) {
          setNotice("Enlace validado. Ahora crea una clave nueva.");
          setError(null);
        }
      } catch (caught) {
        if (alive) setError(getAuthErrorMessage(caught));
      } finally {
        if (alive) {
          setStatus("");
          setReady(true);
        }
      }
    }

    Linking.getInitialURL().then(consume);
    const subscription = Linking.addEventListener("url", ({ url }) => consume(url));

    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  async function onSubmit(values: ResetPasswordForm) {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password: values.password }),
        20000,
        "Supabase no respondio a tiempo al cambiar la clave.",
      );
      if (updateError) throw updateError;

      setNotice("Clave actualizada. Ya puedes iniciar sesión con tu nueva clave.");
      await supabase.auth.signOut({ scope: "local" });
      setTimeout(() => router.replace("/login"), 900);
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <LoadingState label={status || "Preparando cambio de clave..."} />;
  }

  return (
    <Screen>
      <Title>Nueva clave</Title>
      <Subtitle>Usa una clave que no compartas con otras cuentas.</Subtitle>

      <Card>
        <View style={styles.iconBox}>
          <KeyRound size={22} color={colors.primary} />
        </View>
        <BodyText>Ingresa tu nueva clave. Por seguridad, la app no muestra ni guarda tu clave.</BodyText>
        <FormField control={control} name="password" label="Nueva clave" secureTextEntry />
        <FormField control={control} name="confirmPassword" label="Repetir clave" secureTextEntry />
        {notice ? (
          <View style={styles.noticeBox}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.notice}>{notice}</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Guardar nueva clave" icon={ShieldCheck} loading={loading} onPress={handleSubmit(onSubmit)} />
      </Card>

      <Link href="/login" style={styles.link}>
        Volver a iniciar sesión
      </Link>
    </Screen>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    noticeBox: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    link: {
      color: colors.primary,
      fontWeight: "800",
      textAlign: "center",
    },
  });
}
