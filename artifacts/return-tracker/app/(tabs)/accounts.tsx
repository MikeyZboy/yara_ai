import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { usePurchases } from "@/context/PurchaseContext";

const ACCOUNT_TYPES = [
  {
    id: "plaid",
    label: "Bank & Credit Cards",
    description: "Connect via Plaid to auto-import transactions",
    icon: "credit-card" as const,
    available: false,
    comingSoon: true,
  },
  {
    id: "amazon",
    label: "Amazon",
    description: "Import Amazon orders",
    icon: "package" as const,
    available: false,
    comingSoon: true,
  },
  {
    id: "apple",
    label: "Apple Card",
    description: "Import Apple Card transactions",
    icon: "smartphone" as const,
    available: false,
    comingSoon: true,
  },
];

export default function AccountsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    favoriteStores,
    addFavoriteStore,
    removeFavoriteStore,
  } = usePurchases();
  const [newStore, setNewStore] = React.useState("");
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  async function handleAddStore() {
    const store = newStore.trim();
    if (!store) {
      Alert.alert("Add a store", "Enter a store name first.");
      return;
    }
    await addFavoriteStore(store);
    setNewStore("");
  }

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
          Accounts
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 100 },
        ]}
      >
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.accent,
            },
          ]}
        >
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
            Connect your accounts to automatically import purchases and track
            return deadlines. Currently, add purchases manually using the +
            button.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          FAVORITE STORES
        </Text>

        <View
          style={[
            styles.favoriteIntro,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.favoriteIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="star" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.favoriteIntroText, { color: colors.mutedForeground }]}>
            Keep the stores you shop most in one place. Favorite stores are saved
            on this device and can be managed anytime.
          </Text>
        </View>

        <View style={styles.addStoreRow}>
          <TextInput
            style={[
              styles.storeInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Add a store, e.g. Costco"
            placeholderTextColor={colors.mutedForeground}
            value={newStore}
            onChangeText={setNewStore}
            onSubmitEditing={() => void handleAddStore()}
            returnKeyType="done"
            accessibilityLabel="Store name"
          />
          <TouchableOpacity
            style={[styles.addStoreButton, { backgroundColor: colors.primary }]}
            onPress={() => void handleAddStore()}
            activeOpacity={0.8}
            accessibilityLabel="Add favorite store"
          >
            <Feather name="plus" size={19} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {favoriteStores.length === 0 ? (
          <View style={[styles.favoriteEmpty, { borderColor: colors.border }]}>
            <Feather name="bookmark" size={17} color={colors.mutedForeground} />
            <Text style={[styles.favoriteEmptyText, { color: colors.mutedForeground }]}>
              No favorite stores yet
            </Text>
          </View>
        ) : (
          <View style={styles.favoriteList}>
            {favoriteStores.map((store) => (
              <View
                key={store.toLowerCase()}
                style={[
                  styles.favoriteStoreRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.storeAvatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.storeAvatarText, { color: colors.primary }]}>
                    {store.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.favoriteStoreName, { color: colors.foreground }]}>
                  {store}
                </Text>
                <TouchableOpacity
                  onPress={() => void removeFavoriteStore(store)}
                  activeOpacity={0.7}
                  style={styles.removeStoreButton}
                  accessibilityLabel={`Remove ${store} from favorite stores`}
                >
                  <Feather name="x" size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          COMING SOON
        </Text>

        {ACCOUNT_TYPES.map((account) => (
          <View
            key={account.id}
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: 0.6,
              },
            ]}
          >
            <View
              style={[
                styles.accountIcon,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Feather name={account.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountLabel, { color: colors.foreground }]}>
                {account.label}
              </Text>
              <Text
                style={[styles.accountDesc, { color: colors.mutedForeground }]}
              >
                {account.description}
              </Text>
            </View>
            <View
              style={[
                styles.comingSoonChip,
                { backgroundColor: colors.muted },
              ]}
            >
              <Text
                style={[
                  styles.comingSoonText,
                  { color: colors.mutedForeground },
                ]}
              >
                Soon
              </Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          MANUAL ENTRY
        </Text>

        <View
          style={[
            styles.accountCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.accountIcon, { backgroundColor: colors.secondary }]}
          >
            <Feather name="edit-3" size={20} color={colors.primary} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountLabel, { color: colors.foreground }]}>
              Manual Entry
            </Text>
            <Text
              style={[styles.accountDesc, { color: colors.mutedForeground }]}
            >
              Add purchases manually with the + button
            </Text>
          </View>
          <View
            style={[
              styles.activeChip,
              { backgroundColor: colors.safe },
            ]}
          >
            <Text style={[styles.activeText, { color: colors.safeForeground }]}>
              Active
            </Text>
          </View>
        </View>

        <View style={[styles.aiCard, { backgroundColor: colors.secondary, borderColor: colors.accentForeground }]}>
          <Feather name="zap" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiTitle, { color: colors.foreground }]}>
              AI Policy Lookup
            </Text>
            <Text style={[styles.aiDesc, { color: colors.mutedForeground }]}>
              Return policies are automatically looked up using AI when you add a purchase. No setup needed.
            </Text>
          </View>
        </View>
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
    gap: 10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
  favoriteIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  favoriteIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteIntroText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  addStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storeInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  addStoreButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  favoriteEmptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  favoriteList: {
    gap: 8,
  },
  favoriteStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
  },
  storeAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  storeAvatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  favoriteStoreName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  removeStoreButton: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 4,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  accountDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  comingSoonChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  activeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  aiCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  aiDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 2,
  },
});
