import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Droplet, Plus, Calendar as CalIcon, Activity, Smile, Sparkles, Thermometer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CycleCalendar } from "@/components/CycleCalendar";
import { DailyLogSheet } from "@/components/DailyLogSheet";
import { Button } from "@/components/ui/button";
import { useCycleStore } from "@/lib/cycleStore";
import { fmt, getDayPhase, phaseLabel, phaseColorMap } from "@/lib/cycle";
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Cycle Calendar — CycleNova" },
      {
        name: "description",
        content:
          "Log your period, track daily symptoms, and visualize your menstrual cycle phases, ovulation, and fertile windows.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { profile, periods, symptoms, saveSymptomLog, getSymptomLog, savePeriod } = useCycleStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const selectedDateStr = fmt(selectedDate);
  const selectedLog = getSymptomLog(selectedDateStr);
  const selectedPhase = getDayPhase(selectedDate, profile, periods);
  const phaseColors = phaseColorMap[selectedPhase] || phaseColorMap.follicular;

  const loggedDates = Object.keys(symptoms);

  // Check if selected date is an existing recorded period
  const isPeriodRecorded = periods.some((p) => {
    const s = p.start_date;
    const e = p.end_date || p.start_date;
    return selectedDateStr >= s && selectedDateStr <= e;
  });

  const handleTogglePeriodDay = async () => {
    try {
      if (isPeriodRecorded) {
        toast.info("This day is already logged as part of a period.");
      } else {
        await savePeriod({
          start_date: selectedDateStr,
          end_date: null,
          flow_intensity: "medium",
        });
        toast.success(`Period recorded starting on ${format(selectedDate, "MMM d")}`);
      }
    } catch (e) {
      toast.error("Could not record period");
    }
  };

  return (
    <AppShell>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Cycle Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize your cycle rhythm, fertile days, and logged symptoms.
          </p>
        </div>

        <Button
          onClick={() => setLogSheetOpen(true)}
          className="rounded-full bg-gradient-primary font-bold text-xs h-10 px-4"
        >
          <Plus className="h-4 w-4 mr-1" /> Log Today
        </Button>
      </div>

      <div className="space-y-4">
        {/* The interactive multi-phase Calendar */}
        <CycleCalendar
          profile={profile}
          periods={periods}
          selected={selectedDate}
          onSelect={setSelectedDate}
          onOpenLog={(date) => {
            setSelectedDate(date);
            setLogSheetOpen(true);
          }}
          loggedDates={loggedDates}
        />

        {/* Selected Day Detailed Inspector Card */}
        <div className="bg-card border rounded-3xl p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mb-1"
                style={{
                  backgroundColor: `color-mix(in oklab, ${phaseColors.bg} 18%, transparent)`,
                  color: phaseColors.bg,
                }}
              >
                {phaseLabel[selectedPhase]}
              </span>
              <h3 className="font-display text-lg font-bold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setLogSheetOpen(true)}
              className="rounded-full text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Log Symptoms
            </Button>
          </div>

          {/* Quick period start button */}
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isPeriodRecorded ? "Period bleeding recorded on this day" : "Not logged as period day"}
            </span>

            <Button
              size="sm"
              variant={isPeriodRecorded ? "secondary" : "ghost"}
              onClick={handleTogglePeriodDay}
              className="rounded-full text-xs h-8"
            >
              <Droplet className="h-3.5 w-3.5 mr-1 text-rose-500" />
              {isPeriodRecorded ? "Period Logged ✓" : "Mark Period Start"}
            </Button>
          </div>

          {/* If there is a symptom log for this day, show its highlights */}
          {selectedLog ? (
            <div className="mt-3 p-3.5 rounded-2xl bg-muted/40 border space-y-2 text-xs">
              <p className="font-bold text-foreground">Logged Symptoms & Vitals:</p>

              <div className="flex flex-wrap gap-2">
                {selectedLog.flow && selectedLog.flow !== "none" && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 font-semibold border border-rose-500/20">
                    Flow: {selectedLog.flow}
                  </span>
                )}
                {selectedLog.cramps ? (
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                    Cramps: {selectedLog.cramps}/10
                  </span>
                ) : null}
                {selectedLog.headache ? (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
                    Headache: {selectedLog.headache}/10
                  </span>
                ) : null}
                {selectedLog.bloating ? (
                  <span className="px-2.5 py-1 rounded-full bg-muted text-foreground font-medium">
                    Bloating: {selectedLog.bloating}/10
                  </span>
                ) : null}
                {selectedLog.temperature_c && (
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/20 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> {selectedLog.temperature_c}°C BBT
                  </span>
                )}
                {selectedLog.mucus && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Mucus: {selectedLog.mucus}
                  </span>
                )}
              </div>

              {selectedLog.mood_tags && selectedLog.mood_tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-muted-foreground font-medium">Mood:</span>
                  {selectedLog.mood_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-card border text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {selectedLog.notes && (
                <p className="italic text-muted-foreground text-[11px] pt-1">
                  "{selectedLog.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-muted/20 border border-dashed text-center text-xs text-muted-foreground">
              No daily symptoms logged for this date.
            </div>
          )}
        </div>
      </div>

      {/* Log Sheet Modal */}
      <DailyLogSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        date={selectedDate}
        initialLog={selectedLog}
        onSave={async (log) => {
          await saveSymptomLog(log);
        }}
        isPeriodDay={selectedPhase === "period" || selectedPhase === "menstrual"}
      />
    </AppShell>
  );
}
