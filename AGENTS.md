# PixelFit engineering notes

- Keep every image operation client-only. Never add an upload API, persistence, or telemetry containing file-derived data.
- Preset policy is enforced in `src/lib/presets`; official-photo operations must remain allowlisted.
- Do not claim approval, identity verification, background preservation, or metadata preservation beyond what code verifies.
- Keep Korean user-facing copy centralized where practical in `src/config`.
- Run `pnpm check` and the relevant Playwright tests after changes.
- Record real verification results and limitations in `docs/STATUS.md`; unavailable checks are `NOT_TESTED`.
