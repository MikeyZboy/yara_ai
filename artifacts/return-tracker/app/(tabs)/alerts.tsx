import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
import { usePurchases, computeDeadlineStatus } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { urgentPurchases, expiringPurchases, activePurchases } =
    usePurchases();

  const safePurchases = activePurchases.filter((p) => {
    const { daysLeft } = computeDeadlineStatus(p);
    return daysLeft > 14;
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const hasAnyAlerts =
    urgentPurchases.length > 0 || expiringPurchases.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Alerts
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 100 },
        ]}
      >
        {!hasAnyAlerts && (
          <View
            style={[
              styles.allClearBanner,
              {
                backgroundColor: colors.safe,
                borderColor: colors.safeBorder,
              },
            ]}
          >
            <Feather name="shield" size={24} color={colors.safeForeground} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.allClearTitle,
                  { color: colors.safeForeground },
                ]}
              >
                All clear
              </Text>
              <Text
                style={[
                  styles.allClearText,
                  { color: colors.safeForeground },
                ]}
              >
                No purchases expiring within 2 weeks
              </Text>
            </View>
          </View>
        )}

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
              style={[
                styles.addButton,
                { backgroundColor: colors.primary },
              ]}
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
  container: {
    flex: 1,
  },
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
  },
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
