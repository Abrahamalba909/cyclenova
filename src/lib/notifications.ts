// Goal-aware push notification templates.
// Used both by the client (preview in Settings) and the server (job dispatch).
import type { Goal } from "@/hooks/useGoal";
import type { CycleStats } from "@/lib/cycle";
import { format } from "date-fns";

export type NotificationKind =
  | "period_upcoming"
  | "period_started"
  | "fertile_window_open"
  | "ovulation_today"
  | "pms_heads_up"
  | "daily_check_in";

export interface NotificationTemplate {
  kind: NotificationKind;
  title: string;
  body: string;
}

const fmtDay = (d: Date) => format(d, "MMM d");

/**
 * Builds a goal-aware push notification for a given event.
 * - "conceive" emphasizes high-chance / fertile alerts
 * - "avoid"    emphasizes low-risk reminders & caution windows
 * - "tracking" stays neutral and informative
 */
export function buildNotification(
  kind: NotificationKind,
  goal: Goal,
  stats: CycleStats,
): NotificationTemplate {
  const ov = fmtDay(stats.ovulationDay);
  const fStart = fmtDay(stats.fertileWindow.start);
  const fEnd = fmtDay(stats.fertileWindow.end);
  const nextP = fmtDay(stats.nextPeriodStart);

  switch (kind) {
    case "fertile_window_open":
      if (goal === "conceive")
        return {
          kind,
          title: "🌸 Your fertile window is open",
          body: `High chance days have started (${fStart}–${fEnd}). Peak conception around ${ov}.`,
        };
      if (goal === "avoid")
        return {
          kind,
          title: "⚠️ Higher pregnancy risk window",
          body: `You're entering your fertile window (${fStart}–${fEnd}). Take extra care if avoiding pregnancy.`,
        };
      return {
        kind,
        title: "Fertile window opening",
        body: `Your fertile days are ${fStart}–${fEnd}, with ovulation around ${ov}.`,
      };

    case "ovulation_today":
      if (goal === "conceive")
        return {
          kind,
          title: "💖 Today is your peak fertility day",
          body: `Ovulation is predicted today — your highest chance to conceive this cycle.`,
        };
      if (goal === "avoid")
        return {
          kind,
          title: "⚠️ Highest risk day today",
          body: `You're likely ovulating today. This is your highest pregnancy-risk day — take precautions.`,
        };
      return {
        kind,
        title: "Ovulation today",
        body: `Your body is likely ovulating today.`,
      };

    case "period_upcoming":
      if (goal === "conceive")
        return {
          kind,
          title: "Period expected soon",
          body: `Your period is predicted around ${nextP}. If it's late, consider a test.`,
        };
      if (goal === "avoid")
        return {
          kind,
          title: "✅ Low-risk days ahead",
          body: `Your period is expected around ${nextP}. You're past the fertile window — low pregnancy risk.`,
        };
      return {
        kind,
        title: "Period expected soon",
        body: `Your next period is predicted around ${nextP}.`,
      };

    case "period_started":
      return {
        kind,
        title: "Time to log your period?",
        body:
          goal === "conceive"
            ? "Looks like your period may have started. Logging helps refine your fertile window predictions."
            : goal === "avoid"
              ? "Your period may have started — a confirmed safe-day signal. Tap to log it."
              : "Your period may have started today. Tap to log it.",
      };

    case "pms_heads_up":
      return {
        kind,
        title: "PMS phase incoming",
        body:
          goal === "conceive"
            ? "PMS phase started. Two-week wait is almost over — period expected around " + nextP + "."
            : goal === "avoid"
              ? "PMS phase — you're in low-risk days. Period expected around " + nextP + "."
              : "PMS phase — be gentle with yourself. Period around " + nextP + ".",
      };

    case "daily_check_in":
      if (goal === "conceive")
        return {
          kind,
          title: "Daily check-in 💕",
          body: `Cycle day ${stats.cycleDay}. Ovulation around ${ov} — log symptoms to sharpen predictions.`,
        };
      if (goal === "avoid")
        return {
          kind,
          title: "Daily check-in 🛡️",
          body: `Cycle day ${stats.cycleDay}. Fertile window: ${fStart}–${fEnd}. Plan accordingly.`,
        };
      return {
        kind,
        title: "Daily check-in",
        body: `Cycle day ${stats.cycleDay}. Next period around ${nextP}.`,
      };
  }
}

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  fertile_window_open: "Fertile window opens",
  ovulation_today: "Ovulation day",
  period_upcoming: "Period upcoming",
  period_started: "Period may have started",
  pms_heads_up: "PMS heads-up",
  daily_check_in: "Daily check-in",
};
