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

type FilterType = "active" | "today" | "all" | "done";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const todayStr = toLocalDateString(new Date());

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { purchases, loading } = usePurchases();
  const [filter, setFilter] = useState<FilterType>("active");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activePurchases = useMemo(
    () => purchases.filter((p) => p.status === "active"),
    [purchases]
  );

  const returnedPurchases = useMemo(
    () => purchases.filter((p) => p.status === "returned"),
    [purchases]
  );

  // Balance stats
  const atRiskTotal = useMemo(
    () => activePurchases.reduce((sum, p) => sum + p.amount, 0),
    [activePurchases]
  );
  const recoveredTotal = useMemo(
    () => returnedPurchases.reduce((sum, p) => sum + p.amount, 0),
    [returnedPurchases]
  );

  // Calendar jump target — today when "today" filter is active
  const calendarJumpDate = filter === "today" ? todayStr : null;
  // Calendar selected date — today's date when "today" filter, otherwise user-picked
  const effectiveSelectedDate = filter === "today" ? todayStr : selectedDate;

  const urgentCount = useMemo(
    () =>
      activePurchases.filter((p) => {
        const deadline = new Date(p.returnDeadline);
        const daysLeft = Math.ceil(
          (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 3 && daysLeft >= 0;
      }).length,
    [activePurchases]
  );

  const filteredPurchases = useMemo(() => {
    let base =
      filter === "done"
        ? purchases.filter((p) => p.status !== "active")
        : filter === "all"
        ? purchases
        : activePurchases; // "active" and "today" both start from active

    if (filter === "today") {
      return base.filter(
        (p) => toLocalDateString(new Date(p.returnDeadline)) === todayStr
      );
    }

    if (selectedDate && filter !== "done") {
      return base.filter(
        (p) => toLocalDateString(new Date(p.returnDeadline)) === selectedDate
      );
    }

    return base;
  }, [purchases, activePurchases, filter, selectedDate]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  function handleFilterChange(f: FilterType) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setFilter(f);
    if (f !== "today") setSelectedDate(null);
  }

  function handleSelectDate(date: string | null) {
    // If user taps a date while in Today mode, switch to Active mode
    if (filter === "today") setFilter("active");
    setSelectedDate(date);
  }

  const showCalendar = filter !== "done";
  const showDateFilter = selectedDate && filter !== "today" && filter !== "done";

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "today", label: "Today" },
    { key: "all", label: "All" },
    { key: "done", label: "Done" },
  ];

  const renderHeader = () => (
    <View>
      {/* Filter pills */}
      <View style={styles.filters}>
        {FILTERS.map(({ key, label }) => {
          const isActive = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.secondary,
                },
              ]}
              onPress={() => handleFilterChange(key)}
              activeOpacity={0.7}
            >
              {key === "today" && (
                <View
                  style={[
                    styles.todayDot,
                    {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.7)"
                        : colors.urgentForeground,
                    },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? "#fff" : colors.primary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Balance summary card */}
      {showCalendar && (
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.balanceStat}>
            <Text style={[styles.balanceAmount, { color: colors.foreground }]}>
              {formatCurrency(atRiskTotal)}
            </Text>
            <View style={styles.balanceLabelRow}>
              <View
                style={[styles.balanceIndicator, { backgroundColor: colors.warning }]}
              />
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
                At Risk
              </Text>
            </View>
          </View>

          <View
            style={[styles.balanceDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.balanceStat}>
            <Text style={[styles.balanceAmount, { color: colors.success }]}>
              {formatCurrency(recoveredTotal)}
            </Text>
            <View style={styles.balanceLabelRow}>
              <View
                style={[styles.balanceIndicator, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
                Recovered
              </Text>
            </View>
          </View>

          <View
            style={[styles.balanceDivider, { backgroundColor: colors.border }]}
          />

          <View style={styles.balanceStat}>
            <Text
              style={[
                styles.balanceAmount,
                {
                  color:
                    recoveredTotal > 0 ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {activePurchases.length}
            </Text>
            <View style={styles.balanceLabelRow}>
              <View
                style={[styles.balanceIndicator, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
                Tracked
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Calendar */}
      {showCalendar && (
        <ReturnCalendar
          purchases={activePurchases}
          selectedDate={effectiveSelectedDate}
          onSelectDate={handleSelectDate}
          jumpToDate={calendarJumpDate}
        />
      )}

      {/* Date filter context row */}
      {showDateFilter && (
        <View style={styles.dateFilterRow}>
          <Text style={[styles.dateFilterLabel, { color: colors.mutedForeground }]}>
            {filteredPurchases.length === 0
              ? "No returns due this day"
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

      {/* Today filter context */}
      {filter === "today" && (
        <View style={styles.dateFilterRow}>
          <Text style={[styles.dateFilterLabel, { color: colors.mutedForeground }]}>
            {filteredPurchases.length === 0
              ? "Nothing due today"
              : `${filteredPurchases.length} return${filteredPurchases.length !== 1 ? "s" : ""} due today`}
          </Text>
        </View>
      )}

      {/* Urgent alert */}
      {urgentCount > 0 && !selectedDate && filter !== "today" && filter !== "done" && (
        <View
          style={[
            styles.alertBanner,
            { backgroundColor: colors.urgent, borderColor: colors.urgentBorder },
          ]}
        >
          <Feather name="alert-circle" size={15} color={colors.urgentForeground} />
          <Text style={[styles.alertText, { color: colors.urgentForeground }]}>
            {urgentCount}{" "}
            {urgentCount === 1 ? "purchase expires" : "purchases expire"} within
            3 days
          </Text>
        </View>
      )}

      {/* Section header */}
      {filteredPurchases.length > 0 && (
        <SectionHeader
          title={
            filter === "today"
              ? "Due Today"
              : selectedDate
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
        name={filter === "today" || selectedDate ? "calendar" : "shopping-bag"}
        size={40}
        color={colors.mutedForeground}
      />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {filter === "today"
          ? "Nothing due today"
          : selectedDate
          ? "Nothing due this day"
          : filter === "active"
          ? "No active purchases"
          : "No purchases yet"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        {filter === "today"
          ? "You're in the clear today"
          : selectedDate
          ? "Tap a highlighted date to see returns due"
          : filter === "active"
          ? "All purchases resolved"
          : "Tap + to add your first purchase"}
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
        <Text style={[styles.title, { color: colors.foreground }]}>Returns</Text>
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
  container: { flex: 1 },
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
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // Balance card
  balanceCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  balanceStat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  balanceAmount: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  balanceDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 4,
  },
  // Date filter
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
  // Alert banner
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
