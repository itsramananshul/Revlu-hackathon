"use client";

import { useState, useEffect, useRef } from "react";
import type { Patient, AiAnalysis } from "@trialpulse/types";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { SymptomList } from "@/components/SymptomList";
import { DropoutRiskBar } from "@/components/DropoutRiskBar";
import { RiskBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileAudio,
  X,
} from "lucide-react";

export default function CheckInPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(() => toast.error("Failed to load patients"));
  }, []);

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      if (!transcript) {
        setTranscript(
          "Hi, this is my check-in. I've been feeling okay but I've had some headaches this week. I'm still taking my medication every day. The headaches started about three days ago and they're moderate. I also feel a bit tired in the afternoons."
        );
      }
    } else {
      setIsRecording(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      toast.success(`Audio file selected: ${file.name}`);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !transcript) {
      toast.error("Please select a patient and provide a transcript");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Upload audio if present
      let audioUrl: string | undefined;
      if (audioFile) {
        const supabase = createClient();
        const fileName = `${selectedPatient}/${Date.now()}-${audioFile.name}`;
        const { data, error } = await supabase.storage
          .from("checkin-audio")
          .upload(fileName, audioFile);

        if (error) throw new Error(`Audio upload failed: ${error.message}`);
        const { data: urlData } = supabase.storage
          .from("checkin-audio")
          .getPublicUrl(data.path);
        audioUrl = urlData.publicUrl;
      }

      const result = await api.analyzeTranscript(transcript);
      setAnalysis(result);

      await api.createCheckIn({
        patientId: selectedPatient,
        transcript,
        ...(audioUrl && { audioUrl }),
      });

      setSubmitted(true);
      toast.success("Check-in submitted and analyzed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setAnalysis(null);
    setSubmitted(false);
    setSelectedPatient("");
    setAudioFile(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Voice Check-in
        </h1>
        <p className="section-subtitle mt-0.5">
          Record or enter a patient voice check-in for AI analysis
        </p>
      </div>

      {submitted && analysis ? (
        /* Result View */
        <div className="space-y-5">
          <div className="card bg-emerald-50/40 border-emerald-200">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Check-in Submitted</p>
                <p className="text-sm text-emerald-600">
                  AI analysis complete. Results below.
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Result */}
          <div className="card">
            <h2 className="section-title mb-5">AI Analysis Result</h2>

            <div className="mb-5">
              <h3 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                Summary
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm">
                {analysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-3">
                  Symptoms Detected
                </h3>
                <SymptomList symptoms={analysis.symptoms} />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                    Dropout Risk
                  </h3>
                  <DropoutRiskBar risk={analysis.dropoutRisk} />
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                    Medication Adherence Risk
                  </h3>
                  <RiskBadge risk={analysis.medicationAdherenceRisk} />
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-2">
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

            <div className="mt-5 p-4 rounded-lg bg-primary-50/60 border border-primary-200">
              <h3 className="text-xs font-semibold text-primary-800 uppercase tracking-wide mb-1">
                Recommended Action
              </h3>
              <p className="text-sm text-primary-700 leading-relaxed">
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
        <div className="space-y-5">
          {/* Patient Select */}
          <div className="card">
            <label
              htmlFor="patient-select"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Patient
            </label>
            <select
              id="patient-select"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="input"
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.condition}
                </option>
              ))}
            </select>
          </div>

          {/* Recording + Upload */}
          <div className="card">
            <label className="block text-sm font-medium text-slate-700 mb-4">
              Voice Recording
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecord}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-200"
                    : "bg-primary-600 hover:bg-primary-700 shadow-primary-200"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {isRecording
                    ? "Recording... Click to stop"
                    : "Click to start recording"}
                </p>
                <p className="text-xs text-clinical-muted mt-0.5">
                  Or upload an audio file / type transcript below
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {audioFile && (
              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-primary-50 border border-primary-200">
                <FileAudio className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-700 flex-1 truncate">
                  {audioFile.name}
                </span>
                <button
                  onClick={() => setAudioFile(null)}
                  className="text-primary-400 hover:text-primary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="card">
            <label
              htmlFor="transcript"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Transcript
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Patient transcript will appear here after recording, or type/paste manually..."
              rows={5}
              className="input resize-none"
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
