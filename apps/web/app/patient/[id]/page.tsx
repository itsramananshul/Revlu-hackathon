"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Patient, CheckIn, Alert } from "@trialpulse/types";
import { api } from "@/lib/api";
import { PatientStatusBadge, SeverityBadge, RiskBadge } from "@/components/StatusBadge";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { SymptomList } from "@/components/SymptomList";
import {
  ArrowLeft,
  User,
  Calendar,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, a] = await Promise.all([
          api.getPatient(id),
          api.getPatientCheckIns(id),
          api.getAlerts().then((all) => all.filter((a) => a.patientId === id)),
        ]);
        setPatient(p);
        setCheckins(c);
        setAlerts(a);
      } catch (err) {
        console.error("Failed to load patient:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-clinical-muted">
          Loading patient details...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-clinical-muted">Patient not found</p>
        <Link href="/" className="text-primary-600 hover:underline mt-2 block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const latestCheckIn = checkins[checkins.length - 1];
  const analysis = latestCheckIn?.analysis;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-clinical-muted hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Patient Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {patient.name}
              </h1>
              <p className="text-clinical-muted">{patient.condition}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-clinical-muted">
                <span>Age: {patient.age}</span>
                <span>Trial: {patient.trialId}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Enrolled:{" "}
                  {new Date(patient.enrolledAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <PatientStatusBadge status={patient.status} />
        </div>
      </div>

      {/* Alerts for this patient */}
      {alerts.length > 0 && (
        <div className="card border-red-200">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Alerts ({alerts.length})
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-3 rounded-lg bg-red-50/50 border border-red-100"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs text-clinical-muted">
                      {alert.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{alert.message}</p>
                </div>
                <span className="text-xs text-clinical-muted whitespace-nowrap ml-4">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Analysis */}
      {analysis && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary-600" />
            Latest AI Analysis
          </h2>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-clinical-muted mb-2">
              Summary
            </h3>
            <p className="text-slate-700">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-clinical-muted mb-3">
                Symptoms
              </h3>
              <SymptomList symptoms={analysis.symptoms} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-clinical-muted mb-2">
                  Dropout Risk
                </h3>
                <DropoutRiskBar risk={analysis.dropoutRisk} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-clinical-muted mb-2">
                  Medication Adherence Risk
                </h3>
                <RiskBadge risk={analysis.medicationAdherenceRisk} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-clinical-muted mb-2">
                  Adverse Event
                </h3>
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

          <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-200">
            <h3 className="text-sm font-medium text-primary-800 mb-1">
              Recommended Action
            </h3>
            <p className="text-sm text-primary-700">
              {analysis.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Check-in History */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Check-in History
        </h2>
        {checkins.length === 0 ? (
          <p className="text-clinical-muted text-sm">No check-ins recorded.</p>
        ) : (
          <div className="space-y-4">
            {[...checkins].reverse().map((ci) => (
              <div
                key={ci.id}
                className="p-4 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    {new Date(ci.timestamp).toLocaleString()}
                  </span>
                  {ci.analysis?.adverseEvent && (
                    <span className="badge-danger text-xs">Adverse Event</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 line-clamp-3">
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
