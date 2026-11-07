import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Droplet,
  Heart,
  Smile,
  Thermometer,
  Calendar,
  X,
  Check,
  Flame,
  Activity,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { DailySymptomLog, FlowIntensity, CervicalMucus } from "@/lib/cycle";
import { fmt } from "@/lib/cycle";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  initialLog?: DailySymptomLog;
  onSave: (log: DailySymptomLog) => void | Promise<void>;
  onLogPeriodStart?: () => void | Promise<void>;
  isPeriodDay?: boolean;
}

const FLOW_OPTIONS: { key: FlowIntensity; label: string; icon: string; desc: string }[] = [
  { key: "none", label: "No Flow", icon: "⚪", desc: "No bleeding today" },
  { key: "spotting", label: "Spotting", icon: "🌸", desc: "A few drops / pinkish" },
  { key: "light", label: "Light", icon: "🩸", desc: "Light flow, pantyliner" },
  { key: "medium", label: "Medium", icon: "🔴", desc: "Regular pad / tampon" },
  { key: "heavy", label: "Heavy", icon: "🛑", desc: "Heavy flow, high absorbency" },
];

const SYMPTOM_SLIDERS = [
  { key: "cramps", label: "Pelvic Cramps", icon: Flame },
  { key: "headache", label: "Headache / Migraine", icon: Activity },
  { key: "bloating", label: "Bloating / Digestion", icon: Droplet },
  { key: "breast_tenderness", label: "Breast Tenderness", icon: Heart },
  { key: "fatigue", label: "Fatigue / Exhaustion", icon: Activity },
  { key: "back_pain", label: "Lower Back Pain", icon: Activity },
] as const;

const MOODS = [
  { tag: "Calm", emoji: "😌" },
  { tag: "Happy", emoji: "😊" },
  { tag: "Energetic", emoji: "⚡" },
  { tag: "Confident", emoji: "✨" },
  { tag: "Romantic", emoji: "🥰" },
  { tag: "Sensitive", emoji: "🥺" },
  { tag: "Irritable", emoji: "😤" },
  { tag: "Anxious", emoji: "😟" },
  { tag: "Low Energy", emoji: "😔" },
  { tag: "Tearful", emoji: "😢" },
];

const MUCUS_OPTIONS: { key: CervicalMucus; label: string; sub: string }[] = [
  { key: "dry", label: "Dry", sub: "Low / infertile" },
  { key: "sticky", label: "Sticky", sub: "Thick, low fertility" },
  { key: "creamy", label: "Creamy", sub: "Lotion-like, transitional" },
  { key: "watery", label: "Watery", sub: "Clear & wet, fertile" },
  { key: "eggwhite", label: "Egg-white", sub: "Stretchy & clear, peak fertility!" },
];

export function DailyLogSheet({
  open,
  onOpenChange,
  date,
  initialLog,
  onSave,
  onLogPeriodStart,
  isPeriodDay,
}: Props) {
  const [flow, setFlow] = useState<FlowIntensity>(initialLog?.flow ?? (isPeriodDay ? "medium" : "none"));
  const [cramps, setCramps] = useState<number>(initialLog?.cramps ?? 0);
  const [headache, setHeadache] = useState<number>(initialLog?.headache ?? 0);
  const [bloating, setBloating] = useState<number>(initialLog?.bloating ?? 0);
  const [breast, setBreast] = useState<number>(initialLog?.breast_tenderness ?? 0);
  const [fatigue, setFatigue] = useState<number>(initialLog?.fatigue ?? 0);
  const [backPain, setBackPain] = useState<number>(initialLog?.back_pain ?? 0);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(initialLog?.mood_tags ?? []);
  const [mucus, setMucus] = useState<CervicalMucus | undefined>(initialLog?.mucus);
  const [temp, setTemp] = useState<string>(initialLog?.temperature_c ? String(initialLog.temperature_c) : "");
  const [intimacy, setIntimacy] = useState<"none" | "protected" | "unprotected" | "high_drive">(
    initialLog?.intimacy ?? "none"
  );
  const [notes, setNotes] = useState<string>(initialLog?.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Sync state when initialLog changes
  useEffect(() => {
    if (open) {
      setFlow(initialLog?.flow ?? (isPeriodDay ? "medium" : "none"));
      setCramps(initialLog?.cramps ?? 0);
      setHeadache(initialLog?.headache ?? 0);
      setBloating(initialLog?.bloating ?? 0);
      setBreast(initialLog?.breast_tenderness ?? 0);
      setFatigue(initialLog?.fatigue ?? 0);
      setBackPain(initialLog?.back_pain ?? 0);
      setSelectedMoods(initialLog?.mood_tags ?? []);
      setMucus(initialLog?.mucus);
      setTemp(initialLog?.temperature_c ? String(initialLog.temperature_c) : "");
      setIntimacy(initialLog?.intimacy ?? "none");
      setNotes(initialLog?.notes ?? "");
    }
  }, [open, initialLog, isPeriodDay]);

  const toggleMood = (tag: string) => {
    setSelectedMoods((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedTemp = temp ? parseFloat(temp) : undefined;
      const logPayload: DailySymptomLog = {
        log_date: fmt(date),
        flow,
        cramps,
        headache,
        bloating,
        breast_tenderness: breast,
        fatigue,
        back_pain: backPain,
        mood_tags: selectedMoods,
        mucus,
        temperature_c: parsedTemp && !isNaN(parsedTemp) ? parsedTemp : undefined,
        intimacy,
        notes,
      };

      await onSave(logPayload);
      toast.success(`Logged for ${format(date, "MMMM d")}`);
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save log");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Daily Health Log
              </p>
              <DialogTitle className="font-display text-2xl font-bold mt-0.5">
                {format(date, "EEEE, MMMM d")}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Track bleeding flow, physical symptoms, moods, and cervical mucus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Bleeding Flow Intensity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-2.5">
              <Droplet className="h-4 w-4 text-rose-500" /> Bleeding Flow
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {FLOW_OPTIONS.map((opt) => {
                const isSelected = flow === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFlow(opt.key)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold shadow-xs scale-102"
                        : "border-border bg-card/60 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[10px] mt-1 truncate w-full">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood Tags */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-2.5">
              <Smile className="h-4 w-4 text-amber-500" /> Moods & Emotions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const active = selectedMoods.includes(m.tag);
                return (
                  <button
                    key={m.tag}
                    type="button"
                    onClick={() => toggleMood(m.tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "border-border bg-card/60 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Symptoms Sliders */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-indigo-500" /> Physical Symptoms (0 - 10)
            </label>

            {/* Cramps */}
            <div className="bg-card/40 border rounded-2xl p-3">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Pelvic Cramps</span>
                <span className="font-bold text-primary">{cramps > 0 ? `${cramps}/10` : "None"}</span>
              </div>
              <Slider value={[cramps]} onValueChange={([v]) => setCramps(v)} min={0} max={10} step={1} />
            </div>

            {/* Headache */}
            <div className="bg-card/40 border rounded-2xl p-3">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Headache / Tension</span>
                <span className="font-bold text-primary">{headache > 0 ? `${headache}/10` : "None"}</span>
              </div>
              <Slider value={[headache]} onValueChange={([v]) => setHeadache(v)} min={0} max={10} step={1} />
            </div>

            {/* Bloating */}
            <div className="bg-card/40 border rounded-2xl p-3">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Bloating & Water Retention</span>
                <span className="font-bold text-primary">{bloating > 0 ? `${bloating}/10` : "None"}</span>
              </div>
              <Slider value={[bloating]} onValueChange={([v]) => setBloating(v)} min={0} max={10} step={1} />
            </div>

            {/* Fatigue */}
            <div className="bg-card/40 border rounded-2xl p-3">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Fatigue & Low Stamina</span>
                <span className="font-bold text-primary">{fatigue > 0 ? `${fatigue}/10` : "None"}</span>
              </div>
              <Slider value={[fatigue]} onValueChange={([v]) => setFatigue(v)} min={0} max={10} step={1} />
            </div>
          </div>

          {/* Cervical Mucus Fertility Indicator */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> Cervical Fluid (Fertility Awareness)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MUCUS_OPTIONS.map((opt) => {
                const active = mucus === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMucus(active ? undefined : opt.key)}
                    className={`flex items-start justify-between p-2.5 rounded-2xl border text-left transition-all ${
                      active
                        ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold"
                        : "border-border bg-card/60 hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                    </div>
                    {active && <Check className="h-4 w-4 text-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals: Basal Body Temperature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-1.5">
                <Thermometer className="h-4 w-4 text-cyan-500" /> BBT (°C)
              </label>
              <Input
                type="number"
                step="0.05"
                min="35.0"
                max="39.0"
                placeholder="36.4"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-1.5">
                <Shield className="h-4 w-4 text-emerald-500" /> Intimacy
              </label>
              <select
                value={intimacy}
                onChange={(e) => setIntimacy(e.target.value as typeof intimacy)}
                className="w-full h-10 rounded-xl border bg-background px-3 text-xs"
              >
                <option value="none">None</option>
                <option value="protected">Protected (condom/etc)</option>
                <option value="unprotected">Unprotected</option>
                <option value="high_drive">High drive only</option>
              </select>
            </div>
          </div>

          {/* Personal Journal / Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1.5">
              Personal Journal Notes
            </label>
            <Textarea
              placeholder="How are you feeling today? Any specific symptoms, remedies, or reflections..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl min-h-[70px] text-xs"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gradient-primary font-bold px-6"
          >
            {saving ? "Saving..." : "Save Daily Log"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

