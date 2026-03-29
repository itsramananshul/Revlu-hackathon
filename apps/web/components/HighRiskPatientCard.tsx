import Link from "next/link";
import type { RiskScoredPatient, RiskTier } from "@/lib/risk-scoring";
import { PatientStatusBadge } from "@/components/StatusBadge";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { InsightChip } from "@/components/InsightChip";
import { ChevronRight, User } from "lucide-react";

// ── Tier visual mapping ──────────────────────────────────────

const tierBorder: Record<RiskTier, string> = {
  critical: "border-l-red-500",
  high: "border-l-amber-500",
  medium: "border-l-blue-400",
  low: "border-l-emerald-500",
};

const tierBg: Record<RiskTier, string> = {
  critical: "bg-red-50/40",
  high: "bg-amber-50/30",
  medium: "bg-white",
  low: "bg-white",
};

const rankColor: Record<RiskTier, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-emerald-100 text-emerald-700",
};

// ── Component ────────────────────────────────────────────────

export function HighRiskPatientCard({
  scoredPatient,
  rank,
}: {
  scoredPatient: RiskScoredPatient;
  rank: number;
}) {
  const { patient, analysis, riskTier, insightChips, compositeScore } =
    scoredPatient;

  return (
    <Link
      href={`/patient/${patient.id}`}
      className={`block card-hover border-l-4 ${tierBorder[riskTier]} ${tierBg[riskTier]} ${
        riskTier === "critical" ? "alert-critical" : ""
      } group`}
    >
      {/* Top row: rank + name + status */}
      <div className="flex items-center gap-3">
        {/* Rank circle */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColor[riskTier]}`}
        >
          {rank}
        </div>

        {/* Patient avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-slate-500" />
        </div>

        {/* Name + condition */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate text-sm">
              {patient.name}
            </h3>
            <PatientStatusBadge status={patient.status} />
          </div>
          <p className="text-xs text-clinical-muted truncate">
            {patient.condition} &middot; Age {patient.age}
          </p>
        </div>

        {/* Score + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-clinical-muted tabular-nums">
            {compositeScore}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>

      {/* Insight chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 ml-11">
        {insightChips.map((chip, i) => (
          <InsightChip key={i} label={chip.label} variant={chip.variant} />
        ))}
      </div>

      {/* Bottom row: dropout risk + trial ID */}
      {analysis && (
        <div className="flex items-center gap-4 mt-3 ml-11">
          <div className="flex-1 max-w-xs">
            <div className="text-[10px] font-medium text-clinical-muted uppercase tracking-wider mb-0.5">
              Dropout Risk
            </div>
            <DropoutRiskBar risk={analysis.dropoutRisk} />
          </div>
          <span className="text-[11px] text-clinical-muted flex-shrink-0">
            {patient.trialId}
          </span>
        </div>
      )}
    </Link>
  );
}
