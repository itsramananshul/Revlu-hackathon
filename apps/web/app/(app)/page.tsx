"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Activity, Mic, Stethoscope, Loader2 } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check localStorage first (instant redirect if role already saved)
    const savedRole = localStorage.getItem("voxvitals-role");
    if (savedRole === "patient") {
      router.replace("/checkin");
      return;
    }
    if (savedRole === "clinician") {
      router.replace("/dashboard");
      return;
    }

    // 2. No saved role — try to fetch from app_users table
    const fetchRole = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: appUser } = await supabase
          .from("app_users")
          .select("role")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (appUser?.role) {
          const role = appUser.role === "patient" ? "patient" : "clinician";
          localStorage.setItem("voxvitals-role", role);
          router.replace(role === "patient" ? "/checkin" : "/dashboard");
          return;
        }
      } catch {
        // Ignore errors, fall through to manual selection
      }
      setLoading(false);
    };

    fetchRole();
  }, [router]);

  const selectRole = (role: "patient" | "clinician") => {
    localStorage.setItem("voxvitals-role", role);
    router.push(role === "patient" ? "/checkin" : "/dashboard");
  };

  // Show loading while checking
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 z-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-5 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            VoxVitals
          </h1>
          <Loader2 className="w-5 h-5 animate-spin text-primary-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 z-50">
      <div className="max-w-lg w-full px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-5 shadow-lg">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          VoxVitals
        </h1>
        <p className="text-slate-500 mt-1 mb-10">
          AI-Powered Voice Monitoring for Clinical Trials
        </p>

        {/* Role buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => selectRole("patient")}
            className="group bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              I am a Patient
            </h2>
            <p className="text-sm text-slate-500">
              Submit a voice check-in about how you're feeling
            </p>
          </button>

          <button
            onClick={() => selectRole("clinician")}
            className="group bg-white border-2 border-slate-200 hover:border-primary-400 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              I am a Doctor
            </h2>
            <p className="text-sm text-slate-500">
              Monitor patients, view alerts, and track risk
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
