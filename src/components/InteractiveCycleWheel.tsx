import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Droplet, Eye, EyeOff, RotateCcw, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { CycleStats, Phase } from "@/lib/cycle";
import { phaseLabel, phaseDescription } from "@/lib/cycle";
import type { Goal } from "@/hooks/useGoal";

interface Props {
  stats: CycleStats;
  goal?: Goal;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
}

interface PhaseSegment {
  phase: "menstrual" | "follicular" | "fertile" | "luteal" | "pms";
  startDay: number;
  endDay: number;
  color: string;
  glowColor: string;
  label: string;
}

export function InteractiveCycleWheel({ stats, goal = "tracking", privacyMode = false, onTogglePrivacy }: Props) {
  const [inspectedDay, setInspectedDay] = useState<number | null>(null);

  const activeDay = inspectedDay ?? stats.cycleDay;
  const isInspecting = inspectedDay !== null && inspectedDay !== stats.cycleDay;

  const totalDays = stats.totalCycleDays || 28;
  const periodDays = stats.averagePeriodLength || 5;
  const lutealDays = stats.lutealLength || 14;

  // Approximate day markers along the cycle
  const ovulationDayNum = Math.max(periodDays + 2, totalDays - lutealDays);
  const fertileStartDay = Math.max(periodDays + 1, ovulationDayNum - 5);
  const fertileEndDay = Math.min(totalDays - 2, ovulationDayNum + 1);
  const pmsStartDay = Math.max(fertileEndDay + 2, totalDays - 4);

  // Define segments for the wheel
  const segments: PhaseSegment[] = useMemo(() => [
    {
      phase: "menstrual",
      startDay: 1,
      endDay: periodDays,
      color: "#E11D48",
      glowColor: "rgba(225, 29, 72, 0.3)",
      label: "Period",
    },
    {
      phase: "follicular",
      startDay: periodDays + 1,
      endDay: fertileStartDay - 1,
      color: "#059669",
      glowColor: "rgba(5, 150, 105, 0.3)",
      label: "Follicular",
    },
    {
      phase: "fertile",
      startDay: fertileStartDay,
      endDay: fertileEndDay,
      color: "#D97706",
      glowColor: "rgba(217, 119, 6, 0.3)",
      label: "Fertile",
    },
    {
      phase: "luteal",
      startDay: fertileEndDay + 1,
      endDay: pmsStartDay - 1,
      color: "#7C3AED",
      glowColor: "rgba(124, 58, 237, 0.3)",
      label: "Luteal",
    },
    {
      phase: "pms",
      startDay: pmsStartDay,
      endDay: totalDays,
      color: "#9333EA",
      glowColor: "rgba(147, 51, 234, 0.3)",
      label: "PMS",
    },
  ], [periodDays, fertileStartDay, fertileEndDay, pmsStartDay, totalDays]);

  const size = 300;
  const stroke = 18;
  const radius = (size - stroke - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Converts a day in cycle (1..totalDays) to degrees (0..360, where Day 1 starts at top -90deg)
  const dayToAngle = (day: number) => {
    const fraction = ((day - 1) % totalDays) / totalDays;
    return fraction * 360 - 90;
  };

  const currentAngle = dayToAngle(activeDay);
  const currentRad = (currentAngle * Math.PI) / 180;
  const indicatorX = center + radius * Math.cos(currentRad);
  const indicatorY = center + radius * Math.sin(currentRad);

  // Ovulation marker position
  const ovAngle = dayToAngle(ovulationDayNum);
  const ovRad = (ovAngle * Math.PI) / 180;
  const ovX = center + radius * Math.cos(ovRad);
  const ovY = center + radius * Math.sin(ovRad);

  // Determine inspected phase
  const inspectedPhase = useMemo(() => {
    for (const seg of segments) {
      if (activeDay >= seg.startDay && activeDay <= seg.endDay) {
        return seg.phase;
      }
    }
    return "follicular";
  }, [activeDay, segments]);

  // Center Headline logic
  const headline = useMemo(() => {
    if (isInspecting) {
      return `Day ${activeDay}`;
    }
    if (stats.canonicalPhase === "menstrual" || stats.currentPhase === "period") {
      return `Period Day ${stats.cycleDay}`;
    }
    if (stats.canonicalPhase === "ovulation") {
      return "Ovulation Day";
    }
    if (stats.daysUntilPeriod <= 0) {
      return "Period Likely Today";
    }
    return `${stats.daysUntilPeriod} ${stats.daysUntilPeriod === 1 ? "day" : "days"}`;
  }, [isInspecting, activeDay, stats]);

  const subline = useMemo(() => {
    if (isInspecting) {
      return phaseLabel[inspectedPhase] || "Preview";
    }
    if (stats.canonicalPhase === "menstrual") {
      return "Nourish & rest your body";
    }
    if (stats.canonicalPhase === "ovulation") {
      return "Peak fertility today";
    }
    if (stats.daysUntilPeriod <= 0) {
      return "Check for onset symptoms";
    }
    return "until next period";
  }, [isInspecting, inspectedPhase, stats]);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Top action header for wheel */}
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Droplet className="h-3.5 w-3.5 text-primary" />
          <span>{totalDays}-day cycle</span>
        </div>

        <div className="flex items-center gap-1">
          {isInspecting && (
            <button
              onClick={() => setInspectedDay(null)}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Back to today
            </button>
          )}

          {onTogglePrivacy && (
            <button
              onClick={onTogglePrivacy}
              title={privacyMode ? "Disable Privacy Blur" : "Enable Privacy Shield"}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Toggle privacy shield"
            >
              {privacyMode ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* SVG Multi-Arc Dial */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="needleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeWidth={stroke}
          />

          {/* Render Colored Phase Arcs */}
          {segments.map((seg) => {
            const lengthDays = Math.max(1, seg.endDay - seg.startDay + 1);
            const dashLength = (lengthDays / totalDays) * circumference;
            // Gap between segments for distinct visual segments
            const visibleDash = Math.max(1, dashLength - 3);
            const gapLength = circumference - visibleDash;
            const startFraction = (seg.startDay - 1) / totalDays;
            const dashOffset = -startFraction * circumference;

            return (
              <circle
                key={seg.phase}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${visibleDash} ${gapLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-500 opacity-90 hover:opacity-100"
              />
            );
          })}

          {/* Ovulation Sparkle Marker */}
          <g transform={`translate(${ovX}, ${ovY})`}>
            <circle r="7" fill="#F59E0B" filter="url(#glow)" />
            <circle r="3" fill="#ffffff" />
          </g>

          {/* Day Cursor Needle */}
          <g
            transform={`translate(${indicatorX}, ${indicatorY})`}
            className="transition-transform duration-300 ease-out"
          >
            <circle r="14" fill="white" filter="url(#glow)" className="dark:fill-slate-900" />
            <circle
              r="10"
              fill="#E11D48"
              stroke="white"
              strokeWidth="2.5"
              className="drop-shadow-md"
            />
          </g>
        </svg>

        {/* Center Content Card */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all ${
            privacyMode ? "privacy-shield" : ""
          }`}
        >
          <motion.div
            key={activeDay}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1">
              {isInspecting ? (
                <>
                  <Info className="h-3 w-3 text-primary" /> Inspecting Day
                </>
              ) : stats.canonicalPhase === "menstrual" ? (
                "Current Phase"
              ) : (
                "Next Period"
              )}
            </span>

            <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mt-1 text-foreground">
              {headline}
            </span>

            <span className="text-xs text-muted-foreground mt-1 max-w-[170px] leading-snug">
              {subline}
            </span>

            <div className="mt-3 flex items-center gap-1.5">
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold shadow-xs transition-all"
                style={{
                  backgroundColor: `color-mix(in oklab, ${
                    segments.find((s) => s.phase === inspectedPhase)?.color || "var(--primary)"
                  } 20%, transparent)`,
                  color: segments.find((s) => s.phase === inspectedPhase)?.color || "var(--primary)",
                }}
              >
                {phaseLabel[inspectedPhase]}
              </span>

              {stats.canonicalPhase === "ovulation" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Peak
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Interactive Day Scrubber */}
      <div className="w-full mt-4 flex items-center justify-between gap-2 max-w-xs">
        <button
          onClick={() => {
            const next = activeDay <= 1 ? totalDays : activeDay - 1;
            setInspectedDay(next);
          }}
          className="h-8 w-8 rounded-full border bg-card/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Previous Day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 flex items-center justify-center">
          <input
            type="range"
            min="1"
            max={totalDays}
            value={activeDay}
            onChange={(e) => setInspectedDay(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={() => {
            const next = activeDay >= totalDays ? 1 : activeDay + 1;
            setInspectedDay(next);
          }}
          className="h-8 w-8 rounded-full border bg-card/80 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Next Day"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Phase Legend Pills */}
      <div className="mt-5 grid grid-cols-5 gap-1.5 w-full text-center">
        {segments.map((seg) => (
          <button
            key={seg.phase}
            onClick={() => setInspectedDay(seg.startDay)}
            className={`p-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
              inspectedPhase === seg.phase
                ? "border-current shadow-xs scale-105"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            style={{ color: seg.color }}
          >
            <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: seg.color }} />
            <span className="block truncate">{seg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

