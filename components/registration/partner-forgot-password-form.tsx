"use client";

import { useState, useTransition } from "react";
import { requestPartnerPasswordReset } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PartnerForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const partnerId = String(formData.get("partner_id") ?? "").trim();
    startTransition(async () => {
      const result = await requestPartnerPasswordReset(partnerId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const subject = encodeURIComponent("Reset your partner password");
      const body = encodeURIComponent(
        `Hello ${result.fullName},\n\nPartner ID: ${result.partnerId}\nReset your password here: ${window.location.origin}${result.resetPath}\n\nThis link expires in 24 hours.`
      );
      window.location.href = `mailto:${result.email}?subject=${subject}&body=${body}`;
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="partner_id">Partner ID</Label>
        <Input id="partner_id" name="partner_id" required />
      </div>
      {error && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        Generate Reset Link
      </Button>
    </form>
  );
}
