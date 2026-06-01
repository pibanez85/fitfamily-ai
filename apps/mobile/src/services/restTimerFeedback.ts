import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";
import type * as ExpoNotifications from "expo-notifications";

let notificationHandlerReady = false;
let notificationPermissionChecked = false;
let notificationPermissionGranted = false;

type NotificationsModule = typeof ExpoNotifications;

export async function prepareRestTimerFeedback(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  if (!notificationHandlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerReady = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("rest-timer", {
      name: "Descansos de entrenamiento",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 120, 250],
    }).catch(() => undefined);
  }

  if (!notificationPermissionChecked) {
    const current = await Notifications.getPermissionsAsync().catch(() => null);
    if (current?.granted) {
      notificationPermissionGranted = true;
    } else {
      const requested = await Notifications.requestPermissionsAsync().catch(() => null);
      notificationPermissionGranted = Boolean(requested?.granted);
    }
    notificationPermissionChecked = true;
  }

  return notificationPermissionGranted;
}

export async function notifyRestFinished(label = "Descanso terminado"): Promise<void> {
  Vibration.vibrate([0, 260, 120, 260]);

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

  if (Platform.OS === "web") {
    playWebBeep();
    return;
  }

  const canNotify = await prepareRestTimerFeedback();
  if (!canNotify) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Descanso terminado",
      body: label,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: "rest-timer",
    },
  }).catch(() => undefined);
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

function playWebBeep() {
  const audioWindow =
    typeof window !== "undefined"
      ? (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      : undefined;
  const AudioContextCtor = audioWindow?.AudioContext ?? audioWindow?.webkitAudioContext;
  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.06;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}
