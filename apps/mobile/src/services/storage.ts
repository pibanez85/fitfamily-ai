import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
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
  if (!userId) throw new Error("Sesion no disponible.");

  const response = await fetch(normalized.uri);
  const blob = await response.blob();
  const path = `${userId}/${profileId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
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
