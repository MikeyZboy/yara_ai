# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a **Return Tracker** mobile app built with Expo, and a shared Express API server.

## Apps

### Return Tracker (Expo Mobile App)
- **Path**: `artifacts/return-tracker/`
- **Purpose**: Tracks purchases and monitors return/exchange deadlines. Uses AI to automatically look up return policies for merchants.
- **Storage**: AsyncStorage (local persistence on device)
- **Tabs**: Returns (purchase list), Alerts (deadline alerts), Accounts (connected accounts)
- **Screens**: Home, Alerts, Accounts, Add Purchase, Purchase Detail

### API Server (Express)
- **Path**: `artifacts/api-server/`
- **Routes**:
  - `GET /api/healthz` — health check
  - `POST /api/policies/parse` — AI-powered return policy lookup (OpenAI)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile framework**: Expo (React Native)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (available but not yet used)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for policy parsing)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI proxy base URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy API key

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
