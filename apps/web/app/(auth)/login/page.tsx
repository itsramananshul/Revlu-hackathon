"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  LogIn,
  Mic,
  MicOff,
  ShieldCheck,
  ShieldX,
  RotateCcw,
  KeyRound,
} from "lucide-react";

type LoginMode = "choose" | "email" | "voice";
type VoiceState = "idle" | "recording" | "verifying" | "success" | "failed";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("choose");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice login state
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceError, setVoiceError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load patients for voice login dropdown
  useEffect(() => {
    if (mode === "voice") {
      fetch("/api/auth/patients")
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setPatients(json.data);
        })
        .catch(() => {});
    }
  }, [mode]);

  // Email login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  // Voice recording
  const startRecording = async () => {
    if (!selectedPatient) {
      toast.error("Please select your name first");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-login-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        await handleVoiceLogin(file);
      };

      mediaRecorder.start();
      setVoiceState("recording");
      setVoiceError("");
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
      );
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
    setVoiceState("verifying");
  };

  const handleVoiceLogin = async (audioFile: File) => {
    setVoiceState("verifying");
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("patientId", selectedPatient);

      const res = await fetch("/api/auth/voice-login", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.data?.verified) {
        setVoiceState("success");

        // If server returned a session, set it
        if (json.data.session) {
          const supabase = createClient();
          await supabase.auth.setSession({
            access_token: json.data.session.access_token,
            refresh_token: json.data.session.refresh_token,
          });

          toast.success(`Welcome, ${json.data.patientName}`);
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1000);
        } else {
          // Voice verified but no session — tell user
          toast.success("Voice verified! Please sign in with your credentials.");
          setMode("email");
        }
      } else {
        setVoiceState("failed");
        setVoiceError(json.message || "Voice verification failed");
      }
    } catch {
      setVoiceState("failed");
      setVoiceError("Connection error. Please try again.");
    }
  };

  // Mode chooser
  if (mode === "choose") {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Welcome back
        </h2>
        <p className="text-sm text-clinical-muted mb-6">
          Choose how to sign in
        </p>

        <div className="space-y-3">
          <button
            onClick={() => setMode("voice")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">
                Sign in with Voice
              </div>
              <div className="text-xs text-slate-500">
                Speak your verification phrase
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("email")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <KeyRound className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">
                Sign in with Email
              </div>
              <div className="text-xs text-slate-500">
                Use email and password
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-clinical-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  // Voice login mode
  if (mode === "voice") {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold text-slate-900">
            Voice Sign In
          </h2>
          <button
            onClick={() => {
              setMode("choose");
              setVoiceState("idle");
              setVoiceError("");
            }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Back
          </button>
        </div>
        <p className="text-sm text-clinical-muted mb-6">
          Select your name and speak your verification phrase
        </p>

        {voiceState === "idle" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Name
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="input"
              >
                <option value="">Select your name...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startRecording}
              disabled={!selectedPatient}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Mic className="w-5 h-5" />
              Start Voice Verification
            </button>
          </div>
        )}

        {voiceState === "recording" && (
          <div className="text-center py-6">
            <button
              onClick={stopRecording}
              className="w-24 h-24 mx-auto rounded-full bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200 flex items-center justify-center mb-4"
            >
              <MicOff className="w-10 h-10 text-white" />
            </button>
            <p className="text-sm font-medium text-slate-700">
              Listening... {recordingTime}s
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Say your verification phrase, then tap to stop
            </p>
          </div>
        )}

        {voiceState === "verifying" && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-700">
              Verifying your voice...
            </p>
          </div>
        )}

        {voiceState === "success" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold text-emerald-700">
              Voice Verified
            </p>
            <p className="text-sm text-slate-500 mt-1">Signing you in...</p>
          </div>
        )}

        {voiceState === "failed" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-red-700 mb-1">
              Verification Failed
            </p>
            <p className="text-xs text-slate-500 mb-4">{voiceError}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setVoiceState("idle")}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => setMode("email")}
                className="btn-secondary text-sm"
              >
                Use Email
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-clinical-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    );
  }

  // Email login mode
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-slate-900">
          Email Sign In
        </h2>
        <button
          onClick={() => setMode("choose")}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Back
        </button>
      </div>
      <p className="text-sm text-clinical-muted mb-6">
        Sign in with your email and password
      </p>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-clinical-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
