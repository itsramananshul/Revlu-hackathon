"use client";

import { useState, useEffect } from "react";
import type { CheckIn } from "@trialpulse/types";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  Mic,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

export function PatientHome({
  onStartCheckIn,
}: {
  onStartCheckIn: () => void;
}) {
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Get all check-ins and show the most recent ones
        const checkIns = await api.getCheckIns();
        setRecentCheckIns(checkIns.slice(-3).reverse());

        // Use email as display name
        setPatientName(user?.email?.split("@")[0] || "there");
      } catch {
        // Silent fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusFromCheckIn = (checkIn: CheckIn) => {
    if (!checkIn.analysis) return { label: "Pending", color: "text-slate-500", bg: "bg-slate-50" };
    if (checkIn.analysis.adverseEvent)
      return { label: "Needs attention", color: "text-red-600", bg: "bg-red-50" };
    if (checkIn.analysis.dropoutRisk > 0.5)
      return { label: "Needs attention", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "All good", color: "text-emerald-600", bg: "bg-emerald-50" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white flex flex-col">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
          <Heart className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hi, {patientName}
        </h1>
        <p className="text-slate-500 mt-1">How are you feeling today?</p>
      </div>

      {/* Main CTA */}
      <div className="px-6 max-w-md mx-auto w-full">
        <button
          onClick={onStartCheckIn}
          className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mic className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg font-semibold">Start Check-in</div>
              <div className="text-sm text-primary-200 mt-0.5">
                Tell us how you're feeling
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Check-ins */}
      <div className="px-6 max-w-md mx-auto w-full mt-10">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Recent Check-ins
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : recentCheckIns.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No check-ins yet. Start your first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {recentCheckIns.map((ci) => {
              const status = getStatusFromCheckIn(ci);
              return (
                <div
                  key={ci.id}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">
                      {new Date(ci.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                    >
                      {status.label === "All good" ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {status.label}
                        </span>
                      ) : status.label === "Needs attention" ? (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {status.label}
                        </span>
                      ) : (
                        status.label
                      )}
                    </span>
                  </div>
                  {ci.analysis ? (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {ci.analysis.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      Analysis pending...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer reassurance */}
      <div className="mt-auto px-6 py-6 text-center">
        <p className="text-xs text-slate-400">
          Your check-ins help your care team monitor your well-being.
          <br />
          Everything you share is confidential.
        </p>
      </div>
    </div>
  );
}
