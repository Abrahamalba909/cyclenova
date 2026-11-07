import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Droplet, Sparkles, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDayPhase,
  type CycleProfile,
  type PeriodEntry,
  type Phase,
  phaseLabel,
  phaseColorMap,
} from "@/lib/cycle";
import { useGoal, type Goal } from "@/hooks/useGoal";
import { cn } from "@/lib/utils";

interface Props {
  profile: CycleProfile;
  periods: PeriodEntry[];
  selected: Date;
  onSelect: (d: Date) => void;
  onOpenLog?: (d: Date) => void;
  loggedDates?: string[]; // dates that have symptoms logged YYYY-MM-DD
}

const phaseColorClasses: Record<Phase, string> = {
  menstrual: "bg-rose-500 text-white font-bold shadow-xs",
  period: "bg-rose-500 text-white font-bold shadow-xs",
  follicular: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold",
  fertile: "bg-amber-400/30 text-amber-900 dark:text-amber-200 font-bold border border-amber-400/40",
  ovulation: "bg-amber-500 text-white font-extrabold shadow-sm ring-2 ring-amber-400/50",
  luteal: "bg-violet-500/20 text-violet-800 dark:text-violet-300 font-medium",
  pms: "bg-orange-500/25 text-orange-800 dark:text-orange-300 font-medium",
  normal: "bg-transparent text-foreground hover:bg-muted",
};

export function CycleCalendar({
  profile,
  periods,
  selected,
  onSelect,
  onOpenLog,
  loggedDates = [],
}: Props) {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const { goal } = useGoal();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedPhase = getDayPhase(selected, profile, periods);

  // Check if a day has actual logged period entry
  const hasLoggedPeriod = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return periods.some((p) => {
      const s = p.start_date;
      const e = p.end_date || p.start_date;
      return dStr >= s && dStr <= e;
    });
  };

  const hasLoggedSymptom = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return loggedDates.includes(dStr);
  };

  return (
    <div className="bg-card rounded-3xl p-5 shadow-soft border">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl font-bold">{format(month, "MMMM yyyy")}</h3>
          <p className="text-xs text-muted-foreground">Tap any date to inspect or log</p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setMonth(startOfMonth(new Date()));
              onSelect(new Date());
            }}
            className="rounded-full h-8 text-xs font-semibold px-3"
          >
            Today
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonth(addMonths(month, -1))}
            className="rounded-full h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-full h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-muted-foreground uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const phase = getDayPhase(day, profile, periods);
          const isCurMonth = isSameMonth(day, month);
          const isSel = isSameDay(day, selected);
          const isCurrentDay = isToday(day);
          const isPeriod = hasLoggedPeriod(day);
          const isSymp = hasLoggedSymptom(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "relative aspect-square rounded-2xl flex flex-col items-center justify-center text-xs transition-all",
                phaseColorClasses[phase],
                !isCurMonth && "opacity-25",
                isSel && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105 z-10",
                isCurrentDay && !isSel && "ring-2 ring-foreground/30 font-bold",
                "hover:scale-102"
              )}
            >
              <span>{format(day, "d")}</span>

              {/* Status indicators under date number */}
              <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                {isPeriod && <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />}
                {isSymp && <span className="h-1 w-1 rounded-full bg-primary" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary & Quick Log button */}
      <div className="mt-5 p-3.5 rounded-2xl bg-muted/40 border flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">
            {format(selected, "EEEE, MMMM d")}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {phaseLabel[selectedPhase]}
          </p>
        </div>

        {onOpenLog && (
          <Button
            size="sm"
            onClick={() => onOpenLog(selected)}
            className="rounded-full bg-gradient-primary font-semibold text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Day
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
            <span className="text-muted-foreground font-medium">Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500/40 shrink-0" />
            <span className="text-muted-foreground font-medium">Follicular</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-400 shrink-0" />
            <span className="text-muted-foreground font-medium">Fertile Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-300 shrink-0" />
            <span className="text-muted-foreground font-medium">Ovulation Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-violet-500/40 shrink-0" />
            <span className="text-muted-foreground font-medium">Luteal Phase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
