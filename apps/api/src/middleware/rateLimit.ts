import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

// Los endpoints de IA llaman a OpenAI (costo por request), asi que los
// protegemos contra bucles/abuso. Como las rutas ya pasaron por requireAuth,
// limitamos por usuario autenticado; caemos a IP solo por seguridad.
function userOrIpKey(req: Request): string {
  return req.user?.id ?? ipKeyGenerator(req.ip ?? "unknown");
}

export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  limit: 30, // 30 llamadas de IA por usuario por ventana (holgado para humanos)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "AI_RATE_LIMITED",
        message: "Demasiadas solicitudes de IA seguidas. Espera un momento e intenta nuevamente.",
      },
    });
  },
});
