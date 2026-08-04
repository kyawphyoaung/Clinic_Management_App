"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markCommissionPaid } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

type CommissionPaidButtonProps = {
  commissionId: string;
};

export function CommissionPaidButton({ commissionId }: CommissionPaidButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
