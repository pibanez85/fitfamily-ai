import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  platform: "node",
  outDir: "dist",
  clean: true,
  noExternal: ["@fitfamily-ai/shared"],
});
