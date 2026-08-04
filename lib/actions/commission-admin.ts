"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { approveCommissionsForMonth } from "@/lib/actions/commission";
import {
  formatMonthLabel,
  monthBounds,
  parseBillingId,
  toBillingId,
  toPeriodMonth,
} from "@/lib/utils/commission";
import type { CommissionReviewStatus, PaymentMethod } from "@/prisma/generated/prisma/client";

export type MonthlyCommissionRow = {
  agentId: string;
  agentName: string;
  partnerId: string | null;
  commissionPercent: number;
  periodMonth: string;
  patientCount: number;
  treatmentCount: number;
  amount: number;
  /** Worst/most actionable status across rows in the month */
  reviewStatus: CommissionReviewStatus;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
};

function aggregateStatus(
  statuses: CommissionReviewStatus[]
): CommissionReviewStatus {
  if (statuses.some((s) => s === "PENDING_REVIEW")) return "PENDING_REVIEW";
  if (statuses.some((s) => s === "APPROVED")) return "APPROVED";
  return "PAID";
}

export async function getMonthlyCommissionsForAgent(
  agentId: string
): Promise<MonthlyCommissionRow[]> {
  await requirePermission("agents:read");

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, fullName: true, partnerId: true, commissionPercent: true },
  });
  if (!agent) return [];

  const rows = await prisma.commissionPayment.findMany({
    where: { agentId },
    include: {
      treatment: { select: { endDate: true, patientId: true } },
    },
  });

  const map = new Map<
    string,
    {
      amount: number;
      patients: Set<string>;
      treatments: number;
      statuses: CommissionReviewStatus[];
    }
  >();

  for (const row of rows) {
    if (!row.treatment.endDate) continue;
    const key = toPeriodMonth(row.treatment.endDate);
    const bucket = map.get(key) ?? {
      amount: 0,
      patients: new Set<string>(),
      treatments: 0,
      statuses: [],
    };
    bucket.amount += Number(row.amount);
    bucket.patients.add(row.patientId);
    bucket.treatments += 1;
    bucket.statuses.push(row.reviewStatus);
    map.set(key, bucket);
  }

  return [...map.entries()]
    .map(([periodMonth, bucket]) => ({
      agentId: agent.id,
      agentName: agent.fullName,
      partnerId: agent.partnerId,
      commissionPercent: agent.commissionPercent ?? 10,
      periodMonth,
      patientCount: bucket.patients.size,
      treatmentCount: bucket.treatments,
      amount: Math.round(bucket.amount * 100) / 100,
      reviewStatus: aggregateStatus(bucket.statuses),
      pendingCount: bucket.statuses.filter((s) => s === "PENDING_REVIEW").length,
      approvedCount: bucket.statuses.filter((s) => s === "APPROVED").length,
      paidCount: bucket.statuses.filter((s) => s === "PAID").length,
    }))
    .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
}

export async function getAllMonthlyCommissions(filters?: {
  search?: string;
  monthFrom?: string;
  monthTo?: string;
  sort?: string;
}): Promise<MonthlyCommissionRow[]> {
  await requirePermission("agents:read");

  const agents = await prisma.agent.findMany({
    where: filters?.search
      ? { fullName: { contains: filters.search, mode: "insensitive" } }
      : undefined,
    select: { id: true, fullName: true, partnerId: true, commissionPercent: true },
  });

  const all: MonthlyCommissionRow[] = [];
  for (const agent of agents) {
    const rows = await getMonthlyCommissionsForAgent(agent.id);
    all.push(...rows);
  }

  let filtered = all;
  if (filters?.monthFrom) {
    filtered = filtered.filter((r) => r.periodMonth >= filters.monthFrom!);
  }
  if (filters?.monthTo) {
    filtered = filtered.filter((r) => r.periodMonth <= filters.monthTo!);
  }

  const sort = filters?.sort ?? "month";
  filtered.sort((a, b) => {
    if (sort === "agent") return a.agentName.localeCompare(b.agentName);
    if (sort === "amount") return b.amount - a.amount;
    return b.periodMonth.localeCompare(a.periodMonth);
  });

  return filtered;
}

export async function getCommissionReviewData(
  agentId: string,
  periodMonth: string
) {
  await requirePermission("agents:read");
  return fetchCommissionReviewData(agentId, periodMonth);
}

async function fetchCommissionReviewData(
  agentId: string,
  periodMonth: string
) {
  const { start, end } = monthBounds(periodMonth);

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      fullName: true,
      partnerId: true,
      commissionPercent: true,
    },
  });
  if (!agent) return null;

  const commissions = await prisma.commissionPayment.findMany({
    where: {
      agentId,
      treatment: {
        status: "COMPLETED",
        endDate: { gte: start, lt: end },
      },
    },
    include: {
      patient: {
        select: { id: true, fullName: true, displayId: true, status: true },
      },
      treatment: {
        include: {
          charges: {
            select: {
              id: true,
              netPrice: true,
              lines: {
                select: {
                  serviceCategory: true,
                  notes: true,
                  quantity: true,
                  unitPrice: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { calculatedAt: "asc" },
  });

  const byPatient = new Map<
    string,
    {
      patient: (typeof commissions)[0]["patient"];
      treatments: Array<{
        commissionId: string;
        treatmentId: string;
        diagnosis: string | null;
        treatmentDate: Date;
        endDate: Date | null;
        status: string;
        reviewStatus: CommissionReviewStatus;
        commissionAmount: number;
        charges: Array<{
          serviceCategory: string;
          description: string;
          netPrice: number;
        }>;
        totalCharges: number;
      }>;
      totalCharges: number;
      totalCommission: number;
    }
  >();

  for (const c of commissions) {
    const bucket = byPatient.get(c.patientId) ?? {
      patient: c.patient,
      treatments: [],
      totalCharges: 0,
      totalCommission: 0,
    };
    const totalCharges = c.treatment.charges.reduce(
      (s, ch) => s + Number(ch.netPrice),
      0
    );
    bucket.treatments.push({
      commissionId: c.id,
      treatmentId: c.treatmentId,
      diagnosis: c.treatment.diagnosis,
      treatmentDate: c.treatment.treatmentDate,
      endDate: c.treatment.endDate,
      status: c.treatment.status,
      reviewStatus: c.reviewStatus,
      commissionAmount: Number(c.amount),
      charges: c.treatment.charges.flatMap((ch) =>
        ch.lines.length > 0
          ? ch.lines.map((line) => ({
              serviceCategory: line.serviceCategory,
              description: line.notes?.trim() || line.serviceCategory,
              netPrice: Number(line.quantity) * Number(line.unitPrice),
            }))
          : [
              {
                serviceCategory: "OTHER",
                description: "Charge",
                netPrice: Number(ch.netPrice),
              },
            ]
      ),
      totalCharges,
    });
    bucket.totalCharges += totalCharges;
    bucket.totalCommission += Number(c.amount);
    byPatient.set(c.patientId, bucket);
  }

  return {
    agent,
    periodMonth,
    monthLabel: formatMonthLabel(periodMonth),
    billingId: agent.partnerId
      ? toBillingId(periodMonth, agent.partnerId)
      : null,
    patients: [...byPatient.values()],
    totalCharges: [...byPatient.values()].reduce(
      (s, p) => s + p.totalCharges,
      0
    ),
    totalCommission: [...byPatient.values()].reduce(
      (s, p) => s + p.totalCommission,
      0
    ),
    patientCount: byPatient.size,
    pendingCount: commissions.filter((c) => c.reviewStatus === "PENDING_REVIEW")
      .length,
    reviewStatuses: commissions.map((c) => c.reviewStatus),
  };
}

export async function approveMonthCommissionsAction(
  agentId: string,
  periodMonth: string
) {
  await requirePermission("agents:write");
  const count = await approveCommissionsForMonth(agentId, periodMonth);
  revalidatePath(`/dashboard/agents/${agentId}`);
  revalidatePath("/dashboard/agent_billing");
  revalidatePath("/dashboard/commission/review");
  return { success: true as const, count };
}

export type ApprovedBillingIdOption = {
  billingId: string;
  agentId: string;
  agentName: string;
  partnerId: string;
  periodMonth: string;
  monthLabel: string;
  amount: number;
};

/** APPROVED unpaid billing IDs for the commission payment dropdown */
export async function getApprovedBillingIds(): Promise<ApprovedBillingIdOption[]> {
  await requirePermission("agents:read");

  const rows = await prisma.commissionPayment.findMany({
    where: {
      reviewStatus: "APPROVED",
      paidAt: null,
    },
    include: {
      agent: { select: { id: true, fullName: true, partnerId: true } },
      treatment: { select: { endDate: true } },
    },
  });

  const map = new Map<string, ApprovedBillingIdOption>();

  for (const row of rows) {
    if (!row.treatment.endDate || !row.agent.partnerId) continue;
    const periodMonth = toPeriodMonth(row.treatment.endDate);
    const billingId = toBillingId(periodMonth, row.agent.partnerId);
    const existing = map.get(billingId);
    if (existing) {
      existing.amount += Number(row.amount);
    } else {
      map.set(billingId, {
        billingId,
        agentId: row.agent.id,
        agentName: row.agent.fullName,
        partnerId: row.agent.partnerId,
        periodMonth,
        monthLabel: formatMonthLabel(periodMonth),
        amount: Number(row.amount),
      });
    }
  }

  return [...map.values()]
    .map((o) => ({
      ...o,
      amount: Math.round(o.amount * 100) / 100,
    }))
    .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
}

export async function getBillingDetailByBillingId(
  billingId: string,
  options?: { requireAuth?: boolean; agentId?: string }
) {
  const requireAuthFlag = options?.requireAuth !== false;
  if (requireAuthFlag) {
    await requirePermission("agents:read");
  }

  const parsed = parseBillingId(decodeURIComponent(billingId));
  if (!parsed) return null;

  const agent = await prisma.agent.findFirst({
    where: { partnerId: { equals: parsed.partnerId, mode: "insensitive" } },
    select: {
      id: true,
      fullName: true,
      partnerId: true,
      commissionPercent: true,
    },
  });
  if (!agent?.partnerId) return null;

  if (options?.agentId && options.agentId !== agent.id) {
    return null;
  }

  const data = await fetchCommissionReviewData(agent.id, parsed.periodMonth);
  if (!data) return null;

  return {
    ...data,
    billingId: toBillingId(parsed.periodMonth, agent.partnerId),
    commissionPercent: agent.commissionPercent ?? 10,
  };
}

export type PaidCommissionGroup = {
  billingId: string;
  agentId: string;
  agentName: string;
  partnerId: string | null;
  periodMonth: string;
  amount: number;
  method: PaymentMethod | null;
  paidAt: Date | null;
  reference: string | null;
  rowCount: number;
};

export async function getPaidCommissionGroups(): Promise<PaidCommissionGroup[]> {
  await requirePermission("agents:read");

  const rows = await prisma.commissionPayment.findMany({
    where: { reviewStatus: "PAID" },
    include: {
      agent: { select: { id: true, fullName: true, partnerId: true } },
      treatment: { select: { endDate: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const map = new Map<string, PaidCommissionGroup>();

  for (const row of rows) {
    if (!row.treatment.endDate || !row.agent.partnerId) continue;
    const periodMonth = toPeriodMonth(row.treatment.endDate);
    const billingId = toBillingId(periodMonth, row.agent.partnerId);
    const existing = map.get(billingId);
    if (existing) {
      existing.amount += Number(row.amount);
      existing.rowCount += 1;
      if (row.paidAt && (!existing.paidAt || row.paidAt > existing.paidAt)) {
        existing.paidAt = row.paidAt;
        existing.method = row.paymentMethod;
        existing.reference = row.remark;
      }
    } else {
      map.set(billingId, {
        billingId,
        agentId: row.agent.id,
        agentName: row.agent.fullName,
        partnerId: row.agent.partnerId,
        periodMonth,
        amount: Number(row.amount),
        method: row.paymentMethod,
        paidAt: row.paidAt,
        reference: row.remark,
        rowCount: 1,
      });
    }
  }

  return [...map.values()]
    .map((g) => ({
      ...g,
      amount: Math.round(g.amount * 100) / 100,
    }))
    .sort((a, b) => {
      const aTime = a.paidAt?.getTime() ?? 0;
      const bTime = b.paidAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export async function markCommissionsPaidByBillingId(input: {
  billingId: string;
  method: "CASH" | "BANK";
  paidAt: string;
  referenceNumber?: string;
}) {
  await requirePermission("agents:write");

  const parsed = parseBillingId(input.billingId);
  if (!parsed) {
    return {
      success: false as const,
      error: "Invalid Billing ID. Use format MMYY-AGENTID (e.g. 0526-ZA1W).",
    };
  }

  const agent = await prisma.agent.findFirst({
    where: { partnerId: { equals: parsed.partnerId, mode: "insensitive" } },
    select: { id: true, partnerId: true, fullName: true },
  });
  if (!agent?.partnerId) {
    return {
      success: false as const,
      error: `No agent found for Partner ID ${parsed.partnerId}`,
    };
  }

  const { start, end } = monthBounds(parsed.periodMonth);
  const approved = await prisma.commissionPayment.findMany({
    where: {
      agentId: agent.id,
      reviewStatus: "APPROVED",
      paidAt: null,
      treatment: { endDate: { gte: start, lt: end } },
    },
  });

  if (approved.length === 0) {
    return {
      success: false as const,
      error: "No approved unpaid commissions for this Billing ID",
    };
  }

  const paidAt = new Date(input.paidAt);
  const remark =
    input.method === "BANK"
      ? input.referenceNumber?.trim() || null
      : null;

  await prisma.commissionPayment.updateMany({
    where: { id: { in: approved.map((a) => a.id) } },
    data: {
      reviewStatus: "PAID",
      paidAt,
      paymentMethod: input.method,
      remark,
    },
  });

  const amount =
    Math.round(
      approved.reduce((s, r) => s + Number(r.amount), 0) * 100
    ) / 100;

  revalidatePath("/dashboard/commission-payment");
  revalidatePath("/dashboard/agent_billing");
  revalidatePath(`/dashboard/agents/${agent.id}`);
  return {
    success: true as const,
    amount,
    billingId: toBillingId(parsed.periodMonth, agent.partnerId),
  };
}
