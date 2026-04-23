import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, User, Calendar as CalIcon, Bell, Heart, Moon, Sun, Crown, Gift, Users, Sparkles, Wand2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAmbient } from "@/hooks/useAmbient";
import { useSubscription } from "@/hooks/useSubscription";
import { useGoal, goalLabel, goalDescription, type Goal } from "@/hooks/useGoal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { enabled: ambientEnabled, setEnabled: setAmbientEnabled } = useAmbient();
  const { isPremium } = useSubscription();
  const { goal, setGoal } = useGoal();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(28);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setName(data.display_name ?? "");
        setAge(data.age ?? 28);
        setCycleLength(data.cycle_length);
        setPeriodLength(data.period_length);
        setNotifications(data.notifications_enabled);
        setEmailNotifs(data.email_notifications_enabled ?? true);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        display_name: name,
        age,
        cycle_length: cycleLength,
        period_length: periodLength,
        notifications_enabled: notifications,
        email_notifications_enabled: emailNotifs,
      };
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Profile not found — please complete onboarding first.");
      setCycleLength(data.cycle_length);
      setPeriodLength(data.period_length);
      setName(data.display_name ?? "");
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Unable to save changes. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSelect = async (next: Goal) => {
    if (next === goal) return;
    try {
      await setGoal(next);
      toast.success("Goal updated successfully");
    } catch (e) {
      toast.error("Unable to save changes. Please try again.");
      console.error(e);
    }
  };

  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <NavCard to="/premium" icon={<Crown className="h-4 w-4" />} title={isPremium ? "Premium ✓" : "Upgrade"} />
        <NavCard to="/partner" icon={<Heart className="h-4 w-4" fill="currentColor" />} title="Partner" />
        <NavCard to="/invite" icon={<Gift className="h-4 w-4" />} title="Invite friends" />
        <NavCard to="/community" icon={<Users className="h-4 w-4" />} title="Community" />
      </div>

      <Section icon={<Sparkles className="h-4 w-4" />} title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setTheme("light")}
            className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${theme === "light" ? "border-primary bg-primary-soft" : "border-border"}`}>
            <Sun className="h-4 w-4" /> <span className="text-sm font-medium">Light</span>
          </button>
          <button onClick={() => setTheme("dark")}
            className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 ${theme === "dark" ? "border-primary bg-primary-soft" : "border-border"}`}>
            <Moon className="h-4 w-4" /> <span className="text-sm font-medium">Dark</span>
          </button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Ambient background animation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Phase-aware breathing scene. Turn off to save battery or reduce motion.
              </p>
            </div>
          </div>
          <Switch checked={ambientEnabled} onCheckedChange={setAmbientEnabled} />
        </div>
      </Section>

      <Section icon={<User className="h-4 w-4" />} title="Profile">
        <Field label="Display name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-11" />
        </Field>
        <Field label="Age">
          <Input type="number" min={13} max={70} value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} className="rounded-xl h-11" />
        </Field>
      </Section>

      <Section icon={<CalIcon className="h-4 w-4" />} title="Cycle">
        <Field label="Average cycle length (days)">
          <Input type="number" min={20} max={45} value={cycleLength} onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)} className="rounded-xl h-11" />
        </Field>
        <Field label="Period length (days)">
          <Input type="number" min={2} max={10} value={periodLength} onChange={(e) => setPeriodLength(parseInt(e.target.value) || 5)} className="rounded-xl h-11" />
        </Field>
        <Field label="Goal">
          <div className="grid grid-cols-3 gap-2">
            {(["tracking", "conceive", "avoid"] as const).map((v) => (
              <button key={v} onClick={() => setIntention(v)}
                className={`p-2.5 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${intention === v ? "border-primary bg-primary-soft text-primary" : "border-border"}`}>
                {v === "conceive" ? "Conceive" : v === "avoid" ? "Avoid" : "Track"}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">In-app reminders</p>
            <p className="text-xs text-muted-foreground mt-0.5">Period & ovulation heads-ups.</p>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email reminders</p>
            <p className="text-xs text-muted-foreground mt-0.5">Period, ovulation, partner invites & community replies.</p>
          </div>
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
        </div>
      </Section>

      <Button onClick={save} disabled={saving} className="w-full mt-6 h-12 rounded-full bg-gradient-primary font-semibold shadow-soft">
        {saving ? "Saving…" : "Save changes"}
      </Button>

      <Button onClick={handleSignOut} variant="outline" className="w-full mt-3 h-12 rounded-full">
        <LogOut className="h-4 w-4 mr-2" /> Sign out
      </Button>

      <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1">
        Made with <Heart className="h-3 w-3 text-primary" fill="currentColor" /> for your wellbeing
      </p>
    </AppShell>
  );
}

function NavCard({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="bg-card border rounded-2xl p-4 shadow-soft flex items-center gap-2 hover:border-primary transition-colors">
      <div className="h-8 w-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">{icon}</div>
      <span className="text-sm font-semibold">{title}</span>
    </Link>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-3xl p-5 shadow-soft mb-4">
      <div className="flex items-center gap-2 mb-4 text-primary">
        {icon}<h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
