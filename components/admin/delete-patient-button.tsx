"use client";

import { useState, useTransition } from "react";
import { deletePatient } from "@/lib/actions/patients";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DeletePatientButtonProps = {
  patientId: string;
};

export function DeletePatientButton({ patientId }: DeletePatientButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    const first = window.confirm(
      "Are you sure you want to delete this patient and ALL related data?"
    );
    if (!first) return;

    const second = window.confirm(
      "This action is permanent. All treatment records, charges, and payments will be lost. Confirm delete?"
    );
    if (!second) return;

    startTransition(async () => {
      const result = await deletePatient(patientId);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <Alert className="border-warning/40 bg-warning/10">
        <AlertDescription className="text-sm text-foreground">
          This patient information should only be deleted if it was entered
          incorrectly or contains errors. For patients who are no longer receiving
          treatment, please change the status to{" "}
          <strong>Treatment Cancelled</strong> instead.
        </AlertDescription>
      </Alert>
      {error && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}
      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Deleting..." : "Delete this information"}
      </Button>
    </div>
  );
}
