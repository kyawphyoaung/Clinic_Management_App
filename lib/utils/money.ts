/** Format monetary amounts as NT$ with thousands separators. */
export function formatMoney(
  amount: number | string | { toString(): string } | null | undefined
): string {
  const n = Number(amount ?? 0);
  if (Number.isNaN(n)) return "NT$ 0.00";
  return `NT$ ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
