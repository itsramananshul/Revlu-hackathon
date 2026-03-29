"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

type Role = "patient" | "clinician" | null;

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [ready, setReady] = useState(false);

  // Read role on mount AND on every pathname change
  useEffect(() => {
    const stored = localStorage.getItem("voxvitals-role") as Role;
    setRole(stored);
    setReady(true);
  }, [pathname]);

  // Handle redirects
  useEffect(() => {
    if (!ready || pathname === "/") return;

    if (!role) {
      router.replace("/");
      return;
    }

    // Patient can only access /checkin, /settings, and /medication-scan
    const patientAllowed = ["/checkin", "/settings", "/medication-scan"];
    if (
      role === "patient" &&
      !patientAllowed.some((p) => pathname.startsWith(p))
    ) {
      router.replace("/checkin");
    }
  }, [ready, role, pathname, router]);

  // Role selection page — no sidebar
  if (pathname === "/") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {children}
      </div>
    );
  }

  // Wait for localStorage
  if (!ready || !role) {
    return (
      <div className="min-h-screen bg-clinical-bg flex items-center justify-center">
        <div className="animate-pulse text-clinical-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-clinical-bg">
      <Sidebar role={role} />
      <main className="flex-1 md:ml-64 p-4 md:p-8">{children}</main>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppContent>{children}</AppContent>;
}
