type SupabaseAuthLikeError = {
  code?: string;
  message?: string;
  status?: number;
};

export function getAuthErrorMessage(error: unknown): string {
  const authError = error as SupabaseAuthLikeError;
  const code = authError.code?.toLowerCase() ?? "";
  const message = authError.message?.toLowerCase() ?? "";

  if (
    code.includes("over_email_send_rate_limit") ||
    message.includes("email rate limit") ||
    message.includes("rate limit")
  ) {
    return "Supabase bloqueo temporalmente el envio de emails. Espera unos minutos o desactiva la confirmacion de email mientras desarrollas.";
  }

  if (message.includes("invalid login credentials")) {
    return "Email o clave incorrectos. Revisa los datos e intenta nuevamente.";
  }

  if (message.includes("fetch") || message.includes("network") || message.includes("failed to fetch")) {
    return "No pude conectar con Supabase. Revisa internet en el celular o intenta nuevamente.";
  }

  if (message.includes("no respondio a tiempo") || message.includes("no pude limpiar")) {
    return authError.message ?? "La autenticacion no respondio a tiempo.";
  }

  if (message.includes("email not confirmed")) {
    return "Tu email aun no esta confirmado. Revisa tu correo antes de iniciar sesion.";
  }

  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Ese email ya esta registrado. Prueba iniciar sesion.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "El registro esta desactivado en Supabase Auth. Activalo en Authentication > Providers > Email.";
  }

  return authError.message ?? "No se pudo completar la autenticacion.";
}
