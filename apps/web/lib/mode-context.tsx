"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type AppMode = "patient" | "clinician";

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  refreshKey: number; // increments on mode switch to trigger data refresh
}

const ModeContext = createContext<ModeContextType>({
  mode: "clinician",
  setMode: () => {},
  toggleMode: () => {},
  refreshKey: 0,
});

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeInternal] = useState<AppMode>("clinician");
  const [refreshKey, setRefreshKey] = useState(0);

  const setMode = useCallback((newMode: AppMode) => {
    setModeInternal(newMode);
    // Bump refresh key so clinician dashboard re-fetches fresh data
    setRefreshKey((k) => k + 1);
  }, []);

  const toggleMode = useCallback(() => {
    setModeInternal((prev) => {
      const next = prev === "clinician" ? "patient" : "clinician";
      return next;
    });
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode, refreshKey }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
