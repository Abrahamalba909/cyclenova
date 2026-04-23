import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Droplet, Plus, Settings as SettingsIcon, CalendarCog, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { PhaseRing } from "@/components/PhaseRing";
import { OvulationCalculator } from "@/components/OvulationCalculator";
import { EditPeriodDialog } from "@/components/EditPeriodDialog";
import { useAuth } from "@/hooks/useAuth";
import { useGoal, goalLabel, type Goal } from "@/hooks/useGoal";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, fmt, phaseDescription, phaseLabel, type CycleProfile, type PeriodEntry } from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const { goal, setGoal, saving: goalSaving } = useGoal();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CycleProfile | null>(null);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [name, setName] = useState<string>("");
  const [logging, setLogging] = useState(false);

  const handleGoalChange = async (next: Goal) => {
    if (next === goal || goalSaving) return; // lockout: ignore rapid taps while saving
    try {
      await setGoal(next);
      toast.success("Goal updated successfully");
    } catch (e) {
      toast.error("Unable to save changes. Please try again.");
      console.error(e);
    }
  };


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (!p?.onboarded) {
      navigate({ to: "/onboarding" });
      return;
    }
    setName(p.display_name || "there");
    setProfile({ cycle_length: p.cycle_length, period_length: p.period_length, last_period_start: p.last_period_start });
    const { data: per } = await supabase.from("periods").select("start_date,end_date").eq("user_id", user.id).order("start_date", { ascending: false });
    setPeriods(per ?? []);
  };

  const logPeriodToday = async () => {
    if (!user) return;
    setLogging(true);
    try {
      const today = fmt(new Date());
      const { error } = await supabase.from("periods").insert({ user_id: user.id, start_date: today });
      if (error) throw error;
      await supabase.from("profiles").update({ last_period_start: today }).eq("user_id", user.id);
      toast.success("Period logged for today");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLogging(false);
    }
  };

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center text-muted-foreground py-20">Loading…</div>
      </AppShell>
    );
  }

  const stats = computeStats(profile, periods);

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="font-display text-3xl font-bold mt-1">Hello, {name}</h1>
        </div>
        <Link to="/settings" className="h-10 w-10 rounded-full bg-card border flex items-center justify-center text-muted-foreground hover:text-primary">
          <SettingsIcon className="h-4 w-4" />
        </Link>
      </div>

      {stats && (
        <div className="space-y-4">
          {/* Current Cycle Status */}
          <div className="bg-card border rounded-3xl p-7 shadow-soft text-center">
            <PhaseRing
              cycleDay={stats.cycleDay}
              cycleLength={stats.averageCycleLength}
              daysUntil={stats.daysUntilPeriod}
              phase={stats.currentPhase}
            />
            <div className="mt-6">
              <p className="font-display text-xl font-semibold">{phaseLabel[stats.currentPhase]}</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                {phaseDescription[stats.currentPhase]}
              </p>
            </div>

            {/* Quick metrics inline */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-left">
              <MetricPill label="Cycle day" value={`${stats.cycleDay}`} accent="var(--primary)" />
              <MetricPill
                label="Next period"
                value={stats.daysUntilPeriod <= 0 ? "Likely" : `${stats.daysUntilPeriod}d`}
                accent="var(--period)"
              />
              <MetricPill
                label="Ovulation"
                value={format(stats.ovulationDay, "MMM d")}
                accent="var(--ovulation)"
              />
            </div>
          </div>

          {/* Your Goal */}
          <div className="bg-card border rounded-3xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Your goal</p>
                  <p className="font-display text-base font-bold leading-none mt-0.5">{goalLabel[goal]}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["tracking", "conceive", "avoid"] as const).map((v) => {
                const active = goal === v;
                const isPending = goalSaving && !active;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleGoalChange(v)}
                    aria-pressed={active}
                    disabled={goalSaving}
                    aria-busy={goalSaving}
                    className={`p-3 rounded-2xl border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                      active
                        ? "border-primary bg-gradient-primary text-primary-foreground shadow-soft scale-[1.02]"
                        : isPending
                          ? "border-border bg-background/40 opacity-60"
                          : "border-border bg-background/40 hover:border-primary/40"
                    }`}
                  >
                    {goalLabel[v]}
                  </button>
                );
              })}
            </div>
            {goalSaving && (
              <p className="text-[11px] text-muted-foreground mt-2 text-center">Saving your goal…</p>
            )}
            <GoalGuidance goal={goal} stats={stats} />
          </div>

          {/* Ovulation Calculator */}
          <OvulationCalculator stats={stats} goal={goal} />

          {/* Quick log */}
          <div className="bg-card border rounded-3xl p-5 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-3">Quick actions</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={logPeriodToday}
                disabled={logging}
                className="rounded-full bg-gradient-primary font-semibold"
              >
                <Droplet className="h-4 w-4 mr-1.5" /> Period started today
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate({ to: "/calendar" })}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Log symptoms
              </Button>
              <EditPeriodDialog
                userId={user!.id}
                initial={{
                  last_period_start: profile.last_period_start,
                  period_length: profile.period_length,
                  cycle_length: profile.cycle_length,
                }}
                onSaved={load}
                trigger={
                  <Button variant="outline" className="rounded-full">
                    <CalendarCog className="h-4 w-4 mr-1.5" /> Edit period
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border bg-background/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
        {label}
      </p>
      <p className="font-display text-base font-bold mt-0.5 leading-none">{value}</p>
    </div>
  );
}

function GoalGuidance({ goal, stats }: { goal: Goal; stats: ReturnType<typeof computeStats> }) {
  if (!stats) return null;

  if (goal === "conceive") {
    return (
      <div
        className="mt-4 rounded-2xl p-3.5"
        style={{
          background: "color-mix(in oklab, var(--period) 12%, transparent)",
          border: "1px solid color-mix(in oklab, var(--period) 28%, transparent)",
        }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--period)" }}>
          High chance days
        </p>
        <p className="text-sm font-medium mt-1">
          {format(stats.fertileWindow.start, "MMM d")} – {format(stats.fertileWindow.end, "MMM d")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Best timing for conception is around ovulation on {format(stats.ovulationDay, "MMM d")}.
        </p>
      </div>
    );
  }

  if (goal === "avoid") {
    return (
      <div
        className="mt-4 rounded-2xl p-3.5"
        style={{
          background: "color-mix(in oklab, oklch(0.7 0.14 150) 12%, transparent)",
          border: "1px solid color-mix(in oklab, oklch(0.7 0.14 150) 28%, transparent)",
        }}
      >
        <p className="text-xs font-semibold" style={{ color: "oklch(0.45 0.14 150)" }}>
          Low risk days
        </p>
        <p className="text-sm font-medium mt-1">
          Outside {format(stats.fertileWindow.start, "MMM d")} – {format(stats.fertileWindow.end, "MMM d")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Avoid unprotected intimacy during your fertile window for lowest pregnancy risk.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl p-3.5 bg-background/40 border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Cycle tracking
      </p>
      <p className="text-sm font-medium mt-1">
        Day {stats.cycleDay} of {stats.averageCycleLength} — {phaseLabel[stats.currentPhase]}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Keep logging to refine your predictions and insights.
      </p>
    </div>
  );
}
