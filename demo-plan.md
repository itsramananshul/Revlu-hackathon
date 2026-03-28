# VoxVitals Demo Plan

## 1. Story

**"Patients speak. AI detects risk. Trials stay safe."**

Clinical trials lose patients silently. By the time a coordinator notices a problem, the patient has already dropped out. VoxVitals gives patients a voice -- literally -- and uses AI to catch warning signs before they become losses.

---

## 2. Problem, Solution, Impact

### Problem
Clinical trials have a 30% average dropout rate. Patients experience side effects, lose motivation, or struggle with medication adherence -- but these signals go unnoticed between scheduled visits. Every dropout costs sponsors $20,000-$50,000 and delays the trial timeline.

### Solution
VoxVitals is an AI-powered voice monitoring system for clinical trials. Patients do short voice check-ins (30-60 seconds). The AI analyzes what they say and flags:
- Symptoms and side effects (severity, onset, frequency)
- Dropout risk (low / moderate / high based on language patterns)
- Adverse events (safety-critical flags that require immediate action)
- Medication adherence concerns

### Impact
- Coordinators see a live dashboard of patient risk instead of waiting for the next visit
- Critical alerts surface immediately -- not days later
- Trials retain more patients and catch safety issues faster
- Every check-in creates structured, analyzable data from unstructured speech

---

## 3. Demo Flow (exact step-by-step)

### Setup (before judges arrive)
1. App is running at localhost or deployed URL
2. Logged in with test credentials
3. Dashboard is visible with seed data (5+ patients, some existing check-ins, 1-2 existing alerts)
4. Browser dev tools closed

### Live Demo Sequence

**Step 1: Dashboard Overview (15 seconds)**
- Show the dashboard with patient cards, stat summary, and alerts panel
- Point out: "Here's our coordinator dashboard. We can see 8 patients across the trial. Two already have alerts flagged by the AI."
- Click on one alert briefly to show it has context

**Step 2: Navigate to Voice Check-in (5 seconds)**
- Click "Voice Check-in" in the sidebar
- Page loads with patient selector and recording interface

**Step 3: Select Patient + Provide Transcript (20 seconds)**
- Select a patient from the dropdown (e.g., "Maria Garcia -- Hypertension Study")
- Either:
  - (A) Click the record button, wait 2-3 seconds, click stop (simulated recording fills transcript) -- fast and visual
  - (B) Paste a pre-written concerning transcript into the textarea -- more control over what AI sees
- Recommended transcript to paste for maximum demo impact:
  > "I've been having really bad headaches for the past four days. They started after I increased the dosage like the doctor said. I almost didn't take my pills yesterday because the headaches were so bad. I'm not sure I want to continue with this if it keeps up."

**Step 4: Submit and Watch AI Analyze (15 seconds)**
- Click "Submit & Analyze"
- Loading spinner appears ("Analyzing...")
- AI analysis results appear:
  - Summary: describes the patient's concerns
  - Symptoms: headaches (severe, 4 days)
  - Dropout Risk: HIGH (bar fills red)
  - Adverse Event: FLAGGED
  - Medication Adherence Risk: HIGH
  - Recommended Action: specific clinical guidance
- Point out: "In seconds, the AI extracted structured clinical data from natural speech."

**Step 5: Show Alert Was Auto-Created (15 seconds)**
- Navigate back to Dashboard
- Point out the NEW alert that just appeared in the alerts panel
- The alert shows the patient name, severity (critical), and the reason (adverse event / high dropout risk)
- Point out: "The coordinator didn't have to do anything. The system detected the risk and surfaced it automatically."

**Step 6: Patient Detail View (10 seconds)**
- Click on the patient card to see their detail page
- Show: check-in history with the new check-in, analysis results, alert history
- Point out: "Full history. Every check-in analyzed. Trends visible over time."

### Total demo time: ~80 seconds

---

## 4. WOW Moments

### WOW 1: Instant AI Insight from Natural Speech
The moment the analysis results appear after clicking "Submit & Analyze." Unstructured patient speech transforms into structured clinical data in seconds: symptoms with severity, dropout risk score, adverse event flag, recommended action. This is the core value proposition made visible.

**What makes it land:** The contrast between messy human speech and clean, structured clinical output. Judges see the transcript on the left and the structured analysis on the right.

### WOW 2: Critical Alert Auto-Generation
After submitting a high-risk check-in, navigating to the dashboard and seeing a new red critical alert that was NOT there before. No human created it. The AI detected the risk and the system generated the alert automatically.

**What makes it land:** The alert just appears. The coordinator's workflow is interrupted by something important -- exactly how it should work. The red color and severity badge make it impossible to miss.

### WOW 3: Dashboard Risk-at-a-Glance
The dashboard showing multiple patients with different risk levels, stat cards with real numbers, and an alerts panel with actionable items. A coordinator can look at this for 5 seconds and know which patients need attention.

**What makes it land:** It looks like a real clinical tool, not a hackathon prototype. The design system (clean whites, clinical blues, red for critical, green for stable) communicates professionalism and trustworthiness.

### Bonus WOW (if implemented): Animated Analysis Reveal
Analysis results appearing section by section with subtle animations -- summary first, then symptoms populate, then the dropout risk bar fills from left to right, then the adverse event flag appears with a red pulse. Feels like the AI is actively thinking and reporting.

---

## 5. 60-Second Understanding

What judges must grasp in the first minute:

1. **What it is:** An AI system that monitors clinical trial patients through voice check-ins
2. **How it works:** Patient speaks -> AI extracts symptoms, risk, and adverse events -> alerts surface automatically
3. **Why it matters:** Clinical trials lose 30% of patients. VoxVitals catches the warning signs early
4. **What is real:** The AI analysis is real (Gemini 2.0 Flash or realistic mock). The structured output is real. The alert generation is real. The dashboard is real.
5. **What is the technical achievement:** Voice-to-structured-clinical-data pipeline, automated risk scoring, real-time alert system -- built with Next.js, Supabase, and Gemini

If a judge walks away remembering one thing: "That app that turns patient voice recordings into risk alerts for clinical trials."

---

## 6. Demo Safety

### Avoid These During Demo
- **Do NOT open browser dev tools** -- console may show warnings or mock provider logs
- **Do NOT try to demo real audio recording** unless it has been fully tested and works reliably. Use simulated recording or paste a transcript
- **Do NOT navigate to pages that are not part of the demo flow** -- stick to Dashboard -> Check-in -> Dashboard -> Patient Detail
- **Do NOT attempt to show Supabase dashboard or database tables** -- stay in the app
- **Do NOT demo with a slow network** -- if Gemini API is slow, switch to mock provider (remove `GEMINI_API_KEY` from env)
- **Do NOT try to explain the architecture** unless asked. Show the product, not the code
- **Do NOT demo the signup flow** -- be pre-logged-in. Auth is not the interesting part
- **Do NOT click "Acknowledge" on the seed data alerts** -- you want alerts visible on dashboard for the demo

### Fallback Plans
| Problem | Fallback |
|---------|----------|
| Gemini API is slow or down | Remove `GEMINI_API_KEY`, mock provider responds instantly with realistic data |
| Supabase is unreachable | Have screenshots ready. Or run with local mock data if time allows |
| Audio upload fails | Skip audio upload entirely. Transcript is the important input |
| Login fails | Have a second browser tab already logged in |
| Dashboard shows no data | Run seed SQL again. Or manually create a patient + check-in via the app |
| Alert does not auto-generate | Manually show the analysis results on the check-in page and verbally note "this triggers an alert for the coordinator" |

### Pre-Demo Checklist
- [ ] App running and accessible
- [ ] Logged in with test credentials
- [ ] Dashboard has seed data visible (patients, stats, at least 1 alert)
- [ ] Concerning transcript ready to paste (saved in clipboard or a notepad)
- [ ] Browser zoom at 100%, no dev tools, no other tabs visible
- [ ] Gemini API tested (or confirmed mock provider is active)
- [ ] Demo completed successfully in practice run at least once
