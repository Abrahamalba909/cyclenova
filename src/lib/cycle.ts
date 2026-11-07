import { addDays, differenceInCalendarDays, parseISO, format, isSameDay, isWithinInterval, startOfDay } from "date-fns";

export type Phase =
  | "menstrual"
  | "follicular"
  | "fertile"
  | "ovulation"
  | "luteal"
  | "pms"
  // Legacy aliases
  | "period"
  | "normal";

export type FlowIntensity = "none" | "spotting" | "light" | "medium" | "heavy" | "clots";
export type CervicalMucus = "dry" | "sticky" | "creamy" | "watery" | "eggwhite";
export type ConceptionChance = "none" | "low" | "medium" | "high" | "peak";
export type PregnancyRisk = "very_low" | "low" | "moderate" | "high" | "peak";
export type RegularityRating = "regular" | "slightly_irregular" | "irregular" | "unknown";

export interface CycleProfile {
  cycle_length: number;
  period_length: number;
  luteal_length?: number; // Defaults to 14 days
  last_period_start: string | null; // YYYY-MM-DD
  irregular_cycles?: boolean;
}

export interface PeriodEntry {
  id?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  flow_intensity?: FlowIntensity;
  pain_level?: number; // 0 - 10
  notes?: string;
}

export interface DailySymptomLog {
  log_date: string; // YYYY-MM-DD
  flow?: FlowIntensity;
  cramps?: number;
  headache?: number;
  mood?: number;
  acne?: number;
  bloating?: number;
  back_pain?: number;
  fatigue?: number;
  breast_tenderness?: number;
  cravings?: number;
  energy?: number;
  sleep?: number;
  libido?: number;
  mucus?: CervicalMucus;
  temperature_c?: number; // Basal Body Temp
  intimacy?: "none" | "protected" | "unprotected" | "high_drive";
  mood_tags?: string[];
  notes?: string;
}

export interface PhaseAdvice {
  title: string;
  subtitle: string;
  hormones: string;
  nutrition: string[];
  exercise: string;
  mindset: string;
  energyLevel: number; // 1 to 5
}

export interface CycleStats {
  cycleDay: number;
  totalCycleDays: number;
  daysUntilPeriod: number;
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  ovulationDay: Date;
  fertileWindow: { start: Date; end: Date; peak: Date };
  pmsStart: Date;
  currentPhase: Phase;
  canonicalPhase: "menstrual" | "follicular" | "fertile" | "ovulation" | "luteal" | "pms";
  phaseDay: number;
  phaseTotalDays: number;
  phaseProgress: number; // 0 to 1
  averageCycleLength: number;
  averagePeriodLength: number;
  lutealLength: number;
  regularity: RegularityRating;
  regularityScore: number; // 0 - 100
  stdDeviation: number;
  confidenceScore: number; // %
  conceptionChance: ConceptionChance;
  pregnancyRisk: PregnancyRisk;
  advice: PhaseAdvice;
}

export interface PredictedCycle {
  cycleNumber: number;
  startDate: Date;
  endDate: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  confidenceWindowDays: number; // +/- days margin of error
  daysUntilStart: number;
}

export const toDate = (s: string) => parseISO(s);
export const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Calculates a weighted rolling average cycle length.
 * Recent cycles receive higher weights to reflect bodily changes.
 */
export function computeAverageCycleLength(periods: PeriodEntry[], fallback: number = 28): number {
  const sorted = [...periods]
    .filter((p) => Boolean(p.start_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (sorted.length < 2) return fallback;

  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = differenceInCalendarDays(toDate(sorted[i].start_date), toDate(sorted[i - 1].start_date));
    // Accept valid physiological cycle spans (20 - 50 days)
    if (d >= 20 && d <= 50) {
      diffs.push(d);
    }
  }

  if (diffs.length === 0) return fallback;

  // Weighted average: recent cycles carry more weight
  let totalWeight = 0;
  let weightedSum = 0;
  diffs.forEach((diff, index) => {
    const weight = index + 1; // 1, 2, 3...
    weightedSum += diff * weight;
    totalWeight += weight;
  });

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculates the average period (bleeding) duration in days based on recorded end dates.
 */
export function computeAveragePeriodLength(periods: PeriodEntry[], fallback: number = 5): number {
  const lengths = periods
    .filter((p) => Boolean(p.start_date && p.end_date))
    .map((p) => differenceInCalendarDays(toDate(p.end_date!), toDate(p.start_date)) + 1)
    .filter((l) => l >= 2 && l <= 12);

  if (lengths.length === 0) return fallback;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Computes standard deviation and regularity rating for clinical reporting.
 */
export function computeCycleVariability(periods: PeriodEntry[]): {
  std: number;
  regularity: RegularityRating;
  score: number;
} {
  const sorted = [...periods]
    .filter((p) => Boolean(p.start_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (sorted.length < 3) {
    return { std: 0, regularity: "unknown", score: 75 };
  }

  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = differenceInCalendarDays(toDate(sorted[i].start_date), toDate(sorted[i - 1].start_date));
    if (d >= 18 && d <= 55) diffs.push(d);
  }

  if (diffs.length < 2) {
    return { std: 0, regularity: "unknown", score: 75 };
  }

  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / diffs.length;
  const std = Math.round(Math.sqrt(variance) * 10) / 10;

  if (std <= 1.5) return { std, regularity: "regular", score: 98 };
  if (std <= 3.0) return { std, regularity: "regular", score: 88 };
  if (std <= 5.0) return { std, regularity: "slightly_irregular", score: 68 };
  return { std, regularity: "irregular", score: 45 };
}

export function computeRegularity(periods: PeriodEntry[]): RegularityRating {
  return computeCycleVariability(periods).regularity;
}

/**
 * Clinical wellness advice for each cycle phase.
 */
export const PHASE_ADVICE_CATALOG: Record<
  "menstrual" | "follicular" | "fertile" | "ovulation" | "luteal" | "pms",
  PhaseAdvice
> = {
  menstrual: {
    title: "Menstrual Phase",
    subtitle: "Rest, Replenish & Restore",
    hormones: "Estrogen & progesterone are at their lowest baseline. Uterine lining is shedding.",
    nutrition: [
      "Iron-rich foods: lentils, spinach, grass-fed beef, dark chocolate",
      "Magnesium: pumpkin seeds, leafy greens, warm bone broths",
      "Hydration: ginger or chamomile teas to soothe pelvic cramping",
    ],
    exercise: "Gentle restorative yoga, slow walks, pelvic stretching. Honor lower stamina.",
    mindset: "Reflect and reset. Prioritize quiet boundaries and extra sleep.",
    energyLevel: 1,
  },
  follicular: {
    title: "Follicular Phase",
    subtitle: "Rising Vitality & Creativity",
    hormones: "FSH triggers follicle maturation. Estrogen begins its climb, boosting dopamine & serotonin.",
    nutrition: [
      "Fermented foods: kefir, kimchi, sauerkraut to support estrogen metabolism",
      "Light, fresh meals: vibrant salads, sprouted seeds, lean proteins",
      "Complex carbs: quinoa, oats, berries for sustained cellular fuel",
    ],
    exercise: "Cardio, dance, light resistance training, running. Energy rises day by day.",
    mindset: "Brainstorming, starting new projects, strategic planning, and socializing.",
    energyLevel: 4,
  },
  fertile: {
    title: "Fertile Window",
    subtitle: "Peak Estrogen & Libido",
    hormones: "Estrogen surges toward its peak. Cervical fluid transitions to watery / egg-white consistency.",
    nutrition: [
      "Antioxidants: blueberries, citrus, avocados for egg cell health",
      "Omega-3 fatty acids: wild salmon, walnuts, chia seeds",
      "Plenty of pure water to support fertile cervical fluid volume",
    ],
    exercise: "Higher intensity workouts, interval sprints, group fitness, strength training.",
    mindset: "High communication confidence, social charisma, and expressive connection.",
    energyLevel: 5,
  },
  ovulation: {
    title: "Ovulation Day",
    subtitle: "LH Peak & Egg Release",
    hormones: "Luteinizing Hormone (LH) peaks, releasing the mature oocyte. Highest fertility probability.",
    nutrition: [
      "Fiber-rich veggies: broccoli, Brussels sprouts to bind and clear excess estrogen",
      "Zinc & selenium: Brazil nuts, shellfish, pumpkin seeds",
    ],
    exercise: "Peak strength workouts, intense cardio, or confident power yoga.",
    mindset: "Peak verbal fluency, negotiation stamina, and magnetic energy.",
    energyLevel: 5,
  },
  luteal: {
    title: "Luteal Phase",
    subtitle: "Progesterone Dominance & Focus",
    hormones: "Progesterone dominates to nourish the uterine lining. Basal body temperature rises ~0.3-0.5°C.",
    nutrition: [
      "Complex carbohydrates: sweet potatoes, brown rice, squash to stabilize serotonin",
      "Vitamin B6: bananas, chickpeas, poultry to temper fluid retention",
      "Cruciferous vegetables to assist hepatic hormone detoxification",
    ],
    exercise: "Moderate strength training, Pilates, barre, brisk nature walks. Avoid high-stress exhaustion.",
    mindset: "Detail orientation, organizing, wrapping up projects, and domestic grounding.",
    energyLevel: 3,
  },
  pms: {
    title: "Pre-Menstrual (PMS)",
    subtitle: "Inner Winter & Compassion",
    hormones: "Estrogen & progesterone drop rapidly as body prepares for menstruation. Serotonin can dip.",
    nutrition: [
      "Magnesium glycinate: dark cocoa, almonds, leafy greens to alleviate tension & cramps",
      "Limit high sodium and refined sugars to minimize bloating and breast tenderness",
      "Warm peppermint or dandelion root tea to relieve water retention",
    ],
    exercise: "Gentle low-impact movement, yin yoga, gentle swimming, soothing stretches.",
    mindset: "Self-compassion, cozy evenings, warm baths, avoiding overcommitting.",
    energyLevel: 2,
  },
};

/**
 * Computes complete cycle statistics, phases, fertility windows, and clinical guidance.
 */
export function computeStats(
  profile: CycleProfile,
  periods: PeriodEntry[],
  today: Date = new Date(),
  customLutealLength: number = 14
): CycleStats | null {
  const lastStartStr = profile.last_period_start || periods[0]?.start_date;
  if (!lastStartStr) return null;

  const avgCycle = computeAverageCycleLength(periods, profile.cycle_length || 28);
  const avgPeriod = computeAveragePeriodLength(periods, profile.period_length || 5);
  const lutealLen = profile.luteal_length || customLutealLength;

  const lastStart = startOfDay(toDate(lastStartStr));
  const currentToday = startOfDay(today);

  // Roll forward to find the current active cycle start date
  let cycleStart = lastStart;
  if (currentToday >= cycleStart) {
    while (differenceInCalendarDays(currentToday, cycleStart) >= avgCycle) {
      cycleStart = addDays(cycleStart, avgCycle);
    }
  } else {
    // If lastStart is in the future, roll backward
    while (currentToday < cycleStart) {
      cycleStart = addDays(cycleStart, -avgCycle);
    }
  }

  const cycleDay = differenceInCalendarDays(currentToday, cycleStart) + 1;
  const nextPeriodStart = addDays(cycleStart, avgCycle);
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriod - 1);
  const daysUntilPeriod = differenceInCalendarDays(nextPeriodStart, currentToday);

  // Ovulation typically occurs `lutealLen` days before the next period starts
  const ovulationDay = addDays(nextPeriodStart, -lutealLen);
  // Fertile window: 5 days before ovulation up to 1 day after ovulation (sperm viability ~5d, egg ~24h)
  const fertileWindow = {
    start: addDays(ovulationDay, -5),
    end: addDays(ovulationDay, 1),
    peak: ovulationDay,
  };
  const pmsStart = addDays(nextPeriodStart, -5);

  // Determine canonical phase
  let canonicalPhase: "menstrual" | "follicular" | "fertile" | "ovulation" | "luteal" | "pms" = "follicular";
  let phaseTotalDays = avgCycle;
  let phaseDay = 1;

  if (cycleDay <= avgPeriod) {
    canonicalPhase = "menstrual";
    phaseTotalDays = avgPeriod;
    phaseDay = cycleDay;
  } else if (isSameDay(currentToday, ovulationDay)) {
    canonicalPhase = "ovulation";
    phaseTotalDays = 1;
    phaseDay = 1;
  } else if (currentToday >= fertileWindow.start && currentToday <= fertileWindow.end) {
    canonicalPhase = "fertile";
    phaseTotalDays = differenceInCalendarDays(fertileWindow.end, fertileWindow.start) + 1;
    phaseDay = differenceInCalendarDays(currentToday, fertileWindow.start) + 1;
  } else if (currentToday < fertileWindow.start) {
    canonicalPhase = "follicular";
    phaseTotalDays = differenceInCalendarDays(fertileWindow.start, addDays(cycleStart, avgPeriod));
    phaseDay = differenceInCalendarDays(currentToday, addDays(cycleStart, avgPeriod)) + 1;
  } else if (currentToday >= pmsStart && currentToday < nextPeriodStart) {
    canonicalPhase = "pms";
    phaseTotalDays = 5;
    phaseDay = differenceInCalendarDays(currentToday, pmsStart) + 1;
  } else {
    canonicalPhase = "luteal";
    phaseTotalDays = differenceInCalendarDays(pmsStart, fertileWindow.end);
    phaseDay = differenceInCalendarDays(currentToday, fertileWindow.end);
  }

  const phaseProgress = Math.min(1, Math.max(0, phaseDay / Math.max(1, phaseTotalDays)));

  // Conception probability & pregnancy risk assessment
  let conceptionChance: ConceptionChance = "none";
  let pregnancyRisk: PregnancyRisk = "very_low";

  if (isSameDay(currentToday, ovulationDay)) {
    conceptionChance = "peak";
    pregnancyRisk = "peak";
  } else if (currentToday >= addDays(ovulationDay, -2) && currentToday < ovulationDay) {
    conceptionChance = "high";
    pregnancyRisk = "high";
  } else if (currentToday >= fertileWindow.start && currentToday <= fertileWindow.end) {
    conceptionChance = "medium";
    pregnancyRisk = "moderate";
  } else if (canonicalPhase === "menstrual") {
    conceptionChance = "low";
    pregnancyRisk = "low";
  } else {
    conceptionChance = "low";
    pregnancyRisk = "very_low";
  }

  const variability = computeCycleVariability(periods);
  const confidenceScore = Math.max(
    50,
    Math.min(99, Math.round(variability.score - Math.max(0, variability.std * 3)))
  );

  return {
    cycleDay,
    totalCycleDays: avgCycle,
    daysUntilPeriod,
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDay,
    fertileWindow,
    pmsStart,
    currentPhase: canonicalPhase,
    canonicalPhase,
    phaseDay: Math.max(1, phaseDay),
    phaseTotalDays: Math.max(1, phaseTotalDays),
    phaseProgress,
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    lutealLength: lutealLen,
    regularity: variability.regularity,
    regularityScore: variability.score,
    stdDeviation: variability.std,
    confidenceScore,
    conceptionChance,
    pregnancyRisk,
    advice: PHASE_ADVICE_CATALOG[canonicalPhase],
  };
}

/**
 * Returns the exact phase and clinical context for any given calendar date.
 */
export function getDayPhase(
  date: Date,
  profile: CycleProfile,
  periods: PeriodEntry[],
  lutealLength: number = 14
): Phase {
  const targetDate = startOfDay(date);
  const lastStartStr = profile.last_period_start || periods[0]?.start_date;
  if (!lastStartStr) return "follicular";

  const avg = computeAverageCycleLength(periods, profile.cycle_length || 28);
  const periodLen = computeAveragePeriodLength(periods, profile.period_length || 5);

  // Check against actually logged periods first
  for (const p of periods) {
    const s = startOfDay(toDate(p.start_date));
    const e = p.end_date ? startOfDay(toDate(p.end_date)) : addDays(s, periodLen - 1);
    if (targetDate >= s && targetDate <= e) {
      return "period";
    }
  }

  // Calculate cycle belonging to this date
  let cycleStart = startOfDay(toDate(lastStartStr));
  while (targetDate < cycleStart) cycleStart = addDays(cycleStart, -avg);
  while (differenceInCalendarDays(targetDate, cycleStart) >= avg) cycleStart = addDays(cycleStart, avg);

  const dayInCycle = differenceInCalendarDays(targetDate, cycleStart) + 1;
  const nextStart = addDays(cycleStart, avg);
  const ovulation = addDays(nextStart, -lutealLength);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const pmsStart = addDays(nextStart, -5);

  if (dayInCycle <= periodLen) return "period";
  if (isSameDay(targetDate, ovulation)) return "ovulation";
  if (targetDate >= fertileStart && targetDate <= fertileEnd) return "fertile";
  if (dayInCycle <= differenceInCalendarDays(fertileStart, cycleStart)) return "follicular";
  if (targetDate >= pmsStart && targetDate < nextStart) return "pms";
  return "luteal";
}

/**
 * Predicts the upcoming N menstrual cycles with confidence intervals.
 */
export function predictUpcomingCycles(
  profile: CycleProfile,
  periods: PeriodEntry[],
  count: number = 6,
  today: Date = new Date()
): PredictedCycle[] {
  const stats = computeStats(profile, periods, today);
  if (!stats) return [];

  const avg = stats.averageCycleLength;
  const periodLen = stats.averagePeriodLength;
  const luteal = stats.lutealLength;
  const std = stats.stdDeviation;

  const predictions: PredictedCycle[] = [];
  let currentStart = stats.nextPeriodStart;

  for (let i = 0; i < count; i++) {
    const startDate = currentStart;
    const endDate = addDays(startDate, periodLen - 1);
    const nextStart = addDays(startDate, avg);
    const ovulationDate = addDays(nextStart, -luteal);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, 1);
    const daysUntilStart = differenceInCalendarDays(startDate, today);

    // Confidence window expands further into the future
    const confidenceMargin = Math.min(7, Math.max(1, Math.round(std * (1 + i * 0.4))));

    predictions.push({
      cycleNumber: i + 1,
      startDate,
      endDate,
      ovulationDate,
      fertileStart,
      fertileEnd,
      confidenceWindowDays: confidenceMargin,
      daysUntilStart,
    });

    currentStart = nextStart;
  }

  return predictions;
}

export const phaseLabel: Record<Phase, string> = {
  menstrual: "Menstrual Phase",
  period: "Menstrual Period",
  follicular: "Follicular Phase",
  fertile: "Fertile Window",
  ovulation: "Ovulation Day",
  luteal: "Luteal Phase",
  pms: "PMS / Pre-Menstrual",
  normal: "Follicular / Luteal",
};

export const phaseDescription: Record<Phase, string> = {
  menstrual: "Your period is active. Nourish your body with warmth, iron, and deep rest.",
  period: "Your period is active. Rest, hydrate, and listen to your body's rhythm.",
  follicular: "Estrogen is climbing. Energy, mental clarity, and stamina are on the rise.",
  fertile: "High probability of conception. Peak estrogen and fertile cervical fluid.",
  ovulation: "Ovulation is predicted today. Egg viability is at its peak window.",
  luteal: "Progesterone dominates. Ideal for steady focus, organizing, and grounding routines.",
  pms: "Late luteal phase. Practice self-care, reduce caffeine, and enjoy soothing rituals.",
  normal: "Balanced cycle phase. Continue daily wellness and tracking.",
};

export const phaseColorMap: Record<Phase, { bg: string; text: string; border: string }> = {
  menstrual: {
    bg: "#E11D48",
    text: "#ffffff",
    border: "#BE123C",
  },
  period: {
    bg: "#E11D48",
    text: "#ffffff",
    border: "#BE123C",
  },
  follicular: {
    bg: "#059669",
    text: "#ffffff",
    border: "#047857",
  },
  fertile: {
    bg: "#D97706",
    text: "#ffffff",
    border: "#B45309",
  },
  ovulation: {
    bg: "#EA580C",
    text: "#ffffff",
    border: "#C2410C",
  },
  luteal: {
    bg: "#7C3AED",
    text: "#ffffff",
    border: "#6D28D9",
  },
  pms: {
    bg: "#9333EA",
    text: "#ffffff",
    border: "#7E22CE",
  },
  normal: {
    bg: "#F1F5F9",
    text: "#0F172A",
    border: "#CBD5E1",
  },
};
