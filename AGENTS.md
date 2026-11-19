# Project boundaries

- Keep Sehat AI feature implementation in `sehat-ai/`, including Health Advisor and Voice Assistant model clients, prompts, clinical rules, validation, evaluation, and feature UI.
- Treat `emr-frontend/` and `emr-backend/` as production host applications. Make the smallest necessary integration changes only: authorization/context adapters, route or module wiring, feature mounting, and configuration hooks.
- Do not refactor unrelated EMR code, change its database schema, or add feature logic there to implement Sehat AI functionality.
- Prefer the existing feature-module integration over adding a separate service or another deployment unless a concrete requirement warrants it.
- Prioritize free usage for this semester's prototype. Do not enable paid services or automatic paid-provider fallback.
- Keep model choice configurable. Compare candidates using synthetic cases and the same deterministic validation before claiming one is better for this application.
