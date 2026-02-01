/**
 * Generate frontend-ready ApiCard JSON from:
 * - saved context (from marketValidationWebSearch.mjs --save)
 * - a local PDF report (data/...)
 *
 * No web search is used in this script.
 *
 * Usage:
 *   OPENAI_API_KEY="..." node agentFramework/generateApiCardsFromContextAndPdf.mjs
 *
 * Optional:
 *   OPENAI_API_KEY="..." OPENAI_MODEL="gpt-4o-mini" node agentFramework/generateApiCardsFromContextAndPdf.mjs --debug
 *   OPENAI_API_KEY="..." CONTEXT_IN="agentFramework/context/marketValidation.context.json" \
 *     PDF_PATH="data/56151 Travel Agencies in the US Industry Report.pdf" \
 *     OUT_PATH="agentFramework/out/apiResponse.json" \
 *     node agentFramework/generateApiCardsFromContextAndPdf.mjs --debug
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY env var.");
  process.exit(1);
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const VERBOSE = flags.has("--verbose") || flags.has("--debug");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const CONTEXT_IN = process.env.CONTEXT_IN || "agentFramework/context/marketValidation.context.json";
const PDF_PATH =
  process.env.PDF_PATH || "data/56151 Travel Agencies in the US Industry Report.pdf";
const OUT_PATH = process.env.OUT_PATH || "app/data/apiResponse.generated.json";

const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || "240000"); // 4 minutes
const HEARTBEAT_MS = Number(process.env.OPENAI_HEARTBEAT_MS || "2000");
const MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || "3500");

const fs = await import("node:fs");
const path = await import("node:path");

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

function readTextOrExit(p) {
  const abs = path.resolve(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    console.error(`Missing file: ${abs}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, "utf8");
}

function readPdfAsDataUrlOrExit(p) {
  const abs = path.resolve(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    console.error(`Missing PDF: ${abs}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(abs);
  const b64 = buf.toString("base64");
  return { abs, dataUrl: `data:application/pdf;base64,${b64}` };
}

const priorContext = readTextOrExit(CONTEXT_IN).trim();
const { abs: pdfAbs, dataUrl: pdfDataUrl } = readPdfAsDataUrlOrExit(PDF_PATH);

// Keep prompt tight; rely on PDF + saved context for facts.
const PROMPT = String.raw`
You are an expert business analyst and startup strategist.
Inputs:
1) Prior context (from earlier analysis)
2) An industry PDF report attached

Business idea: Travel agency for Gen Z.

Task:
Analyze the report + prior context and produce insights across:
- Problem & Demand
- Market & Competition
- Feasibility & Risk
- Product & Strategy
- Market Readiness & Validation (incl. TAM/SAM/SOM + PMF readiness)
- SWOT

Output format (STRICT):
Return a single JSON object with optional "aiResponse" and required "cards".
Each insight MUST be one card matching this TypeScript type:

ApiCard = {
  id: string;
  label: string;
  value: string;
  type: "metric" | "image" | "testimonial" | "chart-bar" | "chart-ring" | "chart-progress";
  category: "market" | "idea";
  subcategory: string;
  detail: { title: string; summary: string; points: string[]; source: string; };
  author?: string;
  quote?: string;
}

Rules:
- Output must be strictly parseable JSON. No markdown. No extra keys.
- Include ALL fields for every card; optional fields only when relevant.
- Each section above must be covered with at least 3 cards.
- Total cards target: 18–30 (enough coverage without bloat).
- Quantitative evidence: include numbers/ranges where possible in value/points, but do NOT include URLs.
- For detail.source use one of: "IBISWorld report (Jan 2026)", "Prior context", or "Synthesis".
- Use subcategory exactly as one of:
  "Problem & Demand" | "Market & Competition" | "Feasibility & Risk" | "Product & Strategy" | "Market Readiness & Validation" | "SWOT" | "Market Sizing"
- Prefer these canonical cards (must exist):
  - Pain Severity (chart-ring, idea, Problem & Demand)
  - Problem Frequency (metric, idea, Problem & Demand)
  - Existing Spend (metric, idea, Problem & Demand)
  - Band-Aid Solutions (chart-bar, idea, Problem & Demand)
  - Competitive Landscape (metric or chart-bar, market, Market & Competition)
  - Competitive Gaps (metric, market, Market & Competition)
  - Regulatory & Compliance Risk (metric, idea, Feasibility & Risk)
  - Execution Constraints (metric, idea, Feasibility & Risk)
  - MVP Wedge (metric, idea, Product & Strategy)
  - Unique Advantage (metric, idea, Product & Strategy)
  - PMF Readiness (chart-progress, idea, Market Readiness & Validation)
  - TAM, SAM, SOM (metric, market, Market Sizing)
  - SWOT Overview (chart-bar, market, SWOT)

Prior context (verbatim, may include assumptions):
${priorContext}
`.trim();

vlog("Model:", MODEL);
vlog("Context path:", CONTEXT_IN, `(chars=${priorContext.length})`);
vlog("PDF path:", pdfAbs);

const requestBody = {
  model: MODEL,
  temperature: 0.2,
  max_output_tokens: MAX_OUTPUT_TOKENS,
  // Force JSON output when supported
  text: { format: { type: "json_object" } },
  input: [
    {
      role: "user",
      content: [
        { type: "input_text", text: PROMPT },
        {
          type: "input_file",
          filename: path.basename(pdfAbs),
          file_data: pdfDataUrl,
        },
      ],
    },
  ],
};

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
const rawText = await resp.text();

if (!resp.ok) {
  console.error(`OpenAI API error: ${resp.status} ${resp.statusText}\n${rawText}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(rawText);
} catch {
  console.error(`[${ts()}] Failed to parse JSON response body.`);
  console.error(rawText.slice(0, 2000));
  process.exit(1);
}

function extractOutputText(responseJson) {
  const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const item of output) {
    if (item?.type === "message" && Array.isArray(item?.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part?.text === "string") return part.text;
      }
    }
  }
  return "";
}

const outputText = extractOutputText(data).trim();
if (!outputText) {
  console.error("No output text found in response.");
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

// Validate parseability and save
let parsed;
try {
  parsed = JSON.parse(outputText);
} catch {
  console.error("Model output was not valid JSON. First 2000 chars:");
  console.error(outputText.slice(0, 2000));
  process.exit(1);
}

const outAbs = path.resolve(process.cwd(), OUT_PATH);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, JSON.stringify(parsed, null, 2), "utf8");

console.log("===== API RESPONSE JSON (for frontend) =====");
console.log(JSON.stringify(parsed, null, 2));
log(`Saved to ${outAbs}`);

