import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"],
});

router.post("/parse", async (req, res) => {
  const { merchant, category } = req.body as {
    merchant: string;
    category?: string;
  };

  if (!merchant || typeof merchant !== "string") {
    res.status(400).json({ error: "merchant is required and must be a string" });
    return;
  }
  if (merchant.trim().length > 200) {
    res.status(400).json({ error: "merchant name is too long" });
    return;
  }
  if (category !== undefined && (typeof category !== "string" || category.length > 100)) {
    res.status(400).json({ error: "category must be a string under 100 characters" });
    return;
  }

  try {
    const categoryContext = category ? ` (product category: ${category})` : "";
    const prompt = `You are an expert on retail return policies. Look up the current standard return and exchange policy for "${merchant}"${categoryContext}.

Return a JSON object with the following fields:
- merchant: string (the merchant name)
- returnWindowDays: number (standard return window in days, e.g. 30, 60, 90)
- exchangeWindowDays: number (exchange window in days, if different from returns; otherwise same as returnWindowDays)
- policyHighlights: string[] (3-5 bullet points of the most important policy details)
- requiresReceipt: boolean
- requiresOriginalPackaging: boolean
- finalSale: boolean (true if items cannot be returned)
- notes: string (any important caveats, exclusions, or special conditions)

If you don't know the exact policy, provide a reasonable estimate based on industry norms for that type of retailer and note it in the "notes" field.
Respond ONLY with valid JSON, no markdown, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const parsed = JSON.parse(content);

    // Validate critical fields before returning to the client
    const returnWindowDays = Number(parsed.returnWindowDays);
    if (!Number.isFinite(returnWindowDays) || returnWindowDays <= 0) {
      res.status(500).json({ error: "AI returned an invalid return window" });
      return;
    }
    parsed.returnWindowDays = Math.round(returnWindowDays);

    if (parsed.exchangeWindowDays !== undefined) {
      const exchangeWindowDays = Number(parsed.exchangeWindowDays);
      parsed.exchangeWindowDays = Number.isFinite(exchangeWindowDays) && exchangeWindowDays > 0
        ? Math.round(exchangeWindowDays)
        : parsed.returnWindowDays;
    }

    if (!Array.isArray(parsed.policyHighlights)) {
      parsed.policyHighlights = [];
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to parse return policy");
    res.status(500).json({ error: "Failed to parse return policy" });
  }
});

export default router;
