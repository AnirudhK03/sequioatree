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
  aiResponse: string;
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

  return { aiText: response.aiResponse, cards };
}

// ── Mock API response (hardcoded for now) ─────────────────────

export const MOCK_API_RESPONSE: ApiResponse = {
  aiResponse:
    "Sure. Here is a Typescript code block for your Analog Clock project. It is built using React, and uses the local time for London, England as standard. Let me know if you would like to make any refinements to the code.",
  cards: [
    // ── Idea Validation ───────────────────────────────────────
    // Problem & Demand
    {
      id: "pain-severity",
      label: "Pain Severity",
      value: "9.2",
      type: "chart-ring",
      category: "idea",
      subcategory: "Problem & Demand",
      detail: {
        title: "How severe is the problem?",
        summary:
          "Measures the intensity of the pain point your target users experience. A higher score signals stronger motivation to adopt a solution.",
        points: [
          "Users rated the problem 9.2/10 in severity",
          "87% said it directly impacts revenue or productivity",
          "Top-3 pain point cited across all interview segments",
          "Strong emotional language used when describing the problem",
        ],
        source: "User interviews & survey data",
      },
    },
    {
      id: "problem-frequency",
      label: "Problem Frequency",
      value: "Daily",
      type: "metric",
      category: "idea",
      subcategory: "Problem & Demand",
      detail: {
        title: "How often does the problem occur?",
        summary:
          "Frequency of occurrence directly correlates with willingness to pay. Daily problems create habitual product usage.",
        points: [
          "72% of respondents encounter this problem daily",
          "Average of 3.4 occurrences per workday",
          "Problem frequency increases with team size",
          "Peak occurrence during high-stakes periods (quarter-end, launches)",
        ],
        source: "Usage pattern analysis",
      },
    },
    {
      id: "existing-spend",
      label: "Existing Spend",
      value: "$4.2K",
      type: "metric",
      category: "idea",
      subcategory: "Problem & Demand",
      detail: {
        title: "What are users already spending to solve this?",
        summary:
          "Existing spend validates willingness to pay. Users already allocating budget to workarounds are primed for a better solution.",
        points: [
          "Average annual spend of $4,200 per team on workarounds",
          "35% use paid tools that partially address the problem",
          "18% have hired dedicated staff to manage the issue",
          "Budget already allocated — no need to create new line items",
        ],
        source: "Market spending analysis",
      },
    },
    {
      id: "bandaid-solutions",
      label: "Band-Aid Solutions",
      value: "3.7",
      type: "chart-bar",
      category: "idea",
      subcategory: "Problem & Demand",
      detail: {
        title: "How many workarounds are users juggling?",
        summary:
          "A high number of band-aid solutions indicates the problem is real but unsolved. Each workaround is a friction point your product can eliminate.",
        points: [
          "Average user relies on 3.7 separate tools or workarounds",
          "Spreadsheets are the #1 band-aid (used by 64%)",
          "Manual processes consume ~6 hours/week per team",
          "High error rate (23%) due to fragmented workflows",
        ],
        source: "Workflow audit",
      },
    },
    // Market & Competition
    {
      id: "competitive-landscape",
      label: "Competitive Landscape",
      value: "Moderate",
      type: "metric",
      category: "idea",
      subcategory: "Market & Competition",
      detail: {
        title: "How crowded is the market?",
        summary:
          "A moderate competitive landscape means the market is validated but not saturated — ideal for a differentiated entrant.",
        points: [
          "12 direct competitors identified in the space",
          "Top 3 players hold ~45% market share",
          "No clear dominant winner — market is still fragmenting",
          "Most competitors are horizontal; vertical specialization is an opening",
        ],
        source: "Competitive analysis",
      },
    },
    {
      id: "competitive-gaps",
      label: "Competitive Gaps",
      value: "High",
      type: "metric",
      category: "idea",
      subcategory: "Market & Competition",
      detail: {
        title: "Where are competitors falling short?",
        summary:
          "Identifies the specific areas where existing solutions fail to meet user needs, revealing your opportunity to differentiate.",
        points: [
          "No competitor offers real-time collaboration on this workflow",
          "Pricing models are misaligned with SMB budgets",
          "Onboarding takes 2+ weeks for all major competitors",
          "Integration ecosystem is weak — most require manual data entry",
        ],
        source: "Competitor gap analysis",
      },
    },
    // Feasibility & Risk
    {
      id: "regulatory-risk",
      label: "Regulatory Risk",
      value: "Low",
      type: "metric",
      category: "idea",
      subcategory: "Feasibility & Risk",
      detail: {
        title: "What regulatory hurdles exist?",
        summary:
          "Low regulatory risk means faster go-to-market and fewer compliance costs. Critical for investor confidence.",
        points: [
          "No industry-specific licensing required",
          "Standard data privacy compliance (SOC 2, GDPR) sufficient",
          "No pending legislation that would impact the product category",
          "Existing frameworks cover all planned functionality",
        ],
        source: "Legal & compliance review",
      },
    },
    {
      id: "execution-constraints",
      label: "Execution Constraints",
      value: "2",
      type: "metric",
      category: "idea",
      subcategory: "Feasibility & Risk",
      detail: {
        title: "What execution risks should we watch?",
        summary:
          "Only 2 major execution constraints identified, both mitigable with proper planning.",
        points: [
          "Requires integration with legacy systems at enterprise clients",
          "ML model accuracy needs >95% to meet user expectations",
          "Both constraints have clear technical paths to resolution",
          "No hard dependencies on third-party approvals or partnerships",
        ],
        source: "Technical feasibility assessment",
      },
    },
    // Product & Strategy
    {
      id: "mvp-wedge",
      label: "MVP Wedge",
      value: "Strong",
      type: "metric",
      category: "idea",
      subcategory: "Product & Strategy",
      detail: {
        title: "Is there a clear MVP entry point?",
        summary:
          "A strong MVP wedge means you can deliver immediate value with a focused feature set, then expand.",
        points: [
          "Single workflow automation solves the #1 pain point",
          "MVP can launch with 3 core features",
          "Early users willing to adopt even with limited feature set",
          "Clear expansion path from wedge to full platform",
        ],
        source: "Product strategy analysis",
      },
    },
    {
      id: "unique-advantage",
      label: "Unique Advantage",
      value: "AI-Native",
      type: "metric",
      category: "idea",
      subcategory: "Product & Strategy",
      detail: {
        title: "What's our unfair advantage?",
        summary:
          "Being AI-native from day one enables capabilities that bolt-on AI competitors cannot match.",
        points: [
          "Purpose-built AI models trained on domain-specific data",
          "10x faster processing vs. competitors adding AI as a feature",
          "Proprietary data flywheel improves with each customer",
          "Architecture enables personalization impossible with legacy systems",
        ],
        source: "Technical differentiation analysis",
      },
    },
    // Market Readiness
    {
      id: "pmf-readiness",
      label: "PMF Readiness",
      value: "82%",
      type: "chart-progress",
      category: "idea",
      subcategory: "Market Readiness",
      detail: {
        title: "How close are we to product-market fit?",
        summary:
          "82% PMF readiness score based on the Sean Ellis test and retention metrics from early users.",
        points: [
          "42% of beta users say they'd be 'very disappointed' without the product",
          "Week-4 retention at 68% — above benchmark for B2B SaaS",
          "Organic referral rate of 24% among early adopters",
          "NPS of +54 from first 200 users",
        ],
        source: "PMF survey & cohort analysis",
      },
    },

    // ── Market Validation ─────────────────────────────────────
    {
      id: "sam",
      label: "SAM",
      value: "$2.4B",
      type: "metric",
      category: "market",
      subcategory: "Market Sizing",
      detail: {
        title: "Serviceable Addressable Market",
        summary:
          "The segment of the TAM that your product can realistically serve given your go-to-market strategy and product capabilities.",
        points: [
          "$2.4B addressable within target verticals and geographies",
          "Focused on mid-market and enterprise segments",
          "North America and Western Europe as initial markets",
          "Growing at 18% CAGR driven by digital transformation",
        ],
        source: "Market sizing model",
      },
    },
    {
      id: "som",
      label: "SOM",
      value: "$180M",
      type: "metric",
      category: "market",
      subcategory: "Market Sizing",
      detail: {
        title: "Serviceable Obtainable Market",
        summary:
          "The realistic portion of SAM you can capture in the near term given current resources, competition, and go-to-market motion.",
        points: [
          "$180M capturable within 3-5 year horizon",
          "Based on 7.5% market share target",
          "Bottoms-up model validated by comparable company benchmarks",
          "Conservative estimate — excludes platform expansion revenue",
        ],
        source: "Revenue model & benchmarking",
      },
    },
    {
      id: "swot",
      label: "SWOT Analysis",
      value: "",
      type: "chart-bar",
      category: "market",
      subcategory: "Strategic Analysis",
      detail: {
        title: "SWOT Overview",
        summary:
          "Strengths, weaknesses, opportunities, and threats mapped for strategic positioning.",
        points: [
          "Strength: AI-native architecture and proprietary data moat",
          "Weakness: Early-stage brand awareness and limited sales team",
          "Opportunity: Incumbents slow to adopt AI — window of 18-24 months",
          "Threat: Well-funded competitor pivoting into adjacent space",
        ],
        source: "Strategic planning session",
      },
    },
  ],
};
