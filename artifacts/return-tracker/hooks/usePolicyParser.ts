import { useState } from "react";

// Production builds set EXPO_PUBLIC_API_URL (see eas.json).
// EXPO_PUBLIC_DOMAIN is the old Replit dev setup, kept as a fallback.
const BASE_URL = (
  process.env["EXPO_PUBLIC_API_URL"] ??
  (process.env["EXPO_PUBLIC_DOMAIN"]
    ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
    : "")
).replace(/\/+$/, "");

if (!BASE_URL && !__DEV__) {
  console.warn("EXPO_PUBLIC_API_URL is not set: policy lookups will fail.");
}

interface PolicyResult {
  merchant: string;
  returnWindowDays: number;
  exchangeWindowDays?: number;
  policyHighlights: string[];
  requiresReceipt: boolean;
  requiresOriginalPackaging: boolean;
  finalSale: boolean;
  notes?: string;
}

export function usePolicyParser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parsePolicy(
    merchant: string,
    category?: string
  ): Promise<PolicyResult | null> {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${BASE_URL}/api/policies/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant, category }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch policy");
      }
      const data = (await response.json()) as PolicyResult;
      return data;
    } catch (e) {
      setError("Could not load return policy. Using default 30-day window.");
      return null;
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return { parsePolicy, loading, error };
}
