"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { createTreatment } from "@/lib/actions/treatments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DoctorOption = { id: string; fullName: string };

type TreatmentCreateModalProps = {
  patientId: string;
  doctors: DoctorOption[];
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function TreatmentCreateModal({ patientId, doctors }: TreatmentCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createTreatment({
        patientId,
        treatmentDate: String(formData.get("treatmentDate") ?? todayString()),
        diagnosis: String(formData.get("diagnosis") ?? ""),
        doctorId: String(formData.get("doctorId") ?? "") || null,
        notes: String(formData.get("notes") ?? ""),
      });
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Create Treatment
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Create Treatment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a new treatment record for this patient
            </p>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
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
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis">Diagnosis (optional)</Label>
                <Input id="diagnosis" name="diagnosis" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Treatment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
