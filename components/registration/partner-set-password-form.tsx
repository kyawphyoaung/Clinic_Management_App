"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPartnerPassword } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PartnerSetPasswordFormProps = {
  token: string;
};

export function PartnerSetPasswordForm({ token }: PartnerSetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm_password") ?? "");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await setPartnerPassword(token, password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/partner/login");
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <Input id="confirm_password" name="confirm_password" type="password" required minLength={8} />
      </div>
      {error && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        Set Password
      </Button>
    </form>
  );
}
