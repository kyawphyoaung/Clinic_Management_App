"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAppointmentForPatient } from "@/lib/actions/appointments";
import { WeekSlotPicker } from "@/components/appointments/week-slot-picker";
import { listActiveClinicServices } from "@/lib/actions/appointments";

type Doctor = { id: string; fullName: string };
type Patient = { id: string; fullName: string; displayId: string };

type Props = {
  doctors: Doctor[];
  patients: Patient[];
  services?: { id: string; name: string }[];
  defaultDate?: string;
  defaultSlotMinutes?: number;
  lockPatientId?: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AppointmentCreateModal({
  doctors,
  patients,
  services: servicesProp,
  defaultDate,
  defaultSlotMinutes,
  lockPatientId,
  onClose,
  onCreated,
}: Props) {
  const [patientId, setPatientId] = useState(
    lockPatientId ?? patients[0]?.id ?? ""
  );
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? "");
  const [service, setService] = useState("Consultation");
  const [services, setServices] = useState(servicesProp ?? []);
  const [notes, setNotes] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<number | "">(
    defaultSlotMinutes ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (servicesProp?.length) return;
    listActiveClinicServices()
      .then((rows) => {
        setServices(rows);
        if (rows[0]) setService(rows[0].name);
      })
      .catch(() => {});
  }, [servicesProp]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slotMinutes === "") {
      setError("Select a time slot");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createAppointmentForPatient({
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
      onCreated();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <h3 className="text-lg font-semibold">New Appointment</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Book a 30-minute slot (Taiwan time)
        </p>
        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="patientId">Patient</Label>
            <select
              id="patientId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              disabled={Boolean(lockPatientId)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.displayId.replace(/\D/g, "").slice(-5)})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doctorId">Doctor</Label>
            <select
              id="doctorId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setSlotMinutes("");
              }}
              required
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="service">Service</Label>
            {services.length > 0 ? (
              <select
                id="service"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              >
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              />
            )}
          </div>
          <WeekSlotPicker
            doctorId={doctorId}
            date={date}
            slotMinutes={slotMinutes}
            onDateChange={setDate}
            onSlotChange={setSlotMinutes}
          />
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Booking…" : "Book"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
