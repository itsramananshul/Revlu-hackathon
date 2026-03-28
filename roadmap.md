# VoxVitals Roadmap

## 1. Current State Audit

### DONE (working, do not break)
- Next.js 15 App Router with full route structure (16 API routes)
- Dashboard page: patient cards, stat cards (total patients, active alerts, compliance rate, check-ins), alerts panel, loading skeletons, error/empty states
- Voice check-in page: patient selector, simulated recording, transcript textarea, audio file upload to Supabase Storage, AI analysis display with symptoms/risk/adverse events
- AI service with provider pattern: mock provider returns realistic data, Gemini provider coded, ElevenLabs TTS provider coded
- Supabase Auth: login, signup, signout, middleware route protection, auth callback
- Patient detail page: analysis display, alerts, check-in history
- Responsive sidebar with mobile hamburger menu
- Toast notifications via Sonner
- Database schema SQL (`apps/web/supabase/schema.sql`) and seed data (`apps/web/supabase/seed.sql`)
- Type system in `packages/types` shared across the monorepo
- API utility layer (`lib/api.ts`) with typed client-side fetch wrapper
- DB mappers (`lib/db-mappers.ts`) for snake_case DB rows to camelCase app types

### PARTIAL (coded but not verified end-to-end)
- Supabase connection: `.env.local` configured but never tested with real queries
- Check-in submission: calls `api.analyzeTranscript()` and `api.createCheckIn()` separately, but analysis result is NOT saved to `ai_analyses` table and NOT linked to the check-in record
- AI analysis via Gemini: provider code exists (`lib/ai/providers/gemini.provider.ts`) but no `GEMINI_API_KEY` set, untested
- ElevenLabs TTS: provider exists, speech API route exists (`/api/ai/speech`), no `ELEVENLABS_API_KEY` set
- Analytics summary route (`/api/analytics/summary`): queries DB but never tested against real Supabase data
- Audio file upload to Supabase Storage: code exists in checkin page, bucket "checkin-audio" may not exist yet

### MISSING (not implemented at all)
- Saving AI analysis results: after `analyzeTranscript()` returns, the result is displayed client-side but never POSTed to an endpoint that inserts into `ai_analyses`
- Auto-alert generation: no code creates alerts when AI flags adverse events or high dropout risk
- End-to-end flow wiring: check-in -> analyze -> save analysis -> generate alerts -> update patient risk status
- Real audio recording: `handleRecord()` is fake -- sets a hardcoded transcript string on stop
- Real-time dashboard updates: no polling, no Supabase realtime subscriptions
- Data visualization: no charts or trend graphs (symptom trends mentioned in UI but not rendered as charts)
- Patient risk status auto-update: no code updates patient `status` field based on AI analysis results

### BUG-PRONE
- Check-in page fires `api.analyzeTranscript()` and `api.createCheckIn()` as separate calls with no transactional linking -- if one fails the other still runs
- The `createCheckIn` API client call does not include `audioUrl` in the type signature (type says `{ patientId: string; transcript: string }` but the route handler accepts `audioUrl`)
- AI analyze route (`/api/ai/analyze`) returns analysis but does not accept `checkInId` or `patientId` -- no way to associate the result with a record
- Mock AI provider always returns the same hardcoded response regardless of transcript content -- fine for structure testing but will look fake in demo if Gemini key is missing

---

## 2. Core Demo Goals

The demo must show this flow working end-to-end, visually and reliably:

1. Clinician selects a patient and provides a voice transcript (typed, pasted, or simulated recording)
2. AI analyzes the transcript and returns structured results (symptoms, risk scores, adverse events)
3. Analysis results are displayed immediately on the check-in page
4. If adverse event or high dropout risk is detected, an alert is auto-created
5. Dashboard reflects the new check-in, updated patient status, and any new alerts
6. A judge can see at a glance: which patients are at risk, what the AI found, and what action is recommended

Everything else is secondary.

---

## 3. Phase Plan

### Phase 1: Stability (wire the end-to-end flow)
**Goal:** Check-in submission triggers analysis, saves results, generates alerts, updates dashboard.

| Task | Files | Expected Output | Verification |
|------|-------|-----------------|--------------|
| Create API endpoint to save AI analysis | New: `app/api/analyses/route.ts` | POST accepts `checkInId`, `patientId`, analysis data; inserts into `ai_analyses` table | POST with test data, verify row in Supabase `ai_analyses` table |
| Create API endpoint for auto-alert generation | New: `app/api/alerts/generate/route.ts` or extend existing alerts POST | Accepts analysis result, creates alert if `adverseEvent: true` or `dropoutRisk > 0.7` | Submit high-risk analysis, verify alert appears in `alerts` table |
| Wire check-in page to save analysis + generate alerts | `app/(app)/checkin/page.tsx` | After `analyzeTranscript()`, POST analysis to save endpoint, then POST to alert generation | Submit check-in, verify: check-in in DB, analysis in DB, alert in DB (if high risk) |
| Update patient status based on analysis | Extend analysis save or alert generation endpoint | Set patient status to "flagged" or "critical" when dropout risk > 0.7 or adverse event detected | Check `patients` table after high-risk check-in |
| Test Supabase connection end-to-end | `.env.local`, run `npm run dev` | Login works, dashboard loads seed data, API routes return real data | Manual: login, see patients, see alerts |
| Verify Supabase Storage bucket exists | Supabase dashboard | "checkin-audio" bucket exists and accepts uploads | Upload audio file via check-in page |

### Phase 2: UX Polish (clean, clear, demo-ready)
**Goal:** Every screen looks intentional and professional. No broken states visible during demo.

| Task | Files | Expected Output | Verification |
|------|-------|-----------------|--------------|
| Add loading/analyzing animation to check-in flow | `app/(app)/checkin/page.tsx` | Smooth transition: "Analyzing..." spinner -> results appear with slight delay for dramatic effect | Visual: submit check-in, see clean transition |
| Dashboard auto-refresh after check-in | `app/(app)/page.tsx` | Dashboard reloads data when navigated to (or add 30s polling) | Submit check-in, navigate to dashboard, see updated data |
| Make alert panel on dashboard show new alerts prominently | `app/(app)/page.tsx` | New critical alerts have red accent, pulse animation or "NEW" badge | Create high-risk check-in, see alert appear red on dashboard |
| Clean up any TypeScript errors or console warnings | All files | Zero console errors during demo flow | Open dev tools, run full demo flow, check console |
| Ensure empty states display well | Components | "No alerts" shows clean message, not blank space | View dashboard with no alerts |

### Phase 3: Demo Impact (WOW moments)
**Goal:** Three moments that make judges pause and pay attention.

| Task | Files | Expected Output | Verification |
|------|-------|-----------------|--------------|
| Instant AI insight reveal: animate analysis results appearing section by section | `app/(app)/checkin/page.tsx` | After analysis, summary fades in first, then symptoms, then risk bar fills, then adverse event flag appears | Visual: feels like AI is "thinking and revealing" |
| Critical alert red flash on dashboard | Dashboard components | When a critical alert exists, the alert card has a subtle red pulse or glow | Create adverse event check-in, check dashboard |
| Add a simple trend indicator to patient cards | `app/(app)/page.tsx` or patient card component | Small up/down arrow or "risk increasing" text based on latest analysis | Check patient card after multiple check-ins |

### Phase 4: Optional Stretch (only if time)
| Task | Notes |
|------|-------|
| Real audio recording via MediaRecorder API | Replace simulated recording with actual browser mic capture; transcript still needs to come from somewhere (manual input or a speech-to-text API) |
| ElevenLabs TTS playback of AI summary | If API key is available, add "Listen to Summary" button that plays spoken version |
| Supabase Realtime subscription on dashboard | Live updates without page refresh |
| Simple bar chart for symptom frequency | Use a lightweight chart library (recharts or chart.js) |

---

## 4. DO NOT TOUCH List

These are good enough. Do not refactor, redesign, or "improve" them:

- Sidebar navigation and responsive layout
- Auth flow (login/signup/signout/middleware) -- it works
- API route structure and naming conventions
- Type system in `packages/types`
- Database schema -- it covers what is needed
- Tailwind design system and existing component styles
- Loading skeletons and error state components
- The mock AI provider -- keep it as fallback
- Monorepo structure (`apps/web`, `packages/types`, `packages/config`)
- Toast notification setup

---

## 5. Risks & Constraints

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase connection fails (wrong URL, missing keys, RLS policies block queries) | Nothing works -- dashboard empty, check-ins fail | Test connection FIRST before any feature work. Check RLS policies allow authenticated user access. Have seed data ready. |
| Gemini API latency > 5 seconds | Demo feels slow, awkward pause during check-in | Keep mock provider as instant fallback. If Gemini is set up, test response time. Consider showing a "thinking" animation. |
| Gemini API returns malformed JSON | Analysis display crashes or shows blank | Add try/catch with fallback to mock response. Validate response shape before using. |
| No GEMINI_API_KEY available | AI analysis is fake (mock provider) | Mock provider returns realistic-looking data. Mention in demo: "connected to Gemini 2.0 Flash" but show the mock gracefully. |
| Audio recording fails (browser permissions, no HTTPS) | Can't demo voice input | Transcript textarea is the reliable fallback. Lead demo with "patient speaks, transcript captured" and paste/type. |
| Supabase Storage bucket missing | Audio upload errors on check-in | Create bucket manually in Supabase dashboard before demo. Or skip audio upload in demo. |
| Auth session expires during demo | Redirected to login mid-demo | Login fresh right before demo. Set long session duration in Supabase auth settings. |
| Database has no data | Dashboard looks empty and unimpressive | Run seed SQL before demo. Or create 2-3 check-ins manually during demo setup. |

---

## 6. Definition of "Hackathon Ready"

Concrete checklist -- every item must be YES before demo:

- [ ] `npm run dev` starts without errors
- [ ] Login with test credentials works
- [ ] Dashboard loads and shows patient cards with data
- [ ] Dashboard shows stat cards with non-zero numbers
- [ ] Navigate to Voice Check-in page without errors
- [ ] Select a patient from dropdown (patients load from DB)
- [ ] Enter/paste a transcript and click "Submit & Analyze"
- [ ] AI analysis results appear on screen (summary, symptoms, risk, adverse event flag)
- [ ] Analysis is saved to `ai_analyses` table in Supabase
- [ ] If adverse event or high risk detected, alert auto-created in `alerts` table
- [ ] Navigate to dashboard -- new alert visible in alerts panel
- [ ] Patient detail page shows the check-in and analysis
- [ ] No console errors during the entire flow
- [ ] Demo can be completed in under 3 minutes
- [ ] Fallback works: if Gemini key missing, mock provider returns data and demo still looks good
- [ ] At least one "wow moment" is visible (instant AI insight, red alert appearance, or risk visualization)
