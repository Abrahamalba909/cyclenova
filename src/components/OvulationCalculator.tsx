import { format, isSameDay, differenceInCalendarDays } from "date-fns";
import { Sparkles, Heart, Shield, Flame } from "lucide-react";
import type { CycleStats } from "@/lib/cycle";
import type { Goal } from "@/hooks/useGoal";

interface Props {
  stats: CycleStats;
  today?: Date;
  goal?: Goal;
}

type FertilityStatus = "high" | "ovulation" | "safe";

function getStatus(today: Date, stats: CycleStats): FertilityStatus {
  if (isSameDay(today, stats.ovulationDay)) return "ovulation";
  if (today >= stats.fertileWindow.start && today <= stats.fertileWindow.end) return "high";
  return "safe";
}

const statusMeta: Record<
  FertilityStatus,
  { label: string; sub: string; icon: typeof Flame; bg: string; fg: string; ring: string }
> = {
  high: {
    label: "High chance of pregnancy",
    sub: "You're in your fertile window",
    icon: Flame,
    bg: "color-mix(in oklab, var(--period) 14%, transparent)",
    fg: "var(--period)",
    ring: "var(--period)",
  },
  ovulation: {
    label: "Ovulation Day",
    sub: "Peak fertility today",
    icon: Sparkles,
    bg: "color-mix(in oklab, var(--ovulation) 18%, transparent)",
    fg: "var(--ovulation)",
    ring: "var(--ovulation)",
  },
  safe: {
    label: "Low pregnancy risk",
    sub: "Outside your fertile window",
    icon: Shield,
    bg: "color-mix(in oklab, oklch(0.7 0.14 150) 16%, transparent)",
    fg: "oklch(0.45 0.14 150)",
    ring: "oklch(0.6 0.14 150)",
  },
};

export function OvulationCalculator({ stats, today = new Date(), goal = "tracking" }: Props) {
  const status = getStatus(today, stats);
  const meta = statusMeta[status];
  const Icon = meta.icon;
  const daysToOvulation = differenceInCalendarDays(stats.ovulationDay, today);

  const goalBanner =
    goal === "conceive"
      ? { text: "Trying to conceive — fertile days are highlighted.", color: "var(--period)" }
      : goal === "avoid"
        ? { text: "Avoiding pregnancy — safe days are highlighted.", color: "oklch(0.45 0.14 150)" }
        : null;

  return (
    <section
      aria-labelledby="ovulation-heading"
      className="bg-card border rounded-3xl p-5 shadow-soft"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 id="ovulation-heading" className="font-display text-lg font-semibold">
            Ovulation Calculator
          </h2>
        </div>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          {stats.averageCycleLength}-day cycle
        </span>
      </div>

      {goalBanner && (
        <div
          className="mb-3 rounded-xl px-3 py-2 text-xs font-medium"
          style={{
            background: `color-mix(in oklab, ${goalBanner.color} 12%, transparent)`,
            color: goalBanner.color,
            border: `1px solid color-mix(in oklab, ${goalBanner.color} 30%, transparent)`,
          }}
        >
          {goalBanner.text}
        </div>
      )}

      {/* Hero status pill */}
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: meta.bg,
          border: `1px solid color-mix(in oklab, ${meta.ring} 35%, transparent)`,
        }}
      >
        <div
          className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklab, ${meta.fg} 22%, transparent)`, color: meta.fg }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold leading-tight" style={{ color: meta.fg }}>
            {meta.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.sub}</p>
        </div>
      </div>

      {/* Key dates grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <KeyDate
          label="Ovulation"
          value={format(stats.ovulationDay, "MMM d")}
          sub={
            daysToOvulation === 0
              ? "Today"
              : daysToOvulation > 0
                ? `In ${daysToOvulation}d`
                : `${Math.abs(daysToOvulation)}d ago`
          }
          color="var(--ovulation)"
        />
        <KeyDate
          label="Fertile from"
          value={format(stats.fertileWindow.start, "MMM d")}
          sub={`to ${format(stats.fertileWindow.end, "MMM d")}`}
          color="var(--period)"
        />
        <KeyDate
          label="Next period"
          value={format(stats.nextPeriodStart, "MMM d")}
          sub={`Day ${stats.cycleDay}`}
          color="var(--primary)"
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <LegendDot color="var(--period)" label="High chance" />
        <LegendDot color="var(--ovulation)" label="Ovulation" />
        <LegendDot color="oklch(0.6 0.14 150)" label="Low risk" />
      </div>
    </section>
  );
}

function KeyDate({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
        <Heart className="h-3 w-3" fill="currentColor" />
        {label}
      </div>
      <p className="font-display text-base font-bold mt-1.5 leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
