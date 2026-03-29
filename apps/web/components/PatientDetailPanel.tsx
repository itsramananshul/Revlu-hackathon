import type { CheckIn, Alert, AiAnalysis } from "@trialpulse/types";
import type { RiskScoredPatient } from "@/lib/risk-scoring";
import { SeverityBadge, RiskBadge } from "@/components/StatusBadge";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { SymptomList } from "@/components/SymptomList";
import { InsightChip } from "@/components/InsightChip";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import {
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Mic,
  Stethoscope,
  Pill,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";

// ── Tier colors ─────────────────────────────────────────────

const tierHeaderBg: Record<string, string> = {
  critical: "bg-red-50 border-red-200",
  high: "bg-amber-50 border-amber-200",
  medium: "bg-blue-50 border-blue-200",
  low: "bg-emerald-50 border-emerald-200",
};

const tierDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-emerald-500",
};

// ── Empty state ─────────────────────────────────────────────

export function PatientDetailEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Stethoscope className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        Select a patient
      </h3>
      <p className="text-sm text-clinical-muted max-w-xs">
        Click on a patient from the list to view their clinical details, AI
        analysis, and check-in history.
      </p>
    </div>
  );
}

// ── Main panel ──────────────────────────────────────────────

export function PatientDetailPanel({
  scored,
  checkins,
  onAcknowledge,
}: {
  scored: RiskScoredPatient;
  checkins: CheckIn[];
  onAcknowledge: (alertId: string) => void;
}) {
  const { patient, analysis, alerts, riskTier, insightChips, compositeScore } =
    scored;

  const patientCheckins = checkins
    .filter((c) => c.patientId === patient.id)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="space-y-5 overflow-y-auto">
      {/* ── Patient Header ─────────────────────────────── */}
      <div
        className={`rounded-xl border p-4 ${tierHeaderBg[riskTier]}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {patient.name}
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${tierDot[riskTier]}`}
                />
                <span className="text-xs font-semibold text-slate-600 capitalize">
                  {riskTier} risk
                </span>
                <span className="text-xs text-clinical-muted tabular-nums">
                  ({compositeScore})
                </span>
              </div>
            </div>
            <p className="text-sm text-clinical-muted mt-0.5">
              {patient.condition} &middot; Age {patient.age}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-clinical-muted">
              <span>{patient.trialId}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Enrolled{" "}
                {new Date(patient.enrolledAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Insight chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {insightChips.map((chip, i) => (
            <InsightChip key={i} label={chip.label} variant={chip.variant} />
          ))}
        </div>
      </div>

      {/* ── Emergency Alerts ───────────────────────────── */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4" />
            Active Alerts ({unacknowledgedAlerts.length})
          </h3>
          <div className="space-y-2">
            {unacknowledgedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start justify-between p-3 rounded-lg border ${
                  alert.severity === "critical"
                    ? "bg-red-100/60 border-red-300 alert-critical"
                    : "bg-white/60 border-red-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-[11px] text-clinical-muted uppercase tracking-wide">
                      {alert.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{alert.message}</p>
                </div>
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="btn-ghost text-xs ml-3 flex-shrink-0"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Clinical Summary ────────────────────────── */}
      {analysis ? (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary-600" />
            AI Clinical Summary
          </h3>

          {/* Summary text */}
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {analysis.summary}
          </p>

          {/* Symptoms + Risk indicators side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Symptoms */}
            <div>
              <h4 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                Symptoms
              </h4>
              <SymptomList symptoms={analysis.symptoms} />
            </div>

            {/* Risk indicators */}
            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-1.5">
                  Dropout Risk
                </h4>
                <DropoutRiskBar risk={analysis.dropoutRisk} />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-1.5">
                  Medication Adherence
                </h4>
                <RiskBadge risk={analysis.medicationAdherenceRisk} />
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-1.5">
                  Adverse Event
                </h4>
                {analysis.adverseEvent ? (
                  <span className="badge-critical flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    Flagged
                  </span>
                ) : (
                  <span className="badge-success">None detected</span>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="mt-4 p-3 rounded-lg bg-primary-50/60 border border-primary-200">
            <h4 className="text-[11px] font-semibold text-primary-800 uppercase tracking-wide mb-1">
              Recommended Action
            </h4>
            <p className="text-sm text-primary-700 leading-relaxed">
              {analysis.recommendedAction}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No analysis yet"
            description="Submit a voice check-in to generate an AI analysis."
          />
        </div>
      )}

      {/* ── Check-in History ───────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-slate-400" />
          Check-in History
          {patientCheckins.length > 0 && (
            <span className="badge-neutral">{patientCheckins.length}</span>
          )}
        </h3>
        {patientCheckins.length === 0 ? (
          <EmptyState
            icon={Mic}
            title="No check-ins"
            description="Voice check-ins will appear here."
          />
        ) : (
          <div className="space-y-2">
            {patientCheckins.map((ci) => (
              <div
                key={ci.id}
                className="p-3 rounded-lg bg-slate-50/80 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">
                    {new Date(ci.timestamp).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ci.analysis?.adverseEvent && (
                      <span className="badge-danger text-[10px]">
                        Adverse
                      </span>
                    )}
                    {ci.analysis && (
                      <span className="text-[10px] text-clinical-muted">
                        Pain max:{" "}
                        {Math.max(
                          ...ci.analysis.symptoms.map((s) => s.severity),
                          0
                        )}
                        /10
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {ci.transcript}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
