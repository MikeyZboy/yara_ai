import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { PolicyBadge } from "@/components/PolicyBadge";
import { ReturnStatus, usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getPurchase, updatePurchase, deletePurchase } = usePurchases();

  const purchase = getPurchase(id ?? "");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  if (!purchase) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding + 20 }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Purchase not found
          </Text>
        </View>
      </View>
    );
  }

  function handleStatusChange(newStatus: ReturnStatus) {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    updatePurchase(purchase!.id, { status: newStatus });
  }

  function showStatusPicker() {
    const options = ["Mark as Returned", "Mark as Kept", "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          destructiveButtonIndex: undefined,
        },
        (index) => {
          if (index === 0) handleStatusChange("returned");
          if (index === 1) handleStatusChange("kept");
        }
      );
    } else {
      Alert.alert("Update Status", "What would you like to do?", [
        { text: "Mark as Returned", onPress: () => handleStatusChange("returned") },
        { text: "Mark as Kept", onPress: () => handleStatusChange("kept") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Purchase",
      "Are you sure you want to delete this purchase?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            deletePurchase(purchase!.id);
            router.back();
          },
        },
      ]
    );
  }

  const isActive = purchase.status === "active";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Purchase Details
        </Text>
        <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 20 },
        ]}
      >
        <View style={styles.heroSection}>
          <View
            style={[
              styles.merchantIcon,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="shopping-bag" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.merchant, { color: colors.foreground }]}>
            {purchase.merchant}
          </Text>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {formatCurrency(purchase.amount, purchase.currency)}
          </Text>
          {purchase.items ? (
            <Text style={[styles.items, { color: colors.mutedForeground }]}>
              {purchase.items}
            </Text>
          ) : null}
        </View>

        {isActive && (
          <DeadlineCountdown purchase={purchase} large />
        )}

        {!isActive && (
          <View style={[styles.statusCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather
              name={purchase.status === "returned" ? "check-circle" : "package"}
              size={20}
              color={colors.mutedForeground}
            />
            <Text style={[styles.statusCardText, { color: colors.mutedForeground }]}>
              {purchase.status === "returned" ? "Item returned" : "Item kept"}
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            TRANSACTION
          </Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
              Purchase Date
            </Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {formatDate(purchase.purchaseDate)}
            </Text>
          </View>
          {purchase.accountLabel ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Account
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {purchase.accountLabel}
              </Text>
            </View>
          ) : null}
          {purchase.category ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Category
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {purchase.category}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            RETURN POLICY
          </Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
              Return Window
            </Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {purchase.returnWindowDays} days
            </Text>
          </View>
          {purchase.exchangeWindowDays &&
            purchase.exchangeWindowDays !== purchase.returnWindowDays && (
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                  Exchange Window
                </Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>
                  {purchase.exchangeWindowDays} days
                </Text>
              </View>
            )}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
              Return By
            </Text>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {new Date(purchase.returnDeadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.badges}>
            <PolicyBadge
              label="Receipt Required"
              icon="file-text"
              active={purchase.requiresReceipt}
            />
            <PolicyBadge
              label="Original Packaging"
              icon="box"
              active={purchase.requiresOriginalPackaging}
            />
            {purchase.finalSale && (
              <PolicyBadge
                label="Final Sale"
                icon="x-circle"
                active={true}
              />
            )}
          </View>

          {purchase.policyHighlights.length > 0 && (
            <View style={styles.highlights}>
              <Text style={[styles.highlightsTitle, { color: colors.mutedForeground }]}>
                Key Policy Details
              </Text>
              {purchase.policyHighlights.map((h, i) => (
                <View key={i} style={styles.highlight}>
                  <Feather name="check" size={12} color={colors.primary} />
                  <Text style={[styles.highlightText, { color: colors.foreground }]}>
                    {h}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {purchase.policyNotes ? (
            <View
              style={[styles.policyNote, { backgroundColor: colors.muted }]}
            >
              <Feather
                name="info"
                size={13}
                color={colors.mutedForeground}
              />
              <Text style={[styles.policyNoteText, { color: colors.mutedForeground }]}>
                {purchase.policyNotes}
              </Text>
            </View>
          ) : null}
        </View>

        {isActive && !purchase.finalSale && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={showStatusPicker}
            activeOpacity={0.8}
          >
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>
              Mark as Resolved
            </Text>
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => handleStatusChange("kept")}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>
              Keep Item (dismiss)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  heroSection: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },
  merchantIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  merchant: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  amount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  items: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusCardText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  highlights: {
    gap: 6,
    marginTop: 4,
  },
  highlightsTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  highlightText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  policyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  policyNoteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
