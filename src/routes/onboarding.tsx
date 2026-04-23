import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Intention = "conceive" | "avoid" | "tracking";

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<number>(28);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [lastPeriod, setLastPeriod] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [intention, setIntention] = useState<Intention>("tracking");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age,
          cycle_length: cycleLength,
          period_length: periodLength,
          last_period_start: lastPeriod,
          intention,
          onboarded: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      // Also create a period entry
      await supabase.from("periods").insert({
        user_id: user.id,
        start_date: lastPeriod,
      });
      toast.success("You're all set!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { title: "Welcome to CycleNova", subtitle: "Let's personalize your experience in under a minute." },
    { title: "How old are you?", subtitle: "This helps us provide age-appropriate insights." },
    { title: "Average cycle length", subtitle: "From the first day of one period to the next. 28 is typical." },
    { title: "How long is your period?", subtitle: "The number of days you usually bleed." },
    { title: "When did your last period start?", subtitle: "We use this to calibrate your predictions." },
    { title: "What's your goal?", subtitle: "We'll tailor the app to support you." },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="px-6 py-5 flex items-center gap-3 max-w-2xl mx-auto w-full">
        <div className="h-9 w-9 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-display font-bold">CycleNova</span>
      </header>

      <div className="px-6 max-w-2xl mx-auto w-full">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card border rounded-3xl p-7 shadow-soft"
            >
              <h2 className="font-display text-2xl font-bold">{steps[step].title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{steps[step].subtitle}</p>

              <div className="mt-6">
                {step === 0 && (
                  <div className="text-center py-6">
                    <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow">
                      <Heart className="h-10 w-10 text-primary-foreground" fill="currentColor" />
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground">Your data is private and encrypted. Only you can see it.</p>
                  </div>
                )}
                {step === 1 && (
                  <NumberPicker label={`${age} years`} value={age} min={13} max={60} onChange={setAge} />
                )}
                {step === 2 && (
                  <NumberPicker label={`${cycleLength} days`} value={cycleLength} min={20} max={45} onChange={setCycleLength} />
                )}
                {step === 3 && (
                  <NumberPicker label={`${periodLength} days`} value={periodLength} min={2} max={10} onChange={setPeriodLength} />
                )}
                {step === 4 && (
                  <div>
                    <Label htmlFor="lp">Date</Label>
                    <Input id="lp" type="date" value={lastPeriod} max={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => setLastPeriod(e.target.value)} className="mt-1.5 h-12 rounded-xl text-base" />
                  </div>
                )}
                {step === 5 && (
                  <div className="space-y-3">
                    {([
                      { v: "tracking", t: "Just tracking", d: "I want to understand my body better." },
                      { v: "conceive", t: "Trying to conceive", d: "Help me identify my fertile window." },
                      { v: "avoid", t: "Avoiding pregnancy", d: "Show me my safer days." },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setIntention(opt.v)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                          intention === opt.v ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <p className="font-semibold">{opt.t}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.d}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <Button variant="outline" onClick={back} className="rounded-full flex-1 h-12">Back</Button>
                )}
                {step < steps.length - 1 ? (
                  <Button onClick={next} className="rounded-full flex-1 h-12 bg-gradient-primary font-semibold shadow-soft">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={finish} disabled={saving} className="rounded-full flex-1 h-12 bg-gradient-primary font-semibold shadow-soft">
                    {saving ? "Setting up…" : "Finish setup"}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NumberPicker({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="text-center py-4">
      <p className="font-display text-5xl font-bold text-primary">{label}</p>
      <div className="mt-6">
        <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0])} />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{min}</span><span>{max}</span>
        </div>
      </div>
    </div>
  );
}
