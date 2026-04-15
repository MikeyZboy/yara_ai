import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePurchases } from "@/context/PurchaseContext";
import { usePolicyParser } from "@/hooks/usePolicyParser";
import { useColors } from "@/hooks/useColors";

export default function AddPurchaseScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addPurchase } = usePurchases();
  const { parsePolicy, loading: policyLoading } = usePolicyParser();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState("");
  const [category, setCategory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [accountLabel, setAccountLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  function isValidDate(dateStr: string): boolean {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  async function handleSave() {
    if (!merchant.trim()) {
      Alert.alert("Required", "Please enter the merchant name");
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert("Required", "Please enter a valid amount");
      return;
    }
    if (!isValidDate(purchaseDate)) {
      Alert.alert("Invalid Date", "Please enter a valid date (YYYY-MM-DD)");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSaving(true);
    try {
      const policy = await parsePolicy(merchant.trim(), category.trim() || undefined);

      const returnWindowDays = policy?.returnWindowDays ?? 30;
      const purchaseDateObj = new Date(purchaseDate);
      const returnDeadlineObj = new Date(purchaseDateObj);
      returnDeadlineObj.setDate(returnDeadlineObj.getDate() + returnWindowDays);

      await addPurchase({
        merchant: merchant.trim(),
        amount: parseFloat(amount),
        currency: "USD",
        purchaseDate,
        items: items.trim(),
        category: category.trim() || undefined,
        accountLabel: accountLabel.trim() || undefined,
        returnWindowDays,
        returnDeadline: returnDeadlineObj.toISOString(),
        exchangeWindowDays: policy?.exchangeWindowDays,
        policyHighlights: policy?.policyHighlights ?? [
          `${returnWindowDays}-day standard return window`,
          "Return policy fetched from AI",
        ],
        requiresReceipt: policy?.requiresReceipt ?? true,
        requiresOriginalPackaging: policy?.requiresOriginalPackaging ?? false,
        finalSale: policy?.finalSale ?? false,
        policyNotes: policy?.notes,
        status: "active",
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save purchase. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isLoading = saving || policyLoading;

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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Add Purchase
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButton, { color: colors.primary }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={[styles.loadingBanner, { backgroundColor: colors.secondary }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            Looking up return policy...
          </Text>
        </View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.form, { paddingBottom: bottomPadding + 20 }]}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            STORE & PURCHASE
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Merchant *
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="e.g. Amazon, Target, Nike"
                placeholderTextColor={colors.mutedForeground}
                value={merchant}
                onChangeText={setMerchant}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Items
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="What did you buy?"
                placeholderTextColor={colors.mutedForeground}
                value={items}
                onChangeText={setItems}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Category
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="e.g. Electronics, Clothing"
                placeholderTextColor={colors.mutedForeground}
                value={category}
                onChangeText={setCategory}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            TRANSACTION
          </Text>
          <View
            style={[
              styles.fieldGroup,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Amount *
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Purchase Date *
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Account / Card
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder="e.g. Chase Sapphire, Cash"
                placeholderTextColor={colors.mutedForeground}
                value={accountLabel}
                onChangeText={setAccountLabel}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.aiNote,
            { backgroundColor: colors.secondary, borderColor: colors.accent },
          ]}
        >
          <Feather name="zap" size={14} color={colors.primary} />
          <Text style={[styles.aiNoteText, { color: colors.secondaryForeground }]}>
            Return policy will be automatically looked up using AI when you save
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  saveButton: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  loadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  form: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  fieldGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  field: {
    padding: 14,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 14,
  },
  aiNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  aiNoteText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
});
