"use client";

import { useState, useTransition } from "react";
import { requestAdminAgentPasswordReset } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

export function AgentPasswordResetButton({ agentId }: { agentId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result: any = await requestAdminAgentPasswordReset(agentId);
            if (!result.success) {
              setMessage(result.error);
              return;
            }
            const link = result.resetUrl ?? result.resetPath;
            try {
              await navigator.clipboard.writeText(link);
              setMessage("Password reset link copied");
            } catch {
              setMessage(`Copy failed. Use this link: ${link}`);
            }
          });
        }}
      >
        Copy password reset link
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
