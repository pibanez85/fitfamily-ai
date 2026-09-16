import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

// Local device preferences and drafts. Authentication tokens stay in SecureStore.
export const deviceStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web")
      return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
    if (!FileSystem.documentDirectory) return null;
    const path = `${FileSystem.documentDirectory}${encodeURIComponent(key)}.json`;
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? FileSystem.readAsStringAsync(path) : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    if (!FileSystem.documentDirectory) throw new Error("No hay almacenamiento local disponible.");
    await FileSystem.writeAsStringAsync(
      `${FileSystem.documentDirectory}${encodeURIComponent(key)}.json`,
      value,
    );
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    if (FileSystem.documentDirectory)
      await FileSystem.deleteAsync(
        `${FileSystem.documentDirectory}${encodeURIComponent(key)}.json`,
        { idempotent: true },
      );
  },
};
