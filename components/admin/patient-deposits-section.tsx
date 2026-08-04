"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet, X } from "lucide-react";
import { recordPatientDeposit } from "@/lib/actions/deposits";
import type { PaymentMethod } from "@/prisma/generated/prisma/enums";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils/money";

type DepositRow = {
  id: string;
  amount: number;
  method: string;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  createdBy: string;
};

type Props = {
  patientId: string;
  deposits: DepositRow[];
  balance: number;
  canWrite: boolean;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function PatientDepositsSection({
  patientId,
  deposits,
  balance,
  canWrite,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordPatientDeposit({
        patientId,
        amount: Number(formData.get("amount")),
        method: String(formData.get("method")) as PaymentMethod,
        paymentDate: String(formData.get("paymentDate")),
        reference: String(formData.get("reference") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Deposit Billing</h2>
          <p className="text-sm text-muted-foreground">
            Balance: {formatMoney(balance)}
          </p>
        </div>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => setOpen(true)}
          >
            <Wallet className="size-4" />
            New Deposit Payment
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Recorded by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No deposits yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    deposits.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.paymentDate}</TableCell>
                        <TableCell>{formatMoney(d.amount)}</TableCell>
                        <TableCell>{d.method}</TableCell>
                        <TableCell>{d.reference ?? "—"}</TableCell>
                        <TableCell>{d.notes ?? "—"}</TableCell>
                        <TableCell>{d.createdBy}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {deposits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No deposits yet
                  </p>
                ) : (
                  deposits.map((d) => (
                    <Card key={d.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <MobileField label="Date">{d.paymentDate}</MobileField>
                          <p className="font-medium">{formatMoney(d.amount)}</p>
                        </div>
                        <MobileField label="Method">{d.method}</MobileField>
                        <MobileField label="Reference">
                          {d.reference ?? "—"}
                        </MobileField>
                        <MobileField label="Notes">{d.notes ?? "—"}</MobileField>
                        <MobileField label="Recorded by">
                          {d.createdBy}
                        </MobileField>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

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
            <h3 className="text-lg font-semibold">New Deposit Payment</h3>
            <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input name="amount" type="number" min={0.01} step="0.01" required />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <select
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
                <Label>Date</Label>
                <Input
                  name="paymentDate"
                  type="date"
                  defaultValue={todayString()}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input name="reference" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Recording…" : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
