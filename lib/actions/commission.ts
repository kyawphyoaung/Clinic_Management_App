"use server";

import { prisma } from "@/lib/db";
import { COMMISSION_CURRENCY } from "@/lib/utils/commission";

const DEFAULT_COMMISSION_PERCENT = 10;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Recalculate commission for a single treatment.
 * Eligible when status=COMPLETED, endDate is set, and the visit has an agent.
 * Amount = sum((totalPrice - discount) × rate) for isAgentRelated charges.
 */
export async function recalculateCommissionForTreatment(treatmentId: string) {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: {
      id: true,
      patientId: true,
      status: true,
      endDate: true,
      charges: {
        select: {
          totalPrice: true,
          discount: true,
          isAgentRelated: true,
        },
      },
      visit: {
        select: {
          agentId: true,
          agent: { select: { id: true, commissionPercent: true } },
        },
      },
    },
  });

  if (!treatment) return;

  const existingRows = await prisma.commissionPayment.findMany({
    where: { treatmentId },
  });

  const visitAgent = treatment.visit.agent;
  const eligible =
    treatment.status === "COMPLETED" &&
    treatment.endDate != null &&
    Boolean(treatment.visit.agentId) &&
    Boolean(visitAgent);

  if (!eligible) {
    for (const row of existingRows) {
      if (row.reviewStatus === "PAID") continue;
      await prisma.commissionPayment.delete({ where: { id: row.id } });
    }
    return;
  }

  const agentId = treatment.visit.agentId!;
  const agent = visitAgent!;
  const rate =
    agent.commissionPercent != null && agent.commissionPercent > 0
      ? agent.commissionPercent
      : DEFAULT_COMMISSION_PERCENT;

  const commissionable = treatment.charges
    .filter((c) => c.isAgentRelated)
    .reduce((sum, c) => sum + Math.max(0, Number(c.totalPrice) - Number(c.discount)), 0);
  const amount = roundMoney((commissionable * rate) / 100);

  for (const row of existingRows) {
    if (row.agentId !== agentId && row.reviewStatus !== "PAID") {
      await prisma.commissionPayment.delete({ where: { id: row.id } });
    }
  }

  const existing = await prisma.commissionPayment.findUnique({
    where: {
      agentId_treatmentId: { agentId, treatmentId },
    },
  });

  if (amount <= 0) {
    if (existing && existing.reviewStatus !== "PAID") {
      await prisma.commissionPayment.delete({ where: { id: existing.id } });
    }
    return;
  }

  if (existing) {
    await prisma.commissionPayment.update({
      where: { id: existing.id },
      data: {
        patientId: treatment.patientId,
        amount,
        calculatedAt: new Date(),
        currency: existing.currency || COMMISSION_CURRENCY,
      },
    });
  } else {
    await prisma.commissionPayment.create({
      data: {
        agentId,
        patientId: treatment.patientId,
        treatmentId,
        amount,
        currency: COMMISSION_CURRENCY,
        calculatedAt: new Date(),
        reviewStatus: "PENDING_REVIEW",
      },
    });
  }
}

/** Recalculate all treatments for a patient (legacy hook after assignment change). */
export async function recalculateAgentCommission(patientId: string) {
  const treatments = await prisma.treatment.findMany({
    where: { patientId },
    select: { id: true },
  });
  for (const t of treatments) {
    await recalculateCommissionForTreatment(t.id);
  }
}

export async function recalculateCommissionAfterRefund(treatmentId: string) {
  await recalculateCommissionForTreatment(treatmentId);
}

export async function approveCommissionsForMonth(
  agentId: string,
  periodMonth: string
) {
  const [year, month] = periodMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const result = await prisma.commissionPayment.updateMany({
    where: {
      agentId,
      reviewStatus: "PENDING_REVIEW",
      treatment: {
        status: "COMPLETED",
        endDate: { gte: start, lt: end },
      },
    },
    data: { reviewStatus: "APPROVED" },
  });

  return result.count;
}
