import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { TrendingUp, Calendar, Activity, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeAverageCycleLength, computeRegularity, type PeriodEntry } from "@/lib/cycle";

export const Route = createFileRoute("/insights")({
  component: Insights,
});

interface SymptomRow {
  log_date: string;
  cramps: number; headache: number; mood: number; acne: number; bloating: number;
  back_pain: number; fatigue: number; energy: number; sleep: number; libido: number;
}

function Insights() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [cycleLen, setCycleLen] = useState(28);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: p } = await supabase.from("profiles").select("cycle_length").eq("user_id", user.id).maybeSingle();
      if (p) setCycleLen(p.cycle_length);
      const { data: per } = await supabase.from("periods").select("start_date,end_date").eq("user_id", user.id).order("start_date", { ascending: true });
      setPeriods(per ?? []);
      const { data: sym } = await supabase.from("symptoms").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(60);
      setSymptoms((sym ?? []) as SymptomRow[]);
    })();
  }, [user]);

  const avg = computeAverageCycleLength(periods, cycleLen);
  const regularity = computeRegularity(periods);
  const cyclesTracked = periods.length;

  // Symptom averages
  const SYM_KEYS: Array<{ k: keyof SymptomRow; l: string }> = [
    { k: "cramps", l: "Cramps" }, { k: "headache", l: "Headache" }, { k: "mood", l: "Mood" },
    { k: "bloating", l: "Bloating" }, { k: "fatigue", l: "Fatigue" }, { k: "energy", l: "Energy" },
    { k: "sleep", l: "Sleep" }, { k: "back_pain", l: "Back pain" },
  ];
  const avgSym = SYM_KEYS.map((s) => {
    const vals = symptoms.map((r) => r[s.k] as number).filter((v) => v > 0);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { label: s.l, value: avg };
  }).sort((a, b) => b.value - a.value);

  // Cycle length history
  const cycleHistory: { label: string; days: number }[] = [];
  for (let i = 1; i < periods.length; i++) {
    const d = differenceInCalendarDays(parseISO(periods[i].start_date), parseISO(periods[i - 1].start_date));
    if (d >= 18 && d <= 45) cycleHistory.push({ label: format(parseISO(periods[i].start_date), "MMM d"), days: d });
  }

  const regLabel = { regular: "Regular", slightly_irregular: "Slightly irregular", irregular: "Irregular", unknown: "Need more data" }[regularity];
  const regColor = { regular: "var(--primary)", slightly_irregular: "var(--ovulation)", irregular: "var(--destructive)", unknown: "var(--muted-foreground)" }[regularity];

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Patterns from your cycle history.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Calendar className="h-4 w-4" />} label="Avg cycle" value={`${avg} days`} />
        <Card icon={<TrendingUp className="h-4 w-4" />} label="Regularity" value={regLabel} valueColor={regColor} />
        <Card icon={<Sparkles className="h-4 w-4" />} label="Cycles tracked" value={String(cyclesTracked)} />
        <Card icon={<Activity className="h-4 w-4" />} label="Days logged" value={String(symptoms.length)} />
      </div>

      <div className="bg-card border rounded-3xl p-5 shadow-soft mt-4">
        <h3 className="font-display text-lg font-semibold mb-4">Cycle length history</h3>
        {cycleHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Log a few more periods to see your trends.</p>
        ) : (
          <div className="space-y-2">
            {cycleHistory.slice(-6).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16">{c.label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${Math.min((c.days / 45) * 100, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-12 text-right">{c.days}d</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border rounded-3xl p-5 shadow-soft mt-4">
        <h3 className="font-display text-lg font-semibold mb-4">Symptom intensity (avg)</h3>
        {symptoms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Log symptoms to see patterns here.</p>
        ) : (
          <div className="space-y-3">
            {avgSym.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground text-xs">{s.value.toFixed(1)}/5</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.value / 5) * 100}%`, backgroundColor: "var(--primary)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Card({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{icon} {label}</div>
      <p className="font-display text-xl font-semibold mt-2" style={valueColor ? { color: valueColor } : undefined}>{value}</p>
    </div>
  );
}
