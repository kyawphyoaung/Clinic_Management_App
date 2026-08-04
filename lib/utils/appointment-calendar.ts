export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  url?: string;
  backgroundColor?: string;
  borderColor?: string;
  doctorId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#d97706",
  CONFIRMED: "#059669",
  RESCHEDULED: "#2563eb",
  NO_SHOW: "#dc2626",
  WAITING_FOR_PATIENT_RESCHEDULE: "#a855f7",
  CANCELLED: "#64748b",
};

export function appointmentToEvent(apt: {
  id: string;
  status: string;
  service: string;
  startsAt: Date | string;
  endsAt: Date | string;
  patient?: { fullName: string } | null;
  doctor?: { id?: string; fullName: string } | null;
  doctorId?: string;
  publicId?: string;
}): CalendarEvent {
  const color = STATUS_COLORS[apt.status] ?? "#64748b";
  const name = apt.patient?.fullName ?? "Walk-in";
  const idLabel = apt.publicId ? ` · ${apt.publicId}` : "";
  return {
    id: apt.id,
    title: `${name}${idLabel} · ${apt.service}`,
    start:
      typeof apt.startsAt === "string"
        ? apt.startsAt
        : apt.startsAt.toISOString(),
    end:
      typeof apt.endsAt === "string" ? apt.endsAt : apt.endsAt.toISOString(),
    backgroundColor: color,
    borderColor: color,
    doctorId: apt.doctorId ?? apt.doctor?.id,
  };
}
