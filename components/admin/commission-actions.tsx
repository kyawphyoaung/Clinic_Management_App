"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveCommission, markCommissionPaid } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

type CommissionActionsProps = {
  commissionId: string;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "PAID";
};

export function CommissionActions({
  commissionId,
  reviewStatus,
}: CommissionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (reviewStatus === "PAID") {
    return <span className="text-sm text-success">Paid</span>;
  }

  if (reviewStatus === "APPROVED") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await markCommissionPaid(commissionId);
            router.refresh();
          })
        }
      >
        Mark Paid
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await approveCommission(commissionId);
          router.refresh();
        })
      }
    >
      Approve
    </Button>
  );
}
