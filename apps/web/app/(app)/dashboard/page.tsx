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
import { HighRiskPatientCard } from "@/components/HighRiskPatientCard";
import {
  PatientDetailPanel,
  PatientDetailEmpty,
} from "@/components/PatientDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import {
  StatCardSkeleton,
  HighRiskCardSkeleton,
} from "@/components/Skeleton";
import { Skeleton } from "@/components/Skeleton";
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
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addingPatient, setAddingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    condition: "",
  });

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
      toast.error(
        err instanceof Error ? err.message : "Failed to add patient"
      );
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
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  // ── Risk scoring ──────────────────────────────────────────

  const rankedPatients = useMemo(
    () => rankPatientsByRisk(patients, checkins, alerts),
    [patients, checkins, alerts]
  );

  const highRiskCount = rankedPatients.filter(
    (r) => r.riskTier === "critical" || r.riskTier === "high"
  ).length;

  const emergencyCount = rankedPatients.filter(
    (r) => r.riskTier === "critical"
  ).length;

  const checkinsToday = checkins.filter((c) => {
    const d = new Date(c.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  // Auto-select first patient when data loads
  useEffect(() => {
    if (!loading && rankedPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(rankedPatients[0].patient.id);
    }
  }, [loading, rankedPatients, selectedPatientId]);

  const selectedScored = rankedPatients.find(
    (r) => r.patient.id === selectedPatientId
  );

  // ── Error state ───────────────────────────────────────────

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      {/* ── Top Bar: title + stats + actions ──────────────── */}
      <div className="flex-shrink-0 mb-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              High-Risk Patient Dashboard
            </h1>
            <p className="text-xs text-clinical-muted mt-0.5">
              AI-powered patient risk monitoring &amp; triage
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              value={patients.length}
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
            ) : patients.length === 0 ? (
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
                  isSelected={scored.patient.id === selectedPatientId}
                  onClick={() => setSelectedPatientId(scored.patient.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Patient Detail (65%) */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-clinical-border bg-white p-5">
          {loading ? (
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
              checkins={checkins}
              onAcknowledge={handleAcknowledge}
            />
          )}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient((p) => ({ ...p, name: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g. Sarah Chen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={newPatient.age}
                  onChange={(e) =>
                    setNewPatient((p) => ({ ...p, age: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g. 34"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={newPatient.condition}
                  onChange={(e) =>
                    setNewPatient((p) => ({ ...p, condition: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g. Rheumatoid Arthritis"
                />
              </div>
              <button
                onClick={handleAddPatient}
                disabled={addingPatient}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {addingPatient ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {addingPatient ? "Adding..." : "Add Patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini Stat Card (compact for top strip) ──────────────────

function MiniStatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="card py-2.5 px-3 flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900 tabular-nums leading-tight">
          {value}
        </div>
        <div className="text-[11px] text-clinical-muted font-medium leading-tight">
          {label}
        </div>
      </div>
    </div>
  );
}
