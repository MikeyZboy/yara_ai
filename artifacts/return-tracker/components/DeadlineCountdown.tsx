import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Purchase, computeDeadlineStatus } from "@/context/PurchaseContext";

interface DeadlineCountdownProps {
  purchase: Purchase;
  large?: boolean;
}

export function DeadlineCountdown({ purchase, large = false }: DeadlineCountdownProps) {
  const colors = useColors();
  const { daysLeft, isUrgent, isExpiring } = computeDeadlineStatus(purchase);

  if (purchase.status !== "active") {
    return null;
  }

  function getBgColor() {
    if (daysLeft < 0 || purchase.status === "expired") return colors.urgent;
    if (isUrgent) return colors.urgent;
    if (isExpiring) return colors.expiring;
    return colors.safe;
  }

  function getFgColor() {
    if (daysLeft < 0 || purchase.status === "expired") return colors.urgentForeground;
    if (isUrgent) return colors.urgentForeground;
    if (isExpiring) return colors.expiringForeground;
    return colors.safeForeground;
  }

  function getDeadlineText() {
    const deadline = new Date(purchase.returnDeadline);
    return deadline.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const bg = getBgColor();
  const fg = getFgColor();

  return (
    <View style={[styles.container, { backgroundColor: bg }, large && styles.containerLarge]}>
      <Text style={[styles.label, { color: fg }, large && styles.labelLarge]}>
        {daysLeft < 0 ? "Return window expired" : daysLeft === 0 ? "Last day to return!" : "Return by"}
      </Text>
      {daysLeft >= 0 && (
        <Text style={[styles.deadline, { color: fg }, large && styles.deadlineLarge]}>
          {getDeadlineText()}
        </Text>
      )}
      {daysLeft >= 0 && (
        <Text style={[styles.daysLeft, { color: fg }, large && styles.daysLeftLarge]}>
          {daysLeft === 0 ? "Today is the deadline" : daysLeft === 1 ? "1 day remaining" : `${daysLeft} days remaining`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  containerLarge: {
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontSize: 12,
  },
  deadline: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  deadlineLarge: {
    fontSize: 22,
  },
  daysLeft: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  daysLeftLarge: {
    fontSize: 14,
  },
});
