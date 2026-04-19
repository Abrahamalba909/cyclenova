import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function PaywallCard({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="bg-gradient-card border-2 border-primary/20 rounded-3xl p-7 shadow-soft text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-3">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="font-display text-2xl font-bold">{feature}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>
      <Link to="/premium" className="inline-block mt-5">
        <Button className="rounded-full bg-gradient-primary font-semibold h-11 px-6">
          <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade to Premium
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground mt-3">$5/month · Cancel anytime</p>
    </div>
  );
}
