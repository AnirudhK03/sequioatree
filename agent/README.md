# agentFramework

This folder contains small, runnable “agent-style” scripts.

## Market validation (travel agencies) via Web Search

Run:

```bash
OPENAI_API_KEY="YOUR_KEY" node agentFramework/marketValidationWebSearch.mjs
```

Optional focus override:

```bash
OPENAI_API_KEY="YOUR_KEY" node agentFramework/marketValidationWebSearch.mjs "Focus: luxury leisure travel agencies in the US; avoid OTAs; emphasize pricing and acquisition channels"
```

What you get:
- A **single JSON object** (printed as plain text by the model) containing market sizing, demand signals, segments, competitors, pricing/WTP patterns, acquisition channels, risks, and a concrete validation plan.
- No citations/URLs in the output (by design, to reduce tokens/cost).

Notes:
- Set `model` or `reasoning.effort` inside `marketValidationWebSearch.mjs` if you want faster/cheaper vs deeper research.
- The script uses `fetch` directly (no SDK dependencies).

### Save output as context (for downstream scripts)

```bash
OPENAI_API_KEY="YOUR_KEY" node agentFramework/marketValidationWebSearch.mjs --save
```

This writes to `agentFramework/context/marketValidation.context.json` by default (override with `CONTEXT_OUT`).

## Generate `ApiCard[]` JSON from context + PDF (no web search)

```bash
OPENAI_API_KEY="YOUR_KEY" node agentFramework/generateApiCardsFromContextAndPdf.mjs
```

Outputs a strictly-JSON object with `aiResponse` + `cards` (matching `app/data/cards.ts` `ApiResponse`) and saves it to:
`app/data/apiResponse.generated.json` (override with `OUT_PATH`).

