import type { Prisma } from "@/prisma/generated/prisma/client";

const DEFAULT_CLINIC_CODE = "00";
const DEFAULT_AGENT_CODE = "000";

export function formatDisplayIdPrefix(
  clinicCode?: string | null,
  agentCode?: string | null
): string {
  const clinic = clinicCode?.padStart(2, "0") ?? DEFAULT_CLINIC_CODE;
  const agent = agentCode?.toUpperCase().padStart(4, "0").slice(0, 4) ?? DEFAULT_AGENT_CODE;
  return `${clinic}-${agent}`;
}

export function formatSequenceSuffix(year: number, sequence: number): string {
  const yy = String(year).slice(-2);
  const seq = String(sequence).padStart(5, "0");
  return `${yy}${seq}`;
}

export function buildDisplayId(
  clinicCode: string | null | undefined,
  agentCode: string | null | undefined,
  year: number,
  sequence: number
): string {
  return `${formatDisplayIdPrefix(clinicCode, agentCode)}-${formatSequenceSuffix(year, sequence)}`;
}

/** Extract YYnnnnn suffix from an existing display ID. */
export function extractSequenceSuffix(displayId: string): string | null {
  const parts = displayId.split("-");
  if (parts.length < 3) return null;
  return parts.slice(2).join("-");
}

export async function allocateYearlySequence(
  tx: Prisma.TransactionClient,
  year: number
): Promise<number> {
  const row = await tx.yearlyPatientSequence.upsert({
    where: { year },
    create: { year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  return row.lastSeq;
}

export async function generateDisplayId(
  tx: Prisma.TransactionClient,
  options?: {
    clinicCode?: string | null;
    agentCode?: string | null;
    year?: number;
  }
): Promise<string> {
  const year = options?.year ?? new Date().getFullYear();
  const sequence = await allocateYearlySequence(tx, year);
  return buildDisplayId(options?.clinicCode, options?.agentCode, year, sequence);
}

export function recomputeDisplayId(
  currentDisplayId: string,
  clinicCode?: string | null,
  agentCode?: string | null
): string {
  const suffix = extractSequenceSuffix(currentDisplayId);
  if (!suffix) {
    const year = new Date().getFullYear();
    return buildDisplayId(clinicCode, agentCode, year, 1);
  }

  return `${formatDisplayIdPrefix(clinicCode, agentCode)}-${suffix}`;
}
