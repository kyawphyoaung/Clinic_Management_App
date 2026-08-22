import type { Prisma } from "@/prisma/generated/prisma/client";

const DEFAULT_CLINIC_CODE = "00";
const WALKIN_AGENT_CODE = "0000";

export function formatDisplayIdPrefix(
  clinicCode?: string | null,
  agentCode?: string | null
): string {
  const clinic = (clinicCode ?? DEFAULT_CLINIC_CODE).padStart(2, "0").slice(-2);
  const agent = agentCode
    ? agentCode.toUpperCase().padStart(4, "0").slice(0, 4)
    : WALKIN_AGENT_CODE;
  return `${clinic}-${agent}`;
}

export function formatSequenceSuffix(year: number, sequence: number): string {
  const yy = String(year).slice(-2);
  const seq = String(sequence).padStart(4, "0");
  return `${yy}${seq}`;
}

export function formatVisitDateSuffix(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function buildPatientNumber(year: number, sequence: number): string {
  return formatSequenceSuffix(year, sequence);
}

export function buildVisitDisplayId(
  clinicCode: string | null | undefined,
  agentCode: string | null | undefined,
  patientNumber: string,
  visitDate: Date
): string {
  return `${formatDisplayIdPrefix(clinicCode, agentCode)}-${patientNumber}-${formatVisitDateSuffix(visitDate)}`;
}

/** Legacy patient display ID (kept for older records). */
export function buildDisplayId(
  clinicCode: string | null | undefined,
  agentCode: string | null | undefined,
  year: number,
  sequence: number
): string {
  return `${formatDisplayIdPrefix(clinicCode, agentCode)}-${formatSequenceSuffix(year, sequence)}`;
}

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

export async function allocatePatientNumber(
  tx: Prisma.TransactionClient,
  year?: number
): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const sequence = await allocateYearlySequence(tx, y);
  return buildPatientNumber(y, sequence);
}

export async function allocateShortId(
  tx: Prisma.TransactionClient,
  key: "treat" | "chg" | "doctor",
  prefix: string
): Promise<string> {
  const row = await tx.sequenceCounter.upsert({
    where: { key },
    create: { key, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return `${prefix}${String(row.lastSeq).padStart(3, "0")}`;
}

/** Invoice IDs: #000001 … #999999, then #1000000, #1000001, … */
export function formatInvoiceId(sequence: number): string {
  if (sequence <= 999999) return `#${String(sequence).padStart(6, "0")}`;
  return `#${sequence}`;
}

export async function allocateInvoiceId(
  tx: Prisma.TransactionClient
): Promise<string> {
  const row = await tx.sequenceCounter.upsert({
    where: { key: "chg" },
    create: { key: "chg", lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return formatInvoiceId(row.lastSeq);
}

/** Preview next invoice ID without consuming the sequence. */
export async function peekNextInvoiceId(
  client: { sequenceCounter: { findUnique: (args: { where: { key: string } }) => Promise<{ lastSeq: number } | null> } }
): Promise<string> {
  const row = await client.sequenceCounter.findUnique({ where: { key: "chg" } });
  const next = (row?.lastSeq ?? 0) + 1;
  return formatInvoiceId(next);
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
