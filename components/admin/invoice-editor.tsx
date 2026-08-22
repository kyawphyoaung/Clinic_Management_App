"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCharge, updateCharge } from "@/lib/actions/treatments";
import type { ServiceCategory } from "@/prisma/generated/prisma/enums";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  customName: string;
  quantity: number;
  unitPrice: number;
};

type PatientBillTo = {
  fullName: string;
  streetAddress?: string | null;
  city?: string | null;
  countryOfResidence?: string | null;
  mobileNumber?: string | null;
};

type Props = {
  treatmentId: string;
  patient: PatientBillTo;
  previewInvoiceId: string;
  defaultAgentRelated?: boolean;
  mode?: "create" | "edit";
  chargeId?: string;
  initialLines?: DraftLine[];
  initialDiscountAmount?: number;
  initialIsAgentRelated?: boolean;
  initialInvoiceDate?: string;
  readOnly?: boolean;
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function lineDescription(l: DraftLine): string {
  if (l.serviceCategory === "OTHER" && l.customName.trim()) {
    return l.customName.trim();
  }
  return l.serviceCategory;
}

export function InvoiceEditor({
  treatmentId,
  patient,
  previewInvoiceId,
  defaultAgentRelated = false,
  mode = "create",
  chargeId,
  initialLines = [],
  initialDiscountAmount = 0,
  initialIsAgentRelated,
  initialInvoiceDate,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"edit" | "success">("edit");
  const [successKind, setSuccessKind] = useState<"created" | "updated">(
    "created"
  );
  const [savedId, setSavedId] = useState<string | null>(
    mode === "edit" ? previewInvoiceId : null
  );
  const [invoiceDate, setInvoiceDate] = useState(
    initialInvoiceDate ?? todayInput()
  );
  const [lines, setLines] = useState<DraftLine[]>(initialLines);
  const [category, setCategory] = useState<ServiceCategory>("CONSULTATION");
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceText, setPriceText] = useState("");
  const initialSubtotal = initialLines.reduce(
    (s, l) => s + l.quantity * l.unitPrice,
    0
  );
  const initialPct =
    initialSubtotal > 0
      ? Math.round((initialDiscountAmount / initialSubtotal) * 10000) / 100
      : 0;
  const [discountPct, setDiscountPct] = useState(initialPct);
  const [isAgentRelated, setIsAgentRelated] = useState(
    initialIsAgentRelated ?? defaultAgentRelated
  );
  const [oldTotalSnapshot] = useState(
    Math.max(0, initialSubtotal - initialDiscountAmount)
  );

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const discountAmount = Math.max(0, (subtotal * discountPct) / 100);
  const total = Math.max(0, subtotal - discountAmount);
  const displayId = savedId ?? previewInvoiceId ?? "New";
  const canEdit = !readOnly && phase === "edit";

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
    if (quantity < 1) {
      window.alert("Quantity must be at least 1.");
      return;
    }
    if (category === "OTHER" && !customName.trim()) {
      window.alert("Please enter a custom name for OTHER.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${prev.length}`,
        serviceCategory: category,
        customName: customName.trim(),
        quantity,
        unitPrice,
      },
    ]);
    setCategory("CONSULTATION");
    setCustomName("");
    setQuantity(1);
    setPriceText("");
  }

  function handleSave() {
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one line item");
      return;
    }
    startTransition(async () => {
      const result = await addCharge({
        treatmentId,
        discount: discountAmount,
        isAgentRelated,
        lineItems: lines.map((l) => ({
          serviceCategory: l.serviceCategory,
          notes:
            l.serviceCategory === "OTHER" && l.customName
              ? l.customName
              : null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedId(result.shortId);
      setSuccessKind("created");
      setPhase("success");
      router.refresh();
    });
  }

  function handleUpdate() {
    setError(null);
    if (!chargeId) return;
    if (lines.length === 0) {
      setError("Add at least one line item");
      return;
    }
    const ok = window.confirm(
      `Old Invoice Total: ${formatMoney(oldTotalSnapshot)}, New Invoice Total: ${formatMoney(total)}. Are you sure?`
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await updateCharge({
        chargeId,
        discount: discountAmount,
        isAgentRelated,
        lineItems: lines.map((l) => ({
          serviceCategory: l.serviceCategory,
          notes:
            l.serviceCategory === "OTHER" && l.customName
              ? l.customName
              : null,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccessKind("updated");
      setPhase("success");
      router.refresh();
    });
  }

  const addressLine = [patient.streetAddress, patient.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      {phase === "success" && (
        <Alert className="no-print border-emerald-500/40 bg-emerald-500/10">
          <AlertDescription className="space-y-3">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              {successKind === "created"
                ? "Invoice Created Successfully"
                : "Update Successfully"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => window.print()}>
                Print Invoice
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Done
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {canEdit && (
        <div className="no-print flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-3 sm:grid-cols-4">
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
            {category === "OTHER" && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Custom name</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Describe the service"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                inputMode="decimal"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Qty</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={addLine}>
                Add Line
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                className="w-24"
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={isAgentRelated}
                onChange={(e) => setIsAgentRelated(e.target.checked)}
              />
              Agent-related
            </label>
            {mode === "create" ? (
              <Button
                type="button"
                disabled={isPending || lines.length === 0}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleSave}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending || lines.length === 0}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleUpdate}
              >
                {isPending ? "Updating…" : "Update"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {phase === "edit" && readOnly && (
        <div className="no-print flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.print()}>
            Print Invoice
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Done
          </Button>
        </div>
      )}

      {error && (
        <p className="no-print text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-center bg-[#d6e4f0] py-8 print:bg-white print:py-0">
        <article
          className="invoice-sheet relative w-[210mm] max-w-full overflow-hidden px-10 py-8 text-slate-900 shadow-md print:shadow-none"
          style={{
            minHeight: "297mm",
            backgroundColor: "#e8f1f8",
          }}
        >
          {/* Watermark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/main_logo.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[55%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] grayscale"
          />

          <div className="relative z-10">
            <header className="flex items-start justify-between gap-6 border-b border-slate-400/60 pb-6">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/main_logo.svg"
                  alt="Revivora Medical Tourism"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold tracking-wide text-slate-800 sm:text-3xl">
                  Medical Billing Invoice
                </h1>
                <p className="mt-1 font-mono text-sm text-slate-600">
                  Invoice {displayId}
                </p>
              </div>
            </header>

            <div className="mt-8 flex flex-wrap justify-between gap-6">
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bill To
                </p>
                <p className="text-base font-semibold">{patient.fullName}</p>
                {addressLine ? <p>{addressLine}</p> : null}
                <p>{patient.countryOfResidence || "—"}</p>
                <p>{patient.mobileNumber || "—"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue Date
                </p>
                {canEdit ? (
                  <>
                    <Input
                      type="date"
                      className="no-print h-9 w-40 border-slate-300 bg-white"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                    <p className="hidden print:block">
                      {new Date(invoiceDate).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p>{new Date(invoiceDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="mt-10 border border-slate-800 bg-white/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-800 px-3 py-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Price
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Qty
                    </th>
                    <th className="border-b border-slate-800 px-3 py-2 text-right font-semibold">
                      Total
                    </th>
                    {canEdit && (
                      <th className="no-print border-b border-slate-800 px-2 py-2" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEdit ? 5 : 4}
                        className="px-3 py-8 text-center text-slate-400"
                      >
                        No line items yet
                      </td>
                    </tr>
                  ) : (
                    lines.map((l) => (
                      <tr key={l.key}>
                        <td className="px-3 py-3">{lineDescription(l)}</td>
                        <td className="px-3 py-3 text-right">
                          {formatMoney(l.unitPrice)}
                        </td>
                        <td className="px-3 py-3 text-right">{l.quantity}</td>
                        <td className="px-3 py-3 text-right">
                          {formatMoney(l.quantity * l.unitPrice)}
                        </td>
                        {canEdit && (
                          <td className="no-print px-2 py-3 text-right">
                            <button
                              type="button"
                              className="text-xs text-rose-600 underline"
                              onClick={() =>
                                setLines((prev) =>
                                  prev.filter((x) => x.key !== l.key)
                                )
                              }
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="border-t border-slate-800 px-3 py-4">
                <div className="ml-auto w-56 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount {discountPct}%</span>
                    <span>{formatMoney(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="mt-12 flex flex-wrap items-end justify-between gap-4 border-t border-slate-300/80 pt-6 text-xs text-slate-600">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/main_logo.svg"
                  alt="Revivora"
                  className="h-8 w-auto object-contain"
                />
                <p className="mt-1">www.revivoratw.com</p>
              </div>
              <p className="max-w-sm text-right leading-relaxed">
                For more information or any issues or concerns, email us at{" "}
                <span className="font-medium">uroadrian.tw@gmail.com</span>
              </p>
            </footer>
          </div>
        </article>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
