/** Patient-facing ID: last 7 digits of internal displayId. */
export function toPatientFacingId(displayId: string): string {
  const digits = displayId.replace(/\D/g, "");
  if (digits.length >= 7) return digits.slice(-7);
  return digits.padStart(7, "0");
}
