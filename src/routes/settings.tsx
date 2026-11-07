import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  LogOut,
  User,
  Calendar as CalIcon,
  Bell,
  Heart,
  Moon,
  Sun,
  Crown,
  Gift,
  Users,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Save,
} from "lucide-react";
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
import { useCycleStore } from "@/lib/cycleStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — CycleNova" }],
  }),
  component: Settings,
});

function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { enabled: ambientEnabled, setEnabled: setAmbientEnabled } = useAmbient();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const {
    profile,
    updateProfile,
    goal,
    setGoal,
    privacyMode,
    togglePrivacyMode,
    loadSampleJourney,
    resetAllData,
    exportDataJson,
    importDataJson,
    isGuest,
  } = useCycleStore();

  const [name, setName] = useState(user?.user_metadata?.display_name || "There");
  const [cycleLength, setCycleLength] = useState<number>(profile.cycle_length || 28);
  const [periodLength, setPeriodLength] = useState<number>(profile.period_length || 5);
  const [lutealLength, setLutealLength] = useState<number>(profile.luteal_length || 14);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCycleLength(profile.cycle_length || 28);
    setPeriodLength(profile.period_length || 5);
    setLutealLength(profile.luteal_length || 14);
  }, [profile]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateProfile({
        cycle_length: cycleLength,
        period_length: periodLength,
        luteal_length: lutealLength,
      });

      if (user) {
        await supabase
          .from("profiles")
          .update({
            display_name: name,
            cycle_length: cycleLength,
            period_length: periodLength,
            notifications_enabled: notifications,
          })
          .eq("user_id", user.id);
      }

      toast.success("Settings saved successfully");
    } catch (e) {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSelect = async (next: Goal) => {
    try {
      await setGoal(next);
      toast.success(`Goal updated to ${goalLabel[next]}`);
    } catch (e) {
      toast.error("Could not update goal");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          toast.success("Data successfully restored!");
        } else {
          toast.error("Invalid backup file format");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalize your cycle calculations, privacy, and backup.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account & Storage Status */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-white shadow-soft font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{user?.email || "Private Offline User"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  {user ? "Cloud Sync Active" : "Private local device storage (no account required)"}
                </p>
              </div>
            </div>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-xs rounded-full text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign out
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="rounded-full text-xs font-semibold">
                  Sign in / Backup
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Clinical Cycle Calibration */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold">Cycle Calculation Parameters</h3>
              <p className="text-xs text-muted-foreground">Adjust algorithm inputs for predictions</p>
            </div>
            <Button
              size="sm"
              onClick={saveSettings}
              disabled={saving}
              className="rounded-full bg-gradient-primary font-bold text-xs h-8 px-4"
            >
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cycle-len" className="text-xs font-semibold">
                Average Cycle Length
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="cycle-len"
                  type="number"
                  min={20}
                  max={50}
                  value={cycleLength}
                  onChange={(e) => setCycleLength(parseInt(e.target.value, 10) || 28)}
                  className="rounded-xl h-10 font-bold"
                />
                <span className="text-xs text-muted-foreground shrink-0">days</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Normal: 21–35 days</p>
            </div>

            <div>
              <Label htmlFor="period-len" className="text-xs font-semibold">
                Period Bleeding
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="period-len"
                  type="number"
                  min={2}
                  max={12}
                  value={periodLength}
                  onChange={(e) => setPeriodLength(parseInt(e.target.value, 10) || 5)}
                  className="rounded-xl h-10 font-bold"
                />
                <span className="text-xs text-muted-foreground shrink-0">days</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Normal: 3–7 days</p>
            </div>

            <div>
              <Label htmlFor="luteal-len" className="text-xs font-semibold">
                Luteal Phase
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="luteal-len"
                  type="number"
                  min={10}
                  max={16}
                  value={lutealLength}
                  onChange={(e) => setLutealLength(parseInt(e.target.value, 10) || 14)}
                  className="rounded-xl h-10 font-bold"
                />
                <span className="text-xs text-muted-foreground shrink-0">days</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Clinical norm: 14 days</p>
            </div>
          </div>
        </div>

        {/* Tracking Goal */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-3">
          <div>
            <h3 className="font-display text-base font-bold">Tracking Mode</h3>
            <p className="text-xs text-muted-foreground">Tailors ovulation guidance and calendar alerts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(["tracking", "conceive", "avoid"] as const).map((v) => {
              const active = goal === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleGoalSelect(v)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border bg-card/60 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-xs font-bold">{goalLabel[v]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {goalDescription[v]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy & Appearance Toggles */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-4">
          <h3 className="font-display text-base font-bold">Preferences & Display</h3>

          {/* Privacy Shield */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center">
                {privacyMode ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold">Privacy Shield (Public Transit Mode)</p>
                <p className="text-[11px] text-muted-foreground">
                  Blurs sensitive cycle days on screen until hovered or tapped
                </p>
              </div>
            </div>
            <Switch checked={privacyMode} onCheckedChange={togglePrivacyMode} />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold">Dark Theme</p>
                <p className="text-[11px] text-muted-foreground">Easy on the eyes at night</p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          {/* Ambient Scene */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold">Ambient Phase Background</p>
                <p className="text-[11px] text-muted-foreground">
                  Subtle floating orbs & illustrations matching cycle phase
                </p>
              </div>
            </div>
            <Switch checked={ambientEnabled} onCheckedChange={setAmbientEnabled} />
          </div>
        </div>

        {/* Data Backup & Demo Utilities */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-3">
          <div>
            <h3 className="font-display text-base font-bold">Data Management & Backup</h3>
            <p className="text-xs text-muted-foreground">
              Your health data belongs to you. Export or restore at any time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={exportDataJson}
              className="rounded-full text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-primary" /> Export Backup (JSON)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Restore Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadSampleJourney();
                toast.success("Loaded 4-month sample cycle history!");
              }}
              className="rounded-full text-xs font-semibold"
            >
              <Wand2 className="h-3.5 w-3.5 mr-1 text-amber-500" /> Load Sample Journey
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset all cycle data back to default initial state?")) {
                  resetAllData();
                  toast.success("Data reset to default");
                }
              }}
              className="rounded-full text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Data
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
