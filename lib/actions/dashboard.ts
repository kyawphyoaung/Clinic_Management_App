"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import {
  addDaysToTaiwanDate,
  formatTaiwanTime,
  taiwanLocalToUtc,
  toTaiwanDateString,
} from "@/lib/utils/taiwan-time";
import { CommissionReviewStatus, PatientSource } from "@/prisma/generated/prisma/client";

function taiwanMonthStart(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

function nextTaiwanMonthStart(monthStart: string): string {
  const [y, m] = monthStart.split("-").map(Number);
  if (m === 12) return `${y + 1}-01-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

function priorTaiwanMonthStart(monthStart: string): string {
  const [y, m] = monthStart.split("-").map(Number);
  if (m === 1) return `${y - 1}-12-01`;
  return `${y}-${String(m - 1).padStart(2, "0")}-01`;
}

function monthRangeUtc(monthStart: string) {
  const next = nextTaiwanMonthStart(monthStart);
  return {
    start: taiwanLocalToUtc(monthStart, 0),
    end: taiwanLocalToUtc(next, 0),
  };
}

function momPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function formatActivityDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMoneyShort(amount: number): string {
  return `NT$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export type DashboardActivity = {
  id: string;
  text: string;
  at: string;
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  totalPatients: number;
  totalReferrals: number;
  todayAppointments: number;
  appointmentsSubtitle: string;
  revenueThisMonth: number;
  revenueMomPercent: number | null;
  commissionThisMonth: number;
  commissionMomPercent: number | null;
  activities: DashboardActivity[];
  patientGrowth: DashboardChartPoint[];
  revenueSeries: DashboardChartPoint[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const session = await requireAuth();
  const role = session.user.role;
  const today = toTaiwanDateString(new Date());
  const thisMonthStart = taiwanMonthStart(today);
  const lastMonthStart = priorTaiwanMonthStart(thisMonthStart);
  const thisMonth = monthRangeUtc(thisMonthStart);
  const lastMonth = monthRangeUtc(lastMonthStart);
  const todayStart = taiwanLocalToUtc(today, 0);
  const todayEnd = taiwanLocalToUtc(today, 24 * 60);

  const isDoctor = role === "DOCTOR";
  const appointmentWhere = {
    startsAt: { gte: todayStart, lt: todayEnd },
    ...(isDoctor ? { doctorId: session.user.id } : {}),
  };

  const chartStartDate = addDaysToTaiwanDate(today, -83);
  const chartStart = taiwanLocalToUtc(chartStartDate, 0);

  const [
    totalPatients,
    totalReferrals,
    todayAppointments,
    doctor,
    revenueAgg,
    lastRevenueAgg,
    commissionAgg,
    lastCommissionAgg,
    recentAppointments,
    recentPayments,
    recentTreatments,
    recentPatients,
    patientsForChart,
    paymentsForChart,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { source: PatientSource.AGENT } }),
    prisma.appointment.count({ where: appointmentWhere }),
    isDoctor
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { fullName: true },
        })
      : Promise.resolve(null),
    prisma.treatmentPayment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: { gte: thisMonth.start, lt: thisMonth.end },
      },
    }),
    prisma.treatmentPayment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: { gte: lastMonth.start, lt: lastMonth.end },
      },
    }),
    prisma.commissionPayment.aggregate({
      _sum: { amount: true },
      where: {
        reviewStatus: CommissionReviewStatus.APPROVED,
        calculatedAt: { gte: thisMonth.start, lt: thisMonth.end },
      },
    }),
    prisma.commissionPayment.aggregate({
      _sum: { amount: true },
      where: {
        reviewStatus: CommissionReviewStatus.APPROVED,
        calculatedAt: { gte: lastMonth.start, lt: lastMonth.end },
      },
    }),
    prisma.appointment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { fullName: true } },
        doctor: { select: { fullName: true } },
      },
    }),
    prisma.treatmentPayment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        treatment: {
          include: { patient: { select: { fullName: true } } },
        },
        recordedBy: { select: { fullName: true } },
      },
    }),
    prisma.treatment.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        patient: { select: { fullName: true } },
        doctor: { select: { fullName: true } },
      },
    }),
    prisma.patient.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        currentAgent: { select: { fullName: true } },
      },
    }),
    prisma.patient.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.treatmentPayment.findMany({
      where: { paymentDate: { gte: chartStart } },
      select: { paymentDate: true, amount: true },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  const revenueThisMonth = Number(revenueAgg._sum.amount ?? 0);
  const revenueLastMonth = Number(lastRevenueAgg._sum.amount ?? 0);
  const commissionThisMonth = Number(commissionAgg._sum.amount ?? 0);
  const commissionLastMonth = Number(lastCommissionAgg._sum.amount ?? 0);

  const doctorName = doctor?.fullName ?? session.user.name ?? "Doctor";
  const appointmentsSubtitle = isDoctor
    ? `Dr. ${doctorName}`
    : "All Doctors";

  type RawActivity = { id: string; at: Date; text: string };
  const raw: RawActivity[] = [];

  for (const a of recentAppointments) {
    const who = a.patient?.fullName ?? "A patient";
    raw.push({
      id: `appt-${a.id}`,
      at: a.createdAt,
      text: `${who} booked an appointment at ${formatTaiwanTime(a.startsAt)} on ${formatActivityDate(a.startsAt)}.`,
    });
  }

  for (const p of recentPayments) {
    const patientName = p.treatment.patient.fullName;
    const actor = p.recordedBy?.fullName
      ? `${p.recordedBy.fullName} recorded a payment of ${formatMoneyShort(Number(p.amount))} for ${patientName}`
      : `Patient ${patientName} made a payment of ${formatMoneyShort(Number(p.amount))}`;
    raw.push({
      id: `pay-${p.id}`,
      at: p.createdAt,
      text: `${actor} at ${formatTaiwanTime(p.createdAt)} on ${formatActivityDate(p.createdAt)}.`,
    });
  }

  for (const t of recentTreatments) {
    const actor = t.doctor?.fullName ? `Dr. ${t.doctor.fullName}` : "Staff";
    raw.push({
      id: `tx-${t.id}-${t.updatedAt.getTime()}`,
      at: t.updatedAt,
      text: `${actor} updated treatment status to ${t.status} for ${t.patient.fullName} at ${formatTaiwanTime(t.updatedAt)} on ${formatActivityDate(t.updatedAt)}.`,
    });
  }

  for (const p of recentPatients) {
    const actor =
      p.source === PatientSource.AGENT && p.currentAgent
        ? `Agent ${p.currentAgent.fullName}`
        : p.fullName;
    const action =
      p.source === PatientSource.AGENT
        ? `referred a new patient (${p.fullName})`
        : `registered as a new patient`;
    raw.push({
      id: `pat-${p.id}`,
      at: p.createdAt,
      text: `${actor} ${action} at ${formatTaiwanTime(p.createdAt)} on ${formatActivityDate(p.createdAt)}.`,
    });
  }

  raw.sort((a, b) => b.at.getTime() - a.at.getTime());
  const activities: DashboardActivity[] = raw.slice(0, 10).map((a) => ({
    id: a.id,
    text: a.text,
    at: a.at.toISOString(),
  }));

  // Weekly buckets for last ~12 weeks
  const weeks: { start: string; label: string }[] = [];
  let cursor = chartStartDate;
  for (let i = 0; i < 12; i++) {
    const end = addDaysToTaiwanDate(cursor, 6);
    weeks.push({
      start: cursor,
      label: `${cursor.slice(5)}`,
    });
    cursor = addDaysToTaiwanDate(end, 1);
  }

  function weekIndex(dateStr: string): number {
    return weeks.findIndex((w) => {
      const end = addDaysToTaiwanDate(w.start, 6);
      return dateStr >= w.start && dateStr <= end;
    });
  }

  const patientGrowth = weeks.map((w) => ({ label: w.label, value: 0 }));
  for (const p of patientsForChart) {
    const idx = weekIndex(toTaiwanDateString(p.createdAt));
    if (idx >= 0) patientGrowth[idx].value += 1;
  }

  const revenueSeries = weeks.map((w) => ({ label: w.label, value: 0 }));
  for (const p of paymentsForChart) {
    const idx = weekIndex(toTaiwanDateString(p.paymentDate));
    if (idx >= 0) revenueSeries[idx].value += Number(p.amount);
  }

  return {
    totalPatients,
    totalReferrals,
    todayAppointments,
    appointmentsSubtitle,
    revenueThisMonth,
    revenueMomPercent: momPercent(revenueThisMonth, revenueLastMonth),
    commissionThisMonth,
    commissionMomPercent: momPercent(commissionThisMonth, commissionLastMonth),
    activities,
    patientGrowth,
    revenueSeries,
  };
}
