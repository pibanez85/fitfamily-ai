import * as ImagePicker from "expo-image-picker";
import { isDemoMode } from "@/config/env";
import { supabase } from "@/lib/supabase";

type PhotoBucket = "meal-photos" | "machine-photos" | "progress-photos";

export async function pickAndUploadImage(bucket: PhotoBucket, profileId: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitas permiso para seleccionar fotos.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.82,
    // SDK 56: MediaTypeOptions fue removido. Ahora se usa un arreglo de strings.
    mediaTypes: ["images"],
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  // Modo demo: no hay Supabase Storage. Usamos la URI local de la imagen
  // directamente para que el flujo de analisis por IA funcione sin backend.
  if (isDemoMode) {
    return {
      uri: asset.uri,
      path: `demo/${profileId}/${Date.now()}`,
      signedUrl: asset.uri,
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Sesion no disponible.");

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const extension = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${profileId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: asset.mimeType ?? "image/jpeg",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (signedError || !data.signedUrl) {
    throw new Error(signedError?.message ?? "No se pudo firmar la URL de la imagen.");
  }

  return {
    uri: asset.uri,
    path,
    signedUrl: data.signedUrl,
  };
}
