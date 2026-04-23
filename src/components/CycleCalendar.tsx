import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDayPhase, type CycleProfile, type PeriodEntry, type Phase } from "@/lib/cycle";
import { useGoal, type Goal } from "@/hooks/useGoal";
import { cn } from "@/lib/utils";

interface Props {
  profile: CycleProfile;
  periods: PeriodEntry[];
  selected: Date;
  onSelect: (d: Date) => void;
}

const phaseStyle: Record<Phase, string> = {
  period: "bg-[var(--period)] text-white",
  fertile: "bg-[var(--fertile)] text-foreground",
  ovulation: "bg-[var(--ovulation)] text-white",
  pms: "bg-[var(--pms)]/40 text-foreground",
  normal: "bg-transparent text-foreground hover:bg-muted",
};

interface LegendItem {
  color: string;
  label: string;
}

function legendForGoal(goal: Goal): LegendItem[] {
  if (goal === "conceive") {
    return [
      { color: "var(--period)", label: "Period" },
      { color: "var(--fertile)", label: "High-chance days" },
      { color: "var(--ovulation)", label: "Peak fertility" },
      { color: "var(--pms)", label: "Two-week wait" },
    ];
  }
  if (goal === "avoid") {
    return [
      { color: "var(--period)", label: "Period (safe)" },
      { color: "var(--fertile)", label: "High pregnancy risk" },
      { color: "var(--ovulation)", label: "Peak risk day" },
      { color: "oklch(0.78 0.14 150)", label: "Low-risk / safe days" },
    ];
  }
  return [
    { color: "var(--period)", label: "Period" },
    { color: "var(--fertile)", label: "Fertile" },
    { color: "var(--ovulation)", label: "Ovulation" },
    { color: "var(--pms)", label: "PMS" },
  ];
}

const goalCaption: Record<Goal, string> = {
  tracking: "Phase view — neutral cycle tracking.",
  conceive: "Time intimacy on high-chance days for the best chance to conceive.",
  avoid: "Plan around the high-risk window. Days outside it are lower risk.",
};

export function CycleCalendar({ profile, periods, selected, onSelect }: Props) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const { goal } = useGoal();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const legend = legendForGoal(goal);

  return (
    <div className="bg-card rounded-3xl p-5 shadow-soft border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setMonth(addMonths(month, -1))} className="rounded-full h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setMonth(addMonths(month, 1))} className="rounded-full h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const phase = getDayPhase(day, profile, periods);
          const isCur = isSameMonth(day, month);
          const isSel = isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center text-sm transition-all relative",
                phaseStyle[phase],
                !isCur && "opacity-30",
                isSel && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105",
                isToday(day) && !isSel && "ring-1 ring-foreground/40",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {legend.map((l) => (
            <Legend key={l.label} color={l.color} label={l.label} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-snug">{goalCaption[goal]}</p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="leading-tight">{label}</span>
    </div>
  );
}
