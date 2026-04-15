import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { ReturnCalendar } from "@/components/ReturnCalendar";
import { SectionHeader } from "@/components/SectionHeader";
import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | "active" | "done";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { purchases, loading } = usePurchases();
  const [filter, setFilter] = useState<FilterType>("active");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const baseFiltered = useMemo(() =>
    filter === "all"
      ? purchases
      : filter === "active"
      ? purchases.filter((p) => p.status === "active")
      : purchases.filter((p) => p.status !== "active"),
    [purchases, filter]
  );

  const filteredPurchases = useMemo(() => {
    if (!selectedDate) return baseFiltered;
    return baseFiltered.filter((p) => {
      const deadline = new Date(p.returnDeadline);
      return toLocalDateString(deadline) === selectedDate;
    });
  }, [baseFiltered, selectedDate]);

  const activePurchases = purchases.filter((p) => p.status === "active");

  const urgentCount = activePurchases.filter((p) => {
    const deadline = new Date(p.returnDeadline);
    const daysLeft = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 3 && daysLeft >= 0;
  }).length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  function handleSelectDate(date: string | null) {
    setSelectedDate(date);
  }

  const renderHeader = () => (
    <View>
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
              setSelectedDate(null);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#fff" : colors.primary },
              ]}
            >
              {f === "active" ? "Active" : f === "all" ? "All" : "Done"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ReturnCalendar
        purchases={filter === "done" ? [] : activePurchases}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      {selectedDate && (
        <View style={styles.dateFilterRow}>
          <Text style={[styles.dateFilterLabel, { color: colors.mutedForeground }]}>
            {filteredPurchases.length === 0
              ? "No returns due on this day"
              : `${filteredPurchases.length} return${filteredPurchases.length !== 1 ? "s" : ""} due`}
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedDate(null)}
            activeOpacity={0.7}
            style={[styles.clearDateBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="x" size={12} color={colors.mutedForeground} />
            <Text style={[styles.clearDateText, { color: colors.mutedForeground }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {urgentCount > 0 && !selectedDate && (
        <View
          style={[
            styles.alertBanner,
            { backgroundColor: colors.urgent, borderColor: colors.urgentBorder },
          ]}
        >
          <Feather name="alert-circle" size={15} color={colors.urgentForeground} />
          <Text style={[styles.alertText, { color: colors.urgentForeground }]}>
            {urgentCount} {urgentCount === 1 ? "purchase expires" : "purchases expire"} within 3 days
          </Text>
        </View>
      )}

      {filteredPurchases.length > 0 && (
        <SectionHeader
          title={
            selectedDate
              ? "Due This Day"
              : filter === "active"
              ? "Active Purchases"
              : filter === "done"
              ? "Completed"
              : "All Purchases"
          }
          count={filteredPurchases.length}
        />
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Feather
        name={selectedDate ? "calendar" : "shopping-bag"}
        size={40}
        color={colors.mutedForeground}
      />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {selectedDate
          ? "Nothing due this day"
          : filter === "active"
          ? "No active purchases"
          : "No purchases yet"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {selectedDate
          ? "Tap a highlighted date to see returns due"
          : filter === "active"
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
          { paddingTop: topPadding + 12, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Returns
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    paddingBottom: 10,
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
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
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
  dateFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 2,
  },
  dateFilterLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  clearDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  clearDateText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
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
    paddingTop: 40,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
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
