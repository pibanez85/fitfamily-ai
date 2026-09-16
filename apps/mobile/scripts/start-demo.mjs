import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expoCli = resolve(mobileRoot, "../../node_modules/expo/bin/cli");
// pnpm and npm may pass a standalone separator; Expo expects the flags directly.
const args = process.argv.slice(2).filter((argument) => argument !== "--");
console.log("FitFamily · Modo demo local. No usa Supabase ni realiza solicitudes a OpenAI.");
const child = spawn(
  process.execPath,
  ["--use-system-ca", expoCli, "start", "--go", "--clear", ...args],
  {
    cwd: mobileRoot,
    env: {
      ...process.env,
      EXPO_NO_DOTENV: "1",
      EXPO_PUBLIC_DEMO_MODE: "true",
      EXPO_PUBLIC_SUPABASE_URL: "",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "",
      EXPO_PUBLIC_API_URL: "http://localhost:4000",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);
child.on("error", (error) => {
  console.error(`No se pudo iniciar Expo: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
