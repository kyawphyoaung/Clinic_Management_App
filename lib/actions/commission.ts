"use server";

import { prisma } from "@/lib/db";
import { COMMISSION_CURRENCY } from "@/lib/utils/commission";

const DEFAULT_COMMISSION_PERCENT = 10;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Recalculate commission for a single treatment.
 * Eligible only when status=COMPLETED and endDate is set; patient must have currentAgentId.
 * Amount = (treatment charges × agent rate) / 100.
 */
export async function recalculateCommissionForTreatment(treatmentId: string) {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
    select: {
      id: true,
      patientId: true,
      status: true,
      endDate: true,
      charges: { select: { netPrice: true } },
      patient: {
        select: {
          currentAgentId: true,
          currentAgent: { select: { id: true, commissionPercent: true } },
        },
      },
      commissionPayments: true,
    },
  });

  if (!treatment) return;

  const existingRows = await prisma.commissionPayment.findMany({
    where: { treatmentId },
  });

  const eligible =
    treatment.status === "COMPLETED" &&
    treatment.endDate != null &&
    Boolean(treatment.patient.currentAgentId) &&
    Boolean(treatment.patient.currentAgent);

  if (!eligible) {
    for (const row of existingRows) {
      if (row.reviewStatus === "PAID") continue;
      await prisma.commissionPayment.delete({ where: { id: row.id } });
    }
    return;
  }

  const agentId = treatment.patient.currentAgentId!;
  const agent = treatment.patient.currentAgent!;
  const rate =
    agent.commissionPercent != null && agent.commissionPercent > 0
      ? agent.commissionPercent
      : DEFAULT_COMMISSION_PERCENT;

  const totalCharges = treatment.charges.reduce(
    (sum, c) => sum + Number(c.netPrice),
    0
  );
  const amount = roundMoney((totalCharges * rate) / 100);

  // Revoke rows belonging to a different agent (agent change)
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

/** Recalculate all treatments for a patient (e.g. after agent change). */
export async function recalculateAgentCommission(patientId: string) {
  const treatments = await prisma.treatment.findMany({
    where: { patientId },
    select: { id: true },
  });
  for (const t of treatments) {
    await recalculateCommissionForTreatment(t.id);
  }
}

/**
 * Hook for future refund flows: recompute commission from remaining charges
 * after a refund adjusts treatment charges.
 */
export async function recalculateCommissionAfterRefund(treatmentId: string) {
  await recalculateCommissionForTreatment(treatmentId);
}

/** Approve all PENDING_REVIEW commissions for an agent in a period month (yyyy-mm). */
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
