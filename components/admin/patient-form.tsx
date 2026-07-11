"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createPatient } from "@/lib/actions/patients";
import { parsePatientFormData } from "@/lib/utils/parse-patient-form";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AgentOption = { id: string; name: string };

type PatientFormProps = {
  agents: AgentOption[];
};

export function PatientForm({ agents }: PatientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<PatientSource>(PatientSource.WALKIN);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createPatient(parsePatientFormData(formData));

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/dashboard/patients/${result.patientId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name (Trilingual supported)</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g. John Doe / ကျော်မြောက် / 张三"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" min={1} max={150} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gender">Gender</Label>
        <Select id="gender" name="gender" defaultValue="">
          <option value="">Not specified</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Select
            id="source"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value as PatientSource)}
          >
            <option value={PatientSource.WALKIN}>Walk-in</option>
            <option value={PatientSource.BOOKING}>Booking</option>
            <option value={PatientSource.AGENT}>Agent Referral</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={PatientStatus.PENDING}>
            <option value={PatientStatus.PENDING}>Pending</option>
            <option value={PatientStatus.APPOINTED}>Appointed</option>
            <option value={PatientStatus.TREATING}>Treating</option>
            <option value={PatientStatus.COMPLETED}>Completed</option>
          </Select>
        </div>
      </div>

      {source === PatientSource.AGENT && (
        <div className="space-y-1.5">
          <Label htmlFor="agentId">Linked Agent</Label>
          <Select id="agentId" name="agentId" defaultValue="">
            <option value="">Select agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Register Patient
      </Button>
    </form>
  );
}
