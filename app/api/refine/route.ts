import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type Annotation = {
    id: string;
    cardId: string;
    cardLabel: string;
    cardValue: string;
    selectedText: string;
    note: string;
    createdAt: number;
};

type ApiCard = {
    id: string;
    label: string;
    value: string;
    type: "metric" | "image" | "testimonial" | "chart-bar" | "chart-ring" | "chart-progress";
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

type ApiResponseShape = {
    aiResponse?: string | null;
    cards?: ApiCard[];
};

type ApiResponseOut = {
    aiResponse: string;
    modifiedIdea: string;
    cards: ApiCard[];
};

const ALLOWED_TYPES: ApiCard["type"][] = [
    "metric",
    "image",
    "testimonial",
    "chart-bar",
    "chart-ring",
    "chart-progress",
];

function sanitizeCardAgainstBase(incoming: any, base: ApiCard): ApiCard {
    const nextDetail: ApiCard["detail"] = {
        title: typeof incoming?.detail?.title === "string" ? incoming.detail.title : base.detail.title,
        summary: typeof incoming?.detail?.summary === "string" ? incoming.detail.summary : base.detail.summary,
        points: Array.isArray(incoming?.detail?.points)
            ? incoming.detail.points.map((p: any) => (typeof p === "string" ? p : String(p))).filter(Boolean)
            : base.detail.points,
        source: typeof incoming?.detail?.source === "string" ? incoming.detail.source : base.detail.source,
    };

    const next: ApiCard = {
        id: base.id,
        label: typeof incoming?.label === "string" ? incoming.label : base.label,
        value: typeof incoming?.value === "string" ? incoming.value : base.value,
        type: ALLOWED_TYPES.includes(incoming?.type) ? incoming.type : base.type,
        category: incoming?.category === "market" || incoming?.category === "idea" ? incoming.category : base.category,
        subcategory: typeof incoming?.subcategory === "string" ? incoming.subcategory : base.subcategory,
        detail: nextDetail,
    };

    if (typeof incoming?.author === "string") next.author = incoming.author;
    else if (typeof base.author === "string") next.author = base.author;

    if (typeof incoming?.quote === "string") next.quote = incoming.quote;
    else if (typeof base.quote === "string") next.quote = base.quote;

    return next;
}

function normalizeAiResponse(value: unknown): string {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "";
        }
    }
    return String(value);
}

function normalizeModifiedIdea(value: unknown): string {
    if (typeof value === "string") return value;
    if (value == null) return "";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "";
        }
    }
    return String(value);
}

function normalizeComparableText(value: unknown): string {
    return stripKnownPrefixes(String(value ?? ""))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function stripKnownPrefixes(text: string): string {
    let out = text;
    // Remove repeated UI-noise prefixes that may come from fallback logic or model echoing.
    // Example: "Revised: Revised: $46.9B" -> "$46.9B"
    // Keep this conservative (start-of-string only).
    const patterns = [
        /^\s*updated:\s*/i,
        /^\s*revised:\s*/i,
        /^\s*reframed:\s*/i,
        /^\s*rewritten:\s*/i,
        /^\s*refined:\s*/i,
    ];
    let changed = true;
    while (changed) {
        changed = false;
        for (const re of patterns) {
            const next = out.replace(re, "");
            if (next !== out) {
                out = next;
                changed = true;
            }
        }
    }
    return out;
}

function sameStringish(a: unknown, b: unknown): boolean {
    return normalizeComparableText(a) === normalizeComparableText(b);
}

function sameStringArray(a: unknown, b: unknown): boolean {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!sameStringish(a[i], b[i])) return false;
    }
    return true;
}

function ensureCardTextDifferentFromBase(card: ApiCard, base: ApiCard): ApiCard {
    // This function used to add visible prefixes to force "difference".
    // That created bad UX (e.g. "Revised: Revised:").
    // Now it *only* strips known prefixes from incoming output so the UI stays clean.
    const next: ApiCard = {
        ...card,
        label: stripKnownPrefixes(card.label),
        value: stripKnownPrefixes(card.value),
        detail: {
            ...card.detail,
            title: stripKnownPrefixes(card.detail.title),
            summary: stripKnownPrefixes(card.detail.summary),
            points: Array.isArray(card.detail.points)
                ? card.detail.points.map((p) => stripKnownPrefixes(String(p)))
                : card.detail.points,
            source: stripKnownPrefixes(card.detail.source),
        },
    };
    if (typeof next.author === "string") next.author = stripKnownPrefixes(next.author);
    if (typeof next.quote === "string") next.quote = stripKnownPrefixes(next.quote);
    return next;
}

function countUnchangedCardTextFields(incoming: ApiCard, base: ApiCard): number {
    let unchanged = 0;
    if (sameStringish(incoming.label, base.label)) unchanged++;
    if (sameStringish(incoming.value, base.value)) unchanged++;
    if (sameStringish(incoming.detail?.title, base.detail.title)) unchanged++;
    if (sameStringish(incoming.detail?.summary, base.detail.summary)) unchanged++;
    if (sameStringArray(incoming.detail?.points, base.detail.points)) unchanged++;
    return unchanged;
}

function limitToMaxSentences(text: string, maxSentences: number): string {
    const cleaned = String(text ?? "").trim();
    if (!cleaned) return "";

    // Simple sentence segmentation: split on whitespace following ., !, ?
    // Keeps punctuation with the sentence.
    const parts = cleaned.split(/(?<=[.!?])\s+/g).filter(Boolean);
    if (parts.length <= maxSentences) return cleaned;
    return parts.slice(0, maxSentences).join(" ").trim();
}

const RESPONSE_JSON_SCHEMA = {
    schema: {
        type: "object",
        additionalProperties: false,
        required: ["aiResponse", "modifiedIdea", "cards"],
        properties: {
            // Keep it short for the UI: max 3 sentences.
            aiResponse: { type: "string", maxLength: 500 },
            modifiedIdea: { type: "string" },
            cards: {
                type: "array",
                // minItems/maxItems and id enum are added per-request when we know expected ids
                items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "label", "value", "type", "category", "subcategory", "detail"],
                    properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                        value: { type: "string" },
                        type: {
                            type: "string",
                            enum: [
                                "metric",
                                "image",
                                "testimonial",
                                "chart-bar",
                                "chart-ring",
                                "chart-progress",
                            ],
                        },
                        category: { type: "string", enum: ["market", "idea"] },
                        subcategory: { type: "string" },
                        detail: {
                            type: "object",
                            additionalProperties: false,
                            required: ["title", "summary", "points", "source"],
                            properties: {
                                title: { type: "string" },
                                summary: { type: "string" },
                                points: { type: "array", items: { type: "string" } },
                                source: { type: "string" },
                            },
                        },
                        author: { type: "string" },
                        quote: { type: "string" },
                    },
                },
            },
        },
    },
} as const;

function buildResponseSchemaForExpectedIds(expectedIds: string[]) {
    const base = RESPONSE_JSON_SCHEMA.schema;
    const cloned = safeJsonStringify(base);
    const schema = cloned ? (JSON.parse(cloned) as any) : (base as any);

    if (expectedIds.length > 0) {
        schema.properties.cards.minItems = expectedIds.length;
        schema.properties.cards.maxItems = expectedIds.length;
        schema.properties.cards.items.properties.id = {
            type: "string",
            enum: expectedIds,
        };
    }
    return schema;
}

type RefineRequestBody = {
    originalIdea: string;
    notesText?: string;
    annotations?: Annotation[];
    base?: ApiResponseShape;
};

function truncate(text: string, maxChars: number) {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + "\n[truncated]";
}

function safeJsonStringify(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return "";
    }
}

function getBaseCardIds(base: ApiResponseShape | undefined): string[] {
    const cards = Array.isArray(base?.cards) ? base!.cards : [];
    return cards.map((c) => c.id);
}

function sameIdSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    if (sa.size !== a.length) return false;
    for (const id of b) if (!sa.has(id)) return false;
    return true;
}

function formatBaseCards(base: ApiResponseShape | undefined): string {
    const cards = Array.isArray(base?.cards) ? base!.cards : [];
    if (!cards.length) return "(no base cards provided)";

    const lines: string[] = [];
    for (const c of cards) {
        const points = Array.isArray(c.detail?.points) ? c.detail.points : [];
        const pointsInline = points.slice(0, 5).join(" | ");
        lines.push(
            `- [${c.category} / ${c.subcategory}] ${c.label}: ${c.value}\n  Summary: ${c.detail?.summary ?? ""}\n  Evidence: ${pointsInline}\n  Source: ${c.detail?.source ?? ""}`,
        );
    }
    return lines.join("\n");
}

function formatUserNotes(notesText: string | undefined, annotations: Annotation[] | undefined): string {
    const safeNotes = (notesText ?? "").trim();
    const safeAnnotations = Array.isArray(annotations) ? annotations : [];

    const parts: string[] = [];
    parts.push("User notes (verbatim):");
    parts.push(safeNotes ? safeNotes : "(none)");
    parts.push("");
    parts.push("User annotations (verbatim, structured):");
    if (!safeAnnotations.length) {
        parts.push("(none)");
    } else {
        for (const a of safeAnnotations) {
            parts.push(
                `- Card: ${a.cardLabel} (${a.cardValue})\n  Selected: "${a.selectedText}"\n  Note: ${a.note || "(empty)"}`,
            );
        }
    }
    return parts.join("\n");
}

function buildPrompt(input: RefineRequestBody): string {
    const baseText = truncate(formatBaseCards(input.base), 14000);
    const userText = truncate(formatUserNotes(input.notesText, input.annotations), 7000);
    const baseJson = truncate(safeJsonStringify(input.base ?? {}), 14000);
    const baseCardIds = getBaseCardIds(input.base);

    return String.raw`
Reconsideration → Revised Idea Output Prompt
Instruction for the Agent

Using:
- the original report,
- your prior analysis and conclusions, and
- the user’s notes and annotations,
re-evaluate assumptions and adjust the idea without introducing new external data. Then synthesize the updated thinking into a clear, concise, well-formed idea statement that reflects improved product–market alignment.

The goal is not to defend the original idea, but to adapt it into the strongest possible version given the evidence and feedback. We also need to answer the exact same questions we posed in the first place, as in answer each heading.

Base material (represents the original report + prior analysis; do not add any new external facts):
${baseText}

Existing ApiResponse JSON (this is the current set of cards you MUST update; treat as authoritative structure):
${baseJson}

User feedback (notes + annotations):
${userText}

Original idea (user input):
${input.originalIdea.trim()}

Output format (STRICT):
Return a single JSON object with required keys: "aiResponse", "modifiedIdea", and "cards".

aiResponse MUST be MAXIMUM 3 sentences total.
Rules for aiResponse:
- No headings, no numbering, no bullets.
- No new external facts.
- It should crisply summarize the revised idea + fit in 3 sentences.

modifiedIdea MUST be a revised version of the user's Original idea that is safe to place back into the input box.
Rules for modifiedIdea:
- It must be meaningfully different from the original idea text.
- Keep it short (1–3 sentences).
- It must not add new external facts.

Each card MUST match this TypeScript type:
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

Rules for cards:
- Update ALL the cards to reflect the revised idea and updated assumptions.
- Answer all the topics!
- Do NOT introduce any new external facts. Only re-interpret/re-weight what's already in base material + user notes.
- Keep sources as: "IBISWorld report (Jan 2026)", "Prior context", or "Synthesis".
- Use subcategory exactly as one of:
  "Problem & Demand" | "Market & Competition" | "Feasibility & Risk" | "Product & Strategy" | "Market Readiness & Validation" | "SWOT" | "Market Sizing"
- CRITICAL REWRITE CONSTRAINTS (to ensure the new generated cards are completely different in wording):
    - For every card, rewrite ALL user-facing text fields: label, value, detail.title, detail.summary, and every item in detail.points.
    - Do not copy any sentences or bullet points from the Existing ApiResponse JSON. Avoid reusing exact phrases.
    - No text field may be identical to the corresponding field in the Existing ApiResponse JSON for that same card id.
    - You may keep the same id/type/category/subcategory, but the card's written content must be substantially rewritten.
- CRITICAL: Return EXACTLY ${baseCardIds.length} cards, with the EXACT SAME card ids as the existing ApiResponse JSON, and update their content in-place. Do not add/remove cards.
- Required card ids (must match exactly): ${baseCardIds.join(", ") || "(none)"}
- Output must be strictly parseable JSON. No markdown. No extra keys.
`.trim();
}

function extractOutputText(responseJson: any): string {
    const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
    for (const item of output) {
        if (item?.type === "message" && Array.isArray(item?.content)) {
            for (const part of item.content) {
                if (part?.type === "output_text" && typeof part?.text === "string") return part.text;
                // Some Responses API variants may provide structured output.
                if (part?.type === "output_json") {
                    const jsonVal = (part as any)?.json ?? (part as any)?.data;
                    if (jsonVal != null) return safeJsonStringify(jsonVal);
                }
            }
        }
    }
    return "";
}

function parseJsonLenient(text: string): unknown {
    const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
    // First try strict JSON parse.
    try {
        return JSON.parse(cleaned);
    } catch {
        // Try to recover from accidental code fences / extra prose.
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first >= 0 && last > first) {
            const slice = cleaned.slice(first, last + 1);
            return JSON.parse(slice);
        }
        throw new Error("No JSON object found in output");
    }
}

async function callOpenAI(apiKey: string, body: unknown) {
    const resp = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const rawText = await resp.text();
    return { resp, rawText };
}

async function callOpenAIJsonSchema(apiKey: string, model: string, prompt: string) {
    return callOpenAIJsonSchemaWithSchema(apiKey, model, prompt, RESPONSE_JSON_SCHEMA.schema);
}

async function callOpenAIJsonSchemaWithSchema(
    apiKey: string,
    model: string,
    prompt: string,
    schema: unknown,
) {
    const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || "6000");
    const requestBody = {
        model,
        temperature: 0.2,
        max_output_tokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 6000,
        text: {
            format: {
                type: "json_schema",
                name: "RefinedApiResponse",
                schema,
            },
        },
        input: [
            {
                role: "user",
                content: [{ type: "input_text", text: prompt }],
            },
        ],
    };
    return callOpenAI(apiKey, requestBody);
}

async function callOpenAIJsonObject(apiKey: string, model: string, prompt: string) {
    const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || "6000");
    const requestBody = {
        model,
        temperature: 0.2,
        max_output_tokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 6000,
        text: { format: { type: "json_object" } },
        input: [
            {
                role: "user",
                content: [{ type: "input_text", text: prompt }],
            },
        ],
    };
    return callOpenAI(apiKey, requestBody);
}

export async function POST(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { ok: false, error: "Missing OPENAI_API_KEY on server" },
            { status: 500 },
        );
    }

    let body: RefineRequestBody;
    try {
        body = (await req.json()) as RefineRequestBody;
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body?.originalIdea || !body.originalIdea.trim()) {
        return NextResponse.json({ ok: false, error: "originalIdea is required" }, { status: 400 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const prompt = buildPrompt(body);

    const expectedIds = getBaseCardIds(body.base);
    const responseSchema = buildResponseSchemaForExpectedIds(expectedIds);

    let firstCall;
    try {
        firstCall = await callOpenAIJsonSchemaWithSchema(apiKey, model, prompt, responseSchema);
        // If schema format is rejected by the model/account, fall back to json_object.
        if (!firstCall.resp.ok && firstCall.resp.status === 400) {
            firstCall = await callOpenAIJsonObject(apiKey, model, prompt);
        }
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: `OpenAI request failed: ${err?.message || String(err)}` },
            { status: 502 },
        );
    }

    if (!firstCall.resp.ok) {
        return NextResponse.json(
            {
                ok: false,
                error: `OpenAI API error: ${firstCall.resp.status} ${firstCall.resp.statusText}`,
                raw: firstCall.rawText,
            },
            { status: 502 },
        );
    }

    let data: any;
    try {
        data = JSON.parse(firstCall.rawText);
    } catch {
        return NextResponse.json(
            { ok: false, error: "Failed to parse OpenAI JSON response", raw: firstCall.rawText },
            { status: 502 },
        );
    }

    const outputText = extractOutputText(data).trim();
    if (!outputText) {
        return NextResponse.json(
            { ok: false, error: "No output text returned from model", raw: data },
            { status: 502 },
        );
    }

    let parsed: ApiResponseOut;
    try {
        parsed = parseJsonLenient(outputText) as ApiResponseOut;
    } catch {
        // One repair attempt: ask the model to emit STRICT JSON only.
        const repairPrompt =
            "Fix the following output into a single STRICT JSON object that matches the required schema. " +
            "Return ONLY JSON.\n\nInvalid output:\n" +
            outputText;

        try {
            let repairCall = await callOpenAIJsonSchemaWithSchema(apiKey, model, repairPrompt, responseSchema);
            if (!repairCall.resp.ok && repairCall.resp.status === 400) {
                repairCall = await callOpenAIJsonObject(apiKey, model, repairPrompt);
            }
            if (!repairCall.resp.ok) {
                // Fall back: keep cards but still surface the revised thinking text.
                const baseCards = Array.isArray(body.base?.cards) ? body.base!.cards : [];
                return NextResponse.json({
                    ok: true,
                    apiResponse: {
                        aiResponse: limitToMaxSentences(normalizeAiResponse(outputText), 3),
                        modifiedIdea: body.originalIdea,
                        cards: baseCards,
                    },
                    warning: "Model did not return valid JSON; cards left unchanged.",
                    raw: outputText.slice(0, 4000),
                });
            }

            const repairData = JSON.parse(repairCall.rawText);
            const repairText = extractOutputText(repairData).trim();
            parsed = parseJsonLenient(repairText) as ApiResponseOut;
        } catch {
            const baseCards = Array.isArray(body.base?.cards) ? body.base!.cards : [];
            return NextResponse.json({
                ok: true,
                apiResponse: {
                    aiResponse: limitToMaxSentences(normalizeAiResponse(outputText), 3),
                    modifiedIdea: body.originalIdea,
                    cards: baseCards,
                },
                warning: "Model did not return valid JSON; cards left unchanged.",
                raw: outputText.slice(0, 4000),
            });
        }
    }

    if (!parsed || !Array.isArray(parsed.cards)) {
        return NextResponse.json(
            { ok: false, error: "Model JSON missing required 'cards' array", raw: parsed },
            { status: 502 },
        );
    }

    const baseCards = Array.isArray(body.base?.cards) ? body.base!.cards : [];
    const baseById = new Map(baseCards.map((c) => [c.id, c] as const));

    const returnedIds = parsed.cards.map((c) => c.id);
    const needsIdRepair = expectedIds.length > 0 && !sameIdSet(expectedIds, returnedIds);

    if (needsIdRepair) {
        const repairPrompt =
            "You returned the wrong card set. " +
            `You MUST return exactly ${expectedIds.length} cards with the exact same ids as the existing ApiResponse JSON. ` +
            "Return ONLY a single JSON object with keys aiResponse and cards.\n\n" +
            `Required ids: ${expectedIds.join(", ")}\n\n` +
            "Here is your previous (incorrect) output; fix it without adding new external facts:\n" +
            truncate(safeJsonStringify(parsed), 12000);

        try {
            let repairCall = await callOpenAIJsonSchemaWithSchema(apiKey, model, repairPrompt, responseSchema);
            if (!repairCall.resp.ok && repairCall.resp.status === 400) {
                repairCall = await callOpenAIJsonObject(apiKey, model, repairPrompt);
            }

            if (repairCall.resp.ok) {
                const repairData = JSON.parse(repairCall.rawText);
                const repairText = extractOutputText(repairData).trim();
                parsed = parseJsonLenient(repairText) as ApiResponseOut;
            }
        } catch {
            // ignore and fall back to merging
        }

        // If the model still didn't comply, fall back to merging onto the base card set
        // so the UI can continue and we never "lose" cards.
        const afterIds = parsed.cards.map((c) => c.id);
        if (expectedIds.length > 0 && !sameIdSet(expectedIds, afterIds)) {
            const returnedById = new Map(parsed.cards.map((c) => [c.id, c] as const));
            parsed.cards = expectedIds
                .map((id) => returnedById.get(id) ?? baseById.get(id))
                .filter(Boolean) as ApiCard[];
        }
    }

    // Final safety: sanitize every card against the base card set so
    // required fields (especially detail.points) are always present.
    if (expectedIds.length > 0 && baseCards.length > 0) {
        const incomingById = new Map(parsed.cards.map((c: any) => [c.id, c] as const));
        parsed.cards = expectedIds
            .map((id) => {
                const base = baseById.get(id);
                if (!base) return null;
                const sanitized = sanitizeCardAgainstBase(incomingById.get(id), base);
                return ensureCardTextDifferentFromBase(sanitized, base);
            })
            .filter(Boolean) as ApiCard[];
    }

    parsed.aiResponse = limitToMaxSentences(normalizeAiResponse((parsed as any).aiResponse), 3);
    parsed.modifiedIdea = normalizeModifiedIdea((parsed as any).modifiedIdea);
    if (!parsed.modifiedIdea.trim()) parsed.modifiedIdea = body.originalIdea;
    parsed.modifiedIdea = stripKnownPrefixes(parsed.modifiedIdea);
    if (sameStringish(parsed.modifiedIdea, body.originalIdea)) {
        parsed.modifiedIdea = stripKnownPrefixes(body.originalIdea.trim());
    }

    // If the model "complied" structurally but left card text unchanged, do one
    // extra rewrite pass to push it to fully regenerate card wording.
    if (expectedIds.length > 0 && baseCards.length > 0) {
        let unchangedTotal = 0;
        for (const id of expectedIds) {
            const base = baseById.get(id);
            const inc = parsed.cards.find((c) => c.id === id);
            if (base && inc) unchangedTotal += countUnchangedCardTextFields(inc, base);
        }

        if (unchangedTotal > 0) {
            const rewritePrompt =
                "Rewrite the following JSON so that every card's text content is substantially different from before. " +
                "Keep EXACTLY the same card ids/count. Return ONLY JSON with keys aiResponse, modifiedIdea, cards. " +
                "Do NOT introduce any new external facts. " +
                "Critical: label/value/detail.title/detail.summary/detail.points must all be rewritten for every card.\n\n" +
                "Current (insufficiently rewritten) JSON:\n" +
                truncate(safeJsonStringify(parsed), 12000);

            try {
                let rewriteCall = await callOpenAIJsonSchemaWithSchema(
                    apiKey,
                    model,
                    rewritePrompt,
                    responseSchema,
                );
                if (!rewriteCall.resp.ok && rewriteCall.resp.status === 400) {
                    rewriteCall = await callOpenAIJsonObject(apiKey, model, rewritePrompt);
                }

                if (rewriteCall.resp.ok) {
                    const rewriteData = JSON.parse(rewriteCall.rawText);
                    const rewriteText = extractOutputText(rewriteData).trim();
                    const rewriteParsed = parseJsonLenient(rewriteText) as ApiResponseOut;

                    // Only accept if ids are correct; then sanitize/ensure-different.
                    if (
                        rewriteParsed &&
                        Array.isArray((rewriteParsed as any).cards) &&
                        sameIdSet(expectedIds, (rewriteParsed as any).cards.map((c: any) => c.id))
                    ) {
                        const rewriteIncomingById = new Map(
                            (rewriteParsed as any).cards.map((c: any) => [c.id, c] as const),
                        );
                        parsed.cards = expectedIds
                            .map((id) => {
                                const base = baseById.get(id);
                                if (!base) return null;
                                const sanitized = sanitizeCardAgainstBase(rewriteIncomingById.get(id), base);
                                return ensureCardTextDifferentFromBase(sanitized, base);
                            })
                            .filter(Boolean) as ApiCard[];

                        parsed.aiResponse = limitToMaxSentences(
                            normalizeAiResponse((rewriteParsed as any).aiResponse),
                            3,
                        );
                        parsed.modifiedIdea = normalizeModifiedIdea((rewriteParsed as any).modifiedIdea);
                        if (!parsed.modifiedIdea.trim()) parsed.modifiedIdea = body.originalIdea;
                        parsed.modifiedIdea = stripKnownPrefixes(parsed.modifiedIdea);
                        if (sameStringish(parsed.modifiedIdea, body.originalIdea)) {
                            parsed.modifiedIdea = stripKnownPrefixes(body.originalIdea.trim());
                        }
                    }
                }
            } catch {
                // ignore; we'll still return a safe, non-crashing response
            }
        }
    }

    // Optional: persist the refined output to a JSON file (local dev only).
    // Note: in many hosted/serverless environments the filesystem is read-only.
    let savedTo: string | null = null;
    if (process.env.SAVE_REFINED_RESPONSE === "1") {
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const defaultDir = process.env.REFINE_OUT_DIR || "app/data/refined";
        const outPath =
            process.env.REFINE_OUT_PATH ||
            path.join(defaultDir, `apiResponse.refined.${ts}.json`);
        try {
            const outAbs = path.resolve(process.cwd(), outPath);
            await fs.mkdir(path.dirname(outAbs), { recursive: true });
            await fs.writeFile(outAbs, JSON.stringify(parsed, null, 2), "utf8");
            savedTo = outPath;
        } catch {
            // ignore
        }
    }

    return NextResponse.json({ ok: true, apiResponse: parsed, savedTo });
}
