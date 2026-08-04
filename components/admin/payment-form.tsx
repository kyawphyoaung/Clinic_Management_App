"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { recordPayment } from "@/lib/actions/treatments";
import type { PaymentMethod } from "@/prisma/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils/money";

type ChargeOption = {
  id: string;
  description: string;
  netPrice: number;
  serviceCategory?: string;
  isPaid?: boolean;
};

type PaymentFormProps = {
  treatmentId: string;
  charges: ChargeOption[];
  onPaymentRecorded?: (paymentId: string) => void;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  treatmentId,
  charges,
  onPaymentRecorded,
}: PaymentFormProps) {
  const unpaid = charges.filter((c) => !c.isPaid && c.netPrice > 0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [chargeId, setChargeId] = useState(unpaid[0]?.id ?? "");

  const selected = unpaid.find((c) => c.id === chargeId) ?? unpaid[0];
  const amount = selected?.netPrice ?? 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Select a charge");
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordPayment({
        treatmentId,
        amount: selected.netPrice,
        method: String(formData.get("method")) as PaymentMethod,
        paymentDate: String(formData.get("paymentDate") ?? todayString()),
        reference: String(formData.get("reference") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        allocations: [{ chargeId: selected.id, amount: selected.netPrice }],
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result.paymentId && onPaymentRecorded) {
        onPaymentRecorded(result.paymentId);
      }
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Make New Payment
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Make New Payment</h3>
            {unpaid.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No unpaid charges with remaining net price.
              </p>
            ) : (
              <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label>Charge</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={chargeId || unpaid[0]?.id}
                    onChange={(e) => setChargeId(e.target.value)}
                    required
                  >
                    {unpaid.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.serviceCategory ?? c.description} —{" "}
                        {formatMoney(c.netPrice)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Amount</Label>
                  <Input value={amount.toFixed(2)} readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="method">Payment Method</Label>
                  <select
                    id="method"
                    name="method"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    defaultValue="CASH"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="paymentDate">Date</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    defaultValue={todayString()}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" name="reference" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>
                {error && (
                  <Alert className="border-destructive/50">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Recording…" : "Record Payment"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
