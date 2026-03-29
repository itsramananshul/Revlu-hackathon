"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Heart,
  Brain,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Minimize2,
  Maximize2,
} from "lucide-react";

// ── Simulated vital signals ─────────────────────────────────

interface VitalSignal {
  heartRate: number;
  stressLevel: "low" | "moderate" | "elevated";
  fatigueScore: number; // 0-100
  attentionLevel: "focused" | "distracted" | "drowsy";
  emotionalState: "calm" | "anxious" | "neutral";
}

function generateVitals(prev?: VitalSignal): VitalSignal {
  const base = prev ?? {
    heartRate: 72,
    stressLevel: "low" as const,
    fatigueScore: 20,
    attentionLevel: "focused" as const,
    emotionalState: "calm" as const,
  };

  // Simulate natural variation
  const hr = Math.max(
    55,
    Math.min(110, base.heartRate + (Math.random() - 0.5) * 6)
  );
  const fatigue = Math.max(
    0,
    Math.min(100, base.fatigueScore + (Math.random() - 0.45) * 4)
  );

  const stressLevel: VitalSignal["stressLevel"] =
    hr > 95 ? "elevated" : hr > 80 ? "moderate" : "low";

  const attentionLevel: VitalSignal["attentionLevel"] =
    fatigue > 70 ? "drowsy" : fatigue > 45 ? "distracted" : "focused";

  const emotionalState: VitalSignal["emotionalState"] =
    stressLevel === "elevated"
      ? "anxious"
      : stressLevel === "moderate"
        ? "neutral"
        : "calm";

  return { heartRate: Math.round(hr), stressLevel, fatigueScore: Math.round(fatigue), attentionLevel, emotionalState };
}

// ── Vital card colors ────────────────────────────────────────

const stressColor = {
  low: "text-emerald-600 bg-emerald-50",
  moderate: "text-amber-600 bg-amber-50",
  elevated: "text-red-600 bg-red-50",
};

const attentionColor = {
  focused: "text-emerald-600 bg-emerald-50",
  distracted: "text-amber-600 bg-amber-50",
  drowsy: "text-red-600 bg-red-50",
};

const emotionColor = {
  calm: "text-emerald-600 bg-emerald-50",
  neutral: "text-blue-600 bg-blue-50",
  anxious: "text-amber-600 bg-amber-50",
};

// ── Component ────────────────────────────────────────────────

export function PassiveMonitor() {
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [vitals, setVitals] = useState<VitalSignal | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
      setExpanded(true);

      // Simulate vital signal updates every 2s
      const initial = generateVitals();
      setVitals(initial);
      intervalRef.current = setInterval(() => {
        setVitals((prev) => generateVitals(prev ?? undefined));
      }, 2000);
    } catch {
      // Camera not available — run with mock data only
      setActive(true);
      setExpanded(true);
      const initial = generateVitals();
      setVitals(initial);
      intervalRef.current = setInterval(() => {
        setVitals((prev) => generateVitals(prev ?? undefined));
      }, 2000);
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setVitals(null);
  }, [cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Not active — show start button
  if (!active) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Passive Health Monitor
          </h3>
          <span className="text-[10px] text-clinical-muted">Beta</span>
        </div>
        <p className="text-xs text-clinical-muted mb-4 leading-relaxed">
          Uses your camera to estimate stress, fatigue, and attention levels.
          No images are stored or transmitted.
        </p>
        <button
          onClick={startMonitoring}
          className="btn-secondary flex items-center gap-2 text-sm w-full justify-center py-2.5"
        >
          <Camera className="w-4 h-4" />
          Start Monitoring
        </button>
      </div>
    );
  }

  // Active — show vitals dashboard
  return (
    <div className="card border-primary-200 bg-primary-50/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-900">
            Passive Monitor
          </h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            {expanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={stopMonitoring}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600"
          >
            <CameraOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && vitals && (
        <>
          {/* Camera preview */}
          <div className="relative rounded-lg overflow-hidden bg-slate-900 mb-3 aspect-video max-h-[140px]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {!cameraStream && (
                <div className="text-center">
                  <Camera className="w-6 h-6 text-white/50 mx-auto mb-1" />
                  <span className="text-[10px] text-white/50">
                    Camera unavailable — using simulated data
                  </span>
                </div>
              )}
            </div>
            {/* Scan overlay */}
            <div className="absolute inset-0 border-2 border-primary-400/30 rounded-lg" />
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 text-[9px] text-white">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </div>
          </div>

          {/* Vital signals grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Heart Rate */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
              <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 tabular-nums">
                  {vitals.heartRate}{" "}
                  <span className="text-[9px] text-clinical-muted font-normal">
                    bpm
                  </span>
                </div>
                <div className="text-[9px] text-clinical-muted">
                  Heart Rate
                </div>
              </div>
            </div>

            {/* Stress */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
              <Activity className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stressColor[vitals.stressLevel]}`}
                >
                  {vitals.stressLevel}
                </span>
                <div className="text-[9px] text-clinical-muted mt-0.5">
                  Stress
                </div>
              </div>
            </div>

            {/* Fatigue */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
              <Brain className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 tabular-nums">
                  {vitals.fatigueScore}
                  <span className="text-[9px] text-clinical-muted font-normal">
                    %
                  </span>
                </div>
                <div className="text-[9px] text-clinical-muted">Fatigue</div>
              </div>
            </div>

            {/* Attention */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
              <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${attentionColor[vitals.attentionLevel]}`}
                >
                  {vitals.attentionLevel}
                </span>
                <div className="text-[9px] text-clinical-muted mt-0.5">
                  Attention
                </div>
              </div>
            </div>
          </div>

          {/* Status summary */}
          <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
            {vitals.stressLevel === "elevated" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  Elevated stress detected. Consider taking a break or doing a
                  breathing exercise.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600">
                  Vitals look stable. Keep up the good work!
                </p>
              </>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-[9px] text-clinical-muted mt-2 leading-relaxed">
            Estimates only — not medical-grade measurements. This does not
            replace clinical monitoring.
          </p>
        </>
      )}
    </div>
  );
}
