import { useState, useEffect, useCallback } from "react";
import { format, subDays, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  fmt,
  computeStats,
  type CycleProfile,
  type PeriodEntry,
  type DailySymptomLog,
  type CycleStats,
} from "@/lib/cycle";
import type { Goal } from "@/hooks/useGoal";

const STORAGE_KEYS = {
  PROFILE: "cyclenova_profile_v2",
  PERIODS: "cyclenova_periods_v2",
  SYMPTOMS: "cyclenova_symptoms_v2",
  GOAL: "cyclenova_goal_v2",
  PRIVACY: "cyclenova_privacy_mode",
};

export const DEFAULT_PROFILE: CycleProfile = {
  cycle_length: 28,
  period_length: 5,
  luteal_length: 14,
  last_period_start: fmt(subDays(new Date(), 12)), // currently on Day 13 (near fertile/ovulation)
  irregular_cycles: false,
};

export interface CycleStoreState {
  profile: CycleProfile;
  periods: PeriodEntry[];
  symptoms: Record<string, DailySymptomLog>;
  goal: Goal;
  privacyMode: boolean;
  stats: CycleStats | null;
  isGuest: boolean;
  isLoaded: boolean;
}

/**
 * Creates 4 months of realistic sample data for demoing and testing.
 */
export function generateSampleData(): {
  profile: CycleProfile;
  periods: PeriodEntry[];
  symptoms: Record<string, DailySymptomLog>;
} {
  const today = new Date();
  // 4 past cycles: 28 days, 27 days, 29 days, currently on day 12 of 28
  const cycle4Start = subDays(today, 12); // Day 13 of current cycle
  const cycle3Start = subDays(cycle4Start, 28);
  const cycle2Start = subDays(cycle3Start, 27);
  const cycle1Start = subDays(cycle2Start, 29);

  const periods: PeriodEntry[] = [
    {
      id: "cycle-4",
      start_date: fmt(cycle4Start),
      end_date: fmt(addDays(cycle4Start, 4)),
      flow_intensity: "medium",
      pain_level: 4,
      notes: "Started in the morning, mild cramping.",
    },
    {
      id: "cycle-3",
      start_date: fmt(cycle3Start),
      end_date: fmt(addDays(cycle3Start, 4)),
      flow_intensity: "heavy",
      pain_level: 6,
      notes: "Heavy on day 2. Used heating pad.",
    },
    {
      id: "cycle-2",
      start_date: fmt(cycle2Start),
      end_date: fmt(addDays(cycle2Start, 5)),
      flow_intensity: "medium",
      pain_level: 3,
      notes: "Comfortable cycle.",
    },
    {
      id: "cycle-1",
      start_date: fmt(cycle1Start),
      end_date: fmt(addDays(cycle1Start, 4)),
      flow_intensity: "light",
      pain_level: 2,
      notes: "Light spotting on first day.",
    },
  ];

  const symptoms: Record<string, DailySymptomLog> = {};

  // Populate some realistic symptom logs
  for (let i = 0; i < 90; i++) {
    const d = subDays(today, i);
    const dateStr = fmt(d);

    // Randomize realistic logs
    const isPeriodDay = periods.some((p) => {
      const s = p.start_date;
      const e = p.end_date || p.start_date;
      return dateStr >= s && dateStr <= e;
    });

    if (isPeriodDay) {
      symptoms[dateStr] = {
        log_date: dateStr,
        flow: i % 2 === 0 ? "heavy" : "medium",
        cramps: 6,
        fatigue: 7,
        bloating: 5,
        energy: 2,
        sleep: 3,
        mood_tags: ["Tired", "Reflective"],
        temperature_c: 36.3,
      };
    } else if (i >= 10 && i <= 15) {
      // Near ovulation
      symptoms[dateStr] = {
        log_date: dateStr,
        energy: 5,
        libido: 5,
        mucus: "eggwhite",
        temperature_c: 36.4,
        mood_tags: ["Energetic", "Confident", "Happy"],
      };
    } else if (i >= 24 && i <= 27) {
      // Pre-menstrual
      symptoms[dateStr] = {
        log_date: dateStr,
        bloating: 7,
        cravings: 8,
        headache: 4,
        mood: 7,
        energy: 2,
        mood_tags: ["Irritable", "Craving sweets"],
        temperature_c: 36.8,
      };
    }
  }

  const profile: CycleProfile = {
    cycle_length: 28,
    period_length: 5,
    luteal_length: 14,
    last_period_start: fmt(cycle4Start),
    irregular_cycles: false,
  };

  return { profile, periods, symptoms };
}

// Memory cache to share across hook instances
let cachedState: CycleStoreState = {
  profile: DEFAULT_PROFILE,
  periods: [],
  symptoms: {},
  goal: "tracking",
  privacyMode: false,
  stats: null,
  isGuest: true,
  isLoaded: false,
};

const listeners = new Set<(state: CycleStoreState) => void>();

function notify() {
  cachedState = {
    ...cachedState,
    stats: computeStats(cachedState.profile, cachedState.periods),
  };
  listeners.forEach((listener) => listener(cachedState));
}

export function useCycleStore() {
  const [state, setState] = useState<CycleStoreState>(cachedState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  // Initial loader
  useEffect(() => {
    if (cachedState.isLoaded) return;

    try {
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const storedPeriods = localStorage.getItem(STORAGE_KEYS.PERIODS);
      const storedSymptoms = localStorage.getItem(STORAGE_KEYS.SYMPTOMS);
      const storedGoal = localStorage.getItem(STORAGE_KEYS.GOAL);
      const storedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY);

      let profile = storedProfile ? JSON.parse(storedProfile) : DEFAULT_PROFILE;
      let periods = storedPeriods ? JSON.parse(storedPeriods) : [];
      let symptoms = storedSymptoms ? JSON.parse(storedSymptoms) : {};
      let goal: Goal = storedGoal ? (storedGoal as Goal) : "tracking";
      let privacyMode = storedPrivacy === "true";

      // If no periods exist yet, seed a default period for the active cycle
      if (periods.length === 0 && profile.last_period_start) {
        periods = [
          {
            id: "initial-period",
            start_date: profile.last_period_start,
            end_date: fmt(addDays(new Date(profile.last_period_start), (profile.period_length || 5) - 1)),
            flow_intensity: "medium",
          },
        ];
      }

      cachedState = {
        profile,
        periods,
        symptoms,
        goal,
        privacyMode,
        stats: computeStats(profile, periods),
        isGuest: true,
        isLoaded: true,
      };

      notify();

      // Check if logged into Supabase and attempt cloud sync
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          cachedState.isGuest = false;
          // Hydrate from Supabase
          void syncFromSupabase(session.user.id);
        }
      });
    } catch (e) {
      console.error("Error hydrating cycle store:", e);
      cachedState.isLoaded = true;
      notify();
    }
  }, []);

  const syncFromSupabase = async (userId: string) => {
    try {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (p) {
        cachedState.profile = {
          cycle_length: p.cycle_length || cachedState.profile.cycle_length,
          period_length: p.period_length || cachedState.profile.period_length,
          last_period_start: p.last_period_start || cachedState.profile.last_period_start,
          luteal_length: 14,
        };
        if (p.intention) {
          cachedState.goal = p.intention as Goal;
        }
      }

      const { data: per } = await supabase
        .from("periods")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      if (per && per.length > 0) {
        cachedState.periods = per.map((entry) => ({
          id: entry.id,
          start_date: entry.start_date,
          end_date: entry.end_date,
        }));
      }

      persistLocal();
      notify();
    } catch (err) {
      console.warn("Could not sync with Supabase (operating in offline/guest mode):", err);
    }
  };

  const persistLocal = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cachedState.profile));
      localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(cachedState.periods));
      localStorage.setItem(STORAGE_KEYS.SYMPTOMS, JSON.stringify(cachedState.symptoms));
      localStorage.setItem(STORAGE_KEYS.GOAL, cachedState.goal);
      localStorage.setItem(STORAGE_KEYS.PRIVACY, cachedState.privacyMode ? "true" : "false");
    } catch (e) {
      console.error("Failed to persist to localStorage:", e);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<CycleProfile>) => {
      cachedState.profile = { ...cachedState.profile, ...updates };
      persistLocal();
      notify();

      // Background sync to Supabase if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("profiles")
          .update({
            cycle_length: cachedState.profile.cycle_length,
            period_length: cachedState.profile.period_length,
            last_period_start: cachedState.profile.last_period_start,
          })
          .eq("user_id", session.user.id);
      }
    },
    [persistLocal]
  );

  const setGoal = useCallback(
    async (newGoal: Goal) => {
      cachedState.goal = newGoal;
      persistLocal();
      notify();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").update({ intention: newGoal }).eq("user_id", session.user.id);
      }
    },
    [persistLocal]
  );

  const togglePrivacyMode = useCallback(() => {
    cachedState.privacyMode = !cachedState.privacyMode;
    persistLocal();
    notify();
  }, [persistLocal]);

  const logPeriodToday = useCallback(
    async (flow: CycleProfile["last_period_start"] = fmt(new Date())) => {
      const today = fmt(new Date());
      const newEntry: PeriodEntry = {
        id: `local-period-${Date.now()}`,
        start_date: today,
        end_date: null,
        flow_intensity: "medium",
      };

      // Add to beginning of periods if not already logged today
      const exists = cachedState.periods.some((p) => p.start_date === today);
      if (!exists) {
        cachedState.periods = [newEntry, ...cachedState.periods];
      }
      cachedState.profile = {
        ...cachedState.profile,
        last_period_start: today,
      };

      persistLocal();
      notify();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("periods").insert({ user_id: session.user.id, start_date: today });
        await supabase.from("profiles").update({ last_period_start: today }).eq("user_id", session.user.id);
      }
    },
    [persistLocal]
  );

  const endPeriodToday = useCallback(async () => {
    const today = fmt(new Date());
    if (cachedState.periods.length > 0) {
      const first = { ...cachedState.periods[0], end_date: today };
      cachedState.periods = [first, ...cachedState.periods.slice(1)];
      persistLocal();
      notify();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && first.id) {
        await supabase.from("periods").update({ end_date: today }).eq("id", first.id);
      }
    }
  }, [persistLocal]);

  const savePeriod = useCallback(
    async (entry: PeriodEntry) => {
      const existingIdx = cachedState.periods.findIndex(
        (p) => (entry.id && p.id === entry.id) || p.start_date === entry.start_date
      );

      if (existingIdx >= 0) {
        cachedState.periods[existingIdx] = { ...cachedState.periods[existingIdx], ...entry };
      } else {
        cachedState.periods = [entry, ...cachedState.periods].sort((a, b) =>
          b.start_date.localeCompare(a.start_date)
        );
      }

      if (
        !cachedState.profile.last_period_start ||
        entry.start_date >= cachedState.profile.last_period_start
      ) {
        cachedState.profile.last_period_start = entry.start_date;
      }

      persistLocal();
      notify();
    },
    [persistLocal]
  );

  const deletePeriod = useCallback(
    async (startDate: string) => {
      cachedState.periods = cachedState.periods.filter((p) => p.start_date !== startDate);
      if (cachedState.profile.last_period_start === startDate) {
        cachedState.profile.last_period_start = cachedState.periods[0]?.start_date || null;
      }
      persistLocal();
      notify();
    },
    [persistLocal]
  );

  const saveSymptomLog = useCallback(
    async (log: DailySymptomLog) => {
      cachedState.symptoms = {
        ...cachedState.symptoms,
        [log.log_date]: log,
      };
      persistLocal();
      notify();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const dbPayload: Record<string, unknown> = {
          user_id: session.user.id,
          log_date: log.log_date,
          cramps: log.cramps,
          headache: log.headache,
          mood: log.mood,
          acne: log.acne,
          bloating: log.bloating,
          back_pain: log.back_pain,
          fatigue: log.fatigue,
          energy: log.energy,
          sleep: log.sleep,
          libido: log.libido,
        };
        // Clean undefined values
        Object.keys(dbPayload).forEach(
          (k) => dbPayload[k] === undefined && delete dbPayload[k]
        );
        await (supabase.from("symptoms") as any).upsert(dbPayload, {
          onConflict: "user_id,log_date",
        });
      }
    },
    [persistLocal]
  );

  const getSymptomLog = useCallback(
    (dateStr: string): DailySymptomLog | undefined => {
      return cachedState.symptoms[dateStr];
    },
    []
  );

  const loadSampleJourney = useCallback(() => {
    const sample = generateSampleData();
    cachedState.profile = sample.profile;
    cachedState.periods = sample.periods;
    cachedState.symptoms = sample.symptoms;
    persistLocal();
    notify();
  }, [persistLocal]);

  const resetAllData = useCallback(() => {
    cachedState.profile = DEFAULT_PROFILE;
    cachedState.periods = [
      {
        id: "fresh-period",
        start_date: DEFAULT_PROFILE.last_period_start!,
        end_date: fmt(addDays(new Date(DEFAULT_PROFILE.last_period_start!), 4)),
      },
    ];
    cachedState.symptoms = {};
    cachedState.goal = "tracking";
    persistLocal();
    notify();
  }, [persistLocal]);

  const exportDataJson = useCallback(() => {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      profile: cachedState.profile,
      periods: cachedState.periods,
      symptoms: cachedState.symptoms,
      goal: cachedState.goal,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyclenova-health-backup-${fmt(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importDataJson = useCallback(
    (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.profile) cachedState.profile = parsed.profile;
        if (Array.isArray(parsed.periods)) cachedState.periods = parsed.periods;
        if (parsed.symptoms) cachedState.symptoms = parsed.symptoms;
        if (parsed.goal) cachedState.goal = parsed.goal;
        persistLocal();
        notify();
        return true;
      } catch (err) {
        console.error("Failed to import JSON data:", err);
        return false;
      }
    },
    [persistLocal]
  );

  return {
    ...state,
    updateProfile,
    setGoal,
    togglePrivacyMode,
    logPeriodToday,
    endPeriodToday,
    savePeriod,
    deletePeriod,
    saveSymptomLog,
    getSymptomLog,
    loadSampleJourney,
    resetAllData,
    exportDataJson,
    importDataJson,
  };
}

