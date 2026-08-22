"use client";

import { useMemo, useState, useTransition } from "react";
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
  paidAmount?: number;
  serviceCategory?: string;
  isPaid?: boolean;
};

type PaymentFormProps = {
  treatmentId: string;
  charges: ChargeOption[];
  depositBalance: number;
  onPaymentRecorded?: (paymentId: string) => void;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  treatmentId,
  charges,
  depositBalance,
  onPaymentRecorded,
}: PaymentFormProps) {
  const unpaid = charges.filter((c) => !c.isPaid && remainingOf(c) > 0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(unpaid.map((c) => c.id));
  const [depositApplied, setDepositApplied] = useState(0);

  const selectedCharges = useMemo(
    () => unpaid.filter((c) => selected.includes(c.id)),
    [unpaid, selected]
  );
  const chargesTotal = selectedCharges.reduce((sum, c) => sum + remainingOf(c), 0);
  const cappedDeposit = Math.min(depositApplied, depositBalance, chargesTotal);
  const cashDue = Math.max(0, chargesTotal - cappedDeposit);

  function toggleCharge(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (selectedCharges.length === 0) {
      setError("Select at least one invoice");
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordPayment({
        treatmentId,
        amount: cashDue,
        depositAppliedAmount: cappedDeposit,
        method: String(formData.get("method")) as PaymentMethod,
        paymentDate: String(formData.get("paymentDate") ?? todayString()),
        reference: String(formData.get("reference") ?? ""),
        notes: String(formData.get("notes") ?? ""),
        allocations: selectedCharges.map((c) => ({
          chargeId: c.id,
          amount: remainingOf(c),
        })),
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
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Make New Payment</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Invoices to pay</Label>
                {unpaid.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unpaid invoices</p>
                ) : (
                  unpaid.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selected.includes(c.id)}
                        onChange={() => toggleCharge(c.id)}
                      />
                      <span>
                        {c.description} · {formatMoney(remainingOf(c))}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-sm">
                Selected total: {formatMoney(chargesTotal)}
              </p>
              <p className="text-sm text-muted-foreground">
                Deposit balance: {formatMoney(depositBalance)}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="depositApplied">Apply deposit</Label>
                <Input
                  id="depositApplied"
                  type="number"
                  min={0}
                  step="0.01"
                  value={depositApplied}
                  onChange={(e) => setDepositApplied(Number(e.target.value) || 0)}
                />
              </div>
              <p className="text-sm font-medium">
                Amount to pay: {formatMoney(cashDue)}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  name="method"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  defaultValue="CASH"
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
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || unpaid.length === 0}>
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function remainingOf(c: ChargeOption) {
  return Math.max(0, c.netPrice - (c.paidAmount ?? 0));
}
