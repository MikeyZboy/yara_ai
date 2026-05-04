import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PurchaseCard } from "@/components/PurchaseCard";
import { SectionHeader } from "@/components/SectionHeader";
import { computeDeadlineStatus, usePurchases } from "@/context/PurchaseContext";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import {
  getScheduledCount,
  syncAllNotifications,
} from "@/services/notifications";
import { useColors } from "@/hooks/useColors";

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { urgentPurchases, expiringPurchases, activePurchases, purchases } =
    usePurchases();
  const { status: permStatus, loading: permLoading, request } =
    useNotificationPermission();
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const safePurchases = activePurchases.filter((p) => {
    const { daysLeft } = computeDeadlineStatus(p);
    return daysLeft > 14;
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const hasAnyAlerts =
    urgentPurchases.length > 0 || expiringPurchases.length > 0;

  useEffect(() => {
    if (permStatus === "granted") {
      getScheduledCount().then(setScheduledCount);
    }
  }, [permStatus, purchases]);

  async function handleEnableNotifications() {
    const result = await request();
    if (result === "granted") {
      setSyncing(true);
      await syncAllNotifications(purchases);
      const count = await getScheduledCount();
      setScheduledCount(count);
      setSyncing(false);
    } else if (result === "denied") {
      // Already denied — send to settings
      Linking.openSettings();
    }
  }

  async function handleResync() {
    setSyncing(true);
    await syncAllNotifications(purchases);
    const count = await getScheduledCount();
    setScheduledCount(count);
    setSyncing(false);
  }

  const renderNotificationBanner = () => {
    if (Platform.OS === "web") return null;
    if (permLoading) return null;

    if (permStatus === "granted") {
      return (
        <View
          style={[
            styles.notifBanner,
            { backgroundColor: colors.safe, borderColor: colors.safeBorder },
          ]}
        >
          <View style={styles.notifBannerLeft}>
            <View
              style={[
                styles.notifIconWrap,
                { backgroundColor: colors.safeForeground + "22" },
              ]}
            >
              <Feather name="bell" size={16} color={colors.safeForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.notifBannerTitle, { color: colors.safeForeground }]}
              >
                Notifications active
              </Text>
              <Text
                style={[styles.notifBannerSub, { color: colors.safeForeground }]}
              >
                {scheduledCount === null
                  ? "Loading…"
                  : scheduledCount === 0
                  ? "No upcoming reminders scheduled"
                  : `${scheduledCount} reminder${scheduledCount !== 1 ? "s" : ""} scheduled`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleResync}
            activeOpacity={0.7}
            style={[
              styles.notifAction,
              { backgroundColor: colors.safeForeground + "22" },
            ]}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.safeForeground} />
            ) : (
              <Feather name="refresh-cw" size={14} color={colors.safeForeground} />
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.notifBanner,
          { backgroundColor: colors.expiring, borderColor: colors.expiringBorder },
        ]}
      >
        <View style={styles.notifBannerLeft}>
          <View
            style={[
              styles.notifIconWrap,
              { backgroundColor: colors.expiringForeground + "22" },
            ]}
          >
            <Feather
              name="bell-off"
              size={16}
              color={colors.expiringForeground}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.notifBannerTitle,
                { color: colors.expiringForeground },
              ]}
            >
              {permStatus === "undetermined"
                ? "Enable return reminders"
                : "Notifications are off"}
            </Text>
            <Text
              style={[
                styles.notifBannerSub,
                { color: colors.expiringForeground },
              ]}
            >
              {permStatus === "undetermined"
                ? "Get alerts 7, 3, and 1 day before each deadline"
                : "Turn on notifications in Settings to get deadline reminders"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleEnableNotifications}
          activeOpacity={0.8}
          style={[
            styles.notifAction,
            { backgroundColor: colors.expiringForeground },
          ]}
        >
          <Text style={[styles.notifActionText, { color: "#fff" }]}>
            {permStatus === "undetermined" ? "Enable" : "Settings"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          { paddingTop: topPadding + 12, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Alerts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 100 },
        ]}
      >
        {/* Notification permission banner */}
        {renderNotificationBanner()}

        {/* All clear */}
        {!hasAnyAlerts && activePurchases.length > 0 && (
          <View
            style={[
              styles.allClearBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="shield" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.allClearTitle, { color: colors.foreground }]}>
                All clear
              </Text>
              <Text
                style={[
                  styles.allClearText,
                  { color: colors.mutedForeground },
                ]}
              >
                No purchases expiring within 2 weeks
              </Text>
            </View>
          </View>
        )}

        {/* Urgent — ≤ 3 days */}
        {urgentPurchases.length > 0 && (
          <View>
            <SectionHeader
              title="Expiring Soon"
              count={urgentPurchases.length}
            />
            <View style={styles.cards}>
              {urgentPurchases.map((p) => (
                <PurchaseCard key={p.id} purchase={p} />
              ))}
            </View>
          </View>
        )}

        {/* Expiring — 4-14 days */}
        {expiringPurchases.length > 0 && (
          <View>
            <SectionHeader
              title="Expiring in 2 weeks"
              count={expiringPurchases.length}
            />
            <View style={styles.cards}>
              {expiringPurchases.map((p) => (
                <PurchaseCard key={p.id} purchase={p} />
              ))}
            </View>
          </View>
        )}

        {/* Safe — > 14 days */}
        {safePurchases.length > 0 && (
          <View>
            <SectionHeader title="Safe" count={safePurchases.length} />
            <View style={styles.cards}>
              {safePurchases.map((p) => (
                <PurchaseCard key={p.id} purchase={p} />
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {activePurchases.length === 0 && (
          <View style={styles.empty}>
            <Feather name="bell" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No active purchases
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Track purchases to get return deadline alerts
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/add-purchase")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.addButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Add Purchase
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 0,
  },
  // Notification banner
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    gap: 10,
  },
  notifBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  notifBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  notifAction: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    minWidth: 36,
    minHeight: 36,
  },
  notifActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // All clear
  allClearBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  allClearTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  allClearText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cards: {
    gap: 0,
  },
  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
