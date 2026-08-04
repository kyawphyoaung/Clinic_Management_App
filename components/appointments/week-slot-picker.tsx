"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDaysToTaiwanDate,
  minutesToTimeLabel,
  toTaiwanDateString,
  toTaiwanDayOfWeek,
  taiwanLocalToUtc,
} from "@/lib/utils/taiwan-time";

type Slot = { startMinutes: number; label: string };

type Props = {
  doctorId: string;
  date: string;
  slotMinutes: number | "";
  onDateChange: (date: string) => void;
  onSlotChange: (minutes: number | "") => void;
  accent?: "gold" | "default";
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeekTaiwan(dateStr: string): string {
  const probe = taiwanLocalToUtc(dateStr, 12 * 60);
  const dow = toTaiwanDayOfWeek(probe);
  return addDaysToTaiwanDate(dateStr, -dow);
}

function monthYearLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function WeekSlotPicker({
  doctorId,
  date,
  slotMinutes,
  onDateChange,
  onSlotChange,
  accent = "default",
}: Props) {
  const today = toTaiwanDateString(new Date());
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekTaiwan(date || today)
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysToTaiwanDate(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    if (date) setWeekStart(startOfWeekTaiwan(date));
  }, [date]);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/appointments/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  const selectedClass =
    accent === "gold"
      ? "border-[#c9a84c] bg-[#c9a84c] text-[#0f0f1a]"
      : "border-primary bg-primary text-primary-foreground";
  const idleClass =
    accent === "gold"
      ? "border-[#c9a84c]/30 bg-[#0f0f1a] text-[#f0e6d0] hover:border-[#c9a84c]/60"
      : "border-border bg-card text-foreground hover:bg-muted";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`rounded-md border p-2 ${idleClass}`}
            onClick={() => setWeekStart(addDaysToTaiwanDate(weekStart, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className={`rounded-md border p-2 ${idleClass}`}
            onClick={() => setWeekStart(addDaysToTaiwanDate(weekStart, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <p
          className={`text-sm font-medium ${
            accent === "gold" ? "text-[#f0e6d0]" : "text-foreground"
          }`}
        >
          {monthYearLabel(weekStart)}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => {
          const dow = toTaiwanDayOfWeek(taiwanLocalToUtc(d, 12 * 60));
          const dayNum = Number(d.slice(8, 10));
          const selected = d === date;
          const past = d < today;
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              onClick={() => {
                onDateChange(d);
                onSlotChange("");
              }}
              className={`flex flex-col items-center rounded-lg border px-1 py-2 text-xs transition disabled:opacity-40 ${
                selected ? selectedClass : idleClass
              }`}
            >
              <span className="opacity-80">{DAY_LABELS[dow]}</span>
              <span className="mt-0.5 text-sm font-semibold">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <div>
        {!date ? (
          <p className="text-sm text-muted-foreground">Select a day</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading slots…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open slots this day</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const selected = slotMinutes === s.startMinutes;
              return (
                <button
                  key={s.startMinutes}
                  type="button"
                  onClick={() => onSlotChange(s.startMinutes)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selected ? selectedClass : idleClass
                  }`}
                >
                  {s.label || minutesToTimeLabel(s.startMinutes)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
