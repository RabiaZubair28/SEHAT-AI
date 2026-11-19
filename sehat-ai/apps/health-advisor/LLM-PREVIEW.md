# First LLM call: raw synthetic preview

This experiment is separate from the EMR plan-generation workflow and its existing validators. It makes one Gemini call with a fictional patient and the complete current Pakistani food catalog (43 foods). No clinical harness, output correction, catalog filtering, retries, optimizer or rule-based fallback runs in this preview. Instructions request catalog compliance; actual model compliance is left visible for inspection.

## Model

Default: `gemini-3.8-flash`. Google documents structured output support and free standard input/output for this model as checked November 11, 2026. This is a capable starting candidate, not a measured claim that it is best for clinical nutrition. Account access and quotas vary. There is no paid fallback or billing configuration in this script; it cannot detect whether the API key belongs to a paid project. Use a free-tier project to keep provider spend at zero.

Sources: [model capabilities](https://aistudio.google.com/docs/models/gemini-3.8-flash), [pricing](https://aistudio.google.com/docs/pricing#gemini-3.8-flash).

## Run

Requires Node 22.9+ and the existing backend build dependencies. From the workspace root:

```sh
# Inspect the exact input without a key or network request:
npm run preview --prefix sehat-ai/apps/health-advisor/backend -- --dry-run

# Configure this isolated experiment:
cp -n sehat-ai/apps/health-advisor/backend/.env.example sehat-ai/apps/health-advisor/backend/.env
```

Set `GEMINI_API_KEY` in the copied file to your free-tier Google AI Studio key. Then:

```sh
npm run preview --prefix sehat-ai/apps/health-advisor/backend
```

The script loads only this feature's `.env` and the process environment, never EMR's `.env`. Set `HEALTH_ADVISOR_PREVIEW_MODEL` to change the experimental model. This does not change the model used by EMR. The timeout is configurable from 1–180 seconds; the default is 120 seconds. Provider quota errors, unavailable models, blocked answers and truncated responses remain visible; the script does not silently choose another model.

## Inspect

Every run prints a new folder under `backend/preview-results/`:

- `request.json`: exact body, selected model and the patient/catalog context. No API-key header is saved.
- `response.json`: verbatim provider response string, extracted answer text, parsed JSON when possible, model version, finish reason, usage and elapsed time.
- `raw.txt`: answer text verbatim, or the provider error response if there is no answer text.
- `error.json`: transport failure information if no response was received.

`complete` means HTTP success, finish reason STOP and parseable answer JSON. It does **not** mean the food IDs, clinical claims or nutritional quality are correct. A malformed or truncated result is retained, and the command exits with failure. No output is saved as a patient plan or sent to a patient.

The requested output contains a patient summary, evidence-linked findings and recommendations, seven days of meals with catalog IDs and serving multiples, cautions, missing information, catalog gaps and professional-review reasons. Food names, Urdu names, nutrient values per serving, cost tiers, allergens and meal eligibility are supplied in the input. Calculated targets come from the existing code. The model is instructed not to invent nutrition totals or new foods. This first step intentionally leaves any hallucinated identifiers visible rather than substituting them.

Change the fictional factors in `backend/src/preview/sample.ts` to explore the response. Keep all values synthetic: Google's [unpaid-service terms](https://ai.google.dev/gemini-api/terms) prohibit submitting sensitive, confidential or personal information. The experiment does not accept live EMR patients or arbitrary patient files.

## Verification

```sh
npm test --prefix sehat-ai/apps/health-advisor/backend
```

Tests check the API transport, raw-response preservation, metadata, quota errors, missing credentials, blocked/truncated output and timeout handling. They use mocked provider responses, not model-quality evaluation. No benchmark harness is added.

Initial verification: build and dry run passed, and all 28 backend tests passed. A live synthetic request reached Google but returned HTTP 403 `PERMISSION_DENIED`: the free tier was unavailable for the configured key's project. No billing was enabled. A successful model response remains unverified; supply a key from a project with free-tier access to continue. Changing models is not a demonstrated fix for a project-level access rejection.
