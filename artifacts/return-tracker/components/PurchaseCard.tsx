import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Purchase, computeDeadlineStatus } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

interface PurchaseCardProps {
  purchase: Purchase;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PurchaseCard({ purchase }: PurchaseCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { daysLeft, isUrgent, isExpiring } = computeDeadlineStatus(purchase);

  function getStatusColor() {
    if (purchase.status === "returned")
      return { bg: colors.muted, fg: colors.mutedForeground };
    if (purchase.status === "kept")
      return { bg: colors.muted, fg: colors.mutedForeground };
    if (purchase.status === "expired")
      return { bg: colors.urgent, fg: colors.urgentForeground };
    if (isUrgent) return { bg: colors.urgent, fg: colors.urgentForeground };
    if (isExpiring)
      return { bg: colors.expiring, fg: colors.expiringForeground };
    return { bg: colors.safe, fg: colors.safeForeground };
  }

  function getStatusText() {
    if (purchase.status === "returned") return "Returned";
    if (purchase.status === "kept") return "Kept";
    if (purchase.status === "expired") return "Expired";
    if (daysLeft < 0) return "Expired";
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  }

  function getStatusIcon() {
    if (purchase.status === "returned") return "check-circle";
    if (purchase.status === "kept") return "package";
    if (purchase.status === "expired" || daysLeft < 0) return "x-circle";
    if (isUrgent) return "alert-circle";
    if (isExpiring) return "clock";
    return "shield";
  }

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
        router.push(`/purchase/${purchase.id}` as `/${string}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.merchantSection}>
          <View
            style={[
              styles.merchantIcon,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="shopping-bag" size={18} color={colors.primary} />
          </View>
          <View style={styles.merchantInfo}>
            <Text
              style={[styles.merchant, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {purchase.merchant}
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formatDate(purchase.purchaseDate)}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.foreground }]}>
          {formatCurrency(purchase.amount, purchase.currency)}
        </Text>
      </View>

      {purchase.items ? (
        <Text
          style={[styles.items, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {purchase.items}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {purchase.accountLabel ? (
          <View
            style={[
              styles.accountChip,
              { backgroundColor: colors.muted },
            ]}
          >
            <Feather
              name="credit-card"
              size={10}
              color={colors.mutedForeground}
            />
            <Text style={[styles.accountText, { color: colors.mutedForeground }]}>
              {purchase.accountLabel}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View
          style={[
            styles.statusChip,
            { backgroundColor: statusColor.bg },
          ]}
        >
          <Feather
            name={getStatusIcon() as any}
            size={11}
            color={statusColor.fg}
          />
          <Text style={[styles.statusText, { color: statusColor.fg }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  merchantSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  merchantIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  merchantInfo: {
    flex: 1,
    gap: 2,
  },
  merchant: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  items: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  accountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accountText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
