import { prisma } from "@/lib/db";
import {
  SLOT_MINUTES,
  minutesToTimeLabel,
  taiwanLocalToUtc,
  toTaiwanDayOfWeek,
} from "@/lib/utils/taiwan-time";
import { getDoctorBusySlots } from "@/lib/integrations/google-calendar";

export type TimeWindow = { startTime: number; endTime: number };

export type Slot = {
  startMinutes: number;
  endsMinutes: number;
  startsAt: Date;
  endsAt: Date;
  label: string;
};

/** Resolve open windows for a doctor on a Taiwan calendar date (YYYY-MM-DD). */
export async function getOpenWindowsForDate(
  doctorId: string,
  dateStr: string
): Promise<TimeWindow[]> {
  const dayDate = new Date(`${dateStr}T00:00:00.000Z`);
  const overrides = await prisma.doctorAvailabilityOverride.findMany({
    where: { doctorId, date: dayDate },
  });

  if (overrides.some((o) => o.isBlocked)) {
    return [];
  }

  const customWindows = overrides.filter(
    (o) =>
      !o.isBlocked &&
      o.startTime != null &&
      o.endTime != null &&
      o.endTime > o.startTime
  );
  if (customWindows.length > 0) {
    return customWindows.map((o) => ({
      startTime: o.startTime!,
      endTime: o.endTime!,
    }));
  }

  // Use a midday Taiwan instant to get day-of-week for that calendar date
  const probe = taiwanLocalToUtc(dateStr, 12 * 60);
  const dayOfWeek = toTaiwanDayOfWeek(probe);

  const weekly = await prisma.doctorWeeklyAvailability.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
  });

  return weekly
    .filter((w) => w.endTime > w.startTime)
    .map((w) => ({ startTime: w.startTime, endTime: w.endTime }));
}

function expandWindowsToSlots(windows: TimeWindow[]): number[] {
  const starts: number[] = [];
  for (const w of windows) {
    for (
      let m = w.startTime;
      m + SLOT_MINUTES <= w.endTime;
      m += SLOT_MINUTES
    ) {
      starts.push(m);
    }
  }
  return [...new Set(starts)].sort((a, b) => a - b);
}

export async function getAvailableSlotsForDate(
  doctorId: string,
  dateStr: string
): Promise<Slot[]> {
  const windows = await getOpenWindowsForDate(doctorId, dateStr);
  const candidateStarts = expandWindowsToSlots(windows);
  if (candidateStarts.length === 0) return [];

  const dayStart = taiwanLocalToUtc(dateStr, 0);
  const dayEnd = taiwanLocalToUtc(dateStr, 24 * 60);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { not: "CANCELLED" },
      startsAt: { gte: dayStart, lt: dayEnd },
    },
    select: { startsAt: true },
  });
  const bookedSet = new Set(booked.map((b) => b.startsAt.toISOString()));

  // Demo Google Calendar busy intervals (placeholder until live sync)
  const gcalBusy = await getDoctorBusySlots(doctorId, dateStr);

  const now = new Date();
  const slots: Slot[] = [];
  for (const startMinutes of candidateStarts) {
    const startsAt = taiwanLocalToUtc(dateStr, startMinutes);
    if (startsAt.getTime() <= now.getTime()) continue;
    if (bookedSet.has(startsAt.toISOString())) continue;
    const endsMinutes = startMinutes + SLOT_MINUTES;
    const blockedByGcal = gcalBusy.some(
      (b) => startMinutes < b.endMinutes && endsMinutes > b.startMinutes
    );
    if (blockedByGcal) continue;
    const endsAt = taiwanLocalToUtc(dateStr, endsMinutes);
    slots.push({
      startMinutes,
      endsMinutes,
      startsAt,
      endsAt,
      label: minutesToTimeLabel(startMinutes),
    });
  }
  return slots;
}

export const SLOT_CONFLICT_MESSAGE =
  "Someone is trying to book this time slot. Please try again.";
