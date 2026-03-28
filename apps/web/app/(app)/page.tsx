"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, Mic, LayoutDashboard } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();

  // If role already chosen, redirect immediately
  useEffect(() => {
    const role = localStorage.getItem("voxvitals-role");
    if (role === "patient") router.replace("/checkin");
    if (role === "clinician") router.replace("/dashboard");
  }, [router]);

  const selectRole = (role: "patient" | "clinician") => {
    localStorage.setItem("voxvitals-role", role);
    router.push(role === "patient" ? "/checkin" : "/dashboard");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 z-50">
      <div className="max-w-lg w-full px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-5 shadow-lg">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          VoxVitals
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 mb-10">
          AI-Powered Voice Monitoring for Clinical Trials
        </p>

        {/* Role buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => selectRole("patient")}
            className="group bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              I am a Patient
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Submit a voice check-in about how you're feeling
            </p>
          </button>

          <button
            onClick={() => selectRole("clinician")}
            className="group bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              I am a Clinician
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor patients, view alerts, and track risk
            </p>
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-600 mt-8">
          You can switch roles anytime from the menu
        </p>
      </div>
    </div>
  );
}
