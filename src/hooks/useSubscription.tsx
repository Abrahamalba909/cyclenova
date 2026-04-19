import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Plan = "free" | "premium";

export function useSubscription() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan,status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data && data.plan === "premium" && data.status === "active") setPlan("premium");
      else setPlan("free");
      setLoading(false);
    })();
  }, [user]);

  const isPremium = plan === "premium";
  return { plan, isPremium, loading };
}
