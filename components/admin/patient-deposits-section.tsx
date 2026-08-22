"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet, X } from "lucide-react";
import {
  createRequestedDeposit,
  deletePatientDeposit,
  deleteRequestedDeposit,
  recordPatientDeposit,
  updatePatientDeposit,
  updateRequestedDeposit,
  updateRequestedDepositStatus,
} from "@/lib/actions/deposits";
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
  isApplied?: boolean;
};

type RequestedRow = {
  id: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  status: "REQUESTED" | "SENT" | "PAID" | "CANCELLED";
  requestedAt: string;
  reference: string | null;
};

type Props = {
  patientId: string;
  patientName?: string;
  patientCountry?: string;
  deposits: DepositRow[];
  requestedDeposits?: RequestedRow[];
  treatments?: Array<{ id: string; shortId?: string }>;
  balance: number;
  canWrite: boolean;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(status: RequestedRow["status"]) {
  return status === "PAID" ? "Deposit Received" : "Awaiting Deposit";
}

function isAwaiting(status: RequestedRow["status"]) {
  return status !== "PAID";
}

export function PatientDepositsSection({
  patientId,
  patientName,
  patientCountry,
  deposits,
  requestedDeposits = [],
  treatments = [],
  balance,
  canWrite,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositRow | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestedRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordPatientDeposit({
        patientId,
        amount: Number(formData.get("amount")),
        currency: "TWD",
        exchangeRate: 1,
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

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createRequestedDeposit({
        patientId,
        treatmentId: String(formData.get("treatmentId") ?? "") || null,
        amount: Number(formData.get("amount")),
        currency: "TWD",
        exchangeRate: 1,
        reference: String(formData.get("reference") ?? ""),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRequestOpen(false);
      setAmount("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Deposit Billing</h2>
          <p className="text-sm text-muted-foreground">
            Balance:{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatMoney(balance)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <Button type="button" size="sm" variant="outline" onClick={() => setRequestOpen(true)}>
              Request Deposit
            </Button>
          )}
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
      </div>

      {requestedDeposits.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestedDeposits.map((r) => {
                  const awaiting = isAwaiting(r.status);
                  return (
                    <TableRow
                      key={r.id}
                      className={canWrite ? "cursor-pointer hover:bg-muted/40" : undefined}
                      onClick={() => {
                        if (!canWrite) return;
                        setEditingRequest(r);
                      }}
                    >
                      <TableCell>{new Date(r.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell
                        className={
                          awaiting
                            ? "font-medium text-[#ef4444]"
                            : "font-medium text-[#10b981]"
                        }
                      >
                        {formatMoney(r.amount)} {r.currency}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            awaiting
                              ? "font-medium text-[#ef4444]"
                              : "font-medium text-[#10b981]"
                          }
                        >
                          {statusLabel(r.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {canWrite && (
                          <div className="inline-flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRequest(r)}
                            >
                              Update
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={!awaiting}
                              onClick={() => {
                                if (!awaiting) return;
                                if (!window.confirm("Delete this requested deposit?")) return;
                                startTransition(async () => {
                                  await deleteRequestedDeposit(r.id, patientId);
                                  router.refresh();
                                });
                              }}
                            >
                              Delete
                            </Button>
                            {awaiting && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  startTransition(async () => {
                                    await updateRequestedDepositStatus({
                                      id: r.id,
                                      patientId,
                                      status: "PAID",
                                    });
                                    router.refresh();
                                  });
                                }}
                              >
                                Mark Received
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                        No deposits yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    deposits.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.paymentDate}</TableCell>
                        <TableCell className="font-medium text-amber-600 dark:text-amber-400">
                          {formatMoney(d.amount)}
                        </TableCell>
                        <TableCell>{d.method}</TableCell>
                        <TableCell>{d.reference ?? "—"}</TableCell>
                        <TableCell>{d.notes ?? "—"}</TableCell>
                        <TableCell>{d.createdBy}</TableCell>
                        <TableCell className="text-right">
                          {canWrite && (
                            <div className="inline-flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={d.isApplied}
                                onClick={() => setEditingDeposit(d)}
                              >
                                Update
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={d.isApplied}
                                onClick={() => {
                                  if (d.isApplied) return;
                                  if (!window.confirm("Delete this deposit?")) return;
                                  startTransition(async () => {
                                    await deletePatientDeposit(d.id, patientId);
                                    router.refresh();
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {deposits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No deposits yet</p>
                ) : (
                  deposits.map((d) => (
                    <Card key={d.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <MobileField label="Date">{d.paymentDate}</MobileField>
                          <p className="font-medium text-amber-600 dark:text-amber-400">
                            {formatMoney(d.amount)}
                          </p>
                        </div>
                        <MobileField label="Method">{d.method}</MobileField>
                        <MobileField label="Reference">{d.reference ?? "—"}</MobileField>
                        <MobileField label="Notes">{d.notes ?? "—"}</MobileField>
                        <MobileField label="Recorded by">{d.createdBy}</MobileField>
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
                <Input name="paymentDate" type="date" defaultValue={todayString()} required />
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

      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setRequestOpen(false)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-lg font-semibold">Request Deposit</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              All amounts are in New Taiwan Dollars (TWD).
            </p>
            <form className="mt-4 grid gap-3" onSubmit={handleRequestSubmit}>
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <Input value={patientName ?? "—"} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={patientCountry ?? "—"} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Treatment (optional)</Label>
                <select
                  name="treatmentId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">No treatment</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.shortId ?? t.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (TWD)</Label>
                <Input
                  name="amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input name="reference" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Create Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Update Requested Deposit</h3>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransition(async () => {
                  await updateRequestedDeposit({
                    id: editingRequest.id,
                    patientId,
                    amount: Number(formData.get("amount")),
                    currency: "TWD",
                    exchangeRate: 1,
                    reference: String(formData.get("reference") ?? ""),
                  });
                  setEditingRequest(null);
                  router.refresh();
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Amount (TWD)</Label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  defaultValue={editingRequest.amount}
                  required
                  disabled={!isAwaiting(editingRequest.status)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input
                  name="reference"
                  defaultValue={editingRequest.reference ?? ""}
                  disabled={!isAwaiting(editingRequest.status)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRequest(null)}>
                  Close
                </Button>
                {isAwaiting(editingRequest.status) && (
                  <Button type="submit" disabled={isPending}>
                    Save
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {editingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold">Update Deposit</h3>
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransition(async () => {
                  await updatePatientDeposit({
                    id: editingDeposit.id,
                    patientId,
                    amount: Number(formData.get("amount")),
                    method: String(formData.get("method")) as PaymentMethod,
                    paymentDate: String(formData.get("paymentDate")),
                    reference: String(formData.get("reference") ?? ""),
                    notes: String(formData.get("notes") ?? ""),
                  });
                  setEditingDeposit(null);
                  router.refresh();
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  defaultValue={editingDeposit.amount}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <select
                  name="method"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  defaultValue={editingDeposit.method}
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
                  defaultValue={editingDeposit.paymentDate}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reference</Label>
                <Input name="reference" defaultValue={editingDeposit.reference ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" defaultValue={editingDeposit.notes ?? ""} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingDeposit(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
