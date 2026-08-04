/**
 * Google Calendar integration placeholder (read-only busy slots).
 *
 * TODO: Implement OAuth + Calendar API freebusy query for real doctor calendars.
 * Until then, return demo busy intervals so the booking picker can merge them.
 */

import { taiwanLocalToUtc, toTaiwanDayOfWeek } from "@/lib/utils/taiwan-time";

export type BusyInterval = {
  startMinutes: number;
  endMinutes: number;
  label?: string;
};

/**
 * Demo busy slots for a Taiwan calendar day (minutes from midnight).
 * Always-on demo until live Google Calendar sync ships.
 */
export async function getDoctorBusySlots(
  doctorId: string,
  dateStr: string
): Promise<BusyInterval[]> {
  void doctorId;
  const day = toTaiwanDayOfWeek(taiwanLocalToUtc(dateStr, 12 * 60));
  if (day === 0 || day === 6) {
    return [
      { startMinutes: 11 * 60, endMinutes: 11 * 60 + 30, label: "GCal demo" },
    ];
  }
  return [
    { startMinutes: 12 * 60, endMinutes: 13 * 60, label: "GCal demo lunch" },
    { startMinutes: 15 * 60, endMinutes: 15 * 60 + 30, label: "GCal demo" },
  ];
}

/**
 * Placeholder for a future dashboard filter toggle:
 * "Hide slots busy on Google Calendar" on /dashboard/appointments.
 * Do not wire live Google API here.
 */
export const GOOGLE_CALENDAR_FILTER_PLACEHOLDER = false;
