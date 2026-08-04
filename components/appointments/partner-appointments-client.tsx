"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppointmentForAgent } from "@/lib/actions/appointments";
import { formatStableTaiwanDateTime } from "@/lib/book-i18n";
import { WeekSlotPicker } from "@/components/appointments/week-slot-picker";
import type { CalendarEvent } from "@/lib/utils/appointment-calendar";
import { toPatientFacingId } from "@/lib/utils/patient-id";

type Doctor = { id: string; fullName: string };
type Patient = { id: string; fullName: string; displayId: string };
type Service = { id: string; name: string };

type Props = {
  doctors: Doctor[];
  patients: Patient[];
  services: Service[];
  events: CalendarEvent[];
};

export function PartnerAppointmentsClient({
  doctors,
  patients,
  services,
  events,
}: Props) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [service, setService] = useState(services[0]?.name ?? "Consultation");
  const [notes, setNotes] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slotMinutes === "") {
      setError("Select a time slot");
      return;
    }
    if (!service) {
      setError("Select a service");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createAppointmentForAgent({
        patientId,
        doctorId,
        date,
        slotMinutes,
        service,
        notes,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(`Booked ${result.publicId}`);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <Button variant="outline" size="sm" render={<Link href="/partner/dashboard" />}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Book for referred patient</h2>
          {patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No referred patients yet.
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({toPatientFacingId(p.displayId)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Doctor</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setSlotMinutes("");
                  }}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Service</Label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setService(s.name)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        service === s.name
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <WeekSlotPicker
                doctorId={doctorId}
                date={date}
                slotMinutes={slotMinutes}
                onDateChange={setDate}
                onSlotChange={setSlotMinutes}
              />
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-emerald-700">{success}</p>}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Booking…" : "Book appointment"}
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Upcoming (agenda)</h2>
          <ul className="divide-y divide-border rounded-md border border-border">
            {events.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No upcoming appointments
              </li>
            ) : (
              events.map((ev) => (
                <li key={ev.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-muted-foreground" suppressHydrationWarning>
                    {formatStableTaiwanDateTime(ev.start)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
