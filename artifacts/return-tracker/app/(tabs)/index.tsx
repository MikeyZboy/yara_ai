import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PurchaseCard } from "@/components/PurchaseCard";
import { SectionHeader } from "@/components/SectionHeader";
import { Purchase, usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | "active" | "done";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { purchases, loading } = usePurchases();
  const [filter, setFilter] = useState<FilterType>("active");

  const filteredPurchases =
    filter === "all"
      ? purchases
      : filter === "active"
      ? purchases.filter((p) => p.status === "active")
      : purchases.filter((p) => p.status !== "active");

  const urgentCount = purchases.filter((p) => {
    if (p.status !== "active") return false;
    const deadline = new Date(p.returnDeadline);
    const daysLeft = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 3 && daysLeft >= 0;
  }).length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const renderHeader = () => (
    <View>
      {urgentCount > 0 && (
        <View
          style={[styles.alertBanner, { backgroundColor: colors.urgent, borderColor: colors.urgentBorder }]}
        >
          <Feather name="alert-circle" size={16} color={colors.urgentForeground} />
          <Text style={[styles.alertText, { color: colors.urgentForeground }]}>
            {urgentCount} {urgentCount === 1 ? "purchase" : "purchases"} expire within 3 days
          </Text>
        </View>
      )}

      <View style={styles.filters}>
        {(["active", "all", "done"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f ? colors.primary : colors.secondary,
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setFilter(f);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === f ? colors.primaryForeground : colors.secondary,
                },
                { color: filter === f ? "#fff" : colors.primary },
              ]}
            >
              {f === "active" ? "Active" : f === "all" ? "All" : "Done"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredPurchases.length > 0 && (
        <SectionHeader
          title={filter === "active" ? "Active Purchases" : filter === "done" ? "Completed" : "All Purchases"}
          count={filteredPurchases.length}
        />
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Feather name="shopping-bag" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {filter === "active" ? "No active purchases" : "No purchases yet"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {filter === "active"
          ? "All your purchases have been resolved"
          : "Tap + to track your first purchase"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Returns
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/add-purchase");
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PurchaseCard purchase={item} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
});
