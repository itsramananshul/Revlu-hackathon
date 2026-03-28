"use client";

import { useState, useEffect } from "react";
import type { Patient, AiAnalysis } from "@trialpulse/types";
import { api } from "@/lib/api";
import { SymptomList } from "@/components/SymptomList";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { RiskBadge } from "@/components/StatusBadge";
import {
  Mic,
  MicOff,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function CheckInPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(console.error);
  }, []);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate recorded transcript
      if (!transcript) {
        setTranscript(
          "Hi, this is my check-in. I've been feeling okay but I've had some headaches this week. I'm still taking my medication every day. The headaches started about three days ago and they're moderate. I also feel a bit tired in the afternoons."
        );
      }
    } else {
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !transcript) return;

    setIsAnalyzing(true);
    try {
      const result = await api.analyzeTranscript(transcript);
      setAnalysis(result);

      await api.createCheckIn({
        patientId: selectedPatient,
        transcript,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setAnalysis(null);
    setSubmitted(false);
    setSelectedPatient("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Voice Check-in</h1>
        <p className="text-clinical-muted mt-1">
          Record or enter a patient voice check-in for AI analysis
        </p>
      </div>

      {submitted && analysis ? (
        /* Result View */
        <div className="space-y-6">
          <div className="card border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-semibold">Check-in Submitted Successfully</p>
                <p className="text-sm text-emerald-600">
                  AI analysis complete. Results are shown below.
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Result */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              AI Analysis Result
            </h2>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-clinical-muted mb-2">
                Summary
              </h3>
              <p className="text-slate-700">{analysis.summary}</p>
            </div>

            {/* Two column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Symptoms */}
              <div>
                <h3 className="text-sm font-medium text-clinical-muted mb-3">
                  Symptoms Detected
                </h3>
                <SymptomList symptoms={analysis.symptoms} />
              </div>

              {/* Risk Metrics */}
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

            {/* Recommended Action */}
            <div className="mt-6 p-4 rounded-lg bg-primary-50 border border-primary-200">
              <h3 className="text-sm font-medium text-primary-800 mb-1">
                Recommended Action
              </h3>
              <p className="text-sm text-primary-700">
                {analysis.recommendedAction}
              </p>
            </div>
          </div>

          <button onClick={handleReset} className="btn-secondary">
            New Check-in
          </button>
        </div>
      ) : (
        /* Input Form */
        <div className="space-y-6">
          {/* Patient Select */}
          <div className="card">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Patient
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border border-clinical-border rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.condition}
                </option>
              ))}
            </select>
          </div>

          {/* Recording Controls */}
          <div className="card">
            <label className="block text-sm font-medium text-slate-700 mb-4">
              Voice Recording
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecord}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-7 h-7 text-white" />
                ) : (
                  <Mic className="w-7 h-7 text-white" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {isRecording
                    ? "Recording... Click to stop"
                    : "Click to start recording"}
                </p>
                <p className="text-xs text-clinical-muted mt-1">
                  Or paste/type a transcript below
                </p>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="card">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Patient transcript will appear here after recording, or type/paste it manually..."
              rows={6}
              className="w-full px-3 py-2 border border-clinical-border rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedPatient || !transcript || isAnalyzing}
            className="btn-primary flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit & Analyze
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
