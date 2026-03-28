"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRoleSelection = pathname === "/";

  if (isRoleSelection) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-clinical-bg dark:bg-slate-950 transition-colors duration-200">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
