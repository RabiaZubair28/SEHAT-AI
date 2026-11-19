# Voice Assistant

The voice assistant is split into frontend and backend applications. Shared patient-registration form schemas and visual assets live in the app-level `assets` directory.

## Frontend

- `frontend/src/pages` contains feature screens.
- `frontend/src/components` contains reusable recording and review UI.
- `frontend/src/services` contains backend API calls.
- `frontend/src/utils` contains form mapping and option matching logic.
- `frontend/src/types` contains shared API and form types.
- `frontend/src/styles` contains feature styles.

## Backend

- `backend/app/api` exposes HTTP routes and request schemas.
- `backend/app/services` contains transcription, extraction, interpretation, and schema loading.
- `backend/app/models` and `backend/app/contracts` contain data models and service contracts.
- `assets/schemas` contains JSON form definitions loaded by the schema service.

The EMR imports the frontend through `frontend/src/index.ts` and owns form state and persistence.
