import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface PolicyBadgeProps {
  label: string;
  icon: string;
  active: boolean;
}

export function PolicyBadge({ label, icon, active }: PolicyBadgeProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: active ? colors.secondary : colors.muted,
          borderColor: active ? colors.accentForeground : colors.border,
        },
      ]}
    >
      <Feather
        name={icon as any}
        size={12}
        color={active ? colors.primary : colors.mutedForeground}
      />
      <Text
        style={[
          styles.label,
          { color: active ? colors.primary : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
