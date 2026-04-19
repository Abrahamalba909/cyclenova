import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Check, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — CycleSense" },
      { name: "description", content: "Unlock advanced predictions, partner mode, AI assistant, and detailed health insights with CycleSense Premium." },
      { property: "og:title", content: "CycleSense Premium — Advanced cycle insights & AI" },
      { property: "og:description", content: "Advanced predictions, partner mode, AI health assistant, and detailed insights — $5/month." },
      { property: "og:image", content: "/og/premium.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CycleSense Premium" },
      { name: "twitter:description", content: "Advanced predictions, partner mode, AI assistant — $5/month." },
      { name: "twitter:image", content: "/og/premium.jpg" },
    ],
  }),
  component: PremiumPage,
});

const FREE = ["Basic cycle tracking", "Calendar view", "Basic predictions", "Community discussions"];
const PREMIUM = ["Advanced cycle predictions", "Detailed analytics & insights", "Partner mode + sharing", "Unlimited symptom tracking", "AI Health Assistant", "Monthly health reports", "Priority email reminders"];

function PremiumPage() {
  const { user, loading } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  const startTrial = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // 7-day trial — local activation. Real billing wires in next round.
      const trialEnds = new Date(); trialEnds.setDate(trialEnds.getDate() + 7);
      const periodEnds = new Date(); periodEnds.setMonth(periodEnds.getMonth() + (cycle === "monthly" ? 1 : 12));
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        plan: "premium",
        billing_cycle: cycle,
        status: "active",
        trial_ends_at: trialEnds.toISOString(),
        current_period_end: periodEnds.toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("🎉 Welcome to Premium! Enjoy your 7-day free trial.");
      window.location.href = "/dashboard";
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!user) return;
    await supabase.from("subscriptions").update({ plan: "free", status: "canceled" }).eq("user_id", user.id);
    toast.success("Switched to Free plan");
    window.location.reload();
  };

  return (
    <AppShell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-3 shadow-glow">
          <Crown className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold">CycleSense Premium</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">Unlock advanced predictions, AI guidance, and partner sharing.</p>
      </div>

      {!isPremium && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setCycle("monthly")}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${cycle === "monthly" ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly</p>
            <p className="font-display text-2xl font-bold mt-1">$5<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
          </button>
          <button onClick={() => setCycle("yearly")}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative ${cycle === "yearly" ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Save 17%</p>
            <p className="font-display text-2xl font-bold mt-1">$50<span className="text-sm text-muted-foreground font-normal">/yr</span></p>
          </button>
        </div>
      )}

      <div className="bg-gradient-card border-2 border-primary/30 rounded-3xl p-5 shadow-soft mb-4">
        <p className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Premium</p>
        <ul className="space-y-2 mt-3">
          {PREMIUM.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>
        {isPremium ? (
          <Button onClick={cancel} variant="outline" className="w-full mt-5 rounded-full h-12">Cancel Premium</Button>
        ) : (
          <Button onClick={startTrial} disabled={busy} className="w-full mt-5 rounded-full h-12 bg-gradient-primary font-semibold">
            {busy ? "Starting…" : "Start 7-day free trial"}
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground text-center mt-2">Cancel anytime · No charge during trial</p>
      </div>

      <div className="bg-card border rounded-3xl p-5">
        <p className="font-display text-lg font-semibold">Free</p>
        <ul className="space-y-2 mt-3">
          {FREE.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
