import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Calendar, Heart, Activity, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/icon-192.png?v=2"
            alt="CycleNova logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-2xl shadow-soft"
          />
          <span className="font-display text-xl font-bold tracking-tight">CycleNova</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Women's health, reimagined
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Understand <em className="not-italic text-primary">your cycle</em>, trust your body.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Track your period, predict ovulation, and log symptoms with the elegant health app designed for clarity, privacy, and peace of mind.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="rounded-full bg-gradient-primary hover:opacity-90 shadow-glow h-12 px-7 font-semibold">
                Open App Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-7 font-semibold border-foreground/15">
                Sign in / Sync
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Private by design", "No ads, ever", "Works offline"].map(t => (
              <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> {t}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-8 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
          <div className="relative bg-card rounded-[2.5rem] shadow-glow border p-8 max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Today</p>
                <p className="font-display text-2xl font-semibold">Day 14</p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--ovulation)]/15 text-[var(--ovulation)] font-semibold">Ovulation</span>
            </div>
            <div className="relative h-48 flex items-center justify-center">
              <svg width="180" height="180" className="-rotate-90">
                <circle cx="90" cy="90" r="78" fill="none" stroke="oklch(0.95 0.02 340)" strokeWidth="12" />
                <circle cx="90" cy="90" r="78" fill="none" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 78} strokeDashoffset={2 * Math.PI * 78 * 0.5} />
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.5 0.18 0)" />
                    <stop offset="100%" stopColor="oklch(0.55 0.18 310)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Period in</span>
                <span className="font-display text-5xl font-bold">14</span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { c: "var(--period)", l: "Period" },
                { c: "var(--fertile)", l: "Fertile" },
                { c: "var(--ovulation)", l: "Ovulation" },
              ].map(p => (
                <div key={p.l} className="p-2 rounded-xl bg-muted/40">
                  <span className="block h-2 w-2 rounded-full mx-auto mb-1" style={{ backgroundColor: p.c }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{p.l}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        {[
          { icon: Calendar, title: "Smart predictions", body: "Adaptive algorithm learns your unique rhythm and predicts your next period and ovulation accurately." },
          { icon: Activity, title: "Symptom intelligence", body: "Track 10+ symptoms with simple sliders and uncover patterns across your cycle." },
          { icon: Heart, title: "Built for you", body: "Whether you're tracking, conceiving, or avoiding — CycleNova adapts to your goals." },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border rounded-3xl p-7 shadow-soft hover:shadow-glow transition-shadow"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </section>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CycleNova. Your data, your body, your control.</p>
          <p className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" /> Made with care</p>
        </div>
      </footer>
    </div>
  );
}
