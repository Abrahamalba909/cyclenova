import { addDays, differenceInCalendarDays, parseISO, format, isSameDay } from "date-fns";

export type Phase = "period" | "fertile" | "ovulation" | "pms" | "normal";

export interface CycleProfile {
  cycle_length: number;
  period_length: number;
  last_period_start: string | null; // YYYY-MM-DD
}

export interface PeriodEntry {
  start_date: string;
  end_date: string | null;
}

export interface CycleStats {
  cycleDay: number;
  daysUntilPeriod: number;
  nextPeriodStart: Date;
  ovulationDay: Date;
  fertileWindow: { start: Date; end: Date };
  pmsStart: Date;
  currentPhase: Phase;
  averageCycleLength: number;
  regularity: "regular" | "slightly_irregular" | "irregular" | "unknown";
}

const toDate = (s: string) => parseISO(s);
export const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function computeAverageCycleLength(periods: PeriodEntry[], fallback: number): number {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length < 2) return fallback;
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = differenceInCalendarDays(toDate(sorted[i].start_date), toDate(sorted[i - 1].start_date));
    if (d >= 18 && d <= 45) diffs.push(d);
  }
  if (diffs.length === 0) return fallback;
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

export function computeRegularity(periods: PeriodEntry[]): CycleStats["regularity"] {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length < 3) return "unknown";
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(differenceInCalendarDays(toDate(sorted[i].start_date), toDate(sorted[i - 1].start_date)));
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / diffs.length;
  const std = Math.sqrt(variance);
  if (std <= 2) return "regular";
  if (std <= 5) return "slightly_irregular";
  return "irregular";
}

export function computeStats(profile: CycleProfile, periods: PeriodEntry[], today: Date = new Date()): CycleStats | null {
  const lastStartStr = profile.last_period_start || periods[0]?.start_date;
  if (!lastStartStr) return null;

  const avg = computeAverageCycleLength(periods, profile.cycle_length || 28);
  const periodLen = profile.period_length || 5;
  const lastStart = toDate(lastStartStr);

  // Roll forward last start to most recent before/equal today
  let cycleStart = lastStart;
  while (differenceInCalendarDays(today, cycleStart) >= avg) {
    cycleStart = addDays(cycleStart, avg);
  }

  const cycleDay = differenceInCalendarDays(today, cycleStart) + 1;
  const nextPeriodStart = addDays(cycleStart, avg);
  const daysUntilPeriod = differenceInCalendarDays(nextPeriodStart, today);
  const ovulationDay = addDays(nextPeriodStart, -14);
  const fertileWindow = { start: addDays(ovulationDay, -5), end: addDays(ovulationDay, 1) };
  const pmsStart = addDays(nextPeriodStart, -5);

  let currentPhase: Phase = "normal";
  if (cycleDay <= periodLen) currentPhase = "period";
  else if (isSameDay(today, ovulationDay)) currentPhase = "ovulation";
  else if (today >= fertileWindow.start && today <= fertileWindow.end) currentPhase = "fertile";
  else if (today >= pmsStart && today < nextPeriodStart) currentPhase = "pms";

  return {
    cycleDay,
    daysUntilPeriod,
    nextPeriodStart,
    ovulationDay,
    fertileWindow,
    pmsStart,
    currentPhase,
    averageCycleLength: avg,
    regularity: computeRegularity(periods),
  };
}

export function getDayPhase(date: Date, profile: CycleProfile, periods: PeriodEntry[]): Phase {
  const lastStartStr = profile.last_period_start || periods[0]?.start_date;
  if (!lastStartStr) return "normal";
  const avg = computeAverageCycleLength(periods, profile.cycle_length || 28);
  const periodLen = profile.period_length || 5;

  // Check actual logged periods
  for (const p of periods) {
    const s = toDate(p.start_date);
    const e = p.end_date ? toDate(p.end_date) : addDays(s, periodLen - 1);
    if (date >= s && date <= e) return "period";
  }

  // Find cycle this date belongs to
  let cycleStart = toDate(lastStartStr);
  // move backward if needed
  while (date < cycleStart) cycleStart = addDays(cycleStart, -avg);
  while (differenceInCalendarDays(date, cycleStart) >= avg) cycleStart = addDays(cycleStart, avg);

  const dayInCycle = differenceInCalendarDays(date, cycleStart) + 1;
  const nextStart = addDays(cycleStart, avg);
  const ovulation = addDays(nextStart, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const pmsStart = addDays(nextStart, -5);

  if (dayInCycle <= periodLen) return "period";
  if (isSameDay(date, ovulation)) return "ovulation";
  if (date >= fertileStart && date <= fertileEnd) return "fertile";
  if (date >= pmsStart && date < nextStart) return "pms";
  return "normal";
}

export const phaseLabel: Record<Phase, string> = {
  period: "Period",
  fertile: "Fertile window",
  ovulation: "Ovulation",
  pms: "PMS",
  normal: "Follicular / Luteal",
};

export const phaseDescription: Record<Phase, string> = {
  period: "Your period is here. Rest, hydrate, and listen to your body.",
  fertile: "You're in your fertile window — peak chance of conception.",
  ovulation: "Today is your predicted ovulation day.",
  pms: "PMS phase — be gentle with yourself.",
  normal: "You're in a balanced phase of your cycle.",
};
