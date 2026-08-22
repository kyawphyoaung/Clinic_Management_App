"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/partner/login");
      router.refresh();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [success, countdown, router]);

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
      setSuccess(true);
      setCountdown(5);
    });
  }

  if (success) {
    return (
      <div className="space-y-3">
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <AlertDescription className="font-medium text-emerald-700 dark:text-emerald-400">
            Password Updated Successfully
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Redirecting to Partner Login Page (
          {Array.from({ length: countdown }, (_, i) => countdown - i).join(", ")}
          ...)
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
        />
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
