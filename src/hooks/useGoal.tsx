import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Goal = "tracking" | "conceive" | "avoid";

export const goalLabel: Record<Goal, string> = {
  tracking: "Track",
  conceive: "Conceive",
  avoid: "Avoid",
};

export const goalDescription: Record<Goal, string> = {
  tracking: "Neutral cycle tracking and insights.",
  conceive: "Highlight your fertile window and high-chance days.",
  avoid: "Highlight safe days and low-risk days.",
};

interface GoalContextValue {
  goal: Goal;
  setGoal: (g: Goal) => Promise<void>;
  loading: boolean;
}

const GoalContext = createContext<GoalContextValue | undefined>(undefined);

export function GoalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [goal, setGoalState] = useState<Goal>("tracking");
  const [loading, setLoading] = useState(true);

  // Load from DB whenever user changes
  useEffect(() => {
    if (!user) {
      setGoalState("tracking");
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("intention")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (data?.intention) {
        setGoalState(data.intention as Goal);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const setGoal = useCallback(
    async (next: Goal) => {
      const previous = goal;
      // Optimistic update — instant UI everywhere
      setGoalState(next);
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ intention: next })
        .eq("user_id", user.id);
      if (error) {
        // Roll back on failure
        setGoalState(previous);
        throw error;
      }
    },
    [user, goal],
  );

  return (
    <GoalContext.Provider value={{ goal, setGoal, loading }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoal() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error("useGoal must be used within GoalProvider");
  return ctx;
}
