"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";
import type { PaymentMethod } from "@/prisma/generated/prisma/client";

const depositSchema = z.object({
  patientId: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "BANK"]),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function getPatientDepositBalance(patientId: string) {
  const [deposits, applied] = await Promise.all([
    prisma.patientDeposit.aggregate({
      where: { patientId },
      _sum: { amount: true },
    }),
    prisma.treatmentCharge.aggregate({
      where: { treatment: { patientId } },
      _sum: { depositApplied: true },
    }),
  ]);
  const total = Number(deposits._sum.amount ?? 0);
  const used = Number(applied._sum.depositApplied ?? 0);
  return Math.max(0, total - used);
}

export async function listPatientDeposits(patientId: string) {
  await requirePermission("patients:read");
  const rows = await prisma.patientDeposit.findMany({
    where: { patientId },
    include: { createdBy: { select: { fullName: true } } },
    orderBy: { paymentDate: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    method: r.method,
    paymentDate: r.paymentDate.toISOString().slice(0, 10),
    reference: r.reference,
    notes: r.notes,
    createdBy: r.createdBy?.fullName ?? "—",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listAllDeposits(filters?: {
  search?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  await requirePermission("patients:read");
  const where: {
    method?: PaymentMethod;
    paymentDate?: { gte?: Date; lte?: Date };
    patient?: {
      OR: Array<
        | { fullName: { contains: string; mode: "insensitive" } }
        | { displayId: { contains: string; mode: "insensitive" } }
      >;
    };
  } = {};
  if (filters?.method && ["CASH", "CARD", "BANK"].includes(filters.method)) {
    where.method = filters.method as PaymentMethod;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.paymentDate = {};
    if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.patient = {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { displayId: { contains: q, mode: "insensitive" } },
      ],
    };
  }
  const rows = await prisma.patientDeposit.findMany({
    where,
    include: {
      patient: { select: { id: true, fullName: true, displayId: true } },
      createdBy: { select: { fullName: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 500,
  });
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    method: r.method,
    paymentDate: r.paymentDate.toISOString().slice(0, 10),
    reference: r.reference,
    notes: r.notes,
    patient: r.patient,
    createdBy: r.createdBy?.fullName ?? "—",
  }));
}

export async function recordPatientDeposit(input: unknown) {
  const session = await requirePermission("patients:write");
  const parsed = depositSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  const data = parsed.data;
  await prisma.patientDeposit.create({
    data: {
      patientId: data.patientId,
      amount: data.amount,
      method: data.method,
      paymentDate: new Date(data.paymentDate),
      reference: data.reference?.trim() || null,
      notes: data.notes?.trim() || null,
      createdById: session.user.id,
    },
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  revalidatePath("/dashboard/patient_billing");
  return { success: true as const };
}
