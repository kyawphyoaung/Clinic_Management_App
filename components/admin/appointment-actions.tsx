"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  cancelAppointment,
  markArrived,
  markNoShow,
  requestPatientReschedule,
} from "@/lib/actions/appointments";

type Props = {
  appointmentId: string;
  status: string;
  rescheduleToken?: string | null;
};

export function AppointmentActions({
  appointmentId,
  status,
  rescheduleToken,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(
    action: (
      id: string
    ) => Promise<{ success: boolean; error?: string; rescheduleToken?: string }>
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action(appointmentId);
      if (!result.success) {
        setError(result.error ?? "Action failed");
        return;
      }
      if (result.rescheduleToken) {
        setMessage("Patient reschedule requested");
      }
      router.refresh();
    });
  }

  const canArrive =
    status !== "ARRIVED" &&
    status !== "CANCELLED" &&
    status !== "NO_SHOW";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canArrive && (
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isPending}
            onClick={() => run(markArrived)}
          >
            Arrived
          </Button>
        )}
        {status !== "CANCELLED" && status !== "NO_SHOW" && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => run(cancelAppointment)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => run(requestPatientReschedule)}
            >
              Request Patient Reschedule
            </Button>
          </>
        )}
        {(status === "CONFIRMED" ||
          status === "RESCHEDULED" ||
          status === "WAITING_FOR_PATIENT_RESCHEDULE") && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(markNoShow)}
          >
            Mark No-Show
          </Button>
        )}
      </div>
      {message && <p className="mt-1 text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rescheduleToken && (
        <p className="text-xs text-muted-foreground">
          Reschedule token ready — copy the link from the detail card below.
        </p>
      )}
    </div>
  );
}
