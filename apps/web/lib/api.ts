import type { ApiResponse } from "@trialpulse/types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.message || "API request failed");
  }

  return json.data;
}

export const api = {
  // Patients
  getPatients: () => request<import("@trialpulse/types").Patient[]>("/patients"),
  getPatient: (id: string) =>
    request<import("@trialpulse/types").Patient>(`/patients/${id}`),

  // Check-ins
  getCheckIns: () => request<import("@trialpulse/types").CheckIn[]>("/checkins"),
  getCheckIn: (id: string) =>
    request<import("@trialpulse/types").CheckIn>(`/checkins/${id}`),
  getPatientCheckIns: (patientId: string) =>
    request<import("@trialpulse/types").CheckIn[]>(
      `/checkins/patient/${patientId}`
    ),
  createCheckIn: (data: {
    patientId: string;
    transcript: string;
    audioUrl?: string;
  }) =>
    request<import("@trialpulse/types").CheckIn>("/checkins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  analyzeCheckIn: (checkInId: string) =>
    request<{
      analysis: import("@trialpulse/types").AiAnalysis;
      alerts: import("@trialpulse/types").Alert[];
      patientStatusUpdated: string | null;
    }>(`/checkins/${checkInId}/analyze`, { method: "POST" }),

  // AI
  analyzeTranscript: (transcript: string) =>
    request<import("@trialpulse/types").AiAnalysis>("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ transcript }),
    }),
  getProviderStatus: () =>
    request<{ ai: string; tts: string }>("/ai/status"),

  // Alerts
  getAlerts: () => request<import("@trialpulse/types").Alert[]>("/alerts"),
  getUnacknowledgedAlerts: () =>
    request<import("@trialpulse/types").Alert[]>("/alerts/unacknowledged"),
  acknowledgeAlert: (id: string) =>
    request<import("@trialpulse/types").Alert>(`/alerts/${id}/acknowledge`, {
      method: "PATCH",
    }),

  // Analytics
  getAnalyticsSummary: () =>
    request<import("@trialpulse/types").AnalyticsSummary>("/analytics/summary"),
};
