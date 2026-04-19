import type { Phase } from "@/lib/cycle";

interface Props {
  cycleDay: number;
  cycleLength: number;
  daysUntil: number;
  phase: Phase;
}

const phaseColor: Record<Phase, string> = {
  period: "var(--period)",
  fertile: "var(--fertile)",
  ovulation: "var(--ovulation)",
  pms: "var(--pms)",
  normal: "var(--primary)",
};

export function PhaseRing({ cycleDay, cycleLength, daysUntil, phase }: Props) {
  const size = 240;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(cycleDay / cycleLength, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.5 0.18 0)" />
            <stop offset="100%" stopColor="oklch(0.55 0.18 350)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.95 0.02 340)"
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
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {daysUntil <= 0 ? "Period likely" : "Period in"}
        </span>
        <span className="font-display text-6xl font-bold text-foreground mt-1">
          {Math.max(0, daysUntil)}
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          {daysUntil === 1 ? "day" : "days"}
        </span>
        <span
          className="mt-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `color-mix(in oklab, ${phaseColor[phase]} 18%, white)`, color: phaseColor[phase] }}
        >
          Day {cycleDay}
        </span>
      </div>
    </div>
  );
}
