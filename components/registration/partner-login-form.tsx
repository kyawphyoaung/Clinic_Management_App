"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginPartner } from "@/lib/actions/partner-auth";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PartnerLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginPartner(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Partner Login</CardTitle>
        <CardDescription>
          Use your Partner ID and password to access your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="partner_id">Partner ID</Label>
            <Input id="partner_id" name="partner_id" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && (
            <Alert className="border-destructive/50">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <a className="underline" href="/partner/forgot-password">
              Forgot password?
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
