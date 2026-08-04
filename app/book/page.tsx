import type { Metadata } from "next";
import {
  listDoctorsForBooking,
  listActiveClinicServices,
} from "@/lib/actions/appointments";
import { PublicBookingForm } from "@/components/appointments/public-booking-form";
import { CLINIC } from "@/lib/book-i18n";

export const metadata: Metadata = {
  title: {
    absolute: "Book an Appointment",
  },
};

export default async function PublicBookPage() {
  const [doctors, services] = await Promise.all([
    listDoctorsForBooking(),
    listActiveClinicServices(),
  ]);

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-3 py-8 text-[#f0e6d0] sm:px-4 sm:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.25em] text-[#c9a84c] uppercase">
            {CLINIC.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0e6d0] sm:text-3xl">
            Book an Appointment
          </h1>
          <p className="mt-2 text-sm text-[#f0e6d0]/70">
            Taiwan time (UTC+8) · 30-minute slots
          </p>
        </div>
        <div className="rounded-xl border border-[#c9a84c]/30 bg-[#16213e] p-4 shadow-lg sm:p-6">
          <PublicBookingForm
            doctors={doctors}
            services={services}
            mode="public"
          />
        </div>
      </div>
    </div>
  );
}
