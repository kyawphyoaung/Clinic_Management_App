"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { staffRescheduleAppointment } from "@/lib/actions/appointments";
import { WeekSlotPicker } from "@/components/appointments/week-slot-picker";

type Doctor = { id: string; fullName: string };

type Props = {
  appointmentId: string;
  doctors: Doctor[];
  initialDoctorId: string;
};

export function StaffReschedulePanel({
  appointmentId,
  doctors,
  initialDoctorId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [date, setDate] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Reschedule directly
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <h3 className="text-sm font-semibold">Staff reschedule</h3>
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
      <WeekSlotPicker
        doctorId={doctorId}
        date={date}
        slotMinutes={slotMinutes}
        onDateChange={setDate}
        onSlotChange={setSlotMinutes}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isPending || slotMinutes === "" || !date}
          onClick={() => {
            if (slotMinutes === "") return;
            setError(null);
            startTransition(async () => {
              const result = await staffRescheduleAppointment({
                appointmentId,
                doctorId,
                date,
                slotMinutes,
              });
              if (!result.success) {
                setError(result.error);
                return;
              }
              setOpen(false);
              router.refresh();
            });
          }}
        >
          {isPending ? "Saving…" : "Save new time"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
