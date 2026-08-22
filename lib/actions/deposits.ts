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
  receiverId: z.string().uuid().optional().nullable(),
  currency: z.string().min(1).default("TWD"),
  exchangeRate: z.coerce.number().positive().default(1),
});

const requestedDepositSchema = z.object({
  patientId: z.string().uuid(),
  treatmentId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1).default("TWD"),
  exchangeRate: z.coerce.number().positive().default(1),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function getPatientDepositBalance(patientId: string) {
  const [deposits, applied] = await Promise.all([
    prisma.patientDeposit.aggregate({
      where: { patientId },
      _sum: { amountTwd: true },
    }),
    prisma.treatmentPayment.aggregate({
      where: { treatment: { patientId } },
      _sum: { depositAppliedAmount: true },
    }),
  ]);
  const total = Number(deposits._sum.amountTwd ?? 0);
  const used = Number(applied._sum.depositAppliedAmount ?? 0);
  return Math.max(0, total - used);
}

export async function listPatientDeposits(patientId: string) {
  await requirePermission("patients:read");
  const rows = await prisma.patientDeposit.findMany({
    where: { patientId },
    include: { createdBy: { select: { fullName: true } } },
    orderBy: { paymentDate: "desc" },
  });
  const appliedTotal = Number(
    (
      await prisma.treatmentPayment.aggregate({
        where: { treatment: { patientId } },
        _sum: { depositAppliedAmount: true },
      })
    )._sum.depositAppliedAmount ?? 0
  );
  // FIFO: oldest deposits are consumed first when deposit is applied to payments.
  const oldestFirst = [...rows].sort(
    (a, b) =>
      a.paymentDate.getTime() - b.paymentDate.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
  let remainingApplied = appliedTotal;
  const usedById = new Map<string, boolean>();
  for (const row of oldestFirst) {
    const amountTwd = Number(row.amountTwd ?? row.amount);
    const used = remainingApplied > 0.001;
    usedById.set(row.id, used);
    if (used) remainingApplied = Math.max(0, remainingApplied - amountTwd);
  }
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    method: r.method,
    paymentDate: r.paymentDate.toISOString().slice(0, 10),
    reference: r.reference,
    notes: r.notes,
    createdBy: r.createdBy?.fullName ?? "—",
    createdAt: r.createdAt.toISOString(),
    isApplied: usedById.get(r.id) === true,
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
      amountTwd: data.amount * data.exchangeRate,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      receiverId: data.receiverId || null,
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

export async function listRequestedDeposits(patientId: string) {
  await requirePermission("patients:read");
  const rows = await prisma.requestedDeposit.findMany({
    where: { patientId },
    include: { createdBy: { select: { fullName: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    amountTwd: Number(r.amountTwd),
    currency: r.currency,
    exchangeRate: Number(r.exchangeRate),
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    paidAt: r.paidAt?.toISOString() ?? null,
    reference: r.reference,
    notes: r.notes,
    createdBy: r.createdBy?.fullName ?? "—",
  }));
}

export async function createRequestedDeposit(input: unknown) {
  const session = await requirePermission("patients:write");
  const parsed = requestedDepositSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: getFirstZodError(parsed.error) };
  const data = parsed.data;
  // Phase 707.05: request deposits are TWD-only (no FX).
  await prisma.requestedDeposit.create({
    data: {
      patientId: data.patientId,
      treatmentId: data.treatmentId || null,
      amount: data.amount,
      currency: "TWD",
      exchangeRate: 1,
      amountTwd: data.amount,
      reference: data.reference?.trim() || null,
      notes: data.notes?.trim() || null,
      createdById: session.user.id,
      status: "REQUESTED",
    },
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  return { success: true as const };
}

export async function updateRequestedDepositStatus(input: {
  id: string;
  patientId: string;
  status: "REQUESTED" | "PAID" | "CANCELLED";
  exchangeRate?: number;
}) {
  await requirePermission("patients:write");
  const existing = await prisma.requestedDeposit.findUnique({
    where: { id: input.id },
    select: { amount: true, status: true },
  });
  if (!existing) return { success: false as const, error: "Requested deposit not found" };
  if (existing.status === "PAID" && input.status !== "PAID") {
    return { success: false as const, error: "Paid requested deposit cannot be changed" };
  }
  await prisma.requestedDeposit.update({
    where: { id: input.id },
    data: {
      status: input.status,
      ...(typeof input.exchangeRate === "number" && input.exchangeRate > 0
        ? {
            exchangeRate: input.exchangeRate,
            amountTwd: Number(existing.amount) * input.exchangeRate,
          }
        : {}),
      paidAt: input.status === "PAID" ? new Date() : null,
    },
  });
  revalidatePath(`/dashboard/patients/${input.patientId}`);
  return { success: true as const };
}

export async function updateRequestedDeposit(input: {
  id: string;
  patientId: string;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  reference?: string | null;
  notes?: string | null;
}) {
  await requirePermission("patients:write");
  const existing = await prisma.requestedDeposit.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      exchangeRate: true,
    },
  });
  if (!existing) return { success: false as const, error: "Requested deposit not found" };
  if (existing.status === "PAID") {
    return { success: false as const, error: "Cannot update a received deposit request" };
  }
  const amount = input.amount ?? Number(existing.amount);
  await prisma.requestedDeposit.update({
    where: { id: existing.id },
    data: {
      amount,
      currency: "TWD",
      exchangeRate: 1,
      amountTwd: amount,
      ...(input.reference !== undefined
        ? { reference: input.reference?.trim() || null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
    },
  });
  revalidatePath(`/dashboard/patients/${input.patientId}`);
  return { success: true as const };
}

export async function deleteRequestedDeposit(id: string, patientId: string) {
  await requirePermission("patients:write");
  const existing = await prisma.requestedDeposit.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) return { success: false as const, error: "Requested deposit not found" };
  if (existing.status === "PAID") {
    return { success: false as const, error: "Cannot delete a received deposit request" };
  }
  await prisma.requestedDeposit.delete({ where: { id } });
  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true as const };
}

export async function updatePatientDeposit(input: {
  id: string;
  patientId: string;
  amount?: number;
  method?: "CASH" | "CARD" | "BANK";
  paymentDate?: string;
  reference?: string | null;
  notes?: string | null;
  currency?: string;
  exchangeRate?: number;
}) {
  await requirePermission("patients:write");
  const deposits = await listPatientDeposits(input.patientId);
  const target = deposits.find((d) => d.id === input.id);
  if (!target) return { success: false as const, error: "Deposit not found" };
  if (target.isApplied) {
    return { success: false as const, error: "Cannot update a deposit that has been applied" };
  }
  const amount = input.amount ?? target.amount;
  const exchangeRate = input.exchangeRate ?? 1;
  await prisma.patientDeposit.update({
    where: { id: input.id },
    data: {
      amount,
      amountTwd: amount * exchangeRate,
      ...(input.method ? { method: input.method } : {}),
      ...(input.paymentDate ? { paymentDate: new Date(input.paymentDate) } : {}),
      ...(input.reference !== undefined
        ? { reference: input.reference?.trim() || null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.exchangeRate ? { exchangeRate } : {}),
    },
  });
  revalidatePath(`/dashboard/patients/${input.patientId}`);
  return { success: true as const };
}

export async function deletePatientDeposit(id: string, patientId: string) {
  await requirePermission("patients:write");
  const deposits = await listPatientDeposits(patientId);
  const target = deposits.find((d) => d.id === id);
  if (!target) return { success: false as const, error: "Deposit not found" };
  if (target.isApplied) {
    return { success: false as const, error: "Cannot delete a deposit that has been applied" };
  }
  await prisma.patientDeposit.delete({ where: { id } });
  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true as const };
}

export async function listRequestedDepositsForAgent(agentId: string) {
  const rows = await prisma.requestedDeposit.findMany({
    where: {
      patient: { currentAgentId: agentId },
      status: { in: ["REQUESTED", "SENT"] },
    },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          patientNumber: true,
          displayId: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    currency: r.currency,
    status: r.status,
    requestedAt: r.requestedAt.toISOString(),
    patient: r.patient,
  }));
}
