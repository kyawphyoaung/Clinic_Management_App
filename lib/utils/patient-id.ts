/** Patient-facing 6-digit ID. Prefer `patientNumber` when available. */
export function toPatientFacingId(
  patientNumberOrDisplayId: string | null | undefined
): string {
  if (!patientNumberOrDisplayId) return "";
  if (/^\d{6}$/.test(patientNumberOrDisplayId)) return patientNumberOrDisplayId;
  const digits = patientNumberOrDisplayId.replace(/\D/g, "");
  if (digits.length >= 6) return digits.slice(-6);
  return digits.padStart(6, "0");
}
