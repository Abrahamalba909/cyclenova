import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, Activity, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/community", label: "Community", icon: Users },
  { to: "/assistant", label: "AI", icon: Sparkles },
  { to: "/insights", label: "Insights", icon: Activity },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 flex items-center gap-2.5">
        <img src="/icons/icon-192.png" alt="CycleSense" width={32} height={32} className="h-8 w-8 rounded-xl shadow-soft" />
        <span className="font-display text-base font-bold tracking-tight">CycleSense</span>
      </header>
      <main className="max-w-2xl mx-auto pb-28 pt-3 px-4 sm:px-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-2xl mx-auto px-3 pb-4">
          <div className="bg-card/95 backdrop-blur-xl border rounded-full shadow-glow flex items-center justify-around p-2">
            {tabs.map((t) => {
              const active = pathname === t.to || pathname.startsWith(t.to + "/");
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-full transition-all",
                    active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
