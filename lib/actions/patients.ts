"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { patientUpdateStatusSchema } from "@/lib/validations/patient";
import type { PatientStatus } from "@/prisma/generated/prisma/client";
import { recomputeDisplayId } from "@/lib/utils/display-id";
import { recalculateAgentCommission } from "@/lib/actions/commission";
import { getFirstZodError } from "@/lib/utils/zod";
import { decrypt } from "@/lib/utils/encryption";
import { deleteSignatureImage } from "@/lib/utils/supabase-storage";

export async function updatePatientStatus(
  patientId: string,
  status: PatientStatus
) {
  await requireAuth();

  const parsed = patientUpdateStatusSchema.safeParse({ patientId, status });
  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodError(parsed.error),
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

type UpdatePatientAssignmentInput = {
  patientId: string;
  clinicId?: string | null;
  status?: PatientStatus;
  agentId?: string | null;
};

export async function updatePatientAssignment(
  input: UpdatePatientAssignmentInput
) {
  await requireAuth();

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: {
      id: true,
      displayId: true,
      clinicId: true,
      status: true,
      currentAgentId: true,
    },
  });

  if (!patient) {
    return { success: false as const, error: "Patient not found" };
  }

  try {
    const nextClinicId =
      input.clinicId === undefined ? patient.clinicId : input.clinicId;
    const nextStatus = input.status ?? patient.status;
    const nextAgentId =
      input.agentId === undefined ? patient.currentAgentId : input.agentId;

    let clinicCode: string | null = null;
    if (nextClinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: nextClinicId },
        select: { code: true },
      });
      clinicCode = clinic?.code ?? null;
    }

    let agentCode: string | null = null;
    if (nextAgentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: nextAgentId },
        select: { partnerId: true },
      });
      agentCode = agent?.partnerId ?? null;
    }

    const shouldRecomputeDisplayId =
      input.clinicId !== undefined || input.agentId !== undefined;
    const nextDisplayId = shouldRecomputeDisplayId
      ? recomputeDisplayId(patient.displayId, clinicCode, agentCode)
      : patient.displayId;

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        clinicId: nextClinicId ?? null,
        status: nextStatus,
        currentAgentId: nextAgentId ?? null,
        displayId: nextDisplayId,
      },
    });

    if (input.agentId !== undefined && input.agentId !== patient.currentAgentId) {
      await recalculateAgentCommission(patient.id);
    }

    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${patient.id}`);
    revalidatePath("/dashboard/agents");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Failed to update patient" };
  }
}

export async function deletePatient(patientId: string) {
  await requirePermission("patients:delete");

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, signatureImageUrl: true },
  });

  if (!patient) {
    return { success: false as const, error: "Patient not found" };
  }

  try {
    if (patient.signatureImageUrl) {
      try {
        const path = decrypt(patient.signatureImageUrl);
        await deleteSignatureImage(path);
      } catch {
        // Continue even if signature cleanup fails
      }
    }

    await prisma.patient.delete({ where: { id: patient.id } });

    revalidatePath("/dashboard/patients");
  } catch {
    return { success: false as const, error: "Failed to delete patient" };
  }

  redirect("/dashboard/patients");
}
