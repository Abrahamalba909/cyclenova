import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Droplet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CycleCalendar } from "@/components/CycleCalendar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fmt, getDayPhase, phaseLabel, type CycleProfile, type PeriodEntry } from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

const SYMPTOMS = [
  { key: "cramps", label: "Cramps" },
  { key: "headache", label: "Headache" },
  { key: "mood", label: "Mood swings" },
  { key: "acne", label: "Acne" },
  { key: "bloating", label: "Bloating" },
  { key: "back_pain", label: "Back pain" },
  { key: "fatigue", label: "Fatigue" },
  { key: "energy", label: "Energy" },
  { key: "sleep", label: "Sleep quality" },
  { key: "libido", label: "Libido" },
] as const;

type SymptomKey = typeof SYMPTOMS[number]["key"];
type SymptomState = Record<SymptomKey, number>;
const empty = (): SymptomState => Object.fromEntries(SYMPTOMS.map((s) => [s.key, 0])) as SymptomState;

function CalendarPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CycleProfile | null>(null);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [selected, setSelected] = useState<Date>(new Date());
  const [symptoms, setSymptoms] = useState<SymptomState>(empty());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (p) setProfile({ cycle_length: p.cycle_length, period_length: p.period_length, last_period_start: p.last_period_start });
      const { data: per } = await supabase.from("periods").select("start_date,end_date").eq("user_id", user.id).order("start_date", { ascending: false });
      setPeriods(per ?? []);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("symptoms").select("*").eq("user_id", user.id).eq("log_date", fmt(selected)).maybeSingle();
      if (data) {
        const next = empty();
        for (const k of SYMPTOMS) {
          const v = (data as unknown as Record<string, number>)[k.key];
          if (typeof v === "number") next[k.key] = v;
        }
        setSymptoms(next);
      } else {
        setSymptoms(empty());
      }
    })();
  }, [user, selected]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("symptoms").upsert(
        { user_id: user.id, log_date: fmt(selected), ...symptoms },
        { onConflict: "user_id,log_date" }
      );
      if (error) throw error;
      toast.success("Saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const logPeriodOn = async () => {
    if (!user) return;
    try {
      const date = fmt(selected);
      const { error } = await supabase.from("periods").insert({ user_id: user.id, start_date: date });
      if (error) throw error;
      const latest = periods[0]?.start_date;
      if (!latest || latest < date) {
        await supabase.from("profiles").update({ last_period_start: date }).eq("user_id", user.id);
      }
      toast.success(`Period logged on ${format(selected, "MMM d")}`);
      const { data: per } = await supabase.from("periods").select("start_date,end_date").eq("user_id", user.id).order("start_date", { ascending: false });
      setPeriods(per ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!profile) return <AppShell><div className="text-center py-20 text-muted-foreground">Loading…</div></AppShell>;

  const phase = getDayPhase(selected, profile, periods);
  const isPeriodLogged = periods.some((p) => isSameDay(new Date(p.start_date), selected));

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Tap any day to log symptoms or your period.</p>
      </div>

      <CycleCalendar profile={profile} periods={periods} selected={selected} onSelect={setSelected} />

      <div className="bg-card border rounded-3xl p-5 shadow-soft mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">{format(selected, "EEEE, MMMM d")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{phaseLabel[phase]}</p>
          </div>
          {!isPeriodLogged && (
            <Button onClick={logPeriodOn} variant="outline" className="rounded-full text-xs h-9">
              <Droplet className="h-3.5 w-3.5 mr-1" /> Log period
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {SYMPTOMS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">{s.label}</label>
                <span className="text-xs text-muted-foreground">{symptoms[s.key]}/5</span>
              </div>
              <Slider
                value={[symptoms[s.key]]}
                min={0}
                max={5}
                step={1}
                onValueChange={(v) => setSymptoms({ ...symptoms, [s.key]: v[0] })}
              />
            </div>
          ))}
        </div>

        <Button onClick={save} disabled={saving} className="w-full mt-6 h-11 rounded-full bg-gradient-primary font-semibold shadow-soft">
          {saving ? "Saving…" : "Save symptoms"}
        </Button>
      </div>
    </AppShell>
  );
}
