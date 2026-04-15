import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ReturnStatus = "active" | "returned" | "kept" | "expired";

export interface Purchase {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  items: string;
  category?: string;
  accountLabel?: string;
  returnWindowDays: number;
  returnDeadline: string;
  exchangeWindowDays?: number;
  policyHighlights: string[];
  requiresReceipt: boolean;
  requiresOriginalPackaging: boolean;
  finalSale: boolean;
  policyNotes?: string;
  status: ReturnStatus;
  createdAt: string;
}

interface PurchaseContextValue {
  purchases: Purchase[];
  loading: boolean;
  addPurchase: (purchase: Omit<Purchase, "id" | "createdAt">) => Promise<void>;
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  getPurchase: (id: string) => Purchase | undefined;
  urgentPurchases: Purchase[];
  expiringPurchases: Purchase[];
  activePurchases: Purchase[];
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

const STORAGE_KEY = "@return_tracker_purchases";
const SEEDED_KEY = "@return_tracker_seeded";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dateStr(base: Date, daysAgo: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function makeSeedData(): Purchase[] {
  const now = new Date();

  return [
    {
      id: generateId(),
      merchant: "Nike",
      amount: 139.99,
      currency: "USD",
      purchaseDate: dateStr(now, 28),
      items: "Air Max 270 Sneakers",
      category: "Footwear",
      accountLabel: "Chase Sapphire",
      returnWindowDays: 30,
      returnDeadline: addDays(now, 2),
      policyHighlights: [
        "30-day return window from purchase date",
        "Items must be unworn and in original box",
        "Receipt or order confirmation required",
        "Exchanges accepted in-store for different sizes",
      ],
      requiresReceipt: true,
      requiresOriginalPackaging: true,
      finalSale: false,
      policyNotes: "Sale items are final sale and cannot be returned.",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "Apple",
      amount: 1299.00,
      currency: "USD",
      purchaseDate: dateStr(now, 13),
      items: "MacBook Pro 14-inch",
      category: "Electronics",
      accountLabel: "Apple Card",
      returnWindowDays: 14,
      returnDeadline: addDays(now, 1),
      policyHighlights: [
        "14-day return window for most products",
        "Must be in original packaging with all accessories",
        "Apple ID must be signed out before return",
        "Free return shipping with included label",
      ],
      requiresReceipt: false,
      requiresOriginalPackaging: true,
      finalSale: false,
      policyNotes: "Opened software cannot be returned. Refurbished items are final sale.",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "Nordstrom",
      amount: 245.00,
      currency: "USD",
      purchaseDate: dateStr(now, 20),
      items: "Eileen Fisher Blazer",
      category: "Clothing",
      accountLabel: "Nordstrom Card",
      returnWindowDays: 365,
      returnDeadline: addDays(now, 7),
      exchangeWindowDays: 365,
      policyHighlights: [
        "Generous return policy with no set time limit (effectively 1 year)",
        "No receipt required — purchase can be looked up by card",
        "Items can be worn and still returned",
        "Free returns by mail or in any Nordstrom store",
      ],
      requiresReceipt: false,
      requiresOriginalPackaging: false,
      finalSale: false,
      policyNotes: "Items marked 'Final Sale' cannot be returned. Gift cards are non-refundable.",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "Target",
      amount: 62.47,
      currency: "USD",
      purchaseDate: dateStr(now, 17),
      items: "Threshold Throw Pillow Set, Candle",
      category: "Home",
      accountLabel: "Target RedCard",
      returnWindowDays: 30,
      returnDeadline: addDays(now, 13),
      policyHighlights: [
        "30-day return window (RedCard members get extra 30 days)",
        "Receipt or barcode required for cash refunds",
        "Returns accepted without receipt for store credit",
        "Electronics and entertainment 15-day window",
      ],
      requiresReceipt: false,
      requiresOriginalPackaging: false,
      finalSale: false,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "REI",
      amount: 189.95,
      currency: "USD",
      purchaseDate: dateStr(now, 5),
      items: "Patagonia Nano Puff Jacket",
      category: "Outdoor",
      accountLabel: "REI Visa",
      returnWindowDays: 365,
      returnDeadline: addDays(now, 27),
      policyHighlights: [
        "365-day return policy for REI members",
        "Non-members get 90 days",
        "Used gear can be returned if unsatisfied",
        "Bring original receipt or show membership card",
      ],
      requiresReceipt: false,
      requiresOriginalPackaging: false,
      finalSale: false,
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "Best Buy",
      amount: 499.99,
      currency: "USD",
      purchaseDate: dateStr(now, 3),
      items: "Sony WH-1000XM5 Headphones",
      category: "Electronics",
      accountLabel: "Best Buy Card",
      returnWindowDays: 15,
      returnDeadline: addDays(now, 42),
      policyHighlights: [
        "15-day standard return window",
        "My Best Buy Plus/Total members get 30/60 days",
        "Must include all original contents and packaging",
        "Opened items may be subject to a restocking fee",
      ],
      requiresReceipt: true,
      requiresOriginalPackaging: true,
      finalSale: false,
      policyNotes: "Activated cell phones and major appliances have different return windows.",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "Amazon",
      amount: 34.99,
      currency: "USD",
      purchaseDate: dateStr(now, 35),
      items: "Instant Pot Lid Replacement",
      category: "Kitchen",
      accountLabel: "Amazon Visa",
      returnWindowDays: 30,
      returnDeadline: addDays(now, -5),
      policyHighlights: [
        "30-day return window from delivery date",
        "Most items eligible for free return shipping",
        "Refund issued within 3–5 business days",
        "Third-party seller items may have different policies",
      ],
      requiresReceipt: false,
      requiresOriginalPackaging: false,
      finalSale: false,
      status: "returned",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      merchant: "IKEA",
      amount: 279.00,
      currency: "USD",
      purchaseDate: dateStr(now, 10),
      items: "BEKANT Standing Desk",
      category: "Furniture",
      accountLabel: "Cash",
      returnWindowDays: 365,
      returnDeadline: addDays(now, -0),
      policyHighlights: [
        "365-day return policy for IKEA Family members",
        "Item must be unused and in original packaging",
        "Receipt required for full refund",
        "Assembled furniture cannot be returned",
      ],
      requiresReceipt: true,
      requiresOriginalPackaging: true,
      finalSale: false,
      status: "kept",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function computeDeadlineStatus(purchase: Purchase): {
  daysLeft: number;
  isUrgent: boolean;
  isExpiring: boolean;
} {
  const now = new Date();
  const deadline = new Date(purchase.returnDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    daysLeft,
    isUrgent: daysLeft <= 3 && daysLeft >= 0,
    isExpiring: daysLeft > 3 && daysLeft <= 14,
  };
}

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  async function loadPurchases() {
    try {
      const seeded = await AsyncStorage.getItem(SEEDED_KEY);
      if (!seeded) {
        const seedData = makeSeedData();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        await AsyncStorage.setItem(SEEDED_KEY, "true");
        setPurchases(seedData);
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPurchases(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.error("Failed to load purchases", e);
    } finally {
      setLoading(false);
    }
  }

  async function savePurchases(updated: Purchase[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPurchases(updated);
  }

  const addPurchase = useCallback(
    async (purchase: Omit<Purchase, "id" | "createdAt">) => {
      const newPurchase: Purchase = {
        ...purchase,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newPurchase, ...purchases];
      await savePurchases(updated);
    },
    [purchases]
  );

  const updatePurchase = useCallback(
    async (id: string, updates: Partial<Purchase>) => {
      const updated = purchases.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      await savePurchases(updated);
    },
    [purchases]
  );

  const deletePurchase = useCallback(
    async (id: string) => {
      const updated = purchases.filter((p) => p.id !== id);
      await savePurchases(updated);
    },
    [purchases]
  );

  const getPurchase = useCallback(
    (id: string) => purchases.find((p) => p.id === id),
    [purchases]
  );

  const activePurchases = purchases.filter((p) => p.status === "active");

  const urgentPurchases = activePurchases.filter((p) => {
    const { isUrgent } = computeDeadlineStatus(p);
    return isUrgent;
  });

  const expiringPurchases = activePurchases.filter((p) => {
    const { isExpiring } = computeDeadlineStatus(p);
    return isExpiring;
  });

  return (
    <PurchaseContext.Provider
      value={{
        purchases,
        loading,
        addPurchase,
        updatePurchase,
        deletePurchase,
        getPurchase,
        urgentPurchases,
        expiringPurchases,
        activePurchases,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error("usePurchases must be used within PurchaseProvider");
  return ctx;
}
