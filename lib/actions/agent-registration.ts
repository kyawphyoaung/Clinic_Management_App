"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { linkConsentLogsToAgent } from "@/lib/actions/consent";
import { AGENT_REGISTRATION_FORM } from "@/lib/constants/agent_reg_form";
import { mapFormValuesToAgentData } from "@/lib/utils/config-driven-form";
import {
  ENCRYPTED_AGENT_FIELDS,
  encrypt,
  encryptFields,
} from "@/lib/utils/encryption";
import { uploadSignatureImage } from "@/lib/utils/supabase-storage";
import { buildServerRegistrationSchema } from "@/lib/validations/registration";
import { ConsentSource } from "@/prisma/generated/prisma/client";
import type { Prisma } from "@/prisma/generated/prisma/client";
import { getFirstZodError } from "@/lib/utils/zod";
import { configNameToPrismaKey } from "@/lib/utils/config-driven-form";

export type AgentRegistrationInput = {
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

function encryptAgentRecord(
  data: Record<string, unknown>
): Record<string, unknown> {
  const snakeData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    snakeData[snakeKey] = value;
  }

  const encrypted = encryptFields(snakeData, ENCRYPTED_AGENT_FIELDS);
  const result: Record<string, unknown> = { ...data };

  for (const field of ENCRYPTED_AGENT_FIELDS) {
    const camel = configNameToPrismaKey(field);
    if (encrypted[field] !== undefined) {
      result[camel] = encrypted[field];
    }
  }

  return result;
}

async function createAgentFromRegistration(
  input: AgentRegistrationInput,
  options: {
    consentSource: ConsentSource;
    staffId?: string;
  }
) {
  const schema = buildServerRegistrationSchema(AGENT_REGISTRATION_FORM);
  const parsed = schema.safeParse(input.values);

  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodError(parsed.error),
    };
  }

  try {
    const signaturePath = input.staff?.paperSignatureData
      ? await uploadSignatureImage(input.staff.paperSignatureData, "agent")
      : await uploadSignatureImage(input.signatureData, "agent");

    const mapped = mapFormValuesToAgentData(
      input.values,
      AGENT_REGISTRATION_FORM
    );

    const encryptedData = encryptAgentRecord({
      ...mapped,
      signatureImageUrl: encrypt(signaturePath),
      registrationLanguage: input.language,
      status: "PENDING",
    });

    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          ...(encryptedData as Prisma.AgentUncheckedCreateInput),
          fullName: String(input.values.full_name ?? ""),
          email: String(input.values.email ?? ""),
        },
      });

      await linkConsentLogsToAgent(input.consentLogIds, created.id, tx);

      if (input.consentLogIds.length > 0) {
        await tx.consentLog.updateMany({
          where: { id: { in: input.consentLogIds } },
          data: {
            source: options.consentSource,
            staffId: options.staffId ?? undefined,
            physicalLocation: input.staff?.physicalLocation ?? undefined,
            staffDeclaration: input.staff?.staffDeclaration ?? false,
            consentedAt: input.staff?.signatureDate
              ? new Date(input.staff.signatureDate)
              : undefined,
            signatureImageUrl: signaturePath,
          },
        });
      }

      return created;
    });

    return { success: true as const, agentId: agent.id };
  } catch (error) {
    console.error("Agent registration failed:", error);
    return { success: false as const, error: "Failed to submit application" };
  }
}

export async function submitAgentRegistration(input: AgentRegistrationInput) {
  return createAgentFromRegistration(input, {
    consentSource: ConsentSource.DIGITAL,
  });
}

export async function submitStaffAgentRegistration(input: AgentRegistrationInput) {
  const session = await requireAuth();
  return createAgentFromRegistration(input, {
    consentSource: ConsentSource.PAPER,
    staffId: session.user.id,
  });
}
