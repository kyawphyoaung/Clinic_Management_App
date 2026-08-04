"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAgent, rejectAgent } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

type AgentApprovalActionsProps = {
  agentId: string;
};

export function AgentApprovalActions({ agentId }: AgentApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAgent(agentId);
      if (!result.success) return;
      const subject = encodeURIComponent("Set your partner password");
      const body = encodeURIComponent(
        `Hello ${result.fullName},\n\nYour Partner ID: ${result.partnerId}\nPlease set your password here: ${window.location.origin}${result.setPasswordPath}\n\nThis link expires in 24 hours.`
      );
      window.location.href = `mailto:${result.email}?subject=${subject}&body=${body}`;
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectAgent(agentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        className="bg-green-600 hover:bg-green-500"
        disabled={isPending}
        onClick={handleApprove}
      >
        Approve
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={handleReject}
      >
        Reject
      </Button>
    </div>
  );
}
