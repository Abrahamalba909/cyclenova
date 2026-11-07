import { useState, useEffect } from "react";
import { Calendar as CalIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCycleStore } from "@/lib/cycleStore";

const Schema = z.object({
  last_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  period_length: z.number().int().min(2).max(12),
  cycle_length: z.number().int().min(20).max(50),
});

interface Props {
  userId?: string | null;
  initial: {
    last_period_start: string | null;
    period_length: number;
    cycle_length: number;
  };
  onSaved: () => void | Promise<void>;
  trigger?: React.ReactNode;
}

export function EditPeriodDialog({ userId, initial, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [lastStart, setLastStart] = useState(initial.last_period_start ?? format(new Date(), "yyyy-MM-dd"));
  const [periodLen, setPeriodLen] = useState(initial.period_length || 5);
  const [cycleLen, setCycleLen] = useState(initial.cycle_length || 28);
  const [saving, setSaving] = useState(false);
  const { updateProfile, savePeriod } = useCycleStore();

  useEffect(() => {
    if (open) {
      setLastStart(initial.last_period_start ?? format(new Date(), "yyyy-MM-dd"));
      setPeriodLen(initial.period_length || 5);
      setCycleLen(initial.cycle_length || 28);
    }
  }, [open, initial.last_period_start, initial.period_length, initial.cycle_length]);

  const save = async () => {
    const parsed = Schema.safeParse({
      last_period_start: lastStart,
      period_length: periodLen,
      cycle_length: cycleLen,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      // Update local store
      await updateProfile({
        last_period_start: parsed.data.last_period_start,
        period_length: parsed.data.period_length,
        cycle_length: parsed.data.cycle_length,
      });

      await savePeriod({
        start_date: parsed.data.last_period_start,
        end_date: null,
        flow_intensity: "medium",
      });

      // If user is authenticated, sync to Supabase
      if (userId) {
        try {
          await supabase
            .from("profiles")
            .update({
              last_period_start: parsed.data.last_period_start,
              period_length: parsed.data.period_length,
              cycle_length: parsed.data.cycle_length,
            })
            .eq("user_id", userId);

          const { data: existing } = await supabase
            .from("periods")
            .select("id")
            .eq("user_id", userId)
            .eq("start_date", parsed.data.last_period_start)
            .maybeSingle();

          if (!existing) {
            await supabase.from("periods").insert({
              user_id: userId,
              start_date: parsed.data.last_period_start,
            });
          }
        } catch (syncErr) {
          console.warn("Supabase update skipped, using local store:", syncErr);
        }
      }

      toast.success("Period settings updated — predictions recalculated!");
      setOpen(false);
      await onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="rounded-full">
            <CalIcon className="h-4 w-4 mr-1.5" /> Edit period
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Period & Cycle</DialogTitle>
          <DialogDescription>
            Update your cycle rhythm so our algorithm calculates your period and ovulation accurately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="last-start" className="text-xs font-semibold">
              First day of last period
            </Label>
            <Input
              id="last-start"
              type="date"
              value={lastStart}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setLastStart(e.target.value)}
              className="mt-1.5 rounded-xl h-10"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="period-len" className="text-xs font-semibold">
                Period duration (days of bleeding)
              </Label>
              <span className="text-xs font-bold text-primary">{periodLen} days</span>
            </div>
            <Input
              id="period-len"
              type="number"
              min={2}
              max={12}
              value={periodLen}
              onChange={(e) => setPeriodLen(parseInt(e.target.value, 10) || 5)}
              className="mt-1.5 rounded-xl h-10"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="cycle-len" className="text-xs font-semibold">
                Average cycle length (days between periods)
              </Label>
              <span className="text-xs font-bold text-primary">{cycleLen} days</span>
            </div>
            <Input
              id="cycle-len"
              type="number"
              min={20}
              max={50}
              value={cycleLen}
              onChange={(e) => setCycleLen(parseInt(e.target.value, 10) || 28)}
              className="mt-1.5 rounded-xl h-10"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Normal cycle length ranges from 21 to 35 days.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-gradient-primary font-bold"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
