# PixelFit engineering notes

- Keep every image operation client-only. Never add an upload API, persistence, or telemetry containing file-derived data.
- Preset policy is enforced in `src/lib/presets`; official-photo operations must remain allowlisted.
- Do not claim approval, identity verification, background preservation, or metadata preservation beyond what code verifies.
- Keep Korean user-facing copy centralized where practical in `src/config`.
- Run `pnpm check` and the relevant Playwright tests after changes.
- Record real verification results and limitations in `docs/STATUS.md`; unavailable checks are `NOT_TESTED`.
- Keep `ADSENSE_ENABLED` off by default. Never render an ad script or slot from incomplete IDs, and never place ads beside upload, editor, preview, result, download, navigation, privacy, terms, or contact controls.
- Verify both deployment contracts before release: GitHub project Pages at `/pixelfit` and a root-path custom-domain test build. A successful test build is not proof that DNS, HTTPS, Pages domain settings, Search Console, Naver, AdSense, or CMP setup is complete.
- Do not add placeholder `.example` contact details, fabricated operators, review counts, ratings, usage counts, dates, or metadata preservation claims.
- Keep canonical, Open Graph, sitemap, JSON-LD, breadcrumbs and static assets on the shared URL helpers and the same trailing-slash contract.
- User images may move between tools only through explicit, current-tab React memory. Never use localStorage, sessionStorage, IndexedDB, Cache Storage, analytics payloads, or external image APIs.
- Do not change Search Console properties, ownership records, sitemap submissions, indexing requests, DNS, custom-domain account settings, or advertising account state from repository work.
