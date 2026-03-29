import type { CohortMetrics } from "@/lib/cohort-analytics";
import {
  Pill,
  Heart,
  TrendingDown,
  Users,
  Mic,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

// ── Simple bar chart (no external deps) ─────────────────────

function RiskDistributionChart({
  distribution,
}: {
  distribution: CohortMetrics["riskDistribution"];
}) {
  const total =
    distribution.critical +
    distribution.high +
    distribution.medium +
    distribution.low;
  if (total === 0) return <p className="text-xs text-clinical-muted">No data</p>;

  const bars = [
    {
      label: "Critical",
      value: distribution.critical,
      color: "bg-red-500",
      textColor: "text-red-700",
    },
    {
      label: "High",
      value: distribution.high,
      color: "bg-amber-500",
      textColor: "text-amber-700",
    },
    {
      label: "Medium",
      value: distribution.medium,
      color: "bg-blue-400",
      textColor: "text-blue-700",
    },
    {
      label: "Low",
      value: distribution.low,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
  ];

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="space-y-2">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span
            className={`text-[11px] font-medium w-14 text-right ${bar.textColor}`}
          >
            {bar.label}
          </span>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-500 ${bar.color}`}
              style={{
                width: `${Math.max((bar.value / maxVal) * 100, bar.value > 0 ? 8 : 0)}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 w-6 text-right tabular-nums">
            {bar.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Progress ring (lightweight) ─────────────────────────────

function ProgressCircle({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900 tabular-nums">
          {value}%
        </span>
      </div>
    </div>
  );
}

// ── Top symptoms mini-chart ─────────────────────────────────

function TopSymptomsBars({
  symptoms,
}: {
  symptoms: CohortMetrics["topSymptoms"];
}) {
  if (symptoms.length === 0)
    return <p className="text-xs text-clinical-muted">No symptom data</p>;

  return (
    <div className="space-y-1.5">
      {symptoms.map((s) => (
        <div key={s.name} className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 w-24 truncate">
            {s.name}
          </span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                s.avgSeverity >= 7
                  ? "bg-red-500"
                  : s.avgSeverity >= 4
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${s.avgSeverity * 10}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500 w-8 text-right tabular-nums">
            {s.avgSeverity}/10
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

export function CohortInsightsPanel({
  metrics,
}: {
  metrics: CohortMetrics;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4.5 h-4.5 text-primary-600" />
          Cohort Insights
        </h2>
        <p className="text-xs text-clinical-muted mt-0.5">
          Population-level analytics across all monitored patients
        </p>
      </div>

      {/* ── Top row: circular stats ────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-3 px-3 flex flex-col items-center text-center">
          <ProgressCircle
            value={metrics.adherenceRate}
            color={
              metrics.adherenceRate >= 80
                ? "#10b981"
                : metrics.adherenceRate >= 50
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <div className="mt-2">
            <div className="text-[11px] font-semibold text-slate-700">
              Med Adherence
            </div>
          </div>
        </div>

        <div className="card py-3 px-3 flex flex-col items-center text-center">
          <ProgressCircle
            value={metrics.engagementStats.participationRate}
            color={
              metrics.engagementStats.participationRate >= 80
                ? "#10b981"
                : metrics.engagementStats.participationRate >= 50
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <div className="mt-2">
            <div className="text-[11px] font-semibold text-slate-700">
              Participation
            </div>
          </div>
        </div>

        <div className="card py-3 px-3 flex flex-col items-center text-center">
          <ProgressCircle
            value={100 - metrics.adverseEventRate}
            color={
              metrics.adverseEventRate <= 10
                ? "#10b981"
                : metrics.adverseEventRate <= 30
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <div className="mt-2">
            <div className="text-[11px] font-semibold text-slate-700">
              Safety Rate
            </div>
          </div>
        </div>
      </div>

      {/* ── Key metrics row ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card py-3 px-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider">
              Avg Pain Level
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tabular-nums ${
                metrics.averagePainLevel >= 7
                  ? "text-red-600"
                  : metrics.averagePainLevel >= 4
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {metrics.averagePainLevel}
            </span>
            <span className="text-xs text-clinical-muted">/10</span>
          </div>
        </div>

        <div className="card py-3 px-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider">
              Avg Dropout Risk
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tabular-nums ${
                metrics.averageDropoutRisk >= 60
                  ? "text-red-600"
                  : metrics.averageDropoutRisk >= 35
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {metrics.averageDropoutRisk}
            </span>
            <span className="text-xs text-clinical-muted">%</span>
          </div>
        </div>
      </div>

      {/* ── Risk Distribution ──────────────────────────── */}
      <div className="card py-3 px-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-primary-600" />
          <span className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider">
            Risk Distribution
          </span>
        </div>
        <RiskDistributionChart distribution={metrics.riskDistribution} />
      </div>

      {/* ── Top Symptoms ───────────────────────────────── */}
      <div className="card py-3 px-3">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider">
            Top Symptoms (by severity)
          </span>
        </div>
        <TopSymptomsBars symptoms={metrics.topSymptoms} />
      </div>

      {/* ── Engagement stats ───────────────────────────── */}
      <div className="card py-3 px-3">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider">
            Engagement
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {metrics.engagementStats.totalCheckins}
            </div>
            <div className="text-[10px] text-clinical-muted">
              Total check-ins
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {metrics.engagementStats.avgCheckinsPerPatient}
            </div>
            <div className="text-[10px] text-clinical-muted">
              Avg per patient
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
