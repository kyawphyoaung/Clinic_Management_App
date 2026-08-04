"use server";

import { headers } from "next/headers";
import type { Prisma } from "@/prisma/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseAgreementFilePath } from "@/lib/utils/agreement-files";
import { ConsentSource } from "@/prisma/generated/prisma/client";

export type RecordAgreementConsentInput = {
  documentPath: string;
  source: "DIGITAL" | "PAPER";
  consentedAt: string;
  signatureImageUrl?: string;
  formType: "patient" | "agent";
  staffId?: string;
  physicalLocation?: string;
  staffDeclaration?: boolean;
};

export async function recordAgreementConsent(input: RecordAgreementConsentInput) {
  const parsed = parseAgreementFilePath(input.documentPath);
  const headerStore = await headers();

  try {
    const consentLog = await prisma.consentLog.create({
      data: {
        patientId: null,
        agentId: null,
        documentType: parsed.documentType,
        version: parsed.version,
        source: input.source as ConsentSource,
        consentedAt: new Date(input.consentedAt),
        ipAddress:
          headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headerStore.get("x-real-ip") ??
          null,
        userAgent: headerStore.get("user-agent"),
        staffId: input.staffId ?? null,
        physicalLocation: input.physicalLocation ?? null,
        signatureImageUrl: input.signatureImageUrl ?? null,
        staffDeclaration: input.staffDeclaration ?? false,
      },
    });

    return { success: true as const, consentLogId: consentLog.id };
  } catch {
    return { success: false as const, error: "Failed to record consent" };
  }
}

export async function linkConsentLogsToPatient(
  consentLogIds: string[],
  patientId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  if (consentLogIds.length === 0) return;

  await client.consentLog.updateMany({
    where: { id: { in: consentLogIds } },
    data: { patientId },
  });
}

export async function linkConsentLogsToAgent(
  consentLogIds: string[],
  agentId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  if (consentLogIds.length === 0) return;

  await client.consentLog.updateMany({
    where: { id: { in: consentLogIds } },
    data: { agentId },
  });
}

export async function getPatientConsentLogs(patientId: string) {
  return prisma.consentLog.findMany({
    where: { patientId },
    orderBy: { consentedAt: "desc" },
  });
}
