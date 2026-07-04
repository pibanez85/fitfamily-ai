import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { readAsStringAsync } from "expo-file-system/legacy";
import { isDemoMode } from "@/config/env";
import { supabase } from "@/lib/supabase";

type PhotoBucket = "meal-photos" | "machine-photos" | "progress-photos";
type PhotoSource = "camera" | "library";

const MAX_IMAGE_WIDTH = 1400;

export async function pickAndUploadImage(bucket: PhotoBucket, profileId: string) {
  return pickAndUploadImageFromSource(bucket, profileId, "library");
}

export async function pickAndUploadImageFromSource(
  bucket: PhotoBucket,
  profileId: string,
  source: PhotoSource,
) {
  const result = source === "camera" ? await takeImageFromCamera() : await pickImageFromLibrary();

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const normalized = await normalizeImageForUpload(asset);

  // Modo demo: no hay Supabase Storage. Usamos la URI local de la imagen
  // directamente para que el flujo de analisis por IA funcione sin backend.
  if (isDemoMode) {
    return {
      uri: normalized.uri,
      path: `demo/${profileId}/${Date.now()}.jpg`,
      signedUrl: normalized.uri,
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("Tu sesión expiró. Cierra sesión y vuelve a entrar para subir fotos.");
  }

  const body = await readImageBody(normalized.uri);
  const path = `${userId}/${profileId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`No pude subir la foto a Supabase Storage: ${error.message}`);
  }

  const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (signedError || !data.signedUrl) {
    throw new Error(signedError?.message ?? "No se pudo firmar la URL de la imagen.");
  }

  return {
    uri: normalized.uri,
    path,
    signedUrl: data.signedUrl,
  };
}

// En nativo (sobre todo Android), fetch("file://...") falla con
// "Network request failed", asi que leemos el archivo como base64 y subimos
// un ArrayBuffer. En web el blob funciona bien.
async function readImageBody(uri: string): Promise<Blob | ArrayBuffer> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    return response.blob();
  }

  try {
    const base64 = await readAsStringAsync(uri, { encoding: "base64" });
    return base64ToArrayBuffer(base64);
  } catch {
    throw new Error("No pude leer la foto desde el dispositivo. Intenta con otra imagen.");
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function pickImageFromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitas permiso para seleccionar fotos.");
  }

  return ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.82,
    // SDK 56: MediaTypeOptions fue removido. Ahora se usa un arreglo de strings.
    mediaTypes: ["images"],
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
}

async function takeImageFromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Necesitas permiso de camara para sacar fotos.");
  }

  return ImagePicker.launchCameraAsync({
    allowsEditing: true,
    cameraType: ImagePicker.CameraType.back,
    exif: false,
    quality: 0.82,
    mediaTypes: ["images"],
  });
}

async function normalizeImageForUpload(asset: ImagePicker.ImagePickerAsset) {
  const resize = asset.width && asset.width > MAX_IMAGE_WIDTH ? [{ resize: { width: MAX_IMAGE_WIDTH } }] : [];

  try {
    return await manipulateAsync(asset.uri, resize, {
      compress: 0.82,
      format: SaveFormat.JPEG,
    });
  } catch {
    throw new Error("No pude preparar la foto para subirla. Prueba con otra imagen o sacala nuevamente.");
  }
}
