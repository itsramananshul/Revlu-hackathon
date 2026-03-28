# VoxVitals Next Steps

## Execution Order

Work through these tasks in the order listed. Do not skip ahead -- each task builds on the previous one.

---

## Immediate Tasks (next 2-4 hours)

### Task 1: Test Supabase Connection End-to-End
**Priority:** [CRITICAL]
**Why first:** Nothing else matters if the database connection does not work.

**Steps:**
1. Run `npm run dev` from the project root
2. Open `http://localhost:3000` -- should redirect to login
3. Sign up or log in with test credentials
4. Dashboard should load and display seed data (patients, stats, alerts)
5. If dashboard is empty: run `apps/web/supabase/seed.sql` against your Supabase database
6. Check browser console for errors (especially Supabase auth or fetch failures)
7. Test the health endpoint: `GET /api/health`

**If it fails:**
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check Supabase dashboard: is the project active? Are tables created from `schema.sql`?
- Check RLS policies: authenticated users must be able to SELECT/INSERT on all tables
- Check that `supabase/schema.sql` has been executed in the Supabase SQL editor

**Done when:** Login works, dashboard shows patients and stats from the database, no auth errors in console.

---

### Task 2: Create API Endpoint to Save AI Analysis Results
**Priority:** [CRITICAL]
**Why:** Currently, AI analysis results are returned to the client and displayed but never persisted. The `ai_analyses` table exists but nothing writes to it.

**Files to create/modify:**
- New: `apps/web/app/api/analyses/route.ts`

**What the endpoint does:**
- `POST /api/analyses` accepts `{ checkInId, patientId, summary, symptoms, dropoutRisk, adverseEvent, medicationAdherenceRisk, recommendedAction, sentimentScore, confidenceScore }`
- Inserts a row into `ai_analyses` table
- Returns the created analysis record

**Verification:**
1. Use the app or curl to POST analysis data
2. Check `ai_analyses` table in Supabase -- row exists with correct `check_in_id`
3. Check that the patient detail page (`/patient/[id]`) shows the analysis for the check-in

**Done when:** Analysis data is saved to the database and retrievable via existing GET endpoints.

---

### Task 3: Create Auto-Alert Generation from AI Analysis
**Priority:** [CRITICAL]
**Why:** The demo needs alerts to appear automatically when AI flags risk. Currently, alerts only exist as seed data.

**Files to create/modify:**
- New: `apps/web/app/api/alerts/generate/route.ts` OR add logic to the analysis save endpoint from Task 2

**Alert generation rules:**
- If `adverseEvent === true`: create alert with severity "critical", type "adverse_event"
- If `dropoutRisk > 0.7`: create alert with severity "high", type "dropout_risk"
- If `medicationAdherenceRisk === "high"`: create alert with severity "medium", type "medication_adherence"
- Alert message should include the patient name and a description of what was flagged

**Verification:**
1. Submit a check-in with a concerning transcript (adverse event language)
2. Check `alerts` table -- new alert row exists
3. Navigate to dashboard -- new alert appears in the alerts panel

**Done when:** High-risk check-ins automatically produce alerts visible on the dashboard.

---

### Task 4: Wire Check-in Page to Save Analysis + Generate Alerts
**Priority:** [CRITICAL]
**Why:** This connects all the pieces. The check-in page currently calls `analyzeTranscript()` and `createCheckIn()` but does not save the analysis or trigger alert generation.

**File:** `apps/web/app/(app)/checkin/page.tsx`

**Current flow (broken):**
```
analyzeTranscript(transcript) -> display results
createCheckIn({ patientId, transcript }) -> save check-in
(analysis results are lost, no alerts generated)
```

**Target flow:**
```
1. createCheckIn({ patientId, transcript }) -> get checkInId
2. analyzeTranscript(transcript) -> get analysis results
3. POST /api/analyses with { checkInId, patientId, ...analysisResults } -> save analysis
4. POST /api/alerts/generate with { patientId, analysisResults, checkInId } -> auto-create alerts if needed
5. Display analysis results to user
```

**Also update:** `apps/web/lib/api.ts` -- add `saveAnalysis()` and `generateAlerts()` functions to the API client.

**Verification:**
1. Go to Voice Check-in page
2. Select a patient, enter a concerning transcript, click Submit & Analyze
3. See analysis results on screen
4. Check Supabase: `check_ins` has new row, `ai_analyses` has new row linked to it, `alerts` has new row if high risk
5. Navigate to dashboard: alert visible, patient data updated

**Done when:** Single click on "Submit & Analyze" triggers the full pipeline and everything is persisted.

---

### Task 5: Update Patient Status Based on Analysis
**Priority:** [IMPORTANT]
**Why:** Dashboard patient cards show status (active, flagged, critical). This should auto-update when AI flags risk.

**File:** Add to the analysis save endpoint or alert generation endpoint from Tasks 2-3

**Logic:**
- After saving analysis, if `adverseEvent === true` or `dropoutRisk > 0.7`: update patient status to "critical"
- If `dropoutRisk > 0.4` and status is "active": update to "flagged"
- This makes the dashboard patient cards reflect real risk levels

**Verification:**
1. Submit a high-risk check-in for a patient
2. Navigate to dashboard
3. Patient card shows "Critical" or "Flagged" status badge instead of "Active"

**Done when:** Patient cards on dashboard reflect AI-detected risk status.

---

### Task 6: Dashboard Data Refresh
**Priority:** [IMPORTANT]
**Why:** After submitting a check-in, navigating to the dashboard should show fresh data including new alerts and updated patient status.

**File:** `apps/web/app/(app)/page.tsx`

**Options (pick simplest):**
- Add `router.refresh()` or re-fetch data when the page mounts (already does this via `useEffect`)
- Verify the existing `load()` function runs on every navigation to the dashboard page
- If data is stale, add a refetch on `window.focus` or use `useEffect` with no dependency caching

**Verification:**
1. Submit a check-in on the check-in page
2. Click "Dashboard" in sidebar
3. New data (alert, updated patient) is visible without manual refresh

**Done when:** Dashboard always shows current data when navigated to.

---

### Task 7: Clean Console Errors and Warnings
**Priority:** [IMPORTANT]
**Why:** During demo, if dev tools are accidentally opened or visible, console errors look bad.

**Steps:**
1. Run `npm run dev`
2. Open browser dev tools console
3. Navigate through entire demo flow: login -> dashboard -> check-in -> submit -> dashboard -> patient detail
4. Note and fix any errors or warnings
5. Common issues: missing keys in lists, hydration mismatches, unhandled promise rejections, deprecated API usage

**Done when:** Full demo flow produces zero console errors.

---

## Polish Tasks (next 2-4 hours after core is done)

### Task 8: Animated Analysis Reveal
**Priority:** [NICE-TO-HAVE]
**Why:** Makes the "AI analyzing" moment more impressive.

**File:** `apps/web/app/(app)/checkin/page.tsx`

**What to do:**
- After analysis returns, show results with staggered fade-in (CSS transitions or framer-motion if already installed)
- Summary appears first (0ms delay), symptoms (200ms), risk bar (400ms), adverse event flag (600ms)
- The dropout risk bar should animate from 0% to its actual value

**Done when:** Analysis results appear with a smooth, staggered reveal animation.

---

### Task 9: Critical Alert Styling on Dashboard
**Priority:** [NICE-TO-HAVE]
**Why:** Red critical alerts should be visually impossible to miss.

**File:** Dashboard page or alert card component

**What to do:**
- Critical severity alerts get a subtle red left border or red pulse animation
- "NEW" text badge on alerts created in the last 5 minutes
- Unacknowledged alerts are visually distinct from acknowledged ones

**Done when:** Critical alerts on dashboard are visually prominent.

---

### Task 10: Real Audio Recording via MediaRecorder
**Priority:** [OPTIONAL]
**Why:** Makes the demo more impressive if it works, but risky if it fails.

**File:** `apps/web/app/(app)/checkin/page.tsx`

**What to do:**
- Replace simulated `handleRecord()` with real `navigator.mediaDevices.getUserMedia()` + `MediaRecorder`
- Record audio, create a Blob, set it as the `audioFile` for upload
- Transcript still needs to be typed/pasted manually (no speech-to-text API integrated)
- Keep simulated fallback: if `getUserMedia` fails, fall back to current behavior

**Risk:** Browser permission prompts, HTTPS requirement, microphone access issues.

**Done when:** Clicking record captures real audio, which can be uploaded to Supabase Storage. Transcript is still manual input.

---

## Summary: Execution Order

| Order | Task | Priority | Est. Time |
|-------|------|----------|-----------|
| 1 | Test Supabase connection | CRITICAL | 15-30 min |
| 2 | Create analysis save endpoint | CRITICAL | 30 min |
| 3 | Create auto-alert generation | CRITICAL | 30 min |
| 4 | Wire check-in page end-to-end | CRITICAL | 45 min |
| 5 | Auto-update patient status | IMPORTANT | 20 min |
| 6 | Dashboard data refresh | IMPORTANT | 15 min |
| 7 | Clean console errors | IMPORTANT | 20 min |
| 8 | Animated analysis reveal | NICE-TO-HAVE | 30 min |
| 9 | Critical alert styling | NICE-TO-HAVE | 20 min |
| 10 | Real audio recording | OPTIONAL | 45 min |

**Total for CRITICAL tasks:** ~2 hours
**Total for IMPORTANT tasks:** ~1 hour
**Total for all tasks:** ~4.5 hours

After completing tasks 1-7, VoxVitals is demo-ready. Tasks 8-10 add polish if time allows.
