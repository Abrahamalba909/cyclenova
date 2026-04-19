import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Copy, Share2, Mail } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/invite")({
  component: InvitePage,
});

interface Referral { id: string; invitee_email: string | null; status: string; created_at: string; }

function InvitePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);
  useEffect(() => { if (user) void load(); /* eslint-disable-next-line */ }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("referral_code").eq("user_id", user.id).maybeSingle();
    if (p?.referral_code) setCode(p.referral_code);
    const { data: r } = await supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    setReferrals((r ?? []) as Referral[]);
  };

  const inviteUrl = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${code}` : "";

  const copy = () => { navigator.clipboard.writeText(inviteUrl); toast.success("Link copied!"); };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Join me on CycleSense", text: "I'm using CycleSense to track my cycle. Join me!", url: inviteUrl }); } catch { /* canceled */ }
    } else { copy(); }
  };

  const sendEmail = async () => {
    if (!user || !email.trim()) return;
    const { error } = await supabase.from("referrals").insert({ referrer_id: user.id, invitee_email: email.trim().toLowerCase() });
    if (error) { toast.error(error.message); return; }
    const subject = encodeURIComponent("Join me on CycleSense");
    const body = encodeURIComponent(`Hey! I've been using CycleSense to track my cycle and I love it. Join me here: ${inviteUrl}`);
    window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
    setEmail("");
    await load();
  };

  const successCount = referrals.filter((r) => r.status === "signed_up").length;
  const remaining = Math.max(0, 3 - successCount);

  return (
    <AppShell>
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-3 shadow-glow">
          <Gift className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold">Invite friends</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">Invite 3 friends and unlock 1 month of Premium free.</p>
      </div>

      <div className="bg-gradient-card border rounded-3xl p-5 shadow-soft mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Your referral link</p>
        <div className="flex gap-2 mt-2">
          <Input readOnly value={inviteUrl} className="rounded-xl h-11 text-xs" />
          <Button onClick={copy} variant="outline" className="rounded-full h-11"><Copy className="h-4 w-4" /></Button>
        </div>
        <Button onClick={share} className="w-full mt-3 rounded-full h-11 bg-gradient-primary"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
      </div>

      <div className="bg-card border rounded-3xl p-5 shadow-soft mb-4">
        <p className="font-display text-lg font-semibold flex items-center gap-2 mb-3"><Mail className="h-4 w-4" /> Invite by email</p>
        <div className="flex gap-2">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@email.com" className="rounded-xl h-11" />
          <Button onClick={sendEmail} disabled={!email.trim()} className="rounded-full bg-gradient-primary h-11">Send</Button>
        </div>
      </div>

      <div className="bg-card border rounded-3xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-lg font-semibold">Your invites</p>
          <p className="text-xs text-primary font-semibold">{successCount}/3 — {remaining} to free month</p>
        </div>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">No invites yet.</p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-b-0 py-2">
                <span className="truncate">{r.invitee_email ?? "Link share"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "signed_up" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {r.status === "signed_up" ? "Joined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
