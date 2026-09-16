const path = require("node:path");
const { installWindowsFileTypesWorkaround } = require("./scripts/windows-file-types.cjs");
installWindowsFileTypesWorkaround(path.resolve(__dirname, "../.."));
const { getDefaultConfig } = require("expo/metro-config");

// SDK 56 detects workspace packages and their node_modules automatically.
// Keep Expo's watch folders so native and web resolve the same files.
module.exports = getDefaultConfig(__dirname);
