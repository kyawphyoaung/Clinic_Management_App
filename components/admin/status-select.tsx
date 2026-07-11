"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updatePatientStatus } from "@/lib/actions/patients";
import { Select } from "@/components/ui/select";
import type { PatientStatus } from "@/prisma/generated/prisma/enums";

type StatusSelectProps = {
  patientId: string;
  currentStatus: PatientStatus;
  options: { value: PatientStatus; label: string }[];
};

export function StatusSelect({
  patientId,
  currentStatus,
  options,
}: StatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as PatientStatus;
    startTransition(async () => {
      await updatePatientStatus(patientId, status);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="w-40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {isPending && (
        <Loader2 className="absolute right-8 top-2 size-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
