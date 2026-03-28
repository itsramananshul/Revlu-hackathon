"use client";

import { useMode } from "@/lib/mode-context";
import { Heart, Stethoscope } from "lucide-react";

export function ModeToggle({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center bg-slate-900/5 backdrop-blur-sm rounded-xl p-1 gap-1 shadow-sm border border-slate-200/60">
      <button
        onClick={() => setMode("patient")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          mode === "patient"
            ? "bg-white text-primary-700 shadow-md ring-1 ring-slate-200/50"
            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
        }`}
      >
        <Heart className="w-4 h-4" />
        {variant === "compact" ? "Patient" : "Patient Portal"}
      </button>
      <button
        onClick={() => setMode("clinician")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          mode === "clinician"
            ? "bg-white text-primary-700 shadow-md ring-1 ring-slate-200/50"
            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
        }`}
      >
        <Stethoscope className="w-4 h-4" />
        {variant === "compact" ? "Clinician" : "Clinician Dashboard"}
      </button>
    </div>
  );
}
