/** Taiwan (Asia/Taipei, UTC+8, no DST) helpers for appointments. */

export const TAIWAN_TZ = "Asia/Taipei";
export const SLOT_MINUTES = 30;
export const TAIWAN_UTC_OFFSET = "+08:00";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a Date as YYYY-MM-DD in Taiwan calendar. */
export function toTaiwanDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIWAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Minutes from midnight in Taiwan for a given instant. */
export function toTaiwanMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TAIWAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // en-GB may use "24" for midnight; normalize
  const h = hour === 24 ? 0 : hour;
  return h * 60 + minute;
}

/** Day of week in Taiwan: 0=Sunday … 6=Saturday. */
export function toTaiwanDayOfWeek(date: Date): number {
  // Create a date that reflects Taiwan's calendar day, then use UTC day
  const ymd = toTaiwanDateString(date);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Convert Taiwan local date + minutes-from-midnight to a UTC Date. */
export function taiwanLocalToUtc(
  dateStr: string,
  minutesFromMidnight: number
): Date {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  return new Date(
    `${dateStr}T${pad2(hours)}:${pad2(mins)}:00${TAIWAN_UTC_OFFSET}`
  );
}

/** Format for display in Taiwan timezone. */
export function formatTaiwanDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TAIWAN_TZ,
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(date);
}

export function formatTaiwanTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TAIWAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function minutesToTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/** True if now is within 24 hours before startsAt (Taiwan-aware via absolute time). */
export function isWithin24Hours(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
}

export function addDaysToTaiwanDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}
