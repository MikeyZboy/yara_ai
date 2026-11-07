# Yara deployment runbook

How Yara runs in production, and what to do when something needs changing.

## Where everything lives

| Piece | Where | Notes |
|---|---|---|
| Code | GitHub `MikeyZboy/yara_ai` | `launch` is the release branch until it's merged to `main` |
| Policy API (`artifacts/api-server`) | Railway | Deploys automatically on every push to the deployed branch |
| AI | OpenAI API, your own account | Monthly budget cap set in the OpenAI dashboard |
| Mobile app (`artifacts/return-tracker`) | Expo EAS → App Store / Google Play | Set up in the EAS step of the launch plan |
| Database | None yet | When needed: add Postgres in Railway; `lib/db` (Drizzle) is ready |

Replit is no longer required for anything.

## Railway service settings

Project → service → **Settings**:

| Setting | Value |
|---|---|
| Source repo / branch | `MikeyZboy/yara_ai` / `launch` |
| Root directory | *(leave empty: the build needs the whole workspace)* |
| Custom build command | `pnpm --filter @workspace/api-server run build` |
| Custom start command | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| Healthcheck path | `/api/healthz` |
| Watch paths *(optional)* | `/artifacts/api-server/**`, `/lib/**`, `/pnpm-lock.yaml` |
| Networking | Generate a public domain |

Railway reads the Node version (24) and pnpm version from the root `package.json` and installs dependencies itself.

### Variables

| Name | Required | Value |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI key (`sk-...`) |
| `NODE_ENV` | Yes | `production` |
| `OPENAI_MODEL` | No | Defaults to `gpt-5-mini` |
| `ALLOWED_ORIGINS` | No | Comma-separated web origins allowed to call the API. Leave empty: the mobile app doesn't need it |

Railway sets `PORT` itself.

## What the API protects against

- **Abuse:** 20 lookups per IP per 10 minutes (HTTP 429 after that). In-memory, so it resets on redeploy.
- **Bad input:** merchant names over 80 characters and request bodies over 10 KB are rejected.
- **Bad AI answers:** every answer is checked against the response schema; return windows must be whole days between 0 and 730. Failures return HTTP 502 and the app falls back to a 30-day window.
- **Slow AI:** 15-second timeout on the server, 20 seconds in the app.
- **Cost:** identical lookups are cached for 24 hours (response header `X-Cache: HIT`).
- **Browser misuse:** only origins in `ALLOWED_ORIGINS` can call it from a web page.

## Checking it's healthy

```bash
curl https://YOUR-RAILWAY-DOMAIN/api/healthz
# {"status":"ok"}

curl -X POST https://YOUR-RAILWAY-DOMAIN/api/policies/parse \
  -H 'content-type: application/json' -d '{"merchant":"Target"}'
```

Logs: Railway → service → **Deployments** → latest → **View logs**.

## Common tasks

**Deploy a change:** push to the deployed branch. Railway builds and runs the health check; if it fails, the previous version keeps serving.

**Roll back:** Railway → Deployments → pick a previous deployment → **Redeploy**.

**Rotate the OpenAI key:** create a new key in OpenAI → update `OPENAI_API_KEY` in Railway (it redeploys automatically) → delete the old key in OpenAI.

**AI costs spiking:** check Railway logs for one IP hammering the API; lower the limit in `artifacts/api-server/src/routes/policies.ts`; your OpenAI budget cap is the backstop.

## Running locally (Mac)

```bash
corepack enable            # one time: provides the pinned pnpm version
pnpm install

# API
cp artifacts/api-server/.env.example artifacts/api-server/.env   # then add your key
cd artifacts/api-server && pnpm run build && set -a && . ./.env && set +a && pnpm run start

# App (separate terminal), pointed at the local API
cp artifacts/return-tracker/.env.example artifacts/return-tracker/.env
cd artifacts/return-tracker && pnpm exec expo start
```

The repo expects Node 24 (`brew install node@24` or `nvm install 24`). Node 22 works but prints an engine warning.
