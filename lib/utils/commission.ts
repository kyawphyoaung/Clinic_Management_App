export const COMMISSION_CURRENCY = "NTD";

export function toPeriodMonth(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthBounds(periodMonth: string) {
  const [year, month] = periodMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function formatMonthLabel(periodMonth: string) {
  const [y, m] = periodMonth.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Billing ID: MMYY-{partnerId} e.g. May 2026 + ZA1W → 0526-ZA1W */
export function toBillingId(periodMonth: string, partnerId: string): string {
  const [year, month] = periodMonth.split("-");
  const mmyy = `${month}${year.slice(-2)}`;
  return `${mmyy}-${partnerId}`;
}

export function parseBillingId(
  billingId: string
): { periodMonth: string; partnerId: string } | null {
  const trimmed = billingId.trim().toUpperCase();
  const match = /^(\d{2})(\d{2})-(.+)$/.exec(trimmed);
  if (!match) return null;
  const [, mm, yy, partnerId] = match;
  const month = Number(mm);
  if (month < 1 || month > 12 || !partnerId) return null;
  const year = 2000 + Number(yy);
  return {
    periodMonth: `${year}-${mm}`,
    partnerId,
  };
}
