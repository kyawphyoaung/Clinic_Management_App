"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";
import {
  weeklyAvailabilitySchema,
  availabilityOverrideSchema,
} from "@/lib/validations/appointments";
import { addDaysToTaiwanDate } from "@/lib/utils/taiwan-time";

export async function getWeeklyAvailability(doctorId: string) {
  await requirePermission("availability:manage");
  return prisma.doctorWeeklyAvailability.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getOverridesForMonth(doctorId: string, yearMonth: string) {
  await requirePermission("availability:manage");
  // yearMonth = YYYY-MM
  const start = `${yearMonth}-01`;
  const [y, m] = yearMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;

  return prisma.doctorAvailabilityOverride.findMany({
    where: {
      doctorId,
      date: {
        gte: new Date(`${start}T00:00:00.000Z`),
        lte: new Date(`${end}T00:00:00.000Z`),
      },
    },
    orderBy: { date: "asc" },
  });
}

function windowsOverlapSameDay(
  windows: { dayOfWeek: number; startTime: number; endTime: number; isActive: boolean }[]
): string | null {
  const byDay = new Map<number, { startTime: number; endTime: number }[]>();
  for (const w of windows) {
    if (!w.isActive) continue;
    if (w.endTime <= w.startTime) {
      return "Each window must end after it starts";
    }
    const list = byDay.get(w.dayOfWeek) ?? [];
    list.push({ startTime: w.startTime, endTime: w.endTime });
    byDay.set(w.dayOfWeek, list);
  }
  for (const [, list] of byDay) {
    const sorted = [...list].sort((a, b) => a.startTime - b.startTime);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      // Overlap on half-open [start, end)
      if (cur.startTime < prev.endTime) {
        return "Overlapping windows on the same day are not allowed";
      }
    }
  }
  return null;
}

export async function upsertWeeklyAvailability(input: unknown) {
  await requirePermission("availability:manage");
  const parsed = weeklyAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const { doctorId, windows } = parsed.data;

  const overlapError = windowsOverlapSameDay(windows);
  if (overlapError) {
    return { success: false as const, error: overlapError };
  }

  await prisma.$transaction(async (tx) => {
    await tx.doctorWeeklyAvailability.deleteMany({ where: { doctorId } });
    if (windows.length > 0) {
      await tx.doctorWeeklyAvailability.createMany({
        data: windows.map((w) => ({
          doctorId,
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          isActive: w.isActive,
        })),
      });
    }
  });

  revalidatePath("/dashboard/availability");
  return { success: true as const };
}

export async function upsertOverride(input: unknown) {
  await requirePermission("availability:manage");
  const parsed = availabilityOverrideSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  const date = new Date(`${data.date}T00:00:00.000Z`);

  // Replace all overrides for that day for simplicity
  await prisma.$transaction(async (tx) => {
    await tx.doctorAvailabilityOverride.deleteMany({
      where: { doctorId: data.doctorId, date },
    });
    await tx.doctorAvailabilityOverride.create({
      data: {
        doctorId: data.doctorId,
        date,
        isBlocked: data.isBlocked,
        startTime: data.isBlocked ? null : data.startTime ?? null,
        endTime: data.isBlocked ? null : data.endTime ?? null,
        reason: data.reason ?? null,
      },
    });
  });

  revalidatePath("/dashboard/availability");
  return { success: true as const };
}

export async function deleteOverride(id: string) {
  await requirePermission("availability:manage");
  await prisma.doctorAvailabilityOverride.delete({ where: { id } });
  revalidatePath("/dashboard/availability");
  return { success: true as const };
}

/** Copy overrides from previous month into target YYYY-MM (skip existing dates). */
export async function copyMonthOverrides(
  doctorId: string,
  targetYearMonth: string
) {
  await requirePermission("availability:manage");
  const [y, m] = targetYearMonth.split("-").map(Number);
  const prevM = m === 1 ? 12 : m - 1;
  const prevY = m === 1 ? y - 1 : y;
  const prevYm = `${prevY}-${String(prevM).padStart(2, "0")}`;

  const source = await getOverridesForMonth(doctorId, prevYm);
  if (source.length === 0) {
    return { success: false as const, error: "No overrides in previous month" };
  }

  const existing = await getOverridesForMonth(doctorId, targetYearMonth);
  const existingDays = new Set(
    existing.map((o) => o.date.toISOString().slice(0, 10))
  );

  const dayDelta =
    Math.round(
      (Date.UTC(y, m - 1, 1) - Date.UTC(prevY, prevM - 1, 1)) /
        (24 * 60 * 60 * 1000)
    );

  for (const row of source) {
    const srcDate = row.date.toISOString().slice(0, 10);
    const targetDate = addDaysToTaiwanDate(srcDate, dayDelta);
    if (!targetDate.startsWith(targetYearMonth)) continue;
    if (existingDays.has(targetDate)) continue;
    await prisma.doctorAvailabilityOverride.create({
      data: {
        doctorId,
        date: new Date(`${targetDate}T00:00:00.000Z`),
        isBlocked: row.isBlocked,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
      },
    });
  }

  revalidatePath("/dashboard/availability");
  return { success: true as const };
}

export async function listDoctorsForAvailability() {
  await requirePermission("availability:manage");
  return prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: "asc" },
  });
}
