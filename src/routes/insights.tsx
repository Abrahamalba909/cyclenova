import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  TrendingUp,
  Calendar,
  Activity,
  Sparkles,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Heart,
  Droplet,
  FileText,
  BarChart2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useCycleStore } from "@/lib/cycleStore";
import {
  computeAverageCycleLength,
  computeAveragePeriodLength,
  computeCycleVariability,
  type PeriodEntry,
  type DailySymptomLog,
} from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Cycle Insights & Clinical Analytics — CycleNova" },
      {
        name: "description",
        content:
          "Discover patterns in your menstrual cycle: cycle length trends, regularity score, symptom correlations, and printable OB-GYN health report.",
      },
    ],
  }),
  component: Insights,
});

function Insights() {
  const { profile, periods, symptoms, stats, exportDataJson, loadSampleJourney } = useCycleStore();
  const [showDoctorReport, setShowDoctorReport] = useState(false);

  const avgCycle = stats?.averageCycleLength ?? computeAverageCycleLength(periods, profile.cycle_length || 28);
  const avgPeriod = stats?.averagePeriodLength ?? computeAveragePeriodLength(periods, profile.period_length || 5);
  const variability = computeCycleVariability(periods);

  // Compute cycle lengths history
  const sortedPeriods = [...periods]
    .filter((p) => Boolean(p.start_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const cycleHistory: { label: string; days: number; start: string }[] = [];
  for (let i = 1; i < sortedPeriods.length; i++) {
    const prev = sortedPeriods[i - 1];
    const curr = sortedPeriods[i];
    const d = differenceInCalendarDays(parseISO(curr.start_date), parseISO(prev.start_date));
    if (d >= 18 && d <= 55) {
      cycleHistory.push({
        label: format(parseISO(curr.start_date), "MMM d"),
        days: d,
        start: curr.start_date,
      });
    }
  }

  // Aggregate symptoms
  const symptomList = Object.values(symptoms);
  const totalLogs = symptomList.length;

  const symptomAggregates = [
    {
      name: "Pelvic Cramps",
      count: symptomList.filter((s) => (s.cramps ?? 0) > 3).length,
      avg:
        symptomList.reduce((acc, s) => acc + (s.cramps ?? 0), 0) /
        Math.max(1, symptomList.filter((s) => (s.cramps ?? 0) > 0).length),
      peakPhase: "Menstrual",
      icon: "🩸",
    },
    {
      name: "Bloating / Digestion",
      count: symptomList.filter((s) => (s.bloating ?? 0) > 3).length,
      avg:
        symptomList.reduce((acc, s) => acc + (s.bloating ?? 0), 0) /
        Math.max(1, symptomList.filter((s) => (s.bloating ?? 0) > 0).length),
      peakPhase: "Late Luteal / PMS",
      icon: "💧",
    },
    {
      name: "Headache / Migraine",
      count: symptomList.filter((s) => (s.headache ?? 0) > 3).length,
      avg:
        symptomList.reduce((acc, s) => acc + (s.headache ?? 0), 0) /
        Math.max(1, symptomList.filter((s) => (s.headache ?? 0) > 0).length),
      peakPhase: "Hormone Drop (PMS/Period)",
      icon: "⚡",
    },
    {
      name: "Fatigue",
      count: symptomList.filter((s) => (s.fatigue ?? 0) > 3).length,
      avg:
        symptomList.reduce((acc, s) => acc + (s.fatigue ?? 0), 0) /
        Math.max(1, symptomList.filter((s) => (s.fatigue ?? 0) > 0).length),
      peakPhase: "Menstrual & PMS",
      icon: "😴",
    },
  ].sort((a, b) => b.count - a.count);

  const regLabel = {
    regular: "Regular",
    slightly_irregular: "Slightly Irregular",
    irregular: "Irregular",
    unknown: "Collecting Data",
  }[variability.regularity];

  const regColor = {
    regular: "text-emerald-600 dark:text-emerald-400",
    slightly_irregular: "text-amber-600 dark:text-amber-400",
    irregular: "text-rose-600 dark:text-rose-400",
    unknown: "text-muted-foreground",
  }[variability.regularity];

  const isNormalCycleLength = avgCycle >= 21 && avgCycle <= 35;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Cycle Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Statistical patterns and hormonal trends from your cycle logs.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDoctorReport(!showDoctorReport)}
            className="rounded-full text-xs font-semibold h-9"
          >
            <FileText className="h-4 w-4 mr-1.5 text-primary" />
            {showDoctorReport ? "Hide Report" : "Doctor Report"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Core Statistical Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Calendar className="h-4 w-4 text-primary" />}
            label="Average Cycle"
            value={`${avgCycle} days`}
            sub={isNormalCycleLength ? "Within typical 21-35d range" : "Outside typical 21-35d range"}
            badge={isNormalCycleLength ? "Normal" : "Review"}
            badgeColor={isNormalCycleLength ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}
          />

          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
            label="Cycle Regularity"
            value={regLabel}
            sub={
              variability.regularity === "unknown"
                ? "Log 3+ cycles to calculate"
                : `Variability ±${variability.std} days`
            }
            valueColor={regColor}
            badge={`${variability.score}/100`}
            badgeColor="bg-primary/10 text-primary"
          />

          <StatCard
            icon={<Droplet className="h-4 w-4 text-rose-500" />}
            label="Bleeding Duration"
            value={`${avgPeriod} days`}
            sub="Average period length"
            badge="Typical: 3-7d"
            badgeColor="bg-muted text-muted-foreground"
          />

          <StatCard
            icon={<Activity className="h-4 w-4 text-amber-500" />}
            label="Recorded Data"
            value={`${sortedPeriods.length} cycles`}
            sub={`${totalLogs} daily symptom entries`}
            badge="Health Logged"
            badgeColor="bg-muted text-muted-foreground"
          />
        </div>

        {/* Cycle Length History Visual Bar Chart */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold">Cycle Length Trend</h3>
              <p className="text-xs text-muted-foreground">Historical length between period start dates</p>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              Baseline: 28 days
            </span>
          </div>

          {cycleHistory.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/20">
              <p className="text-sm font-semibold text-foreground">Need at least 2 recorded cycles</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Log your next period start date, or load our realistic sample journey to preview this chart.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={loadSampleJourney}
                className="mt-4 rounded-full text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Load 4-Month Sample Journey
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                {cycleHistory.map((item, idx) => {
                  const maxDisplay = 40;
                  const percent = Math.min(100, Math.max(20, (item.days / maxDisplay) * 100));
                  const isNormal = item.days >= 21 && item.days <= 35;

                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-14 font-medium text-muted-foreground shrink-0">
                        {item.label}
                      </span>

                      <div className="flex-1 h-6 bg-muted/50 rounded-lg relative overflow-hidden flex items-center">
                        {/* 28-day reference guide line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10"
                          style={{ left: `${(28 / maxDisplay) * 100}%` }}
                          title="28-day baseline"
                        />

                        {/* Bar */}
                        <div
                          className={`h-full rounded-lg transition-all flex items-center justify-end pr-2 text-[11px] font-bold text-white shadow-xs ${
                            isNormal ? "bg-gradient-primary" : "bg-amber-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        >
                          {item.days}d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground pt-2 text-right">
                Vertical guide line indicates the standard 28-day baseline.
              </p>
            </div>
          )}
        </div>

        {/* Symptom Trends & Frequency */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg font-bold">Symptom Frequency</h3>
              <p className="text-xs text-muted-foreground">Most commonly reported bodily signs</p>
            </div>
            <span className="text-xs font-bold text-primary">
              {symptomList.length} logs
            </span>
          </div>

          {symptomList.length === 0 ? (
            <div className="p-6 text-center border border-dashed rounded-2xl bg-muted/20 text-xs text-muted-foreground">
              No daily symptoms logged yet. Use the Calendar or Dashboard to log symptoms.
            </div>
          ) : (
            <div className="space-y-2.5">
              {symptomAggregates.map((s) => (
                <div
                  key={s.name}
                  className="p-3 rounded-2xl border bg-background/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Most common during: <span className="font-medium text-foreground">{s.peakPhase}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-primary">
                      {s.count} days reported
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Avg intensity: {s.avg > 0 ? `${s.avg.toFixed(1)}/10` : "0"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Printable Doctor / OB-GYN Clinical Summary Report */}
        {showDoctorReport && (
          <div className="bg-card border-2 border-primary/30 rounded-3xl p-6 shadow-glow space-y-4 print:p-0 print:border-none">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary tracking-widest">
                  CycleNova Clinical Export
                </p>
                <h3 className="font-display text-xl font-bold">
                  Menstrual Health Summary Report
                </h3>
                <p className="text-xs text-muted-foreground">
                  Generated on {format(new Date(), "MMMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-full bg-gradient-primary font-bold text-xs h-9 px-4"
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportDataJson}
                  className="rounded-full text-xs h-9 px-3"
                >
                  <Download className="h-4 w-4 mr-1" /> JSON
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Average Cycle Length</p>
                <p className="font-bold text-base mt-0.5">{avgCycle} days</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Average Bleeding</p>
                <p className="font-bold text-base mt-0.5">{avgPeriod} days</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Regularity Rating</p>
                <p className="font-bold text-base mt-0.5">{regLabel}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Standard Deviation</p>
                <p className="font-bold text-base mt-0.5">±{variability.std} days</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Recorded Cycle History
              </h4>
              <div className="border rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/60 text-[11px] font-bold text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Period Start Date</th>
                      <th className="p-2.5">End Date</th>
                      <th className="p-2.5">Cycle Length</th>
                      <th className="p-2.5">Flow / Intensity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedPeriods.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-2.5 font-semibold">{p.start_date}</td>
                        <td className="p-2.5 text-muted-foreground">{p.end_date || "—"}</td>
                        <td className="p-2.5">
                          {idx > 0
                            ? `${differenceInCalendarDays(
                                parseISO(sortedPeriods[idx].start_date),
                                parseISO(sortedPeriods[idx - 1].start_date)
                              )} days`
                            : "Baseline"}
                        </td>
                        <td className="p-2.5 capitalize">{p.flow_intensity || "Medium"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic border-t pt-3">
              Disclaimer: This report summarizes patient self-reported data collected via CycleNova. It is intended to assist medical consultations and is not a medical diagnosis.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  valueColor,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-card border rounded-3xl p-4 shadow-soft flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || "bg-muted text-muted-foreground"}`}>
            {badge}
          </span>
        )}
      </div>

      <div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`font-display text-xl font-extrabold mt-0.5 ${valueColor || "text-foreground"}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
