import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, Activity, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AmbientScene } from "@/components/AmbientScene";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home, motion: "icon-pulse" },
  { to: "/calendar", label: "Calendar", icon: Calendar, motion: "icon-flip" },
  { to: "/community", label: "Community", icon: Users, motion: "icon-float" },
  { to: "/assistant", label: "AI", icon: Sparkles, motion: "icon-halo" },
  { to: "/insights", label: "Insights", icon: Activity, motion: "icon-pulse" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="relative min-h-screen bg-background">
      <AmbientScene />
      <header className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-5 flex items-center gap-2.5">
        <img src="/icons/icon-192.png" alt="CycleNova" width={32} height={32} className="h-8 w-8 rounded-xl shadow-soft" />
        <span className="font-display text-base font-bold tracking-tight">CycleNova</span>
      </header>
      <main className="relative max-w-2xl mx-auto pb-28 pt-3 px-4 sm:px-6">{children}</main>
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
                    active ? "nav-active bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.motion === "icon-halo" ? (
                    <span className="icon-halo">
                      <Icon className="h-5 w-5" />
                    </span>
                  ) : (
                    <Icon className={cn("h-5 w-5", t.motion)} />
                  )}
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
