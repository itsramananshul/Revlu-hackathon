"use client";

import { useEffect, useState } from "react";
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
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-clinical-muted">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const getLatestAnalysis = (patientId: string) => {
    const patientCheckins = checkins.filter(
      (c) => c.patientId === patientId && c.analysis
    );
    return patientCheckins[patientCheckins.length - 1]?.analysis;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-clinical-muted mt-1">
          Clinical trial monitoring overview
        </p>
      </div>

      {/* Stats Grid */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Patients"
            value={summary.totalPatients}
            accent="bg-primary-50 text-primary-600"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Active"
            value={summary.activePatients}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
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
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Alerts
            </h2>
            <span className="badge-danger">{alerts.length} unacknowledged</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const patient = patients.find((p) => p.id === alert.patientId);
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900">
                        {patient?.name || alert.patientId}
                      </span>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                    <p className="text-sm text-slate-600">{alert.message}</p>
                  </div>
                  <span className="text-xs text-clinical-muted whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Patients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const analysis = getLatestAnalysis(patient.id);
            return (
              <Link
                key={patient.id}
                href={`/patient/${patient.id}`}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-clinical-muted">
                      {patient.condition}
                    </p>
                  </div>
                  <PatientStatusBadge status={patient.status} />
                </div>

                {analysis && (
                  <div className="space-y-3 mt-4">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {analysis.summary}
                    </p>
                    <div>
                      <div className="text-xs text-clinical-muted mb-1">
                        Dropout Risk
                      </div>
                      <DropoutRiskBar risk={analysis.dropoutRisk} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-clinical-border">
                  <span className="text-xs text-clinical-muted">
                    Trial: {patient.trialId}
                  </span>
                  <ChevronRight className="w-4 h-4 text-clinical-muted group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trend Section */}
      {summary && summary.symptomTrends.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Symptom Trends
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {summary.symptomTrends.map((trend) => (
              <div
                key={trend.name}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="text-sm font-medium text-slate-700">
                  {trend.name}
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {trend.dataPoints.length > 0
                    ? trend.dataPoints[
                        trend.dataPoints.length - 1
                      ].avgSeverity.toFixed(1)
                    : "—"}
                </div>
                <div className="text-xs text-clinical-muted">avg severity</div>
              </div>
            ))}
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
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-clinical-muted">{label}</div>
      </div>
    </div>
  );
}
