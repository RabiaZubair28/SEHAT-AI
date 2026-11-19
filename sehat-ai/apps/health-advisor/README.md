# Health Advisor

For the LLM-powered findings, recommendations, diet plan and PDF flow, see [Setup](SETUP.md). Add your server-side key to this feature's backend `.env`.

Start with the isolated [raw LLM preview](LLM-PREVIEW.md) to inspect model output using a synthetic patient and the full Pakistani food catalog, without repair or fallback.

See [AI integration](AI-INTEGRATION.md) for factor handling, backend configuration, validation, tests and current limitations.

Health Advisor is organized as a feature module embedded in EMR. EMR owns authentication, patient and encounter context, persistence, review authorization, and delivery. This app owns nutrition assessment rules, food data, meal planning, AI drafting, and the Advisor UI.

## Structure

- `frontend/src/pages` contains the EMR-hosted Advisor and review screens.
- `frontend/src/components` contains reusable UI pieces.
- `frontend/src/services` contains PDF generation and external integrations.
- `frontend/src/utils` contains pure formatting and client-side validation.
- `frontend/src/types` contains API and view models.
- `backend/src/modules/nutrition-advisor/assessment` contains clinical assessment and targets.
- `backend/src/modules/nutrition-advisor/foods` contains food composition data by group.
- `backend/src/modules/nutrition-advisor/meal-planning` contains safety rules, planning, and validation.
- `backend/src/modules/nutrition-advisor/services` contains AI plan proposal and model integration.
- `backend/src/modules/nutrition-advisor/models` contains domain types.
- `Assets/food-pics` contains food imagery; the frontend bundles images from this shared app asset folder.

## File rules

Keep source modules focused on one responsibility and at most 100 lines. Split by domain or UI responsibility, then export through a feature-level `index.ts`. Keep only application entry points and root configuration files exempt from the line limit.

The feature is exported through `frontend/src/index.ts`. EMR supplies the authenticated API hooks and patient context through the host integration. The backend module is consumed by EMR's Nutrition Advisor service; it does not open its own patient database connection.
