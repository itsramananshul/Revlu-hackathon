# TrialPulse Architecture

## Overview

TrialPulse is a modular monolith monorepo for AI-powered clinical trial monitoring.

## Monorepo Structure

```
trialpulse/
├── apps/
│   ├── web/         → Next.js frontend (App Router, Tailwind CSS)
│   └── api/         → Express backend (modular monolith)
├── packages/
│   ├── types/       → Shared TypeScript types
│   └── config/      → Shared constants and configuration
└── docs/            → Documentation
```

## Backend Architecture

The backend follows a **modular monolith** pattern with layered modules:

```
apps/api/src/
├── modules/
│   ├── patients/    → Patient management
│   ├── checkins/    → Voice check-in submission and storage
│   ├── ai/          → AI provider abstraction (Gemini + ElevenLabs)
│   ├── alerts/      → Clinical alert management
│   └── analytics/   → Risk trends and metrics
├── shared/
│   ├── errors/      → Custom error classes
│   ├── middleware/   → Express middleware
│   └── utils/       → Response envelope helpers
├── data/
│   └── seed.ts      → Demo seed data
├── app.ts           → Express app configuration
└── server.ts        → Entry point
```

### Module Layer Convention

Each module follows:
- `*.types.ts`      → Module-specific types and DTOs
- `*.repository.ts` → Data access (in-memory, swappable for real DB)
- `*.service.ts`    → Business logic
- `*.controller.ts` → Express request handlers
- `*.routes.ts`     → Express router

### Provider Abstraction

AI providers use interface-based abstraction:

- `AiProvider` interface → `GeminiProvider` / `MockAiProvider`
- `TtsProvider` interface → `ElevenLabsProvider` / `MockTtsProvider`

The service layer auto-selects mock providers when API keys are missing.

## Frontend Architecture

```
apps/web/
├── app/
│   ├── page.tsx               → Dashboard
│   ├── checkin/page.tsx       → Voice check-in flow
│   └── patient/[id]/page.tsx  → Patient detail + analysis
├── components/                → Reusable UI components
└── lib/
    └── api.ts                 → API client
```

## API Response Envelope

All API responses follow:

```json
{
  "success": boolean,
  "message": string,
  "data": ...
}
```

## Data Flow

1. Patient submits voice check-in (audio/transcript)
2. Backend receives transcript via `/api/checkins`
3. AI module analyzes transcript via Gemini (or mock)
4. Analysis generates alerts based on risk thresholds
5. Dashboard displays patient status, alerts, and trends
6. Optional: ElevenLabs generates spoken summary
