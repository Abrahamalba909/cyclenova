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

const Schema = z.object({
  last_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date"),
  period_length: z.number().int().min(2).max(10),
  cycle_length: z.number().int().min(20).max(45),
});

interface Props {
  userId: string;
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
  const [periodLen, setPeriodLen] = useState(initial.period_length);
  const [cycleLen, setCycleLen] = useState(initial.cycle_length);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLastStart(initial.last_period_start ?? format(new Date(), "yyyy-MM-dd"));
      setPeriodLen(initial.period_length);
      setCycleLen(initial.cycle_length);
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
      // Update profile
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          last_period_start: parsed.data.last_period_start,
          period_length: parsed.data.period_length,
          cycle_length: parsed.data.cycle_length,
        })
        .eq("user_id", userId);
      if (pErr) throw pErr;

      // Upsert a period entry for that start date so the calendar reflects it
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
      toast.success("Period info updated — predictions refreshed");
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
          <DialogTitle className="font-display">Edit period info</DialogTitle>
          <DialogDescription>
            Updates ovulation, fertile window and safe days instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="lps" className="text-sm">Last period start</Label>
            <Input
              id="lps"
              type="date"
              max={format(new Date(), "yyyy-MM-dd")}
              value={lastStart}
              onChange={(e) => setLastStart(e.target.value)}
              className="rounded-xl h-11 mt-1.5"
            />
            {lastStart && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {format(parseISO(lastStart), "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="plen" className="text-sm">Period duration (days)</Label>
            <Input
              id="plen"
              type="number"
              min={2}
              max={10}
              value={periodLen}
              onChange={(e) => setPeriodLen(parseInt(e.target.value) || 5)}
              className="rounded-xl h-11 mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="clen" className="text-sm">Average cycle length (days)</Label>
            <Input
              id="clen"
              type="number"
              min={20}
              max={45}
              value={cycleLen}
              onChange={(e) => setCycleLen(parseInt(e.target.value) || 28)}
              className="rounded-xl h-11 mt-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Ovulation predicted around day {Math.max(1, cycleLen - 14)}.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-gradient-primary font-semibold"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
