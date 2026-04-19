import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Droplet, Sparkles, Heart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, phaseLabel, type CycleProfile, type PeriodEntry } from "@/lib/cycle";

export const Route = createFileRoute("/partner/view/$ownerId")({
  component: PartnerView,
});

function PartnerView() {
  const { ownerId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Partner");
  const [profile, setProfile] = useState<CycleProfile | null>(null);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [shares, setShares] = useState({ share_period: true, share_ovulation: true, share_fertile: true, share_pms: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: p } = await supabase.from("profiles").select("display_name,cycle_length,period_length,last_period_start").eq("user_id", ownerId).maybeSingle();
      if (p) {
        setName(p.display_name || "Partner");
        setProfile({ cycle_length: p.cycle_length, period_length: p.period_length, last_period_start: p.last_period_start });
      }
      const { data: per } = await supabase.from("periods").select("start_date,end_date").eq("user_id", ownerId).order("start_date", { ascending: false });
      setPeriods((per ?? []) as PeriodEntry[]);
      const { data: s } = await supabase.from("partner_shares").select("*").eq("user_id", ownerId).maybeSingle();
      if (s) setShares(s);
      setLoaded(true);
    })();
  }, [user, ownerId]);

  if (!loaded || !profile) return <AppShell><div className="text-center py-20 text-muted-foreground">Loading…</div></AppShell>;
  const stats = computeStats(profile, periods);

  return (
    <AppShell>
      <Link to="/partner" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Partner view</p>
        <h1 className="font-display text-3xl font-bold mt-1">{name}'s cycle</h1>
      </div>

      {!stats ? (
        <div className="bg-card border rounded-3xl p-7 text-center text-muted-foreground">No cycle data yet.</div>
      ) : (
        <div className="space-y-3">
          <div className="bg-card border rounded-3xl p-6 shadow-soft text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Current phase</p>
            <p className="font-display text-2xl font-bold mt-1">{phaseLabel[stats.currentPhase]}</p>
            <p className="text-sm text-muted-foreground mt-1">Cycle day {stats.cycleDay}</p>
          </div>
          {shares.share_period && (
            <Card icon={<Droplet className="h-4 w-4" />} accent="var(--period)" label="Next period" value={format(stats.nextPeriodStart, "EEEE, MMM d")} sub={`In ${stats.daysUntilPeriod} days`} />
          )}
          {shares.share_ovulation && (
            <Card icon={<Sparkles className="h-4 w-4" />} accent="var(--ovulation)" label="Ovulation" value={format(stats.ovulationDay, "EEEE, MMM d")} />
          )}
          {shares.share_fertile && (
            <Card icon={<Heart className="h-4 w-4" />} accent="var(--fertile)" label="Fertile window" value={`${format(stats.fertileWindow.start, "MMM d")} – ${format(stats.fertileWindow.end, "MMM d")}`} />
          )}
          {shares.share_pms && (
            <Card icon={<Sparkles className="h-4 w-4" />} accent="var(--pms)" label="PMS starts" value={format(stats.pmsStart, "EEEE, MMM d")} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function Card({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: accent }}>
        {icon} {label}
      </div>
      <p className="font-display text-xl font-semibold mt-1.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
