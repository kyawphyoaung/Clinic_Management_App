"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updatePatientAssignment } from "@/lib/actions/patients";
import { Select } from "@/components/ui/select";
import type { PatientStatus } from "@/prisma/generated/prisma/enums";

type PatientActionBarProps = {
  patientId: string;
  currentStatus: PatientStatus;
  currentAgentId: string | null;
  agents: { id: string; fullName: string; partnerId: string | null }[];
  statusOptions: { value: PatientStatus; label: string }[];
};

export function PatientActionBar({
  patientId,
  currentStatus,
  currentAgentId,
  agents,
  statusOptions,
}: PatientActionBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function mutate(data: {
    clinicId?: string | null;
    status?: PatientStatus;
    agentId?: string | null;
  }) {
    startTransition(async () => {
      await updatePatientAssignment({ patientId, ...data });
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Change Status</p>
          <Select
            value={currentStatus}
            disabled={isPending}
            onChange={(e) => mutate({ status: e.target.value as PatientStatus })}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Assign Agent</p>
          <Select
            value={currentAgentId ?? ""}
            disabled={isPending}
            onChange={(e) => mutate({ agentId: e.target.value || null })}
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.fullName}
                {agent.partnerId ? ` (${agent.partnerId})` : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Saving changes...
        </div>
      )}
    </div>
  );
}
