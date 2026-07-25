# driveiq-ui

DriveIQ frontend — React + Vite + Tailwind, served at `driveiq.ry-ops.dev` via
Cloudflare Pages. Talks to [`driveiq-cloud`](https://github.com/fabric-forge/driveiq-cloud)
(`driveiq-api.ry-ops.dev`) for all data. See that repo's `MIGRATION_PLAN.md`
for full context and phase breakdown.

## Phase 1 (current)

Vehicle overview + mileage update, maintenance history list, active
reminders with one-click complete. No auth UI — Cloudflare Access gates this
at the edge.

## Development

```bash
cp .env.example .env
npm install
npm run dev   # http://localhost:4302, proxies /api to the local Worker on :8792
```

Run `driveiq-cloud`'s `npm run dev` (wrangler dev on :8792) alongside this.

## Deploy

Deploys via GitHub Actions on push to `main`
(`.github/workflows/deploy.yml`), building with Vite and pushing to
Cloudflare Pages (`cloudflare/pages-action`). Requires a
`CLOUDFLARE_API_TOKEN` repo secret and a `driveiq-ui` Pages project to exist
in the Cloudflare account.
