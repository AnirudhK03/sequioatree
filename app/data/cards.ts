import { MetricCardData } from "../components/MetricCard";

// ── API response shape ────────────────────────────────────────
// This is the shape the LLM / API will return. The number of cards
// is dynamic — could be 3, could be 20.

export type ApiCard = {
  id: string;
  label: string;
  value: string;
  type: MetricCardData["type"];
  category: "market" | "idea";
  subcategory: string;
  detail: {
    title: string;
    summary: string;
    points: string[];
    source: string;
  };
  author?: string;
  quote?: string;
};

export type ApiResponse = {
  aiResponse: string | null;
  modifiedIdea?: string | null;
  cards: ApiCard[];
};

// ── Subcategory → color palette ───────────────────────────────
// Colors are auto-assigned per subcategory. When a new subcategory
// appears from the API it cycles through the palette.

const SUBCATEGORY_COLORS = [
  "#C4B5FD", // violet
  "#FCA5A5", // red
  "#6EE7B7", // green
  "#FDE68A", // amber
  "#A5F3FC", // cyan
  "#DDD6FE", // purple
  "#FECACA", // rose
  "#BBF7D0", // emerald
  "#E5E7EB", // gray
  "#FBCFE8", // pink
];

const subcategoryColorMap = new Map<string, string>();

function getColorForSubcategory(subcategory: string): string {
  if (!subcategoryColorMap.has(subcategory)) {
    const idx = subcategoryColorMap.size % SUBCATEGORY_COLORS.length;
    subcategoryColorMap.set(subcategory, SUBCATEGORY_COLORS[idx]);
  }
  return subcategoryColorMap.get(subcategory)!;
}

// ── Transform API response → MetricCardData[] ────────────────

export function apiResponseToCards(response: ApiResponse): {
  aiText: string;
  cards: MetricCardData[];
} {
  // Reset color map for each new response so ordering is deterministic
  subcategoryColorMap.clear();

  const cards: MetricCardData[] = response.cards.map((c) => ({
    ...c,
    color: getColorForSubcategory(c.subcategory),
  }));

  return { aiText: response.aiResponse ?? "", cards };
}

// ── Mock API response (hardcoded for now) ─────────────────────

import generatedApiResponseRaw from "./apiResponse.generated.json";

const generatedApiResponse = generatedApiResponseRaw as unknown as ApiResponse;

function normalizeApiResponse(input: ApiResponse): ApiResponse {
  return {
    ...input,
    aiResponse: input.aiResponse ?? "",
    modifiedIdea: input.modifiedIdea ?? null,
  };
}

export const MOCK_API_RESPONSE: ApiResponse = {
  ...normalizeApiResponse(generatedApiResponse),
};
