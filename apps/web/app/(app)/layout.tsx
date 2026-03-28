"use client";

import { Sidebar } from "@/components/Sidebar";
import { ModeProvider, useMode } from "@/lib/mode-context";
import { PatientMode } from "@/components/patient-mode/PatientMode";
import { ModeToggle } from "@/components/ModeToggle";

function AppContent({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();

  return (
    <div className="relative min-h-screen">
      {/* Patient Mode */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          mode === "patient"
            ? "opacity-100 translate-x-0 pointer-events-auto z-20"
            : "opacity-0 translate-x-4 pointer-events-none z-10"
        }`}
      >
        <div className="min-h-screen bg-white relative">
          <div className="fixed top-4 right-4 z-50">
            <ModeToggle variant="compact" />
          </div>
          <PatientMode />
        </div>
      </div>

      {/* Clinician Mode */}
      <div
        className={`transition-all duration-300 ${
          mode === "clinician"
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
      >
        <div className="flex min-h-screen bg-clinical-bg">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            <div className="flex justify-end mb-4">
              <ModeToggle />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <AppContent>{children}</AppContent>
    </ModeProvider>
  );
}
