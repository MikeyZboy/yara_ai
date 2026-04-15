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

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function computeDeadlineStatus(purchase: Purchase): {
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
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPurchases(JSON.parse(stored));
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

export { computeDeadlineStatus };
