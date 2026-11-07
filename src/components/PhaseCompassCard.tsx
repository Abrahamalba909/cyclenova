import { Sparkles, Utensils, Dumbbell, Brain, Activity, Zap } from "lucide-react";
import type { CycleStats } from "@/lib/cycle";
import { phaseLabel, phaseColorMap } from "@/lib/cycle";

interface Props {
  stats: CycleStats;
}

export function PhaseCompassCard({ stats }: Props) {
  const { advice, canonicalPhase, phaseProgress, phaseDay, phaseTotalDays } = stats;
  const phaseColors = phaseColorMap[canonicalPhase] || phaseColorMap.follicular;

  return (
    <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `color-mix(in oklab, ${phaseColors.bg} 18%, transparent)`,
                color: phaseColors.bg,
              }}
            >
              Day {phaseDay} of {phaseTotalDays} • {advice.title}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold mt-1 text-foreground">
            {advice.subtitle}
          </h3>
        </div>

        {/* Energy meter */}
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-end gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Energy
          </p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`h-2.5 w-3.5 rounded-xs transition-all ${
                  lvl <= advice.energyLevel
                    ? "bg-amber-500 shadow-xs"
                    : "bg-muted/80 opacity-40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hormonal state banner */}
      <div className="p-3 rounded-2xl bg-muted/40 border text-xs leading-relaxed">
        <p className="font-bold text-foreground flex items-center gap-1.5 mb-0.5">
          <Activity className="h-3.5 w-3.5 text-primary" /> Hormonal Rhythm
        </p>
        <p className="text-muted-foreground">{advice.hormones}</p>
      </div>

      {/* Grid of actionable tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Nutrition */}
        <div className="p-3 rounded-2xl border bg-background/50 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
              <Utensils className="h-3.5 w-3.5 text-emerald-500" /> Food & Fuel
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              {advice.nutrition.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Movement */}
        <div className="p-3 rounded-2xl border bg-background/50 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-indigo-500" /> Movement
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {advice.exercise}
            </p>
          </div>
        </div>

        {/* Mindset & Work */}
        <div className="p-3 rounded-2xl border bg-background/50 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
              <Brain className="h-3.5 w-3.5 text-violet-500" /> Mental Focus
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {advice.mindset}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

