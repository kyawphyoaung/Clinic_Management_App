"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addCharge } from "@/lib/actions/treatments";
import type { ServiceCategory } from "@/prisma/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney } from "@/lib/utils/money";

const SERVICE_CATEGORIES: ServiceCategory[] = [
  "CONSULTATION",
  "SURGERY",
  "MEDICATION",
  "LAB",
  "IMAGING",
  "ACCOMMODATION",
  "OTHER",
];

type DraftLine = {
  key: string;
  serviceCategory: ServiceCategory;
  notes: string;
  quantity: number;
  unitPrice: number;
};

type ChargeFormProps = {
  treatmentId: string;
  depositBalance: number;
};

export function ChargeForm({ treatmentId, depositBalance }: ChargeFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [category, setCategory] = useState<ServiceCategory>("CONSULTATION");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [depositInput, setDepositInput] = useState("");
  const [depositApplied, setDepositApplied] = useState(0);

  const totalPrice = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0
  );
  const netPrice = Math.max(0, totalPrice - depositApplied);

  function resetDraft() {
    setCategory("CONSULTATION");
    setNotes("");
    setQuantity(1);
    setUnitPrice(0);
  }

  function addLine() {
    if (quantity < 1 || unitPrice < 0) return;
    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        serviceCategory: category,
        notes,
        quantity,
        unitPrice,
      },
    ]);
    resetDraft();
  }

  function applyDeposit(amount: number) {
    const capped = Math.min(Math.max(0, amount), depositBalance, totalPrice);
    setDepositApplied(capped);
    setDepositInput(String(capped));
  }

  function close() {
    setOpen(false);
    setLines([]);
    setDepositApplied(0);
    setDepositInput("");
    setError(null);
    resetDraft();
  }

  function handleSubmit() {
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one line item");
      return;
    }
    startTransition(async () => {
      const result = await addCharge({
        treatmentId,
        depositApplied,
        discount: 0,
        lineItems: lines.map((l) => ({
          serviceCategory: l.serviceCategory,
          notes: l.notes || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Add Charge
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={close}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Add Charge</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Service Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ServiceCategory)
                  }
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  Add Line
                </Button>
              </div>
            </div>

            {lines.length > 0 && (
              <ul className="mt-4 divide-y divide-border rounded-md border border-border text-sm">
                {lines.map((l) => (
                  <li
                    key={l.key}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>
                      {l.serviceCategory}
                      {l.notes ? ` · ${l.notes}` : ""} · qty {l.quantity} ·{" "}
                      {formatMoney(l.unitPrice)}
                    </span>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        setLines((prev) => prev.filter((x) => x.key !== l.key))
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2 rounded-md border border-border p-3">
              <p className="text-sm font-medium">
                Total: {formatMoney(totalPrice)}
              </p>
              <p className="text-sm font-medium">
                Deposit Balance: {formatMoney(depositBalance)}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-32"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyDeposit(Number(depositInput) || 0)}
                >
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    applyDeposit(Math.min(depositBalance, totalPrice))
                  }
                >
                  Apply All
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied: {formatMoney(depositApplied)} · Net:{" "}
                {formatMoney(netPrice)}
              </p>
            </div>

            {error && (
              <Alert className="mt-3 border-destructive/50">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending || lines.length === 0}
                onClick={handleSubmit}
              >
                {isPending ? "Adding…" : "Add Charge"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
