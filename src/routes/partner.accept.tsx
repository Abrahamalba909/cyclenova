import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/partner/accept")({
  validateSearch: (search: Record<string, unknown>) => ({ code: (search.code as string) || "" }),
  component: AcceptInvite,
});

function AcceptInvite() {
  const { code } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: `/partner/accept?code=${code}` } as any });
  }, [user, loading, navigate, code]);

  const accept = async () => {
    if (!user || !code) return;
    setAccepting(true);
    try {
      const { data: invite, error: ie } = await supabase.from("partners")
        .select("id,owner_id,status").eq("invite_code", code).eq("status", "pending").maybeSingle();
      if (ie) throw ie;
      if (!invite) throw new Error("Invalid or expired invite");
      if (invite.owner_id === user.id) throw new Error("You can't accept your own invite");

      const { error } = await supabase.from("partners")
        .update({ partner_id: user.id, status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invite.id);
      if (error) throw error;
      setAccepted(true);
      toast.success("Connected!");
    } catch (e) { toast.error((e as Error).message); }
    finally { setAccepting(false); }
  };

  return (
    <AppShell>
      <div className="bg-card border rounded-3xl p-7 shadow-soft text-center mt-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-3">
          {accepted ? <Check className="h-6 w-6" /> : <Heart className="h-6 w-6" fill="currentColor" />}
        </div>
        {accepted ? (
          <>
            <h1 className="font-display text-2xl font-bold">You're connected!</h1>
            <p className="text-sm text-muted-foreground mt-2">You can now see their cycle.</p>
            <Button onClick={() => navigate({ to: "/partner" })} className="mt-5 rounded-full bg-gradient-primary h-11 px-6">View partner dashboard</Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold">Partner invitation</h1>
            <p className="text-sm text-muted-foreground mt-2">Someone wants to share their cycle with you. Accept to view their period & fertile window.</p>
            <Button onClick={accept} disabled={accepting || !code} className="mt-5 rounded-full bg-gradient-primary h-11 px-6">
              {accepting ? "Accepting…" : "Accept invitation"}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
