# Return Tracker

Return Tracker is a mobile app built with Expo and React Native that helps users track purchases, monitor return windows, and get alerts before deadlines.

## Features

- Track purchases and return/exchange deadlines
- View alerts for upcoming return cutoff dates
- Manage account-related app settings
- Use AI-assisted merchant return policy lookup

## Project Structure

- Mobile app: `artifacts/return-tracker`
- API server: `artifacts/api-server`
- Shared libraries: `lib/*`

## Tech Stack

- Expo + React Native
- TypeScript
- React Query
- AsyncStorage for local persistence
- Express API for policy parsing

## Prerequisites

- Node.js 24+
- pnpm 9+

## Getting Started

Install dependencies from the repository root:

```bash
pnpm install
```

Run the mobile app:

```bash
pnpm --filter @workspace/return-tracker run dev
```

Run the API server:

```bash
pnpm --filter @workspace/api-server run dev
```

## Useful Commands

- `pnpm run typecheck` - Type-check workspace packages
- `pnpm run build` - Type-check and build all packages
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API client/types

## Environment Variables

The API policy parsing flow expects these variables:

- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`

## License

This project is licensed under the MIT License. See `LICENSE` for details.
