"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addCharge, updateCharge } from "@/lib/actions/treatments";
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
  defaultAgentRelated?: boolean;
  mode?: "create" | "edit";
  chargeId?: string;
  initialLines?: DraftLine[];
  initialIsAgentRelated?: boolean;
  triggerLabel?: string;
  onSaved?: () => void;
};

export function ChargeForm({
  treatmentId,
  defaultAgentRelated = false,
  mode = "create",
  chargeId,
  initialLines = [],
  initialIsAgentRelated,
  triggerLabel,
  onSaved,
}: ChargeFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<DraftLine[]>(initialLines);
  const [category, setCategory] = useState<ServiceCategory>("CONSULTATION");
  const [notes, setNotes] = useState("");
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceText, setPriceText] = useState("");
  const [isAgentRelated, setIsAgentRelated] = useState(
    initialIsAgentRelated ?? defaultAgentRelated
  );

  const totalPrice = lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0
  );

  function resetDraft() {
    setCategory("CONSULTATION");
    setNotes("");
    setCustomName("");
    setQuantity(1);
    setPriceText("");
  }

  function addLine() {
    if (!priceText.trim()) {
      window.alert("Please enter a price before adding the line.");
      return;
    }
    const unitPrice = Number(priceText);
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      window.alert("Please enter a valid price.");
      return;
    }
    if (quantity < 1) return;
    if (category === "OTHER" && !customName.trim() && !notes.trim()) {
      window.alert("Please enter a custom name for OTHER.");
      return;
    }
    const otherLabel = customName.trim() || notes.trim();
    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        serviceCategory: category,
        notes: category === "OTHER" ? otherLabel : notes,
        quantity,
        unitPrice,
      },
    ]);
    resetDraft();
  }

  function close() {
    setOpen(false);
    setError(null);
    if (mode === "create") setLines([]);
    resetDraft();
    onSaved?.();
  }

  function handleSubmit() {
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one line item");
      return;
    }
    startTransition(async () => {
      const payload = {
        discount: 0,
        isAgentRelated,
        lineItems: lines.map((l) => ({
          serviceCategory: l.serviceCategory,
          notes: l.notes || null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      };
      const result =
        mode === "edit" && chargeId
          ? await updateCharge({ chargeId, ...payload })
          : await addCharge({ treatmentId, ...payload });
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
      {mode === "create" && (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {triggerLabel ?? "Add Invoice"}
        </Button>
      )}
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
            <h3 className="text-lg font-semibold">
              {mode === "edit" ? "Edit Invoice" : "Add Invoice"}
            </h3>

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
              {category === "OTHER" ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Custom name</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Describe the service"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
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
                  inputMode="decimal"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="0.00"
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

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={isAgentRelated}
                onChange={(e) => setIsAgentRelated(e.target.checked)}
              />
              Agent-related (include in commission)
            </label>

            <p className="mt-3 text-sm font-medium">Total: {formatMoney(totalPrice)}</p>

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
                {isPending
                  ? "Saving…"
                  : mode === "edit"
                    ? "Save Invoice"
                    : "Add Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
