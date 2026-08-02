import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Purchase, computeDeadlineStatus } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

interface ReturnCalendarProps {
  purchases: Purchase[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  jumpToDate?: string | null;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DotType = "urgent" | "expiring" | "safe";

export function ReturnCalendar({
  purchases,
  selectedDate,
  onSelectDate,
  jumpToDate,
}: ReturnCalendarProps) {
  const colors = useColors();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    if (jumpToDate) {
      const d = new Date(jumpToDate);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [jumpToDate]);

  const deadlineMap = useMemo(() => {
    const map: Record<string, DotType[]> = {};
    for (const p of purchases) {
      if (p.status !== "active") continue;
      const deadline = new Date(p.returnDeadline);
      const key = toLocalDateString(deadline);
      const { daysLeft } = computeDeadlineStatus(p);
      const dot: DotType =
        daysLeft <= 3 && daysLeft >= 0 ? "urgent" : daysLeft > 3 && daysLeft <= 14 ? "expiring" : "safe";
      if (!map[key]) map[key] = [];
      map[key].push(dot);
    }
    return map;
  }, [purchases]);

  function getDotColor(type: DotType): string {
    if (type === "urgent") return colors.urgentForeground;
    if (type === "expiring") return colors.expiringForeground;
    return colors.safeForeground;
  }

  function prevMonth() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = toLocalDateString(today);

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  while (rows[rows.length - 1]?.length < 7) {
    rows[rows.length - 1].push(null);
  }

  function handleDayPress(day: number) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onSelectDate(selectedDate === dateStr ? null : dateStr);
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={prevMonth}
          activeOpacity={0.7}
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="chevron-left" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity
          onPress={nextMonth}
          activeOpacity={0.7}
          style={[styles.navBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayLabelCell}>
            <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((day, colIdx) => {
            if (!day) {
              return <View key={colIdx} style={styles.cell} />;
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dots = deadlineMap[dateStr] ?? [];

            return (
              <TouchableOpacity
                key={colIdx}
                style={[
                  styles.cell,
                  isSelected && {
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                  },
                  !isSelected && isToday && {
                    backgroundColor: colors.secondary,
                    borderRadius: 20,
                  },
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: isSelected
                        ? "#fff"
                        : isToday
                        ? colors.primary
                        : colors.foreground,
                      fontFamily:
                        isToday || isSelected
                          ? "Inter_700Bold"
                          : "Inter_400Regular",
                    },
                  ]}
                >
                  {day}
                </Text>
                <View style={styles.dotsRow}>
                  {dots.slice(0, 3).map((dot, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.8)"
                            : getDotColor(dot),
                        },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    marginVertical: 1,
    minHeight: 42,
    gap: 2,
  },
  dayNum: {
    fontSize: 14,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
