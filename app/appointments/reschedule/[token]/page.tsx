import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAppointmentByRescheduleToken,
  listDoctorsForBooking,
} from "@/lib/actions/appointments";
import { RescheduleForm } from "@/components/appointments/reschedule-form";
import { isWithin24Hours } from "@/lib/utils/taiwan-time";
import { CLINIC } from "@/lib/book-i18n";

export const metadata: Metadata = {
  title: {
    absolute: "Reschedule Appointment",
  },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function ReschedulePage({ params }: PageProps) {
  const { token } = await params;
  const [apt, doctors] = await Promise.all([
    getAppointmentByRescheduleToken(token),
    listDoctorsForBooking(),
  ]);
  if (!apt) notFound();

  const locked = isWithin24Hours(apt.startsAt);

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-4 py-12 text-[#f0e6d0]">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.25em] text-[#c9a84c] uppercase">
            {CLINIC.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Reschedule Appointment
          </h1>
          <p className="mt-2 text-sm text-[#f0e6d0]/70">
            Changes must be made at least 24 hours before the visit.
          </p>
        </div>
        <div className="rounded-xl border border-[#c9a84c]/30 bg-[#16213e] p-6 shadow-lg">
          {locked ? (
            <p className="text-sm text-red-400">
              Rescheduling is not allowed within 24 hours of the appointment.
              Please contact the clinic.
            </p>
          ) : (
            <RescheduleForm
              token={token}
              doctors={doctors.map((d) => ({ id: d.id, fullName: d.fullName }))}
              current={{
                startsAt: apt.startsAt.toISOString(),
                doctorName: apt.doctor.fullName,
                patientName: apt.patient?.fullName ?? "Patient",
                displayId: apt.displayId,
                publicId: apt.publicId,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
