import type { AiAnalysis } from "@trialpulse/types";
import type { AiProvider } from "../types";

export class MockAiProvider implements AiProvider {
  async analyzeTranscript(transcript: string): Promise<AiAnalysis> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lower = transcript.toLowerCase();

    const symptoms: AiAnalysis["symptoms"] = [];
    if (lower.includes("headache") || lower.includes("head"))
      symptoms.push({ name: "Headache", severity: 5 });
    if (lower.includes("nausea") || lower.includes("sick"))
      symptoms.push({ name: "Nausea", severity: 4 });
    if (lower.includes("pain") || lower.includes("hurt"))
      symptoms.push({ name: "Pain", severity: 6 });
    if (lower.includes("rash") || lower.includes("skin"))
      symptoms.push({ name: "Skin reaction", severity: 5 });
    if (lower.includes("chest") || lower.includes("breath"))
      symptoms.push({ name: "Chest discomfort", severity: 7 });
    if (lower.includes("tired") || lower.includes("fatigue"))
      symptoms.push({ name: "Fatigue", severity: 3 });

    if (symptoms.length === 0) {
      symptoms.push({ name: "General discomfort", severity: 2 });
    }

    const mentionsStop =
      lower.includes("stop") || lower.includes("quit") || lower.includes("drop");
    const mentionsMissed =
      lower.includes("missed") ||
      lower.includes("forgot") ||
      lower.includes("didn't take");
    const mentionsAdverse =
      lower.includes("chest") ||
      lower.includes("breath") ||
      lower.includes("rash") ||
      lower.includes("severe");

    const dropoutRisk = mentionsStop ? 0.78 : mentionsMissed ? 0.55 : 0.2;
    const medicationAdherenceRisk: AiAnalysis["medicationAdherenceRisk"] =
      mentionsStop ? "high" : mentionsMissed ? "medium" : "low";

    return {
      summary: `[MOCK] Patient check-in analysis based on transcript keywords. ${symptoms.length} symptom(s) detected. ${mentionsAdverse ? "Potential adverse event flagged." : "No adverse events detected."}`,
      symptoms,
      medicationAdherenceRisk,
      dropoutRisk,
      adverseEvent: mentionsAdverse,
      recommendedAction: mentionsAdverse
        ? "URGENT: Schedule immediate follow-up for potential adverse event."
        : mentionsStop
          ? "High dropout risk — schedule retention call within 24 hours."
          : "Continue standard monitoring protocol.",
    };
  }
}
