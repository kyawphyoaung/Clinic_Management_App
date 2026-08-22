"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export type CashflowFilters = {
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type NamedValue = { name: string; value: number };

export type MonthlyCashflowPoint = {
  month: string;
  inflow: number;
  outflow: number;
  cumulative: number;
};

export type ForecastPoint = {
  month: string;
  inflow: number;
  outflow: number;
};

export type CurrencyBreakdownRow = {
  currency: string;
  originalAmount: number;
  amountTwd: number;
};

export type PatientPaymentStatusRow = {
  patientId: string;
  patientName: string;
  totalDeposits: number;
  totalPayments: number;
  outstanding: number;
  status: "Paid" | "Partial" | "Overdue";
};

export type CashflowKpis = {
  totalRevenue: number;
  totalCommission: number;
  netProfit: number;
  operatingCashFlow: number;
  dso: number | null;
  dpo: null;
  totalDepositsHeld: number;
  outstandingCharges: number;
  revenueCollected: number;
  transferredToClinic: number;
};

export type CashflowOverview = {
  kpis: CashflowKpis;
  /** Kept for export / backward compat */
  totalDepositsHeld: number;
  outstandingCharges: number;
  revenueCollected: number;
  transferredToClinic: number;
  receivers: {
    id: string;
    name: string;
    held: number;
    transferred: number;
    balance: number;
  }[];
  monthlySeries: MonthlyCashflowPoint[];
  forecast: ForecastPoint[];
  revenueBySource: NamedValue[];
  revenueByTreatmentType: NamedValue[];
  revenueByCountry: NamedValue[];
  currencyBreakdown: CurrencyBreakdownRow[];
  currencyDistributionPie: NamedValue[];
  patientPaymentStatus: PatientPaymentStatusRow[];
  filters: {
    start: string;
    end: string;
  };
};

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseDateOnly(value: string, endExclusive = false): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (endExclusive) {
    return new Date(Date.UTC(y, mo - 1, d + 1));
  }
  return new Date(Date.UTC(y, mo - 1, d));
}

function periodRange(filters: CashflowFilters) {
  if (filters.dateFrom || filters.dateTo) {
    const start =
      (filters.dateFrom && parseDateOnly(filters.dateFrom, false)) ||
      new Date(Date.UTC(1970, 0, 1));
    const end =
      (filters.dateTo && parseDateOnly(filters.dateTo, true)) ||
      new Date(Date.UTC(9999, 11, 31));
    return { start, end };
  }

  const year = filters.year ?? new Date().getFullYear();
  if (filters.month && filters.month >= 1 && filters.month <= 12) {
    const start = new Date(Date.UTC(year, filters.month - 1, 1));
    const end = new Date(Date.UTC(year, filters.month, 1));
    return { start, end };
  }
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  return { start, end };
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function bumpNamed(map: Map<string, number>, name: string, value: number) {
  if (!value) return;
  map.set(name, (map.get(name) ?? 0) + value);
}

function toNamedList(map: Map<string, number>): NamedValue[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .filter((r) => r.value !== 0)
    .sort((a, b) => b.value - a.value);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const SOURCE_LABEL: Record<string, string> = {
  AGENT: "Agent",
  BOOKING: "Booking",
  WALKIN: "Walk-in",
};

const OVERDUE_DAYS = 30;

/**
 * Cashflow overview + analytics for the admin cashflow dashboard.
 * Supports dateFrom/dateTo or legacy year/month filters.
 */
export async function getCashflowOverview(
  filters: CashflowFilters = {}
): Promise<CashflowOverview> {
  await requirePermission("clinics:manage");
  const { start, end } = periodRange(filters);
  const now = new Date();

  // Chart window is always the last 12 calendar months ending this month
  const seriesEnd = startOfMonth(now);
  const seriesStart = addMonths(seriesEnd, -11);
  const seriesFetchEnd = addMonths(seriesEnd, 1);

  const [
    deposits,
    payments,
    charges,
    commissions,
    receivers,
    transfers,
    seriesDeposits,
    seriesPayments,
    seriesCommissions,
  ] = await Promise.all([
    prisma.patientDeposit.findMany({
      where: { paymentDate: { gte: start, lt: end } },
      select: {
        amount: true,
        amountTwd: true,
        currency: true,
        receiverId: true,
        patientId: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            source: true,
            countryOfResidence: true,
          },
        },
      },
    }),
    prisma.treatmentPayment.findMany({
      where: { paymentDate: { gte: start, lt: end } },
      select: {
        amount: true,
        depositAppliedAmount: true,
        paymentDate: true,
        treatment: {
          select: {
            patientId: true,
            patient: {
              select: {
                id: true,
                fullName: true,
                source: true,
                countryOfResidence: true,
              },
            },
          },
        },
      },
    }),
    prisma.treatmentCharge.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        id: true,
        netPrice: true,
        totalPrice: true,
        createdAt: true,
        lines: {
          select: {
            serviceCategory: true,
            quantity: true,
            unitPrice: true,
          },
        },
        allocations: {
          select: {
            amount: true,
            payment: { select: { paymentDate: true, createdAt: true } },
          },
        },
        treatment: {
          select: {
            patientId: true,
            patient: {
              select: {
                id: true,
                fullName: true,
                source: true,
                countryOfResidence: true,
              },
            },
          },
        },
      },
    }),
    prisma.commissionPayment.findMany({
      where: {
        OR: [
          { calculatedAt: { gte: start, lt: end } },
          { paidAt: { gte: start, lt: end } },
        ],
      },
      select: { id: true, amount: true, calculatedAt: true, paidAt: true },
    }),
    prisma.depositReceiver.findMany({
      include: {
        deposits: { select: { amountTwd: true } },
        transfers: { select: { amountTwd: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.depositTransfer.findMany({
      where: { transferredAt: { gte: start, lt: end } },
      select: { amountTwd: true },
    }),
    prisma.patientDeposit.findMany({
      where: { paymentDate: { gte: seriesStart, lt: seriesFetchEnd } },
      select: { amountTwd: true, paymentDate: true },
    }),
    prisma.treatmentPayment.findMany({
      where: { paymentDate: { gte: seriesStart, lt: seriesFetchEnd } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.commissionPayment.findMany({
      where: {
        OR: [
          { calculatedAt: { gte: seriesStart, lt: seriesFetchEnd } },
          { paidAt: { gte: seriesStart, lt: seriesFetchEnd } },
        ],
      },
      select: { amount: true, calculatedAt: true, paidAt: true },
    }),
  ]);

  const depositRevenue = deposits.reduce((s, d) => s + num(d.amountTwd), 0);
  const paymentRevenue = payments.reduce((s, p) => s + num(p.amount), 0);
  const totalRevenue = depositRevenue + paymentRevenue;

  // Count each commission once; attribute to paidAt ?? calculatedAt when in range
  const totalCommission = commissions.reduce((s, c) => {
    const effective = c.paidAt ?? c.calculatedAt;
    if (effective >= start && effective < end) return s + num(c.amount);
    const inCalc = c.calculatedAt >= start && c.calculatedAt < end;
    const inPaid = c.paidAt != null && c.paidAt >= start && c.paidAt < end;
    return inCalc || inPaid ? s + num(c.amount) : s;
  }, 0);

  const netProfit = totalRevenue - totalCommission;
  const operatingCashFlow = netProfit;

  const outstandingCharges = charges.reduce((sum, c) => {
    const paid = c.allocations.reduce((s, a) => s + num(a.amount), 0);
    return sum + Math.max(0, num(c.netPrice) - paid);
  }, 0);

  const transferredToClinic = transfers.reduce(
    (s, t) => s + num(t.amountTwd),
    0
  );

  // DSO: avg days from charge createdAt → fully paid (or now if unpaid)
  const dsoDays: number[] = [];
  for (const c of charges) {
    const net = num(c.netPrice);
    if (net <= 0) continue;
    const paid = c.allocations.reduce((s, a) => s + num(a.amount), 0);
    let settledAt: Date | null = null;
    if (paid + 0.009 >= net && c.allocations.length > 0) {
      settledAt = c.allocations.reduce((latest, a) => {
        const d = a.payment.paymentDate ?? a.payment.createdAt;
        return d > latest ? d : latest;
      }, c.allocations[0]!.payment.paymentDate ?? c.allocations[0]!.payment.createdAt);
    }
    dsoDays.push(daysBetween(c.createdAt, settledAt ?? now));
  }
  const dso =
    dsoDays.length > 0
      ? Math.round((dsoDays.reduce((a, b) => a + b, 0) / dsoDays.length) * 10) /
        10
      : null;

  // Monthly series — always exactly the last 12 calendar months (zeros filled)
  const inflowByMonth = new Map<string, number>();
  const outflowByMonth = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const key = monthKey(addMonths(seriesStart, i));
    inflowByMonth.set(key, 0);
    outflowByMonth.set(key, 0);
  }
  for (const d of seriesDeposits) {
    const key = monthKey(new Date(d.paymentDate));
    if (inflowByMonth.has(key)) {
      inflowByMonth.set(key, (inflowByMonth.get(key) ?? 0) + num(d.amountTwd));
    }
  }
  for (const p of seriesPayments) {
    const key = monthKey(new Date(p.paymentDate));
    if (inflowByMonth.has(key)) {
      inflowByMonth.set(key, (inflowByMonth.get(key) ?? 0) + num(p.amount));
    }
  }
  for (const c of seriesCommissions) {
    const effective = c.paidAt ?? c.calculatedAt;
    const key = monthKey(new Date(effective));
    if (outflowByMonth.has(key)) {
      outflowByMonth.set(key, (outflowByMonth.get(key) ?? 0) + num(c.amount));
    }
  }

  let cumulative = 0;
  const monthlySeries: MonthlyCashflowPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const month = monthKey(addMonths(seriesStart, i));
    const inflow = round2(inflowByMonth.get(month) ?? 0);
    const outflow = round2(outflowByMonth.get(month) ?? 0);
    cumulative += inflow - outflow;
    monthlySeries.push({
      month,
      inflow,
      outflow,
      cumulative: round2(cumulative),
    });
  }

  // Forecast: linear projection of last 3 months avg for next 6 months
  const last3 = monthlySeries.slice(-3);
  const avgIn =
    last3.length > 0 ? last3.reduce((s, m) => s + m.inflow, 0) / last3.length : 0;
  const avgOut =
    last3.length > 0
      ? last3.reduce((s, m) => s + m.outflow, 0) / last3.length
      : 0;
  const forecast: ForecastPoint[] = [];
  for (let i = 1; i <= 6; i++) {
    forecast.push({
      month: monthKey(addMonths(seriesEnd, i)),
      inflow: round2(avgIn),
      outflow: round2(avgOut),
    });
  }

  // Revenue by source / country
  const bySource = new Map<string, number>();
  const byCountry = new Map<string, number>();
  for (const d of deposits) {
    const src = SOURCE_LABEL[d.patient.source] ?? d.patient.source;
    const country = d.patient.countryOfResidence?.trim() || "Unknown";
    bumpNamed(bySource, src, num(d.amountTwd));
    bumpNamed(byCountry, country, num(d.amountTwd));
  }
  for (const p of payments) {
    const patient = p.treatment.patient;
    const src = SOURCE_LABEL[patient.source] ?? patient.source;
    const country = patient.countryOfResidence?.trim() || "Unknown";
    bumpNamed(bySource, src, num(p.amount));
    bumpNamed(byCountry, country, num(p.amount));
  }

  // Revenue by treatment type — weight paid (or netPrice) by line share
  const byTreatment = new Map<string, number>();
  for (const c of charges) {
    const paid = c.allocations.reduce((s, a) => s + num(a.amount), 0);
    const base = paid > 0 ? paid : num(c.netPrice);
    if (base <= 0 || c.lines.length === 0) continue;
    const lineTotals = c.lines.map((l) => num(l.unitPrice) * l.quantity);
    const lineSum = lineTotals.reduce((a, b) => a + b, 0) || 1;
    c.lines.forEach((l, i) => {
      bumpNamed(byTreatment, l.serviceCategory, (lineTotals[i]! / lineSum) * base);
    });
  }

  // Currency breakdown — aggregate by currency only
  const currencyMap = new Map<
    string,
    { originalAmount: number; amountTwd: number }
  >();

  for (const d of deposits) {
    const cur = d.currency || "TWD";
    const prev = currencyMap.get(cur) ?? { originalAmount: 0, amountTwd: 0 };
    prev.originalAmount += num(d.amount);
    prev.amountTwd += num(d.amountTwd);
    currencyMap.set(cur, prev);
  }

  const currencyBreakdown: CurrencyBreakdownRow[] = [...currencyMap.entries()]
    .map(([currency, v]) => ({
      currency,
      originalAmount: round2(v.originalAmount),
      amountTwd: round2(v.amountTwd),
    }))
    .sort((a, b) => b.amountTwd - a.amountTwd);

  const currencyDistributionPie = toNamedList(
    new Map(
      [...currencyMap.entries()].map(([name, v]) => [name, v.amountTwd] as const)
    )
  );

  // Patient payment status (period deposits/payments + outstanding on period charges)
  const patientNames = new Map<string, string>();
  const depositsByPatient = new Map<string, number>();
  const paymentsByPatient = new Map<string, number>();
  const outstandingByPatient = new Map<
    string,
    { outstanding: number; oldestUnpaid: Date | null }
  >();

  for (const d of deposits) {
    patientNames.set(d.patient.id, d.patient.fullName);
    depositsByPatient.set(
      d.patientId,
      (depositsByPatient.get(d.patientId) ?? 0) + num(d.amountTwd)
    );
  }
  for (const p of payments) {
    const pid = p.treatment.patientId;
    patientNames.set(pid, p.treatment.patient.fullName);
    paymentsByPatient.set(pid, (paymentsByPatient.get(pid) ?? 0) + num(p.amount));
  }
  for (const c of charges) {
    const pid = c.treatment.patientId;
    patientNames.set(pid, c.treatment.patient.fullName);
    const paid = c.allocations.reduce((s, a) => s + num(a.amount), 0);
    const due = Math.max(0, num(c.netPrice) - paid);
    if (due <= 0.009) continue;
    const prev = outstandingByPatient.get(pid) ?? {
      outstanding: 0,
      oldestUnpaid: null,
    };
    prev.outstanding += due;
    if (!prev.oldestUnpaid || c.createdAt < prev.oldestUnpaid) {
      prev.oldestUnpaid = c.createdAt;
    }
    outstandingByPatient.set(pid, prev);
  }

  const patientIds = new Set([
    ...depositsByPatient.keys(),
    ...paymentsByPatient.keys(),
    ...outstandingByPatient.keys(),
  ]);

  const patientPaymentStatus: PatientPaymentStatusRow[] = [...patientIds]
    .map((patientId) => {
      const totalDeposits = depositsByPatient.get(patientId) ?? 0;
      const totalPayments = paymentsByPatient.get(patientId) ?? 0;
      const out = outstandingByPatient.get(patientId);
      const outstanding = round2(out?.outstanding ?? 0);
      let status: PatientPaymentStatusRow["status"] = "Paid";
      if (outstanding > 0.009) {
        const ageDays = out?.oldestUnpaid
          ? daysBetween(out.oldestUnpaid, now)
          : 0;
        status = ageDays >= OVERDUE_DAYS ? "Overdue" : "Partial";
      }
      return {
        patientId,
        patientName: patientNames.get(patientId) ?? "Unknown",
        totalDeposits: round2(totalDeposits),
        totalPayments: round2(totalPayments),
        outstanding,
        status,
      };
    })
    .sort((a, b) => a.patientName.localeCompare(b.patientName));

  const kpis: CashflowKpis = {
    totalRevenue: round2(totalRevenue),
    totalCommission: round2(totalCommission),
    netProfit: round2(netProfit),
    operatingCashFlow: round2(operatingCashFlow),
    dso,
    dpo: null,
    totalDepositsHeld: round2(depositRevenue),
    outstandingCharges: round2(outstandingCharges),
    revenueCollected: round2(paymentRevenue),
    transferredToClinic: round2(transferredToClinic),
  };

  return {
    kpis,
    totalDepositsHeld: kpis.totalDepositsHeld,
    outstandingCharges: kpis.outstandingCharges,
    revenueCollected: kpis.revenueCollected,
    transferredToClinic: kpis.transferredToClinic,
    receivers: receivers.map((r) => {
      const held = r.deposits.reduce((s, d) => s + num(d.amountTwd), 0);
      const moved = r.transfers.reduce((s, t) => s + num(t.amountTwd), 0);
      return {
        id: r.id,
        name: r.name,
        held,
        transferred: moved,
        balance: held - moved,
      };
    }),
    monthlySeries,
    forecast,
    revenueBySource: toNamedList(bySource),
    revenueByTreatmentType: toNamedList(byTreatment),
    revenueByCountry: toNamedList(byCountry),
    currencyBreakdown,
    currencyDistributionPie,
    patientPaymentStatus,
    filters: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  };
}
