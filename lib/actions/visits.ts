"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { buildVisitDisplayId } from "@/lib/utils/display-id";
import { getFirstZodError } from "@/lib/utils/zod";
import type { VisitSource, VisitType } from "@/prisma/generated/prisma/client";

const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  clinicId: z.string().uuid(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitType: z.enum(["FIRST_VISIT", "REVISIT", "FOLLOW_UP"]),
  source: z.enum(["AGENT_REFERRAL", "WALKIN"]),
  agentId: z.string().uuid().optional().nullable(),
});

const updateVisitSchema = z.object({
  visitId: z.string().uuid(),
  clinicId: z.string().uuid(),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitType: z.enum(["FIRST_VISIT", "REVISIT", "FOLLOW_UP"]),
  source: z.enum(["AGENT_REFERRAL", "WALKIN"]),
  agentId: z.string().uuid().optional().nullable(),
  treatmentIds: z.array(z.string().uuid()).optional(),
});

export async function createVisit(input: z.infer<typeof createVisitSchema>) {
  await requirePermission("patients:write");

  const parsed = createVisitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }

  const data = parsed.data;
  if (data.source === "AGENT_REFERRAL" && !data.agentId) {
    return { success: false as const, error: "Select an agent for referrals" };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
    select: { id: true, patientNumber: true },
  });
  if (!patient) {
    return { success: false as const, error: "Patient not found" };
  }

  const [clinic, agent] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: data.clinicId },
      select: { id: true, code: true },
    }),
    data.agentId
      ? prisma.agent.findUnique({
          where: { id: data.agentId },
          select: { id: true, partnerId: true },
        })
      : Promise.resolve(null),
  ]);
  if (!clinic) {
    return { success: false as const, error: "Clinic not found" };
  }

  const visitDate = new Date(`${data.visitDate}T00:00:00`);
  const displayId = buildVisitDisplayId(
    clinic.code,
    data.source === "WALKIN" ? null : agent?.partnerId,
    patient.patientNumber,
    visitDate
  );

  const existing = await prisma.visit.findUnique({ where: { displayId } });
  if (existing) {
    return {
      success: false as const,
      error: "A visit with this clinic, agent, and date already exists",
    };
  }

  await prisma.visit.create({
    data: {
      displayId,
      patientId: patient.id,
      clinicId: clinic.id,
      agentId: data.source === "WALKIN" ? null : (agent?.id ?? null),
      visitDate,
      visitType: data.visitType as VisitType,
      source: data.source as VisitSource,
    },
  });

  revalidatePath(`/dashboard/patients/${patient.id}`);
  revalidatePath("/dashboard/patients");
  return { success: true as const };
}

export async function updateVisit(input: z.infer<typeof updateVisitSchema>) {
  await requirePermission("patients:write");
  const parsed = updateVisitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  if (data.source === "AGENT_REFERRAL" && !data.agentId) {
    return { success: false as const, error: "Select an agent for referrals" };
  }

  const visit = await prisma.visit.findUnique({
    where: { id: data.visitId },
    select: { id: true, patientId: true, patient: { select: { patientNumber: true } } },
  });
  if (!visit) return { success: false as const, error: "Visit not found" };

  const [clinic, agent] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: data.clinicId }, select: { id: true, code: true } }),
    data.agentId
      ? prisma.agent.findUnique({ where: { id: data.agentId }, select: { id: true, partnerId: true } })
      : Promise.resolve(null),
  ]);
  if (!clinic) return { success: false as const, error: "Clinic not found" };

  const visitDate = new Date(`${data.visitDate}T00:00:00`);
  const displayId = buildVisitDisplayId(
    clinic.code,
    data.source === "WALKIN" ? null : agent?.partnerId,
    visit.patient.patientNumber,
    visitDate
  );
  const existing = await prisma.visit.findUnique({ where: { displayId } });
  if (existing && existing.id !== visit.id) {
    return { success: false as const, error: "A visit with this display ID already exists" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.visit.update({
      where: { id: visit.id },
      data: {
        clinicId: clinic.id,
        visitDate,
        visitType: data.visitType as VisitType,
        source: data.source as VisitSource,
        agentId: data.source === "WALKIN" ? null : (agent?.id ?? null),
        displayId,
      },
    });

    if (data.treatmentIds) {
      const allowed = await tx.treatment.findMany({
        where: {
          patientId: visit.patientId,
          id: { in: data.treatmentIds },
        },
        select: { id: true },
      });
      const allowedIds = allowed.map((t) => t.id);
      // Detach treatments removed from this visit by moving them to another visit if possible,
      // otherwise keep them linked (cannot leave visitId null).
      const otherVisit = await tx.visit.findFirst({
        where: { patientId: visit.patientId, id: { not: visit.id } },
        orderBy: { visitDate: "desc" },
        select: { id: true },
      });
      if (otherVisit) {
        await tx.treatment.updateMany({
          where: { visitId: visit.id, id: { notIn: allowedIds } },
          data: { visitId: otherVisit.id },
        });
      }
      if (allowedIds.length > 0) {
        await tx.treatment.updateMany({
          where: { id: { in: allowedIds }, patientId: visit.patientId },
          data: { visitId: visit.id },
        });
      }
    }
  });

  revalidatePath(`/dashboard/patients/${visit.patientId}`);
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/treatments");
  return { success: true as const };
}

export async function getVisitDeleteImpact(visitId: string) {
  await requirePermission("patients:write");
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      displayId: true,
      treatments: {
        select: {
          id: true,
          shortId: true,
          diagnosis: true,
          _count: { select: { charges: true, payments: true } },
          charges: { select: { shortId: true, netPrice: true } },
          payments: { select: { amount: true, paymentDate: true } },
        },
      },
    },
  });
  if (!visit) return null;
  return {
    id: visit.id,
    displayId: visit.displayId,
    treatments: visit.treatments.map((t) => ({
      id: t.id,
      shortId: t.shortId,
      diagnosis: t.diagnosis,
      chargeCount: t._count.charges,
      paymentCount: t._count.payments,
      charges: t.charges.map((c) => ({
        shortId: c.shortId,
        netPrice: Number(c.netPrice),
      })),
      payments: t.payments.map((p) => ({
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString().slice(0, 10),
      })),
    })),
  };
}

export async function deleteVisit(visitId: string) {
  await requirePermission("patients:write");
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: { id: true, patientId: true },
  });
  if (!visit) return { success: false as const, error: "Visit not found" };
  await prisma.visit.delete({ where: { id: visit.id } });
  revalidatePath(`/dashboard/patients/${visit.patientId}`);
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/treatments");
  return { success: true as const };
}
