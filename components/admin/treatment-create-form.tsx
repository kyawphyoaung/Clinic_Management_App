"use client";

import { useTransition } from "react";
import { createTreatment } from "@/lib/actions/treatments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DoctorOption = { id: string; fullName: string };

type TreatmentCreateFormProps = {
  patientId: string;
  doctors: DoctorOption[];
  visits: { id: string; displayId: string }[];
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function TreatmentCreateForm({ patientId, doctors, visits }: TreatmentCreateFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createTreatment({
        patientId,
        visitId: String(formData.get("visitId") ?? ""),
        treatmentDate: String(formData.get("treatmentDate") ?? todayString()),
        diagnosis: String(formData.get("diagnosis") ?? ""),
        doctorId: String(formData.get("doctorId") ?? "") || null,
        notes: String(formData.get("notes") ?? ""),
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create Treatment</CardTitle>
        <CardDescription>Start a new treatment record for this patient</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="visitId">Visit</Label>
            <select
              id="visitId"
              name="visitId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              defaultValue={visits[0]?.id ?? ""}
            >
              {visits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.displayId}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="treatmentDate">Treatment Date</Label>
            <Input
              id="treatmentDate"
              name="treatmentDate"
              type="date"
              defaultValue={todayString()}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doctorId">Assigned Doctor</Label>
            <select
              id="doctorId"
              name="doctorId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              defaultValue=""
            >
              <option value="">— None —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="diagnosis">Diagnosis (optional)</Label>
            <Input id="diagnosis" name="diagnosis" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Treatment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
