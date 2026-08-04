"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClinic } from "@/lib/actions/clinics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ClinicCreateForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createClinic(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor="name">Clinic Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="code">Clinic ID</Label>
        <Input id="code" name="code" required pattern="\d{2}" maxLength={2} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending}>
          Create Clinic
        </Button>
      </div>
      {error && (
        <div className="sm:col-span-3">
          <Alert className="border-destructive/50">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </form>
  );
}
