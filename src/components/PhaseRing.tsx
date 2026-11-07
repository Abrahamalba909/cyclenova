import type { Phase } from "@/lib/cycle";
import { InteractiveCycleWheel } from "@/components/InteractiveCycleWheel";
import type { CycleStats } from "@/lib/cycle";

interface Props {
  cycleDay: number;
  cycleLength: number;
  daysUntil: number;
  phase: Phase;
  stats?: CycleStats;
  privacyMode?: boolean;
}

export function PhaseRing({ cycleDay, cycleLength, daysUntil, phase, stats, privacyMode }: Props) {
  // If stats is provided, use the rich multi-phase wheel
  if (stats) {
    return <InteractiveCycleWheel stats={stats} privacyMode={privacyMode} />;
  }

  // Graceful fallback for simplified invocation
  const size = 260;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(cycleDay / Math.max(1, cycleLength), 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${privacyMode ? "privacy-shield" : ""}`}>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {daysUntil <= 0 ? "Period likely" : "Period in"}
        </span>
        <span className="font-display text-5xl font-extrabold text-foreground mt-1">
          {Math.max(0, daysUntil)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {daysUntil === 1 ? "day" : "days"}
        </span>
        <span className="mt-2.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          Day {cycleDay} of {cycleLength}
        </span>
      </div>
    </div>
  );
}
