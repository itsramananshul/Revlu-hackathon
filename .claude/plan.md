# Plan: Two Remaining Fixes from System Design Review

## Fix 1: YOLO Health Check Banner on Medication Scan Page

**Problem:** If the YOLO Python service (port 8123) isn't running, the medication scanner silently falls back to full-image OCR. During demo, the presenter might not realize YOLO is down — no warning is shown.

**Approach:** Add a health check in `MedicationScanner.tsx` on component mount. Call `/api/medication-scan` is server-side, so we need to expose the YOLO status. Simplest: add a client-side check to the existing `/api/ai/status` route OR add a lightweight check directly in the component against a new thin API. But even simpler — the YOLO fallback already works (the scan still succeeds), so we just need a **warning banner**, not a blocker.

**Plan:**
1. **`apps/web/app/api/ai/status/route.ts`** — Add a YOLO health check to the existing AI status endpoint. Ping `YOLO_SERVICE_URL/health` and include `yolo: "ok" | "unavailable"` in the response.
2. **`apps/web/components/MedicationScanner.tsx`** — On mount, fetch `/api/ai/status`. If `yolo === "unavailable"`, show an amber warning banner: "YOLO detection service is offline — scanner will use full-image fallback."

**Files changed:** 2 files

---

## Fix 2: Force-Refresh Dashboard After Check-in Submission

**Problem:** After a clinician submits a check-in and clicks "View Dashboard", they get `router.push("/dashboard")`. The dashboard loads fresh data via `useEffect → load()` on mount, which should work. BUT — Next.js App Router caches client components. If the dashboard was already visited in the same session, the router may serve the cached version, and the `useEffect` with `useCallback(load, [])` won't re-fire because `load` has a stable reference.

**Approach:** Add a query parameter as a cache-buster: `router.push("/dashboard?t=<timestamp>")`. Then in the dashboard, detect this param and ensure `load()` runs. Actually simpler — use `router.refresh()` before `router.push()`, or just pass a signal.

Simplest fix: change the clinician redirect to use `window.location.href = "/dashboard"` instead of `router.push`. This forces a full page load, guaranteeing fresh data. This is a one-line change and 100% reliable for demo.

**Plan:**
1. **`apps/web/app/(app)/checkin/page.tsx`** — Line 240: Change `router.push("/dashboard")` to `window.location.href = "/dashboard"` so the dashboard does a full fresh load after check-in submission.

**Files changed:** 1 file

---

## Summary

| Fix | Files | Lines changed |
|-----|-------|--------------|
| YOLO health banner | `api/ai/status/route.ts`, `MedicationScanner.tsx` | ~20 lines |
| Dashboard force-refresh | `checkin/page.tsx` | 1 line |

Total: 3 files, minimal changes.
