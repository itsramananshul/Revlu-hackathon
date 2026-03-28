# TrialPulse

AI-powered clinical trial monitoring platform. Patients submit voice check-ins, AI analyzes transcripts into structured clinical insights, and researchers view alerts, patient status, and risk trends in a dashboard.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start backend (port 4000)
npm run dev:api

# Start frontend (port 3000)
npm run dev:web
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key. Mock mode when missing. |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key. Mock mode when missing. |
| `API_PORT` | No | Backend port (default: 4000) |
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: http://localhost:4000/api) |

## Architecture

Modular monolith monorepo:

- `apps/web` — Next.js frontend (App Router, Tailwind CSS)
- `apps/api` — Express backend with module-based architecture
- `packages/types` — Shared TypeScript types
- `packages/config` — Shared configuration constants
- `docs/` — Architecture docs, API contracts, demo flow

## Mock Mode

The app runs fully in mock mode without any API keys. Demo data is preloaded with sample patients, check-ins, and alerts.
