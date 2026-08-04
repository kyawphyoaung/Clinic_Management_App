"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestReschedule } from "@/lib/actions/appointments";
import { WeekSlotPicker } from "@/components/appointments/week-slot-picker";
import {
  CLINIC,
  formatStableTaiwanDateTime,
} from "@/lib/book-i18n";

type Doctor = { id: string; fullName: string };

type Props = {
  token: string;
  doctors: Doctor[];
  current: {
    startsAt: string;
    doctorName: string;
    patientName: string;
    displayId: string;
    publicId?: string;
  };
};

export function RescheduleForm({ token, doctors, current }: Props) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slotMinutes, setSlotMinutes] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slotMinutes === "") {
      setError("Select a time slot");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await requestReschedule({
        token,
        doctorId,
        date,
        slotMinutes,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="w-full space-y-4 text-[#f0e6d0]">
        <h2 className="text-2xl font-semibold text-[#c9a84c]">
          Appointment Confirmed
        </h2>
        <p className="text-sm">
          Your appointment has been rescheduled.
        </p>
        <div className="space-y-1 text-sm">
          <p>{formatStableTaiwanDateTime(current.startsAt)} → new time saved</p>
          <p>{current.doctorName}</p>
          <p className="font-mono">{current.publicId ?? current.displayId}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-[#c9a84c]">{CLINIC.name}</p>
          <p>{CLINIC.address}</p>
          <iframe
            title="Clinic map"
            src={CLINIC.mapsEmbed}
            className="h-40 w-full rounded-md border border-[#c9a84c]/30"
            loading="lazy"
          />
          <p>
            Line:{" "}
            <a href={CLINIC.lineUrl} className="text-[#c9a84c]" target="_blank" rel="noreferrer">
              {CLINIC.lineUrl}
            </a>
          </p>
          <p>
            Email:{" "}
            <a href={`mailto:${CLINIC.email}`} className="text-[#c9a84c]">
              {CLINIC.email}
            </a>
          </p>
          <p>If you need to cancel, please contact us via email.</p>
          <p className="font-medium">Please arrive on time.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="mx-auto grid max-w-xl gap-4" onSubmit={handleSubmit}>
      <div className="rounded-md border border-[#c9a84c]/30 bg-[#0f0f1a]/50 p-3 text-sm text-[#f0e6d0]">
        <p className="font-medium">{current.patientName}</p>
        <p className="text-[#f0e6d0]/70">
          {current.publicId ?? current.displayId} · {current.doctorName}
        </p>
        <p className="mt-1" suppressHydrationWarning>
          Current: {formatStableTaiwanDateTime(current.startsAt)} (Taiwan)
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[#f0e6d0]">Doctor</Label>
        <select
          className="flex h-9 w-full rounded-md border border-[#c9a84c]/30 bg-[#0f0f1a] px-3 text-sm text-[#f0e6d0]"
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
        accent="gold"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={isPending}
        className="bg-[#c9a84c] text-[#0f0f1a] hover:bg-[#c9a84c]/90"
      >
        {isPending ? "Saving…" : "Confirm Schedule"}
      </Button>
    </form>
  );
}
