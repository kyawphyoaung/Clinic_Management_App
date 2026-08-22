import type { Metadata } from "next";
import { listDepositReceivers } from "@/lib/actions/deposit-receivers";
import { DepositReceiversClient } from "@/components/admin/deposit-receivers-client";

export const metadata: Metadata = { title: "Deposit Receivers" };

export default async function DepositReceiversPage() {
  const receivers = await listDepositReceivers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deposit Receivers</h1>
        <p className="text-sm text-muted-foreground">
          People or accounts that hold patient deposits before they are transferred to the clinic.
        </p>
      </div>
      <DepositReceiversClient receivers={receivers} />
    </div>
  );
}
