"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Activity, Mic, Stethoscope, Shield, Loader2 } from "lucide-react";

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
    if (savedRole === "super") {
      router.replace("/super");
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
          const role = appUser.role === "super" ? "super" : appUser.role === "patient" ? "patient" : "clinician";
          localStorage.setItem("voxvitals-role", role);
          const dest = role === "patient" ? "/checkin" : role === "super" ? "/super" : "/dashboard";
          router.replace(dest);
          return;
        }
      } catch {
        // Ignore errors, fall through to manual selection
      }
      setLoading(false);
    };

    fetchRole();
  }, [router]);

  const selectRole = (role: "patient" | "clinician" | "super") => {
    localStorage.setItem("voxvitals-role", role);
    const dest = role === "patient" ? "/checkin" : role === "super" ? "/super" : "/dashboard";
    router.push(dest);
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
      <div className="max-w-lg w-full px-6 text-center animate-fade-in-up">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-5 shadow-lg animate-scale-in">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          VoxVitals
        </h1>
        <p className="text-slate-500 mt-1 mb-10">
          AI-Powered Voice Monitoring for Clinical Trials
        </p>

        {/* Role buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => selectRole("patient")}
            className="group bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:shadow-emerald-100/50 text-left animate-fade-in-up animate-delay-100"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Patient
            </h2>
            <p className="text-sm text-slate-500">
              Daily check-ins &amp; symptom reporting
            </p>
          </button>

          <button
            onClick={() => selectRole("clinician")}
            className="group bg-white border-2 border-slate-200 hover:border-primary-400 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:shadow-primary-100/50 text-left animate-fade-in-up animate-delay-200"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Doctor
            </h2>
            <p className="text-sm text-slate-500">
              Monitor patients, alerts &amp; risk
            </p>
          </button>

          <button
            onClick={() => selectRole("super")}
            className="group bg-white border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:shadow-purple-100/50 text-left animate-fade-in-up animate-delay-300"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Lead Doctor
            </h2>
            <p className="text-sm text-slate-500">
              Oversee all doctors &amp; trial analytics
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
