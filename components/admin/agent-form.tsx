"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createAgentPlaceholder } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AgentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAgentPlaceholder({
        fullName: formData.get("name") as string,
        email: formData.get("email") as string,
        mobileNumber: (formData.get("phone") as string) || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="agent-name">Agent Name</Label>
        <Input id="agent-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agent-email">Email</Label>
        <Input id="agent-email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="agent-phone">Phone</Label>
        <Input id="agent-phone" name="phone" type="tel" />
      </div>
      {error && (
        <Alert className="border-destructive/50">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Add Agent
      </Button>
    </form>
  );
}
