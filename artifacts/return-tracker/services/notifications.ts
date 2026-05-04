import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Purchase } from "@/context/PurchaseContext";

const NOTIF_IDS_PREFIX = "@return_tracker_notif_";

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

// Configure how notifications appear when the app is foregrounded
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === "web") return "denied";

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return "granted";

  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermissionStatus;
}

export async function getNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === "web") return "denied";
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermissionStatus;
}

// Returns a list of upcoming trigger timestamps (ms) for a purchase's reminders.
// Skips any that are already in the past.
function getReminderDates(deadlineIso: string): { label: string; date: Date }[] {
  const deadline = new Date(deadlineIso);
  const now = Date.now();

  const candidates = [
    { label: "7 days", offsetDays: 7 },
    { label: "3 days", offsetDays: 3 },
    { label: "1 day", offsetDays: 1 },
  ];

  return candidates
    .map(({ label, offsetDays }) => {
      const date = new Date(deadline);
      date.setDate(date.getDate() - offsetDays);
      // Fire at 9am on the reminder day
      date.setHours(9, 0, 0, 0);
      return { label, date };
    })
    .filter(({ date }) => date.getTime() > now);
}

function notifBody(label: string, merchant: string, items: string): string {
  if (label === "1 day") {
    return `Last chance — return your ${items} from ${merchant} by tomorrow.`;
  }
  return `Your ${items} from ${merchant} must be returned within ${label}.`;
}

async function saveNotifIds(purchaseId: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(
    NOTIF_IDS_PREFIX + purchaseId,
    JSON.stringify(ids)
  );
}

async function loadNotifIds(purchaseId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(NOTIF_IDS_PREFIX + purchaseId);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function removeNotifIds(purchaseId: string): Promise<void> {
  await AsyncStorage.removeItem(NOTIF_IDS_PREFIX + purchaseId);
}

export async function scheduleNotificationsForPurchase(
  purchase: Purchase
): Promise<void> {
  if (Platform.OS === "web") return;
  if (purchase.status !== "active") return;

  const permission = await getNotificationPermission();
  if (permission !== "granted") return;

  // Cancel any existing notifications for this purchase first
  await cancelNotificationsForPurchase(purchase.id);

  const reminders = getReminderDates(purchase.returnDeadline);
  const ids: string[] = [];

  for (const { label, date } of reminders) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Return deadline: ${purchase.merchant}`,
          body: notifBody(label, purchase.merchant, purchase.items),
          data: { purchaseId: purchase.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      ids.push(id);
    } catch {
      // Silently skip if scheduling fails (e.g. date in the past race condition)
    }
  }

  await saveNotifIds(purchase.id, ids);
}

export async function cancelNotificationsForPurchase(
  purchaseId: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const ids = await loadNotifIds(purchaseId);
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already fired or cancelled
    }
  }
  await removeNotifIds(purchaseId);
}

export async function syncAllNotifications(
  purchases: Purchase[]
): Promise<void> {
  if (Platform.OS === "web") return;
  const permission = await getNotificationPermission();
  if (permission !== "granted") return;

  // Cancel ALL currently scheduled notifications and rebuild from scratch
  await Notifications.cancelAllScheduledNotificationsAsync();

  const active = purchases.filter((p) => p.status === "active");
  for (const purchase of active) {
    const reminders = getReminderDates(purchase.returnDeadline);
    const ids: string[] = [];

    for (const { label, date } of reminders) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Return deadline: ${purchase.merchant}`,
            body: notifBody(label, purchase.merchant, purchase.items),
            data: { purchaseId: purchase.id },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
          },
        });
        ids.push(id);
      } catch {
        // Skip
      }
    }

    await saveNotifIds(purchase.id, ids);
  }
}

export async function getScheduledCount(): Promise<number> {
  if (Platform.OS === "web") return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}

export async function getScheduledNotifications(): Promise<
  Notifications.ScheduledNotificationObject[]
> {
  if (Platform.OS === "web") return [];
  return Notifications.getAllScheduledNotificationsAsync();
}
