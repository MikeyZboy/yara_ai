import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from "@/services/notifications";

export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermissionStatus>("undetermined");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getNotificationPermission();
    setStatus(s);
    setLoading(false);
  }, []);

  const request = useCallback(async () => {
    const s = await requestNotificationPermission();
    setStatus(s);
    return s;
  }, []);

  useEffect(() => {
    refresh();

    if (Platform.OS === "web") return;

    // Re-check whenever app comes back to foreground
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { status, loading, request, refresh };
}
