"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type {
  Patient,
  Alert,
  AnalyticsSummary,
  CheckIn,
} from "@trialpulse/types";
import { api } from "@/lib/api";
import { PatientStatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import {
  StatCardSkeleton,
  PatientCardSkeleton,
  AlertSkeleton,
} from "@/components/Skeleton";
import { toast } from "sonner";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Bell,
  ChevronRight,
  Shield,
  UserX,
} from "lucide-react";

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  const getLatestAnalysis = (patientId: string) => {
    const patientCheckins = checkins.filter(
      (c) => c.patientId === patientId && c.analysis
    );
    return patientCheckins[patientCheckins.length - 1]?.analysis;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="section-subtitle mt-0.5">
          Clinical trial monitoring overview
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Patients"
              value={summary.totalPatients}
              accent="bg-primary-50 text-primary-600"
            />
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              label="Active"
              value={summary.activePatients}
              accent="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={<UserX className="w-5 h-5" />}
              label="Flagged"
              value={summary.flaggedPatients}
              accent="bg-red-50 text-red-600"
            />
            <StatCard
              icon={<Bell className="w-5 h-5" />}
              label="Active Alerts"
              value={summary.recentAlerts}
              accent="bg-amber-50 text-amber-600"
            />
          </div>
        )
      )}

      {/* Alerts Section */}
      {loading ? (
        <div className="card space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AlertSkeleton key={i} />
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Alerts
            </h2>
            <span className="badge-danger">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const patient = patients.find((p) => p.id === alert.patientId);
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    alert.severity === "critical"
                      ? "bg-red-50/60 border-red-200 border-l-4 border-l-red-500"
                      : alert.severity === "high"
                        ? "bg-amber-50/40 border-amber-200 border-l-4 border-l-amber-500"
                        : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-slate-900 truncate">
                        {patient?.name || alert.patientId}
                      </span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn-ghost text-xs flex-shrink-0"
                  >
                    Acknowledge
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Patient Cards */}
      <div>
        <h2 className="section-title mb-3">Patients</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients enrolled"
            description="Patients will appear here once they are added to a trial."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {patients.map((patient) => {
              const analysis = getLatestAnalysis(patient.id);
              return (
                <Link
                  key={patient.id}
                  href={`/patient/${patient.id}`}
                  className="card-hover group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-clinical-muted">
                        {patient.condition}
                      </p>
                    </div>
                    <PatientStatusBadge status={patient.status} />
                  </div>

                  {analysis && (
                    <div className="space-y-3 mt-3">
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {analysis.summary}
                      </p>
                      <div>
                        <div className="text-[11px] font-medium text-clinical-muted uppercase tracking-wide mb-1">
                          Dropout Risk
                        </div>
                        <DropoutRiskBar risk={analysis.dropoutRisk} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-clinical-muted">
                      {patient.trialId}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Trends */}
      {!loading && summary && summary.symptomTrends.length > 0 && (
        <div className="card">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Symptom Trends
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {summary.symptomTrends.map((trend) => {
              const latest =
                trend.dataPoints.length > 0
                  ? trend.dataPoints[trend.dataPoints.length - 1].avgSeverity
                  : 0;
              return (
                <div
                  key={trend.name}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="text-sm font-medium text-slate-700">
                    {trend.name}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {latest.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-clinical-muted font-medium uppercase tracking-wide">
                    avg severity
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
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
    <div className="card flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {value}
        </div>
        <div className="text-xs text-clinical-muted font-medium">{label}</div>
      </div>
    </div>
  );
}
