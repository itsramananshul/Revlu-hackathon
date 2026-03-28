import type { Patient, CheckIn, Alert, AiAnalysis } from "@trialpulse/types";

// ============================================================
// Demo Seed Data
// ============================================================

const analyses: Record<string, AiAnalysis> = {
  "chk-001": {
    summary:
      "Patient reports persistent headaches and mild nausea over the past 3 days. Sleep quality has declined. Medication taken as scheduled but patient expresses frustration with side effects.",
    symptoms: [
      { name: "Headache", severity: 6 },
      { name: "Nausea", severity: 4 },
      { name: "Insomnia", severity: 5 },
    ],
    medicationAdherenceRisk: "low",
    dropoutRisk: 0.35,
    adverseEvent: false,
    recommendedAction:
      "Schedule follow-up call to discuss side effect management. Consider dose adjustment.",
  },
  "chk-002": {
    summary:
      "Patient reports severe chest tightness and difficulty breathing after last dose. Stopped taking medication 2 days ago without consulting physician. Expresses desire to leave trial.",
    symptoms: [
      { name: "Chest tightness", severity: 8 },
      { name: "Dyspnea", severity: 7 },
      { name: "Anxiety", severity: 6 },
    ],
    medicationAdherenceRisk: "high",
    dropoutRisk: 0.85,
    adverseEvent: true,
    recommendedAction:
      "URGENT: Contact patient immediately. Possible adverse reaction. Schedule in-person evaluation within 24 hours.",
  },
  "chk-003": {
    summary:
      "Patient feeling well overall. Mild fatigue noted but improving. Medication adherence is excellent. Positive outlook on trial participation.",
    symptoms: [{ name: "Fatigue", severity: 2 }],
    medicationAdherenceRisk: "low",
    dropoutRisk: 0.1,
    adverseEvent: false,
    recommendedAction:
      "Continue current protocol. Positive trajectory — no intervention needed.",
  },
  "chk-004": {
    summary:
      "Patient missed two doses this week due to forgetfulness. Reports joint pain and stiffness increasing. Mood is low. Mentioned considering dropping out.",
    symptoms: [
      { name: "Joint pain", severity: 7 },
      { name: "Stiffness", severity: 5 },
      { name: "Low mood", severity: 6 },
    ],
    medicationAdherenceRisk: "medium",
    dropoutRisk: 0.62,
    adverseEvent: false,
    recommendedAction:
      "Implement medication reminder system. Schedule motivational check-in. Monitor dropout risk closely.",
  },
  "chk-005": {
    summary:
      "Patient reports skin rash that appeared 48 hours after dose increase. Itching is significant. Otherwise feeling okay. Continues taking medication.",
    symptoms: [
      { name: "Skin rash", severity: 6 },
      { name: "Pruritus", severity: 7 },
    ],
    medicationAdherenceRisk: "low",
    dropoutRisk: 0.28,
    adverseEvent: true,
    recommendedAction:
      "Document potential adverse drug reaction. Consider dermatology referral. May need dose adjustment.",
  },
};

export const seedPatients: Patient[] = [
  {
    id: "pt-001",
    name: "Sarah Chen",
    age: 34,
    condition: "Rheumatoid Arthritis",
    trialId: "TRIAL-RA-2024",
    enrolledAt: "2024-11-15T00:00:00Z",
    status: "active",
    latestCheckInId: "chk-001",
  },
  {
    id: "pt-002",
    name: "James Rodriguez",
    age: 52,
    condition: "Chronic Heart Failure",
    trialId: "TRIAL-CHF-2024",
    enrolledAt: "2024-10-01T00:00:00Z",
    status: "flagged",
    latestCheckInId: "chk-002",
  },
  {
    id: "pt-003",
    name: "Emily Okafor",
    age: 28,
    condition: "Type 2 Diabetes",
    trialId: "TRIAL-T2D-2024",
    enrolledAt: "2024-12-01T00:00:00Z",
    status: "active",
    latestCheckInId: "chk-003",
  },
  {
    id: "pt-004",
    name: "Michael Torres",
    age: 61,
    condition: "Osteoarthritis",
    trialId: "TRIAL-OA-2024",
    enrolledAt: "2024-09-20T00:00:00Z",
    status: "flagged",
    latestCheckInId: "chk-004",
  },
  {
    id: "pt-005",
    name: "Aisha Patel",
    age: 45,
    condition: "Psoriasis",
    trialId: "TRIAL-PS-2024",
    enrolledAt: "2024-11-10T00:00:00Z",
    status: "active",
    latestCheckInId: "chk-005",
  },
];

export const seedCheckIns: CheckIn[] = [
  {
    id: "chk-001",
    patientId: "pt-001",
    timestamp: "2025-01-10T09:30:00Z",
    transcript:
      "Hi, this is Sarah. I've been having these headaches for about three days now, and some nausea too. I'm not sleeping well either. I've been taking my medication on time though. It's just... the side effects are really getting to me. I hope they get better soon.",
    analysis: analyses["chk-001"],
  },
  {
    id: "chk-002",
    patientId: "pt-002",
    timestamp: "2025-01-11T14:15:00Z",
    transcript:
      "This is James. I need to tell you that after my last dose, I had really bad chest tightness and couldn't breathe properly. It scared me so much that I stopped taking the medication two days ago. I didn't call anyone, I just stopped. Honestly, I'm thinking about leaving the trial. This doesn't feel safe.",
    analysis: analyses["chk-002"],
  },
  {
    id: "chk-003",
    patientId: "pt-003",
    timestamp: "2025-01-12T11:00:00Z",
    transcript:
      "Hey, it's Emily. I'm feeling pretty good actually. A little tired sometimes but it's getting better. I've been really good about taking my meds every day. I'm happy to be part of this trial, I think it's helping.",
    analysis: analyses["chk-003"],
  },
  {
    id: "chk-004",
    patientId: "pt-004",
    timestamp: "2025-01-12T16:45:00Z",
    transcript:
      "Michael here. Look, I forgot to take my pills twice this week. My joints are really hurting and I'm stiff all the time. I'm not in a great mood about this whole thing. I've been thinking maybe this isn't worth it. Maybe I should just drop out.",
    analysis: analyses["chk-004"],
  },
  {
    id: "chk-005",
    patientId: "pt-005",
    timestamp: "2025-01-13T08:20:00Z",
    transcript:
      "Hello, this is Aisha. I wanted to report that I developed a rash about two days after my dose was increased. It's quite itchy and uncomfortable. Other than that I feel fine and I'm still taking everything as prescribed. Just wanted to make sure you know about the rash.",
    analysis: analyses["chk-005"],
  },
];

export const seedAlerts: Alert[] = [
  {
    id: "alt-001",
    patientId: "pt-002",
    checkInId: "chk-002",
    type: "adverse_event",
    severity: "critical",
    message:
      "Adverse event reported: chest tightness and dyspnea after dose. Patient self-discontinued medication.",
    createdAt: "2025-01-11T14:20:00Z",
    acknowledged: false,
  },
  {
    id: "alt-002",
    patientId: "pt-002",
    checkInId: "chk-002",
    type: "high_dropout_risk",
    severity: "high",
    message:
      "Dropout risk at 85%. Patient has expressed desire to leave the trial.",
    createdAt: "2025-01-11T14:20:00Z",
    acknowledged: false,
  },
  {
    id: "alt-003",
    patientId: "pt-004",
    checkInId: "chk-004",
    type: "medication_nonadherence",
    severity: "medium",
    message:
      "Patient missed 2 doses this week. Medication adherence risk elevated.",
    createdAt: "2025-01-12T16:50:00Z",
    acknowledged: false,
  },
  {
    id: "alt-004",
    patientId: "pt-004",
    checkInId: "chk-004",
    type: "high_dropout_risk",
    severity: "high",
    message:
      "Dropout risk at 62%. Patient mentioned considering leaving the trial.",
    createdAt: "2025-01-12T16:50:00Z",
    acknowledged: false,
  },
  {
    id: "alt-005",
    patientId: "pt-005",
    checkInId: "chk-005",
    type: "adverse_event",
    severity: "medium",
    message:
      "Potential adverse drug reaction: skin rash following dose increase.",
    createdAt: "2025-01-13T08:25:00Z",
    acknowledged: false,
  },
];
