import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Droplet, Sparkles, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { PhaseRing } from "@/components/PhaseRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, fmt, phaseDescription, phaseLabel, type CycleProfile, type PeriodEntry } from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CycleProfile | null>(null);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [name, setName] = useState<string>("");
  const [logging, setLogging] = useState(false);

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
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="font-display text-3xl font-bold mt-1">Hello, {name}</h1>
      </div>

      {stats && (
        <>
          <div className="bg-card border rounded-3xl p-7 shadow-soft text-center">
            <PhaseRing
              cycleDay={stats.cycleDay}
              cycleLength={stats.averageCycleLength}
              daysUntil={stats.daysUntilPeriod}
              phase={stats.currentPhase}
            />
            <div className="mt-6">
              <p className="font-display text-xl font-semibold">{phaseLabel[stats.currentPhase]}</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">{phaseDescription[stats.currentPhase]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Ovulation"
              value={format(stats.ovulationDay, "MMM d")}
              accent="var(--ovulation)"
            />
            <StatCard
              icon={<Heart className="h-4 w-4" fill="currentColor" />}
              label="Fertile window"
              value={`${format(stats.fertileWindow.start, "MMM d")}–${format(stats.fertileWindow.end, "d")}`}
              accent="var(--fertile)"
            />
            <StatCard
              icon={<Droplet className="h-4 w-4" />}
              label="Next period"
              value={format(stats.nextPeriodStart, "MMM d")}
              accent="var(--period)"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Cycle length"
              value={`${stats.averageCycleLength} days`}
              accent="var(--primary)"
            />
          </div>

          <div className="mt-4 bg-card border rounded-3xl p-5 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-3">Quick log</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={logPeriodToday} disabled={logging} className="rounded-full bg-gradient-primary font-semibold">
                <Droplet className="h-4 w-4 mr-1.5" /> Period started today
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate({ to: "/calendar" })}>
                <Plus className="h-4 w-4 mr-1.5" /> Log symptoms
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: accent }}>
        {icon} <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}
