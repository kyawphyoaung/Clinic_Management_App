"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { linkConsentLogsToPatient } from "@/lib/actions/consent";
import { PATIENT_REGISTRATION_FORM } from "@/lib/constants/patient_reg_form";
import {
  configNameToPrismaKey,
  mapFormValuesToPatientData,
} from "@/lib/utils/config-driven-form";
import { createPatientWithVisit } from "@/lib/utils/create-patient-with-visit";
import {
  ENCRYPTED_PATIENT_FIELDS,
  encrypt,
  encryptFields,
} from "@/lib/utils/encryption";
import { uploadSignatureImage } from "@/lib/utils/supabase-storage";
import { buildServerRegistrationSchema } from "@/lib/validations/registration";
import { ConsentSource, PatientSource } from "@/prisma/generated/prisma/client";
import type { Prisma } from "@/prisma/generated/prisma/client";
import { getFirstZodError } from "@/lib/utils/zod";

export type PatientRegistrationInput = {
  values: Record<string, unknown>;
  signatureData: string;
  consentLogIds: string[];
  language: string;
  staff?: {
    signatureDate?: string;
    paperSignatureData?: string;
    physicalLocation?: string;
    staffDeclaration?: boolean;
  };
};

async function resolveAgentId(partnerId?: string | null): Promise<string | null> {
  if (!partnerId) return null;

  const agent = await prisma.agent.findFirst({
    where: {
      partnerId: partnerId.toUpperCase(),
      status: "ACTIVE",
    },
    select: { id: true, partnerId: true },
  });

  return agent?.id ?? null;
}

function encryptPatientRecord(
  data: Record<string, unknown>
): Record<string, unknown> {
  const snakeData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    snakeData[snakeKey] = value;
  }

  const encrypted = encryptFields(snakeData, ENCRYPTED_PATIENT_FIELDS);
  const result: Record<string, unknown> = { ...data };

  for (const field of ENCRYPTED_PATIENT_FIELDS) {
    const camel = configNameToPrismaKey(field);
    if (encrypted[field] !== undefined) {
      result[camel] = encrypted[field];
    }
  }

  return result;
}

async function createPatientFromRegistration(
  input: PatientRegistrationInput,
  options: {
    source: PatientSource;
    consentSource: ConsentSource;
    digitizedBy?: string;
  }
) {
  const schema = buildServerRegistrationSchema(PATIENT_REGISTRATION_FORM);
  const parsed = schema.safeParse(input.values);

  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodError(parsed.error),
    };
  }

  try {
    const signaturePath = input.staff?.paperSignatureData
      ? await uploadSignatureImage(input.staff.paperSignatureData, "patient")
      : await uploadSignatureImage(input.signatureData, "patient");

    const mapped = mapFormValuesToPatientData(
      input.values,
      PATIENT_REGISTRATION_FORM
    );

    const partnerId = (input.values.partner_id as string | undefined)?.toUpperCase();
    const currentAgentId = await resolveAgentId(partnerId);

    const encryptedData = encryptPatientRecord({
      ...mapped,
      signatureImageUrl: encrypt(signaturePath),
      partnerId: partnerId ?? null,
      currentAgentId,
      source: options.source,
      registrationLanguage: input.language,
      digitizedBy: options.digitizedBy ?? null,
      digitizedAt: options.digitizedBy ? new Date() : null,
    });

    const result = await prisma.$transaction(async (tx) => {
      const clinicId = encryptedData.clinicId as string | undefined;
      const visitSource =
        options.source === "AGENT" || currentAgentId ? "AGENT_REFERRAL" : "WALKIN";

      const { patient } = await createPatientWithVisit(
        tx,
        {
          ...(encryptedData as Prisma.PatientUncheckedCreateInput),
          fullName: String(input.values.full_name ?? ""),
          displayId: "pending",
          patientNumber: "pending",
        },
        {
          clinicId: clinicId ?? null,
          agentId: currentAgentId,
          agentCode: currentAgentId ? partnerId : null,
          source: visitSource,
        }
      );

      await linkConsentLogsToPatient(input.consentLogIds, patient.id, tx);

      if (input.consentLogIds.length > 0) {
        await tx.consentLog.updateMany({
          where: { id: { in: input.consentLogIds } },
          data: {
            source: options.consentSource,
            staffId: options.digitizedBy ?? undefined,
            physicalLocation: input.staff?.physicalLocation ?? undefined,
            staffDeclaration: input.staff?.staffDeclaration ?? false,
            consentedAt: input.staff?.signatureDate
              ? new Date(input.staff.signatureDate)
              : undefined,
            signatureImageUrl: signaturePath,
          },
        });
      }

      return patient;
    });

    revalidatePath("/dashboard/patients");

    return { success: true as const, displayId: result.displayId, patientNumber: result.patientNumber };
  } catch (error) {
    console.error("Patient registration failed:", error);
    return { success: false as const, error: "Failed to register patient" };
  }
}

export async function submitPublicPatientRegistration(
  input: PatientRegistrationInput
) {
  return createPatientFromRegistration(input, {
    source: PatientSource.BOOKING,
    consentSource: ConsentSource.DIGITAL,
  });
}

export async function submitStaffPatientRegistration(
  input: PatientRegistrationInput
) {
  const session = await requireAuth();

  return createPatientFromRegistration(input, {
    source: PatientSource.WALKIN,
    consentSource: ConsentSource.PAPER,
    digitizedBy: session.user.id,
  });
}

export async function getPatientByIdDecrypted(id: string) {
  await requireAuth();

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      currentAgent: { select: { id: true, fullName: true, partnerId: true } },
      consentLogs: { orderBy: { consentedAt: "desc" } },
      surveys: { orderBy: { createdAt: "desc" } },
    },
  });

  return patient;
}
