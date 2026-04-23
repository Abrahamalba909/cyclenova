import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Mail, Copy, X, Users, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner Mode — CycleNova" },
      { name: "description", content: "Privately share your cycle phases, fertile window, and period predictions with your partner — you control what they see." },
      { property: "og:title", content: "CycleNova Partner Mode — Share your cycle, your way" },
      { property: "og:description", content: "Invite your partner to see exactly what you choose: period, ovulation, fertile window, or PMS." },
      { property: "og:image", content: "/og/partner.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CycleNova Partner Mode" },
      { name: "twitter:description", content: "Privately share your cycle with your partner." },
      { name: "twitter:image", content: "/og/partner.jpg" },
    ],
  }),
  component: PartnerPage,
});

interface PartnerInvite { id: string; owner_id: string; partner_id: string | null; invite_email: string | null; invite_code: string; status: string; created_at: string; }
interface Shares { share_period: boolean; share_ovulation: boolean; share_fertile: boolean; share_pms: boolean; }

function PartnerPage() {
  const { user, loading } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PartnerInvite[]>([]);
  const [incoming, setIncoming] = useState<PartnerInvite[]>([]);
  const [shares, setShares] = useState<Shares>({ share_period: true, share_ovulation: true, share_fertile: true, share_pms: true });
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { if (user) void load(); /* eslint-disable-next-line */ }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: out } = await supabase.from("partners").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    setInvites((out ?? []) as PartnerInvite[]);
    const { data: inc } = await supabase.from("partners").select("*").eq("partner_id", user.id).eq("status", "accepted");
    setIncoming((inc ?? []) as PartnerInvite[]);
    const { data: s } = await supabase.from("partner_shares").select("*").eq("user_id", user.id).maybeSingle();
    if (s) setShares(s);
    else await supabase.from("partner_shares").insert({ user_id: user.id });
  };

  const sendInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("partners").insert({
        owner_id: user.id,
        invite_email: inviteEmail.trim().toLowerCase(),
      });
      if (error) throw error;
      toast.success("Invitation created. Share the link below.");
      setInviteEmail("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    await supabase.from("partners").delete().eq("id", id);
    toast.success("Invite revoked");
    await load();
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/partner/accept?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const updateShare = async (key: keyof Shares, value: boolean) => {
    const next = { ...shares, [key]: value };
    setShares(next);
    await supabase.from("partner_shares").update(next).eq("user_id", user!.id);
  };

  if (subLoading) return <AppShell><div className="text-center py-20 text-muted-foreground">Loading…</div></AppShell>;

  if (!isPremium) {
    return (
      <AppShell>
        <div className="mb-5">
          <h1 className="font-display text-3xl font-bold">Partner Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">Share your cycle with someone you trust.</p>
        </div>
        <PaywallCard feature="Partner Mode" description="Invite a partner to view your cycle phases, fertile window, and period predictions — with full control over what's shared." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" fill="currentColor" /> Partner Mode
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Securely share your cycle with someone you trust.</p>
      </div>

      {incoming.length > 0 && (
        <div className="bg-card border rounded-3xl p-5 shadow-soft mb-4">
          <h2 className="font-display text-lg font-semibold mb-3">Connected to</h2>
          {incoming.map((i) => (
            <Link key={i.id} to="/partner/view/$ownerId" params={{ ownerId: i.owner_id }}
              className="flex items-center justify-between p-3 bg-primary-soft rounded-2xl">
              <span className="text-sm font-medium">View their cycle →</span>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-card border rounded-3xl p-5 shadow-soft mb-4">
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Mail className="h-4 w-4" /> Invite a partner</h2>
        <div className="flex gap-2">
          <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="partner@email.com" className="rounded-xl h-11" />
          <Button onClick={sendInvite} disabled={busy || !inviteEmail.trim()} className="rounded-full bg-gradient-primary h-11 px-5">Invite</Button>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="bg-card border rounded-3xl p-5 shadow-soft mb-4">
          <h2 className="font-display text-lg font-semibold mb-3">Your invites</h2>
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 border rounded-2xl">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.invite_email || "Open invite"}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.status === "accepted" ? <span className="text-primary inline-flex items-center gap-1"><Check className="h-3 w-3" /> Connected</span> : "Pending"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {i.status === "pending" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyLink(i.invite_code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => revoke(i.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border rounded-3xl p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2"><Users className="h-4 w-4" /> What partner sees</h2>
        <p className="text-xs text-muted-foreground mb-4">Toggle exactly what your partner can view.</p>
        {[
          { key: "share_period" as const, label: "Period predictions", desc: "Next period date" },
          { key: "share_ovulation" as const, label: "Ovulation day", desc: "Predicted ovulation" },
          { key: "share_fertile" as const, label: "Fertile window", desc: "Conception-friendly days" },
          { key: "share_pms" as const, label: "PMS phase", desc: "Heads-up before PMS" },
        ].map((row) => (
          <div key={row.key} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.desc}</p>
            </div>
            <Switch checked={shares[row.key]} onCheckedChange={(v) => updateShare(row.key, v)} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
