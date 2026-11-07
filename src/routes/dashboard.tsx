import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Droplet,
  Plus,
  Settings as SettingsIcon,
  CalendarCog,
  Target,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Calendar,
  Activity,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { InteractiveCycleWheel } from "@/components/InteractiveCycleWheel";
import { PhaseCompassCard } from "@/components/PhaseCompassCard";
import { OvulationCalculator } from "@/components/OvulationCalculator";
import { EditPeriodDialog } from "@/components/EditPeriodDialog";
import { CycleForecastTimeline } from "@/components/CycleForecastTimeline";
import { DailyLogSheet } from "@/components/DailyLogSheet";
import { useAuth } from "@/hooks/useAuth";
import { goalLabel, type Goal } from "@/hooks/useGoal";
import { useCycleStore } from "@/lib/cycleStore";
import { phaseDescription, phaseLabel, phaseColorMap, fmt } from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    periods,
    stats,
    goal,
    setGoal,
    privacyMode,
    togglePrivacyMode,
    logPeriodToday,
    saveSymptomLog,
    getSymptomLog,
    isGuest,
    isLoaded,
    updateProfile,
  } = useCycleStore();

  const [loggingPeriod, setLoggingPeriod] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleGoalChange = async (next: Goal) => {
    if (next === goal) return;
    try {
      await setGoal(next);
      toast.success(`Goal switched to ${goalLabel[next]}`);
    } catch (e) {
      toast.error("Could not update goal");
    }
  };

  const handlePeriodToday = async () => {
    setLoggingPeriod(true);
    try {
      await logPeriodToday();
      toast.success("Period logged for today!");
    } catch (e) {
      toast.error("Could not record period");
    } finally {
      setLoggingPeriod(false);
    }
  };

  if (!isLoaded || !stats) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">Calculating your cycle...</p>
        </div>
      </AppShell>
    );
  }

  const todayStr = fmt(new Date());
  const todayLog = getSymptomLog(todayStr);

  return (
    <AppShell>
      {/* Header Bar */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            {isGuest && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                <ShieldCheck className="h-3 w-3" /> Private Offline Mode
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-extrabold mt-1 tracking-tight">
            Cycle Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePrivacyMode}
            className="h-10 w-10 rounded-full bg-card border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            title={privacyMode ? "Privacy Mode On" : "Privacy Mode Off"}
          >
            {privacyMode ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4" />}
          </button>

          <Link
            to="/settings"
            className="h-10 w-10 rounded-full bg-card border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hero Interactive Wheel */}
        <div className="bg-card border rounded-3xl p-6 shadow-soft">
          <InteractiveCycleWheel
            stats={stats}
            goal={goal}
            privacyMode={privacyMode}
            onTogglePrivacy={togglePrivacyMode}
          />

          {/* Quick Metrics Bar */}
          <div className={`mt-6 grid grid-cols-3 gap-2.5 ${privacyMode ? "privacy-shield" : ""}`}>
            <MetricCard
              label="Cycle Day"
              value={`Day ${stats.cycleDay}`}
              sub={`of ${stats.averageCycleLength} days`}
              accent="var(--primary)"
            />
            <MetricCard
              label="Next Period"
              value={stats.daysUntilPeriod <= 0 ? "Likely Today" : `${stats.daysUntilPeriod}d away`}
              sub={format(stats.nextPeriodStart, "MMM d")}
              accent="oklch(0.55 0.22 15)"
            />
            <MetricCard
              label="Regularity"
              value={
                stats.regularity === "regular"
                  ? "Regular"
                  : stats.regularity === "slightly_irregular"
                    ? "Slightly Irreg."
                    : stats.regularity === "irregular"
                      ? "Irregular"
                      : "Calculating"
              }
              sub={`${stats.confidenceScore}% confidence`}
              accent="oklch(0.68 0.16 155)"
            />
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="bg-card border rounded-3xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h3>
            <span className="text-xs text-muted-foreground">
              {todayLog ? "Today's log recorded ✓" : "No log yet today"}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handlePeriodToday}
              disabled={loggingPeriod}
              className="rounded-full bg-gradient-primary font-bold text-xs h-10 px-5 shadow-xs"
            >
              <Droplet className="h-4 w-4 mr-1.5" /> Period Started Today
            </Button>

            <Button
              variant="outline"
              className="rounded-full text-xs h-10 px-4 font-semibold"
              onClick={() => {
                setSelectedDate(new Date());
                setLogSheetOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Log Symptoms & Mood
            </Button>

            <EditPeriodDialog
              userId={user?.id}
              initial={{
                last_period_start: profile.last_period_start,
                period_length: profile.period_length,
                cycle_length: profile.cycle_length,
              }}
              onSaved={() => {}}
              trigger={
                <Button variant="ghost" className="rounded-full text-xs h-10 px-3 text-muted-foreground">
                  <CalendarCog className="h-4 w-4 mr-1" /> Edit Cycle
                </Button>
              }
            />
          </div>
        </div>

        {/* Tracking Goal Switcher */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Tracking Focus
                </p>
                <p className="font-display text-base font-bold leading-tight">{goalLabel[goal]}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["tracking", "conceive", "avoid"] as const).map((v) => {
              const active = goal === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleGoalChange(v)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-soft scale-[1.02]"
                      : "border-border bg-card/60 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {goalLabel[v]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Compass: Nutrition, Hormones, Exercise */}
        <PhaseCompassCard stats={stats} />

        {/* Ovulation & Fertility Intelligence */}
        <OvulationCalculator stats={stats} goal={goal} />

        {/* 6-Month Cycle Forecast */}
        <CycleForecastTimeline profile={profile} periods={periods} />
      </div>

      {/* Daily Symptom & Period Log Modal */}
      <DailyLogSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        date={selectedDate}
        initialLog={getSymptomLog(fmt(selectedDate))}
        onSave={async (log) => {
          await saveSymptomLog(log);
        }}
        isPeriodDay={stats.canonicalPhase === "menstrual"}
      />
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/50 p-3 flex flex-col justify-between">
      <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: accent }}>
        {label}
      </p>
      <div>
        <p className="font-display text-base font-extrabold text-foreground mt-0.5 leading-tight">
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
