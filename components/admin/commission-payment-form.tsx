"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markCommissionsPaidByBillingId,
  type ApprovedBillingIdOption,
} from "@/lib/actions/commission-admin";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommissionPaymentFormProps = {
  options: ApprovedBillingIdOption[];
  defaultBillingId?: string;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function CommissionPaymentForm({
  options,
  defaultBillingId,
}: CommissionPaymentFormProps) {
  const initial =
    defaultBillingId && options.some((o) => o.billingId === defaultBillingId)
      ? defaultBillingId
      : options[0]?.billingId ?? "";
  const [open, setOpen] = useState(Boolean(defaultBillingId) || options.length > 0);
  const [billingId, setBillingId] = useState(initial);
  const [method, setMethod] = useState<"CASH" | "BANK">("BANK");
  const [error, setError] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = useMemo(
    () => options.find((o) => o.billingId === billingId) ?? null,
    [options, billingId]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessAmount(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await markCommissionsPaidByBillingId({
        billingId: String(formData.get("billingId")),
        method: String(formData.get("method")) as "CASH" | "BANK",
        paidAt: String(formData.get("paidAt")),
        referenceNumber: String(formData.get("referenceNumber") ?? ""),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccessAmount(result.amount);
      setOpen(false);
      router.refresh();
      router.push("/dashboard/commission-payment");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">New Payment Record</CardTitle>
          <CardDescription>
            Select an approved Billing ID to mark commissions as Paid.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide Form" : "New Payment Record"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent>
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved unpaid Billing IDs available.
            </p>
          ) : (
            <form
              className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="billingId">Billing ID</Label>
                <Select
                  id="billingId"
                  name="billingId"
                  value={billingId}
                  required
                  onChange={(e) => setBillingId(e.target.value)}
                >
                  <option value="">Select Billing ID</option>
                  {options.map((o) => (
                    <option key={o.billingId} value={o.billingId}>
                      {o.billingId} · {o.agentName} · {o.monthLabel} ·{" "}
                      {formatMoney(o.amount)}
                    </option>
                  ))}
                </Select>
              </div>
              {selected && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm md:col-span-2">
                  <span className="text-muted-foreground">Agent: </span>
                  <span className="font-medium">{selected.agentName}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Month: </span>
                  <span className="font-medium">{selected.monthLabel}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-medium">
                    {formatMoney(selected.amount)}
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  id="method"
                  name="method"
                  defaultValue={method}
                  required
                  onChange={(e) => setMethod(e.target.value as "CASH" | "BANK")}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Banking</option>
                </Select>
              </div>
              {method === "BANK" && (
                <div className="space-y-1.5">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    name="referenceNumber"
                    placeholder="Optional bank reference"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="paidAt">Payment Date</Label>
                <Input
                  id="paidAt"
                  name="paidAt"
                  type="date"
                  defaultValue={todayString()}
                  required
                />
              </div>
              {error && (
                <Alert className="border-destructive/50 md:col-span-2">
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {successAmount != null && (
                <Alert className="md:col-span-2">
                  <AlertDescription>
                    Recorded payment of {formatMoney(successAmount)}
                  </AlertDescription>
                </Alert>
              )}
              <div className="md:col-span-2">
                <Button type="submit" disabled={isPending || !billingId}>
                  {isPending ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}
