"use client";

import { useState, useRef, useEffect } from "react";
import type { Patient, AiAnalysis } from "@trialpulse/types";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Heart,
} from "lucide-react";

export function PatientCheckIn({ onBack }: { onBack: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState("");
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(() => {});
  }, []);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], `checkin-${Date.now()}.webm`, {
            type: "audio/webm",
          });
          setAudioFile(file);
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorder.start();

        // Speech-to-text
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          let finalTranscript = "";
          recognition.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            setTranscript(finalTranscript + interim);
          };
          recognition.onerror = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        }

        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !transcript) {
      toast.error("Please select your name and describe how you're feeling");
      return;
    }

    setIsAnalyzing(true);
    try {
      let audioUrl: string | undefined;
      if (audioFile) {
        setPipelineStep("Uploading recording...");
        const supabase = createClient();
        const fileName = `${selectedPatient}/${Date.now()}-recording.webm`;
        const { data, error } = await supabase.storage
          .from("checkin-audio")
          .upload(fileName, audioFile);
        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from("checkin-audio")
            .getPublicUrl(data.path);
          audioUrl = urlData.publicUrl;
        }
      }

      setPipelineStep("Saving your check-in...");
      const checkIn = await api.createCheckIn({
        patientId: selectedPatient,
        transcript,
        ...(audioUrl && { audioUrl }),
      });

      setPipelineStep("Analyzing your responses...");
      const result = await api.analyzeCheckIn(checkIn.id);
      setAnalysis(result.analysis);
      setSubmitted(true);
      setPipelineStep("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setPipelineStep("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Patient-friendly summary of the analysis
  const getPatientFeedback = (analysis: AiAnalysis) => {
    if (analysis.adverseEvent) {
      return {
        icon: AlertCircle,
        color: "text-red-600",
        bg: "bg-red-50 border-red-200",
        title: "We've flagged something important",
        message:
          "Based on what you shared, our system has detected something that needs attention. Your care team has been notified and will follow up with you shortly.",
      };
    }
    if (analysis.dropoutRisk > 0.5 || analysis.medicationAdherenceRisk === "high") {
      return {
        icon: AlertCircle,
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        title: "We hear you",
        message:
          "Thank you for being honest about how you're feeling. Your care team will review your check-in and may reach out to discuss ways to help.",
      };
    }
    return {
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      title: "Looking good",
      message:
        "Based on your check-in, things appear to be going well. Keep up with your current routine and let us know if anything changes.",
    };
  };

  if (submitted && analysis) {
    const feedback = getPatientFeedback(analysis);
    const FeedbackIcon = feedback.icon;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Check-in Complete
          </h1>
          <p className="text-slate-500 mb-8">
            Thank you for sharing how you're feeling.
          </p>

          {/* Patient-friendly feedback */}
          <div className={`rounded-2xl border p-5 text-left mb-6 ${feedback.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${feedback.color}`}>
              <FeedbackIcon className="w-5 h-5" />
              <span className="font-semibold text-sm">{feedback.title}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {feedback.message}
            </p>
          </div>

          {/* Simple symptom list — no severity numbers */}
          {analysis.symptoms.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left mb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                What we noted
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.symptoms.map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="btn-primary w-full py-3 rounded-xl text-base"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Voice Check-in</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tell us how you've been feeling
        </p>
      </div>

      <div className="flex-1 px-6 max-w-md mx-auto w-full space-y-5">
        {/* Patient selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Your name
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="input rounded-xl"
          >
            <option value="">Select your name...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recording */}
        <div className="flex flex-col items-center py-6">
          <button
            onClick={handleRecord}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-200"
                : "bg-primary-600 hover:bg-primary-700 shadow-primary-200"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
          <p className="text-sm text-slate-500 mt-3">
            {isRecording
              ? `Listening... ${recordingTime}s`
              : "Tap to start speaking"}
          </p>
        </div>

        {/* Transcript */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            What you said
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your words will appear here as you speak, or type how you're feeling..."
            rows={4}
            className="input rounded-xl resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedPatient || !transcript || isAnalyzing}
          className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-base"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {pipelineStep || "Processing..."}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Check-in
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-slate-400">
          <Heart className="w-3 h-3 inline mr-1" />
          Your responses are confidential and help your care team support you.
        </p>
      </div>
    </div>
  );
}
