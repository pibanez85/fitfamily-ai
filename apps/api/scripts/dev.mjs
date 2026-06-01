import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, "..");
const tsxCli = resolve(apiRoot, "../../node_modules/tsx/dist/cli.mjs");
const nodeOptions = process.env.NODE_OPTIONS ?? "";
const needsSystemCa = !nodeOptions.split(/\s+/).includes("--use-system-ca");

const child = spawn(process.execPath, [tsxCli, "watch", "src/server.ts"], {
  cwd: apiRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: needsSystemCa ? `${nodeOptions} --use-system-ca`.trim() : nodeOptions,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
