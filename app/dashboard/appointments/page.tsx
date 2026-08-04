import type { Metadata } from "next";
import {
  getCalendarAppointments,
  listDoctorsForBooking,
  listPatientsForBooking,
} from "@/lib/actions/appointments";
import { AppointmentsCalendar } from "@/components/admin/appointments-calendar";
import { appointmentToEvent } from "@/lib/utils/appointment-calendar";
import { toTaiwanDateString, addDaysToTaiwanDate } from "@/lib/utils/taiwan-time";
import { CopyRegistrationLinkButton } from "@/components/admin/copy-registration-link-button";
import { AppointmentQrScanner } from "@/components/admin/appointment-qr-scanner";

export const metadata: Metadata = {
  title: "Appointments",
};

export default async function AppointmentsPage() {
  const today = toTaiwanDateString(new Date());
  const from = addDaysToTaiwanDate(today, -45);
  const to = addDaysToTaiwanDate(today, 90);

  const [apts, doctors, patients] = await Promise.all([
    getCalendarAppointments(
      `${from}T00:00:00+08:00`,
      `${to}T23:59:59+08:00`
    ),
    listDoctorsForBooking(),
    listPatientsForBooking(),
  ]);

  const events = apts.map(appointmentToEvent);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Interactive calendar · Asia/Taipei · 30-minute slots
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AppointmentQrScanner />
          <CopyRegistrationLinkButton
            path="/book"
            label="Copy Booking Link"
            successMessage="Booking link copied to clipboard!"
          />
        </div>
      </div>
      <AppointmentsCalendar
        initialEvents={events}
        doctors={doctors.map((d) => ({ id: d.id, fullName: d.fullName }))}
        patients={patients}
      />
    </div>
  );
}
