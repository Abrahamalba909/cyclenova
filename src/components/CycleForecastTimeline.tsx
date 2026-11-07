import { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { Calendar, Sparkles, Droplet, ChevronRight, AlertCircle, Heart } from "lucide-react";
import { predictUpcomingCycles, type CycleProfile, type PeriodEntry } from "@/lib/cycle";

interface Props {
  profile: CycleProfile;
  periods: PeriodEntry[];
}

export function CycleForecastTimeline({ profile, periods }: Props) {
  const [monthsCount, setMonthsCount] = useState<number>(3);
  const predictions = predictUpcomingCycles(profile, periods, monthsCount);

  if (predictions.length === 0) return null;

  return (
    <div className="bg-card border rounded-3xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold">Upcoming Cycle Forecast</h3>
            <p className="text-[11px] text-muted-foreground">Smart predictions for your schedule</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-full text-[11px]">
          <button
            onClick={() => setMonthsCount(3)}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              monthsCount === 3 ? "bg-card shadow-xs text-foreground font-bold" : "text-muted-foreground"
            }`}
          >
            3 Mo
          </button>
          <button
            onClick={() => setMonthsCount(6)}
            className={`px-2.5 py-1 rounded-full font-medium transition-all ${
              monthsCount === 6 ? "bg-card shadow-xs text-foreground font-bold" : "text-muted-foreground"
            }`}
          >
            6 Mo
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((cycle) => (
          <div
            key={cycle.cycleNumber}
            className="p-3.5 rounded-2xl border bg-background/50 hover:bg-background/80 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Cycle #{cycle.cycleNumber}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  in {cycle.daysUntilStart} days
                </span>
              </div>

              <span className="text-[10px] text-muted-foreground bg-card border px-2 py-0.5 rounded-full">
                Confidence ±{cycle.confidenceWindowDays}d
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-[10px] uppercase font-bold text-rose-500 flex items-center gap-1">
                  <Droplet className="h-3 w-3" /> Predicted Period
                </p>
                <p className="font-semibold text-foreground mt-0.5">
                  {format(cycle.startDate, "MMM d")} – {format(cycle.endDate, "MMM d, yyyy")}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Fertile & Ovulation
                </p>
                <p className="font-semibold text-foreground mt-0.5">
                  {format(cycle.fertileStart, "MMM d")} – {format(cycle.fertileEnd, "MMM d")}
                  <span className="block text-[10px] text-muted-foreground font-normal">
                    Peak: {format(cycle.ovulationDate, "MMM d")}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

