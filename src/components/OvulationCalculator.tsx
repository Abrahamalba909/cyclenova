import { format, isSameDay, differenceInCalendarDays } from "date-fns";
import { Sparkles, Heart, Shield, Flame, Activity, Thermometer, Info } from "lucide-react";
import type { CycleStats } from "@/lib/cycle";
import type { Goal } from "@/hooks/useGoal";

interface Props {
  stats: CycleStats;
  today?: Date;
  goal?: Goal;
}

export function OvulationCalculator({ stats, today = new Date(), goal = "tracking" }: Props) {
  const isOvulationDay = isSameDay(today, stats.ovulationDay);
  const isInFertileWindow = today >= stats.fertileWindow.start && today <= stats.fertileWindow.end;
  const daysToOvulation = differenceInCalendarDays(stats.ovulationDay, today);

  return (
    <section
      aria-labelledby="ovulation-heading"
      className="bg-card border rounded-3xl p-5 shadow-soft space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 id="ovulation-heading" className="font-display text-lg font-bold">
              Ovulation & Fertility Intelligence
            </h2>
            <p className="text-xs text-muted-foreground">
              {stats.lutealLength}-day luteal phase model
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-foreground">
          {stats.conceptionChance.toUpperCase()} CHANCE
        </span>
      </div>

      {/* Hero Banner based on Goal */}
      {goal === "conceive" ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
            <Heart className="h-4 w-4 fill-amber-500 text-amber-500" /> Trying to Conceive (TTC) Mode
          </p>
          <p className="text-sm font-semibold mt-1">
            {isInFertileWindow
              ? isOvulationDay
                ? "Peak fertility today! Best timing for conception."
                : "High-chance fertile window is active."
              : daysToOvulation > 0
                ? `Next fertile window opens in ${Math.max(0, daysToOvulation - 5)} days.`
                : "Fertile window has passed for this cycle."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fertile window: {format(stats.fertileWindow.start, "MMM d")} – {format(stats.fertileWindow.end, "MMM d")}. Look for clear, stretchy cervical fluid.
          </p>
        </div>
      ) : goal === "avoid" ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Natural Prevention Mode
          </p>
          <p className="text-sm font-semibold mt-1">
            {isInFertileWindow
              ? "High pregnancy risk! Strict barrier protection or abstinence recommended."
              : "Lower probability pregnancy days outside the fertile window."}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Caution window: {format(stats.fertileWindow.start, "MMM d")} – {format(stats.fertileWindow.end, "MMM d")}. Standard calendar estimates should be combined with symptom tracking.
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-background/50 border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">
              Predicted Ovulation: {format(stats.ovulationDay, "EEEE, MMMM d")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fertile span: {format(stats.fertileWindow.start, "MMM d")} – {format(stats.fertileWindow.end, "MMM d")}
            </p>
          </div>
          <span className="text-xs font-bold text-primary">
            {daysToOvulation === 0
              ? "Today!"
              : daysToOvulation > 0
                ? `in ${daysToOvulation}d`
                : `${Math.abs(daysToOvulation)}d ago`}
          </span>
        </div>
      )}

      {/* Ovulation Signs Guide */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-2xl border bg-background/40">
          <p className="font-bold text-foreground flex items-center gap-1.5 mb-1">
            <Thermometer className="h-3.5 w-3.5 text-cyan-500" /> Thermal Shift
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Basal temperature jumps ~0.3°C immediately after ovulation and stays elevated through the luteal phase.
          </p>
        </div>

        <div className="p-3 rounded-2xl border bg-background/40">
          <p className="font-bold text-foreground flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Cervical Fluid
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Watery, clear, raw egg-white consistency creates the optimal nutrient channel for sperm survival.
          </p>
        </div>
      </div>
    </section>
  );
}
