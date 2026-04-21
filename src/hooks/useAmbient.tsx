import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeStats, type Phase, type CycleProfile, type PeriodEntry } from "@/lib/cycle";

/**
 * AmbientPhase narrows the cycle phase down to the 3 background variants
 * we have illustrations for. PMS rolls into "luteal", normal/follicular into
 * the default soft-pink scene.
 */
export type AmbientPhase = "period" | "ovulation" | "luteal" | "default";

interface AmbientCtx {
  phase: AmbientPhase;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AmbientCtx>({
  phase: "default",
  enabled: true,
  setEnabled: () => {},
  refresh: async () => {},
});

const STORAGE_KEY = "cyclesense-ambient-enabled";

function mapPhase(p: Phase | undefined): AmbientPhase {
  if (p === "period") return "period";
  if (p === "ovulation" || p === "fertile") return "ovulation";
  if (p === "pms") return "luteal";
  return "default";
}

export function AmbientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<AmbientPhase>("default");
  const [enabled, setEnabledState] = useState<boolean>(true);

  // Hydrate persistence
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setEnabledState(stored === "1");
  }, []);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  };

  const refresh = async () => {
    if (!user) {
      setPhase("default");
      return;
    }
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("cycle_length,period_length,last_period_start")
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: per } = await supabase
        .from("periods")
        .select("start_date,end_date")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (!p) return;
      const profile: CycleProfile = {
        cycle_length: p.cycle_length,
        period_length: p.period_length,
        last_period_start: p.last_period_start,
      };
      const periods: PeriodEntry[] = per ?? [];
      const stats = computeStats(profile, periods);
      setPhase(mapPhase(stats?.currentPhase));
    } catch {
      // Silent — ambient should never break the app
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <Ctx.Provider value={{ phase, enabled, setEnabled, refresh }}>{children}</Ctx.Provider>
  );
}

export const useAmbient = () => useContext(Ctx);
