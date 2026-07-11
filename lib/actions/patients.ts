"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import {
  patientFormSchema,
  patientUpdateStatusSchema,
  type PatientFormInput,
} from "@/lib/validations/patient";
import { PatientSource } from "@/prisma/generated/prisma/client";

export async function createPatient(input: PatientFormInput) {
  await requireAuth();

  const parsed = patientFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Invalid data",
    };
  }

  const data = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        age:
          data.age && data.age !== ""
            ? Number(data.age)
            : null,
        gender: data.gender || null,
        source: data.source,
        status: data.status,
        agentId:
          data.source === PatientSource.AGENT && data.agentId
            ? data.agentId
            : null,
      },
    });

    revalidatePath("/dashboard/patients");
    return { success: true as const, patientId: patient.id };
  } catch {
    return { success: false as const, error: "Failed to create patient" };
  }
}

export async function updatePatientStatus(
  patientId: string,
  status: PatientFormInput["status"]
) {
  await requireAuth();

  const parsed = patientUpdateStatusSchema.safeParse({ patientId, status });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Invalid data",
    };
  }

  try {
    await prisma.patient.update({
      where: { id: parsed.data.patientId },
      data: { status: parsed.data.status },
    });

    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${parsed.data.patientId}`);
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to update status" };
  }
}

export async function getPatients(filters?: {
  search?: string;
  status?: string;
  source?: string;
  agentId?: string;
}) {
  await requireAuth();

  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.source) {
    where.source = filters.source;
  }

  if (filters?.agentId) {
    where.agentId = filters.agentId;
  }

  return prisma.patient.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true } },
      _count: { select: { surveys: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPatientById(id: string) {
  await requireAuth();

  return prisma.patient.findUnique({
    where: { id },
    include: {
      agent: true,
      surveys: { orderBy: { createdAt: "desc" } },
    },
  });
}
