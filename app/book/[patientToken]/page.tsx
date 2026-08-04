import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPatientByBookingToken,
  getUpcomingAppointmentForPatient,
  listDoctorsForBooking,
  listActiveClinicServices,
} from "@/lib/actions/appointments";
import { PublicBookingForm } from "@/components/appointments/public-booking-form";
import { CLINIC } from "@/lib/book-i18n";
import { toPatientFacingId } from "@/lib/utils/patient-id";

export const metadata: Metadata = {
  title: {
    absolute: "Book an Appointment",
  },
};

type PageProps = { params: Promise<{ patientToken: string }> };

export default async function PatientBookPage({ params }: PageProps) {
  const { patientToken } = await params;
  const [patient, doctors, services] = await Promise.all([
    getPatientByBookingToken(patientToken),
    listDoctorsForBooking(),
    listActiveClinicServices(),
  ]);
  if (!patient) notFound();

  const upcoming = await getUpcomingAppointmentForPatient(patient.id);

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-3 py-8 text-[#f0e6d0] sm:px-4 sm:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.25em] text-[#c9a84c] uppercase">
            {CLINIC.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Book an Appointment
          </h1>
          <p className="mt-2 text-sm text-[#f0e6d0]/70">
            Hello {patient.fullName}
          </p>
        </div>
        <div className="rounded-xl border border-[#c9a84c]/30 bg-[#16213e] p-4 shadow-lg sm:p-6">
          <PublicBookingForm
            doctors={doctors}
            services={services}
            mode="patient"
            patientToken={patientToken}
            prefill={{
              fullName: patient.fullName,
              gender: patient.gender,
              dateOfBirth: patient.dateOfBirth
                ? patient.dateOfBirth.toISOString().slice(0, 10)
                : null,
              email: patient.email,
            }}
            existingUpcoming={
              upcoming
                ? {
                    publicId: upcoming.publicId,
                    startsAt: upcoming.startsAt.toISOString(),
                    service: upcoming.service,
                    doctorName: upcoming.doctor.fullName,
                    patientName: patient.fullName,
                    patientFacingId: toPatientFacingId(patient.displayId),
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
