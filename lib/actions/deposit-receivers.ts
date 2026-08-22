"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { getFirstZodError } from "@/lib/utils/zod";

const receiverSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
});

export async function listDepositReceivers() {
  await requirePermission("patients:read");
  const receivers = await prisma.depositReceiver.findMany({
    orderBy: { name: "asc" },
    include: {
      deposits: { select: { amountTwd: true } },
      transfers: { select: { amountTwd: true } },
    },
  });
  return receivers.map((r) => {
    const held = r.deposits.reduce((s, d) => s + Number(d.amountTwd), 0);
    const transferred = r.transfers.reduce((s, t) => s + Number(t.amountTwd), 0);
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      contactInfo: r.contactInfo,
      held,
      transferred,
      currentBalance: held - transferred,
    };
  });
}

export async function createDepositReceiver(input: unknown) {
  await requirePermission("clinics:manage");
  const parsed = receiverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  await prisma.depositReceiver.create({ data: parsed.data });
  revalidatePath("/dashboard/deposit-receivers");
  return { success: true as const };
}

export async function updateDepositReceiver(id: string, input: unknown) {
  await requirePermission("clinics:manage");
  const parsed = receiverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: getFirstZodError(parsed.error) };
  }
  await prisma.depositReceiver.update({ where: { id }, data: parsed.data });
  revalidatePath("/dashboard/deposit-receivers");
  return { success: true as const };
}

export async function deleteDepositReceiver(id: string) {
  await requirePermission("clinics:manage");
  await prisma.depositReceiver.delete({ where: { id } });
  revalidatePath("/dashboard/deposit-receivers");
  return { success: true as const };
}

export async function recordDepositTransfer(input: {
  receiverId: string;
  amountTwd: number;
  transferredAt: string;
  notes?: string | null;
}) {
  const session = await requirePermission("clinics:manage");
  if (!(input.amountTwd > 0)) {
    return { success: false as const, error: "Amount must be greater than 0" };
  }
  await prisma.depositTransfer.create({
    data: {
      receiverId: input.receiverId,
      amountTwd: input.amountTwd,
      transferredAt: new Date(input.transferredAt),
      notes: input.notes?.trim() || null,
      createdById: session.user.id,
    },
  });
  revalidatePath("/dashboard/deposit-receivers");
  revalidatePath("/dashboard/cashflow");
  return { success: true as const };
}
