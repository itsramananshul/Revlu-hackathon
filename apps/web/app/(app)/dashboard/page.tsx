"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type {
  Patient,
  Alert,
  AnalyticsSummary,
  CheckIn,
} from "@trialpulse/types";
import { api } from "@/lib/api";
import { rankPatientsByRisk, type RiskScoredPatient } from "@/lib/risk-scoring";
import { generateSmartAlerts } from "@/lib/alert-engine";
import { computeCohortMetrics } from "@/lib/cohort-analytics";
import { generateSyntheticData, type SyntheticData } from "@/lib/simulation/scenarios";
import { recordAuditEvent } from "@/lib/security/audit";
import { HighRiskPatientCard } from "@/components/HighRiskPatientCard";
import {
  PatientDetailPanel,
  PatientDetailEmpty,
} from "@/components/PatientDetailPanel";
import { SmartAlertBar } from "@/components/SmartAlertBar";
import { CohortInsightsPanel } from "@/components/CohortInsightsPanel";
import { SimulationPanel, SyntheticBadge } from "@/components/SimulationPanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import {
  profilePatient,
  getProfileDistribution,
  analyzeInterventionPatterns,
} from "@/lib/optimization/patient-profiles";
import { predictDropoutRisk } from "@/lib/dropout-risk";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { HighRiskCardSkeleton, Skeleton } from "@/components/Skeleton";
import { toast } from "sonner";
import {
  Users,
  AlertTriangle,
  Flame,
  Mic,
  UserPlus,
  X,
  Loader2,
  Activity,
  User,
  BarChart3,
  FlaskConical,
  Lock,
  Target,
} from "lucide-react";

type RightPanelView = "patient" | "cohort" | "simulation" | "optimization";

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelView>("patient");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", age: "", condition: "" });

  // ── Simulation state ──────────────────────────────────────
  const [syntheticData, setSyntheticData] = useState<SyntheticData | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);

  // ── Data loading ──────────────────────────────────────────

  const generateTrialId = () => {
    const num = String(patients.length + 1).padStart(3, "0");
    return `TRIAL-VX-${num}`;
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.condition) {
      toast.error("Please fill in all fields");
      return;
    }
    setAddingPatient(true);
    try {
      await api.createPatient({
        name: newPatient.name,
        age: Number(newPatient.age),
        condition: newPatient.condition,
        trialId: generateTrialId(),
      });
      toast.success("Patient added");
      setShowAddPatient(false);
      setNewPatient({ name: "", age: "", condition: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add patient");
    } finally {
      setAddingPatient(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a, c, s] = await Promise.all([
        api.getPatients(),
        api.getUnacknowledgedAlerts(),
        api.getCheckIns(),
        api.getAnalyticsSummary(),
      ]);
      setPatients(p);
      setAlerts(a);
      setCheckins(c);
      setSummary(s);
      recordAuditEvent("dashboard_accessed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      recordAuditEvent("alert_acknowledged", { metadata: { alertId } });
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  // ── Merge real + synthetic data ───────────────────────────

  const mergedPatients = useMemo(() => {
    if (!syntheticData) return patients;
    return [...patients, ...syntheticData.patients];
  }, [patients, syntheticData]);

  const mergedCheckins = useMemo(() => {
    if (!syntheticData) return checkins;
    return [...checkins, ...syntheticData.checkins];
  }, [checkins, syntheticData]);

  const mergedAlerts = useMemo(() => {
    if (!syntheticData) return alerts;
    return [...alerts, ...syntheticData.alerts];
  }, [alerts, syntheticData]);

  // ── Synthetic patient ID set (for badge display) ──────────

  const syntheticPatientIds = useMemo(
    () => new Set(syntheticData?.patients.map((p) => p.id) ?? []),
    [syntheticData]
  );

  // ── Risk scoring (on merged data) ─────────────────────────

  const rankedPatients = useMemo(
    () => rankPatientsByRisk(mergedPatients, mergedCheckins, mergedAlerts),
    [mergedPatients, mergedCheckins, mergedAlerts]
  );

  const highRiskCount = rankedPatients.filter(
    (r) => r.riskTier === "critical" || r.riskTier === "high"
  ).length;

  const emergencyCount = rankedPatients.filter(
    (r) => r.riskTier === "critical"
  ).length;

  const checkinsToday = mergedCheckins.filter((c) => {
    const d = new Date(c.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // ── Smart alerts ──────────────────────────────────────────

  const smartAlerts = useMemo(
    () => generateSmartAlerts(mergedPatients, mergedCheckins, mergedAlerts),
    [mergedPatients, mergedCheckins, mergedAlerts]
  );

  // ── Cohort metrics ────────────────────────────────────────

  const cohortMetrics = useMemo(
    () => computeCohortMetrics(mergedPatients, mergedCheckins, rankedPatients),
    [mergedPatients, mergedCheckins, rankedPatients]
  );

  // ── Patient profiles (optimization) ──────────────────────

  const patientProfiles = useMemo(() => {
    return rankedPatients.map((scored) => {
      const dp = predictDropoutRisk(scored.patient, mergedCheckins, mergedAlerts, scored.analysis);
      return profilePatient(scored, mergedCheckins, mergedAlerts, dp);
    });
  }, [rankedPatients, mergedCheckins, mergedAlerts]);

  const profileDistribution = useMemo(
    () => getProfileDistribution(patientProfiles),
    [patientProfiles]
  );

  const interventionInsights = useMemo(
    () => analyzeInterventionPatterns(patientProfiles),
    [patientProfiles]
  );

  // ── Auto-select first patient ─────────────────────────────

  useEffect(() => {
    if (!loading && rankedPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(rankedPatients[0].patient.id);
    }
  }, [loading, rankedPatients, selectedPatientId]);

  const selectedScored = rankedPatients.find(
    (r) => r.patient.id === selectedPatientId
  );

  // ── Handlers ──────────────────────────────────────────────

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setRightPanel("patient");
    recordAuditEvent("patient_record_viewed", { patientId });
  };

  const handleGenerateSimulation = (scenarioIds: string[]) => {
    const data = generateSyntheticData(scenarioIds);
    setSyntheticData(data);
    setActiveScenarios(scenarioIds);
    setSelectedPatientId(null); // Reset selection so it picks highest risk
    recordAuditEvent("simulation_generated", {
      metadata: { scenarios: scenarioIds.length },
    });
    toast.success(`${data.patients.length} synthetic patients generated`);
  };

  const handleResetSimulation = () => {
    setSyntheticData(null);
    setActiveScenarios([]);
    setSelectedPatientId(null);
    recordAuditEvent("simulation_cleared");
    toast.success("Simulation data cleared");
  };

  // ── Error state ───────────────────────────────────────────

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <div className="flex-shrink-0 mb-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              High-Risk Patient Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-clinical-muted">
                AI-powered patient risk monitoring &amp; triage
              </p>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <Lock className="w-2.5 h-2.5" />
                Authorized access
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {syntheticData && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-700">
                <FlaskConical className="w-3 h-3" />
                Simulation active
              </span>
            )}
            <button
              onClick={() => setShowAddPatient(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Patient
            </button>
            <Link
              href="/checkin"
              className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <Mic className="w-3.5 h-3.5" />
              New Check-in
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card py-2.5 px-3 flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <MiniStatCard
              icon={<Users className="w-4 h-4" />}
              label="Monitored"
              value={mergedPatients.length}
              accent="bg-primary-50 text-primary-600"
            />
            <MiniStatCard
              icon={<AlertTriangle className="w-4 h-4" />}
              label="High Risk"
              value={highRiskCount}
              accent="bg-amber-50 text-amber-600"
            />
            <MiniStatCard
              icon={<Flame className="w-4 h-4" />}
              label="Emergencies"
              value={emergencyCount}
              accent="bg-red-50 text-red-600"
            />
            <MiniStatCard
              icon={<Activity className="w-4 h-4" />}
              label="Check-ins Today"
              value={checkinsToday}
              accent="bg-emerald-50 text-emerald-600"
            />
          </div>
        )}
      </div>

      {/* ── Smart Alerts Bar ─────────────────────────────── */}
      {!loading && smartAlerts.length > 0 && (
        <div className="flex-shrink-0 mb-3">
          <SmartAlertBar
            alerts={smartAlerts}
            onAlertClick={handleSelectPatient}
          />
        </div>
      )}

      {/* ── Two-Panel Layout ─────────────────────────────── */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* LEFT PANEL — Patient List (35%) */}
        <div className="w-[35%] flex-shrink-0 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500" />
              Patients by Risk
            </h2>
            <span className="text-[11px] text-clinical-muted">
              {rankedPatients.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <HighRiskCardSkeleton key={i} />
                ))}
              </>
            ) : mergedPatients.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Users}
                  title="No patients enrolled"
                  description="Add patients to start monitoring."
                />
              </div>
            ) : (
              rankedPatients.map((scored, i) => (
                <HighRiskPatientCard
                  key={scored.patient.id}
                  scoredPatient={scored}
                  rank={i + 1}
                  isSelected={
                    scored.patient.id === selectedPatientId &&
                    rightPanel === "patient"
                  }
                  isSynthetic={syntheticPatientIds.has(scored.patient.id)}
                  onClick={() => handleSelectPatient(scored.patient.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Detail / Cohort / Simulation (65%) */}
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-clinical-border bg-white">
          {/* Tab bar */}
          <div className="flex-shrink-0 flex border-b border-clinical-border">
            <button
              onClick={() => setRightPanel("patient")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                rightPanel === "patient"
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-clinical-muted hover:text-slate-700"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Patient Detail
            </button>
            <button
              onClick={() => {
                setRightPanel("cohort");
                recordAuditEvent("cohort_insights_viewed");
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                rightPanel === "cohort"
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-clinical-muted hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Cohort Insights
            </button>
            <button
              onClick={() => setRightPanel("simulation")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                rightPanel === "simulation"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-clinical-muted hover:text-slate-700"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Simulation
            </button>
            <button
              onClick={() => setRightPanel("optimization")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                rightPanel === "optimization"
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-clinical-muted hover:text-slate-700"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Optimization
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-5">
            {rightPanel === "optimization" ? (
              loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                  <Skeleton className="h-40 rounded-lg" />
                </div>
              ) : (
                <OptimizationPanel
                  profiles={patientProfiles}
                  distribution={profileDistribution}
                  interventionInsights={interventionInsights}
                  onSelectPatient={handleSelectPatient}
                />
              )
            ) : rightPanel === "simulation" ? (
              <SimulationPanel
                activeScenarios={activeScenarios}
                onGenerate={handleGenerateSimulation}
                onReset={handleResetSimulation}
                isSimulationActive={!!syntheticData}
              />
            ) : rightPanel === "cohort" ? (
              loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                  </div>
                  <Skeleton className="h-32 rounded-lg" />
                </div>
              ) : (
                <CohortInsightsPanel metrics={cohortMetrics} />
              )
            ) : loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ) : !selectedScored ? (
              <PatientDetailEmpty />
            ) : (
              <PatientDetailPanel
                scored={selectedScored}
                checkins={mergedCheckins}
                allAlerts={mergedAlerts}
                onAcknowledge={handleAcknowledge}
                isSynthetic={syntheticPatientIds.has(selectedScored.patient.id)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Add Patient Modal ────────────────────────────── */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Add New Patient
              </h2>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" value={newPatient.name} onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))} className="input" placeholder="e.g. Sarah Chen" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input type="number" value={newPatient.age} onChange={(e) => setNewPatient((p) => ({ ...p, age: e.target.value }))} className="input" placeholder="e.g. 34" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                <input type="text" value={newPatient.condition} onChange={(e) => setNewPatient((p) => ({ ...p, condition: e.target.value }))} className="input" placeholder="e.g. Rheumatoid Arthritis" />
              </div>
              <button onClick={handleAddPatient} disabled={addingPatient} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {addingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {addingPatient ? "Adding..." : "Add Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini Stat Card ──────────────────────────────────────────

function MiniStatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="card py-2.5 px-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>{icon}</div>
      <div>
        <div className="text-lg font-bold text-slate-900 tabular-nums leading-tight">{value}</div>
        <div className="text-[11px] text-clinical-muted font-medium leading-tight">{label}</div>
      </div>
    </div>
  );
}
