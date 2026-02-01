/**
 * Minimal OpenAI Responses API call with Web Search.
 *
 * Usage:
 *   OPENAI_API_KEY="..." node agentFramework/marketValidationWebSearch.mjs
 *   OPENAI_API_KEY="..." node agentFramework/marketValidationWebSearch.mjs "Focus: luxury leisure travel agencies in the US"
 *
 * Notes:
 * - Uses the Responses API + built-in `web_search` tool to pull real-time sources.
 * - Prints (1) model output text, (2) citations/sources (when available), (3) full raw response JSON.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY env var.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const userFocus = argv
  .filter((a) => !a.startsWith("--"))
  .join(" ")
  .trim() || "Business idea: travel agency for Gen Z (modern travel advisor + booking + itinerary + support).";

const SAVE = flags.has("--save");
const CONTEXT_OUT =
  process.env.CONTEXT_OUT || "agentFramework/context/marketValidation.context.json";

const VERBOSE = flags.has("--verbose") || flags.has("--debug");
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || "240000"); // 4 minutes default
const HEARTBEAT_MS = Number(process.env.OPENAI_HEARTBEAT_MS || "2000");

const t0 = Date.now();
function ts() {
  const ms = Date.now() - t0;
  const s = Math.floor(ms / 1000);
  const rem = ms % 1000;
  return `${s}.${String(rem).padStart(3, "0")}s`;
}
function log(...args) {
  console.log(`[${ts()}]`, ...args);
}
function vlog(...args) {
  if (VERBOSE) log(...args);
}

/**
 * Prompt engineering: keep it compact to reduce token usage/cost.
 */
const MARKET_VALIDATION_PROMPT = String.raw`
You are an expert business analyst + startup strategist. Use web search to gather up-to-date facts, then answer the sections below.

Business idea:
${userFocus}

Rules:
- Prefer evidence from the last ~24 months; use older only if foundational.
- No citations/URLs in the output (reduce tokens). Still be evidence-backed: include numbers, ranges, and assumptions.
- If a number is uncertain, give a range and state why (geo, definition, segment).
- Distinguish: independent travel advisors/agencies vs corporate TMCs vs OTAs vs tour operators/DMCs; state which applies.
- Keep it compact and decision-oriented.

Return ONLY this JSON (no markdown, no extra keys):
{
  "scope": { "segments": string[], "geographies": string[], "time_window": string, "key_assumptions": string[] },

  "1_problem_and_demand": {
    "pain_severity": { "summary": string, "quantification": string[] },
    "problem_frequency": string,
    "existing_spend": string[],
    "band_aid_solutions": string[],
    "customer_willingness_to_pay": { "summary": string, "signals": string[] },
    "insight": string
  },

  "2_market_and_competition": {
    "competitive_landscape": Array<{ "category": string, "examples": string[], "why_customers_choose_them": string[] }>,
    "competitive_gaps": string[],
    "market_dynamics": string[],
    "opportunity_insight": string
  },

  "3_feasibility_and_risk": {
    "regulatory_and_compliance_risks": string[],
    "execution_constraints": string[],
    "critical_dependencies": string[],
    "risk_insight": string
  },

  "4_product_and_strategy": {
    "mvp_wedge": { "wedge": string, "why_it_validates_fast": string, "who_its_for": string, "what_it_excludes": string[] },
    "unique_advantage_hypotheses": string[],
    "growth_levers": string[],
    "strategy_insight": string
  },

  "5_market_readiness_and_validation": {
    "pmf_readiness": { "assessment": "ready"|"borderline"|"not_ready", "why": string[] },
    "market_size_reality_check": {
      "tam_usd_per_year": string,
      "sam_usd_per_year": string,
      "som_usd_per_year_1_to_3_years": string,
      "assumptions": string[]
    },
    "adoption_and_behavior_signals": string[],
    "revenue_potential": { "near_term_12mo": string, "long_term_3yr": string, "assumptions": string[] },
    "readiness_insight": string
  },

  "6_swot": {
    "strengths": string[],
    "weaknesses": string[],
    "opportunities": string[],
    "threats": string[],
    "swot_insight": string
  },

  "key_metrics": Array<{ "metric": string, "value": string, "year": string, "geo": string, "notes": string }>,
  "validation_plan": Array<{ "experiment": string, "hypothesis": string, "method": string, "success_metric": string, "timebox": string, "est_cost_usd": string }>,
  "top_growth_gaps_to_exploit": string[],
  "top_risks_to_mitigate_first": string[],
  "open_questions": string[]
}

Targets (keep short):
- key_metrics: 8–12
- validation_plan: 6–9 (include 2 fast falsifiers)
`.trim();

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }
  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
  const chunks = [];
  for (const item of output) {
    if (item?.type === "message" && Array.isArray(item?.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part?.text === "string") chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

const requestBody = {
  model: "gpt-5",
  reasoning: { effort: "low" },
  tools: [
    {
      type: "web_search",
      // Keep live access on by default.
      external_web_access: true,
    },
  ],
  tool_choice: "auto",
  input: MARKET_VALIDATION_PROMPT,
};

vlog("User focus:", userFocus);
vlog("Request body keys:", Object.keys(requestBody));

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

let heartbeat = null;
heartbeat = setInterval(() => {
  log("Waiting for OpenAI response...");
}, HEARTBEAT_MS);

log("Sending request to OpenAI Responses API...");
let resp;
try {
  resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  });
} catch (err) {
  clearTimeout(timeout);
  if (heartbeat) clearInterval(heartbeat);
  console.error(`[${ts()}] Request failed:`, err?.name || err, err?.message || "");
  process.exit(1);
}
clearTimeout(timeout);
if (heartbeat) clearInterval(heartbeat);

log(`Received response headers. HTTP ${resp.status} ${resp.statusText}`);

if (!resp.ok) {
  log("Reading error body...");
  const text = await resp.text().catch(() => "");
  console.error(`OpenAI API error: ${resp.status} ${resp.statusText}\n${text}`);
  process.exit(1);
}

log("Reading response body...");
const rawText = await resp.text();
vlog(`Body length: ${rawText.length} chars`);

let data;
try {
  data = JSON.parse(rawText);
} catch {
  console.error(`[${ts()}] Failed to parse JSON response.`);
  console.error(rawText.slice(0, 2000));
  process.exit(1);
}

const outputText = extractOutputText(data);

console.log("===== OUTPUT TEXT =====");
console.log(outputText || "(No output_text found in response.)");

if (SAVE && outputText) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const outPath = path.resolve(process.cwd(), CONTEXT_OUT);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, outputText, "utf8");
  log(`Saved context to ${outPath}`);
}

console.log("\n===== RAW RESPONSE JSON =====");
console.log(JSON.stringify(data, null, 2));

