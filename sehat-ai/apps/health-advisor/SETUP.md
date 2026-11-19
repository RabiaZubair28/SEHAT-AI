# Set up the LLM-powered Advisor screens

## What to configure

Edit `sehat-ai/apps/health-advisor/backend/.env`. Keep your key private; do not put it in a frontend file or paste it into chat.

```dotenv
HEALTH_ADVISOR_PROVIDER=groq
GROQ_API_KEY=replace_with_your_groq_key
HEALTH_ADVISOR_MODEL=openai/gpt-oss-120b
HEALTH_ADVISOR_TIMEOUT_MS=120000
```

The `.env` file already exists in this workspace. Set its `GROQ_API_KEY` value; do not overwrite other settings. The `.env.example` documents the new settings. `HEALTH_ADVISOR_PROVIDER` explicitly selects `groq` or `gemini`; `HEALTH_ADVISOR_MODEL` selects the model for the actual Advisor screens; the older `NUTRITION_ADVISOR_MODEL` and `HEALTH_ADVISOR_PREVIEW_MODEL` settings are not used by this new screen flow.

Use a provider account/key with access to the selected model. Groq keys are created at https://console.groq.com/keys. Remain on the Free tier for this prototype. For a strict free prototype, use synthetic patients with a project that has unpaid-tier access. The currently configured project's previous synthetic call returned HTTP 403 because free-tier access was unavailable. A new key from the same project may have the same limitation. The application does not enable billing, verify billing status, or switch to a paid provider. Google’s [unpaid-service terms](https://ai.google.dev/gemini-api/terms) prohibit sending sensitive, confidential or personal information; real-patient use needs an appropriate data-processing arrangement.

No frontend key, new database tables, migrations, routes or permissions are needed. The feature reads its `.env` on each generation request, without modifying the host environment. It resolves this file from the feature's backend directory or from the standard workspace/EMR-backend working directories. Deployed builds without the source tree can instead supply the same server-side environment variables. Never ship `.env` in frontend assets.

## Run and use

Restart your normal EMR backend and frontend development servers to load the implementation changes. The key itself is read at request time.

1. Open the patient's existing Nutrition Advisor tab.
2. Enter allergies, conditions, diet, budget, activity and food preferences.
3. Click **Generate Advice and Continue**. The existing authenticated plan-generation endpoint loads the authorized encounter and sends the entered preferences, measurements, labs, conditions, computed targets and all 43 catalog foods to the LLM.
4. On success, the overview shows the returned findings and recommendations with the model name. Continue to the meal editor and PDF preview; they read the same saved model-generated draft.
5. Changing the entered preferences and generating again creates a new draft. Older rule-only plans are not presented as new LLM results in this flow.

The model supplies findings, recommendations, seven days of catalog food IDs and portions, activity guidance and English/Urdu handout text. Food labels/images and nutrient totals come from the local dataset; targets remain computed by the existing formulas. Existing population eligibility checks, reviewer approval and delivery controls remain in place.

There is no deterministic meal repair, clinical scoring, retry or rule-based fallback in this generation path. Basic JSON/shape checks prevent unreadable responses or unknown food IDs from breaking the existing screens; invalid output is an error, not a substitute plan. The existing review/edit warnings are still calculated from the dataset. This is not a clinical validation of the output.

The entered values drive the actual request; the synthetic fixture used by the separate command-line preview is not used here. Names, phone numbers, MR numbers and encounter IDs are not sent in the request. Free-text notes and clinical context can still be sensitive.

Model output and model/version, usage and elapsed-time metadata are saved with the existing draft snapshot. PDF advice uses the snapshot's recommendations and handout text, rather than regenerating rule advice. No API key is included in the snapshot.

## Failures

Errors appear inline and in the notification. HTTP 401 means an invalid or expired key; HTTP 403 means project/key access needs checking; HTTP 413 means the request exceeds the provider token limit; HTTP 429 means quota exhaustion; missing credentials show the configuration path. Failed generation does not create or supersede a plan, and no rule-based content is silently shown instead. A live Groq call using only synthetic inputs succeeded on November 11, 2026: 9 model findings, 5 recommendations, 7 days, approximately 11.5 seconds. The response was saved under `backend/preview-results/`. This confirms API/response integration, not clinical quality or browser behavior.

## Checks

```sh
npm test --prefix sehat-ai/apps/health-advisor/backend
npm run build --prefix sehat-ai/apps/health-advisor/backend
npm run build --prefix emr-backend
npm run typecheck --prefix emr-frontend
```

The new tests use mocked provider calls to verify entered values/catalog input, exact model content propagation, provider failure handling and invalid responses. Add your working key to test actual model output in the UI.


## Groq request details

The same patient context, prompt and response shape are used for both providers. Groq uses `openai/gpt-oss-120b` with JSON Schema structured output; this is a Groq-hosted open-weight model, not a separate OpenAI API subscription. The adapter encodes all 43 catalog foods as rows with explicit column names to reduce repeated keys while preserving supplied food and nutrient values. It does not filter foods, repair results, score advice or add a clinical harness. No other provider is automatically called after failure.

Provider documentation: [structured outputs](https://console.groq.com/docs/structured-outputs), [free limits](https://console.groq.com/docs/rate-limits). Actual account quotas apply; no billing was enabled by this change. Use synthetic cases for prototype verification and establish suitable data-processing terms before sending actual patient records to a hosted provider.

To make one synthetic call through the same service used by the UI:

```sh
npm run verify:advisor --prefix sehat-ai/apps/health-advisor/backend
```

The script makes one request and saves the unmodified model text, parsed draft and provider metadata locally. Transport errors are reported without a replacement plan. The existing standalone `preview` command is Gemini-specific; use `verify:advisor` for the selected provider.

Gemini support remains available by explicitly setting `HEALTH_ADVISOR_PROVIDER=gemini`, `HEALTH_ADVISOR_MODEL=gemini-3.8-flash`, and `GEMINI_API_KEY`. Its earlier project-access failure is independent of Groq.
