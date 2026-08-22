"use client";

import { useState, useTransition } from "react";
import { requestPartnerPasswordReset } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PartnerForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await requestPartnerPasswordReset({
        email: String(formData.get("email") ?? ""),
        dateOfBirth: String(formData.get("date_of_birth") ?? ""),
      });
      setMessage(
        "If the email and date of birth match our records, a reset link has been sent."
      );
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input id="date_of_birth" name="date_of_birth" type="date" required />
      </div>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        Send Reset Link
      </Button>
    </form>
  );
}
