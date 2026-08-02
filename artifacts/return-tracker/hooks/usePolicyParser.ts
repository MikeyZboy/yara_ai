import { useState } from "react";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

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
    try {
      const response = await fetch(`${BASE_URL}/api/policies/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant, category }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch policy");
      }
      const data = await response.json();
      // Basic runtime validation — guard against malformed AI responses
      if (
        typeof data !== "object" ||
        data === null ||
        typeof data.returnWindowDays !== "number" ||
        data.returnWindowDays <= 0
      ) {
        throw new Error("Invalid policy response shape");
      }
      return data as PolicyResult;
    } catch (e) {
      setError("Could not load return policy. Using default 30-day window.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { parsePolicy, loading, error };
}
