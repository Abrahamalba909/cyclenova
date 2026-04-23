// Canonical profile + goal API. Used by any screen or background job
// that needs ONE consistent value for the user's goal.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Goal = "tracking" | "conceive" | "avoid";

export interface UserProfileResponse {
  user_id: string;
  display_name: string | null;
  goal: Goal; // canonical name used by all clients
  intention: Goal; // legacy alias kept for backwards compatibility
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
  onboarded: boolean;
  notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}

const DEFAULT_GOAL: Goal = "tracking";

function normalizeGoal(value: unknown): Goal {
  if (value === "conceive" || value === "avoid" || value === "tracking") return value;
  return DEFAULT_GOAL;
}

/**
 * Returns the authenticated user's profile with `goal` exposed as a
 * first-class field. Every screen and background job should use this
 * shape so the goal value stays consistent across the app.
 */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserProfileResponse> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, intention, cycle_length, period_length, last_period_start, onboarded, notifications_enabled, email_notifications_enabled",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      // Return a safe default shape if the profile row hasn't been created yet.
      return {
        user_id: userId,
        display_name: null,
        goal: DEFAULT_GOAL,
        intention: DEFAULT_GOAL,
        cycle_length: 28,
        period_length: 5,
        last_period_start: null,
        onboarded: false,
        notifications_enabled: true,
        email_notifications_enabled: true,
      };
    }

    const goal = normalizeGoal(data.intention);
    return {
      user_id: data.user_id,
      display_name: data.display_name,
      goal,
      intention: goal,
      cycle_length: data.cycle_length,
      period_length: data.period_length,
      last_period_start: data.last_period_start,
      onboarded: data.onboarded,
      notifications_enabled: data.notifications_enabled,
      email_notifications_enabled: data.email_notifications_enabled,
    };
  });

/**
 * Server-authoritative goal update. Use this for background jobs or
 * any non-React surface that needs to set the goal consistently.
 */
export const updateMyGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { goal: Goal }) => {
    const goal = normalizeGoal(input?.goal);
    return { goal };
  })
  .handler(async ({ data, context }): Promise<{ goal: Goal }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ intention: data.goal })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { goal: data.goal };
  });
