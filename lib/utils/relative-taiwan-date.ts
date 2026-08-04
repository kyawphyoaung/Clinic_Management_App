import { toTaiwanDateString, addDaysToTaiwanDate } from "@/lib/utils/taiwan-time";

/** Relative label for appointment startsAt vs now (Taiwan calendar days). */
export function relativeTaiwanAppointmentLabel(
  startsAt: Date,
  now = new Date()
): string {
  const startDay = toTaiwanDateString(startsAt);
  const today = toTaiwanDateString(now);
  const yesterday = addDaysToTaiwanDate(today, -1);
  const tomorrow = addDaysToTaiwanDate(today, 1);

  if (startDay === today) return "Today";
  if (startDay === yesterday) return "Yesterday";
  if (startDay === tomorrow) return "Tomorrow";

  const [ty, tm, td] = today.split("-").map(Number);
  const [sy, sm, sd] = startDay.split("-").map(Number);
  const todayUtc = Date.UTC(ty!, tm! - 1, td!);
  const startUtc = Date.UTC(sy!, sm! - 1, sd!);
  const diffDays = Math.round((startUtc - todayUtc) / (24 * 60 * 60 * 1000));

  if (diffDays >= 2 && diffDays <= 7) return "Next Week";
  if (diffDays >= 8 && diffDays <= 14) return "Next 2 Weeks";
  if (diffDays >= 15 && diffDays <= 21) return "Next 3 Weeks";
  if (diffDays >= 22 && diffDays <= 45) return "Next Month";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    dateStyle: "medium",
  }).format(startsAt);
}
