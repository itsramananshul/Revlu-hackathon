"use client";

import { useState } from "react";
import { PatientHome } from "./PatientHome";
import { PatientCheckIn } from "./PatientCheckIn";

export function PatientMode() {
  const [view, setView] = useState<"home" | "checkin">("home");

  if (view === "checkin") {
    return <PatientCheckIn onBack={() => setView("home")} />;
  }

  return <PatientHome onStartCheckIn={() => setView("checkin")} />;
}
