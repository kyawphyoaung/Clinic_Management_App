"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteTreatment,
  updateTreatment,
} from "@/lib/actions/treatments";
import {
  TreatmentStatus as TreatmentStatusEnum,
  type TreatmentStatus,
} from "@/prisma/generated/prisma/enums";
import { ChargeForm } from "@/components/admin/charge-form";
import { PaymentForm } from "@/components/admin/payment-form";
import { TreatmentSummaryCard } from "@/components/admin/treatment-summary-card";
import { TreatmentNotesTable } from "@/components/admin/treatment-notes-table";
import {
  getTreatmentStatusLabel,
  TreatmentStatusBadge,
} from "@/components/admin/treatment-status-badge";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TreatmentDetailClientProps = {
  canWrite: boolean;
  from?: string;
  treatment: {
    id: string;
    treatmentDate: Date;
    endDate: Date | null;
    diagnosis: string | null;
    notes: string | null;
    status: TreatmentStatus;
    patient: { id: string; displayId: string; fullName: string };
    doctor: { id: string; fullName: string } | null;
    charges: {
      id: string;
      categoryLabel: string;
      totalPrice: number;
      discount: number;
      depositApplied: number;
      netPrice: number;
      isPaid: boolean;
      createdAt: string;
      lines: {
        id: string;
        serviceCategory: string;
        notes: string | null;
        quantity: number;
        unitPrice: number;
      }[];
    }[];
    payments: {
      id: string;
      amount: number;
      method: string;
      paymentDate: Date;
      reference: string | null;
      notes: string | null;
      recordedBy: { fullName: string } | null;
      balanceAfter: number;
    }[];
  };
  doctors: { id: string; fullName: string }[];
  summary: { totalCharges: number; totalPaid: number; balance: number; depositBalance?: number };
  linkedNotes?: {
    id: string;
    title: string;
    content?: string | null;
    bloodPressure: string | null;
    heartRate: number | null;
    weight: number | null;
    height: number | null;
    bodyTemperature: number | null;
    createdAt: Date | string;
    createdBy: { fullName: string };
  }[];
};

function toDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export function TreatmentDetailClient({
  canWrite,
  from,
  treatment,
  doctors,
  summary,
  linkedNotes = [],
}: TreatmentDetailClientProps) {
  const [selectedCharge, setSelectedCharge] = useState<
    (typeof treatment.charges)[number] | null
  >(null);
  const [editing, setEditing] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<TreatmentStatus>(
    treatment.status
  );
  const [endDateValue, setEndDateValue] = useState(
    toDateInput(treatment.endDate) ||
      (treatment.status === "COMPLETED" ? todayInput() : "")
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTreatment({
        treatmentId: treatment.id,
        treatmentDate: String(formData.get("treatmentDate")),
        diagnosis: String(formData.get("diagnosis") ?? ""),
        doctorId: String(formData.get("doctorId") ?? "") || null,
        notes: String(formData.get("notes") ?? ""),
      });
      setEditing(false);
      router.refresh();
    });
  }

  function handleStatusUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      await updateTreatment({
        treatmentId: treatment.id,
        status: statusValue,
        endDate:
          statusValue === "COMPLETED"
            ? endDateValue || todayInput()
            : null,
      });
      setShowSuccessModal(true);
      window.setTimeout(() => {
        setShowSuccessModal(false);
        router.refresh();
      }, 2500);
    });
  }

  function handleDelete() {
    const warn = window.confirm(
      "It should only be deleted if it was entered incorrectly or contains errors."
    );
    if (!warn) return;
    const confirmed = window.confirm("Are you sure?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTreatment(treatment.id);
      if (!result.success) return;
      if (from === "treatments") {
        router.push("/dashboard/treatments");
      } else {
        router.push(`/dashboard/patients/${result.patientId}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-in fade-in zoom-in-95 flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center shadow-lg duration-300">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <svg
                viewBox="0 0 24 24"
                className="size-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="origin-center animate-[dash_0.6s_ease-out_forwards]"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 0,
                  }}
                />
              </svg>
            </div>
            <p className="text-lg font-semibold">Status updated</p>
            <p className="text-sm text-muted-foreground">
              Treatment status saved successfully.
            </p>
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 py-3">
          <div>
            <CardTitle className="text-base">Treatment Info</CardTitle>
            <CardDescription className="text-xs">
              Patient:{" "}
              <Link
                href={`/dashboard/patients/${treatment.patient.id}`}
                className="underline"
              >
                {treatment.patient.fullName} ({treatment.patient.displayId})
              </Link>
            </CardDescription>
          </div>
          <TreatmentStatusBadge status={treatment.status} />
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {editing && canWrite ? (
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleUpdate}>
              <div className="space-y-1.5">
                <Label htmlFor="treatmentDate">Start Date</Label>
                <Input
                  id="treatmentDate"
                  name="treatmentDate"
                  type="date"
                  defaultValue={toDateInput(treatment.treatmentDate)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doctorId">Doctor</Label>
                <select
                  id="doctorId"
                  name="doctorId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  defaultValue={treatment.doctor?.id ?? ""}
                >
                  <option value="">— None —</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  name="diagnosis"
                  defaultValue={treatment.diagnosis ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" defaultValue={treatment.notes ?? ""} />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={isPending}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                Start Date: {treatment.treatmentDate.toLocaleDateString()}
              </div>
              <div>
                End Date:{" "}
                {treatment.endDate
                  ? treatment.endDate.toLocaleDateString()
                  : "—"}
              </div>
              <div>Doctor: {treatment.doctor?.fullName ?? "—"}</div>
              <div>Diagnosis: {treatment.diagnosis ?? "—"}</div>
              <div className="sm:col-span-2">Notes: {treatment.notes ?? "—"}</div>
              {canWrite && (
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit Treatment
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {canWrite ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Treatment Status</CardTitle>
            <CardDescription className="text-xs">
              Update status independently. Completing a treatment sets the end
              date used for commission month.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <form
              className="grid gap-3"
              onSubmit={handleStatusUpdate}
            >
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={statusValue}
                  onChange={(e) => {
                    const next = e.target.value as TreatmentStatus;
                    setStatusValue(next);
                    if (next === "COMPLETED" && !endDateValue) {
                      setEndDateValue(todayInput());
                    }
                  }}
                >
                  {Object.values(TreatmentStatusEnum).map((s) => (
                    <option key={s} value={s}>
                      {getTreatmentStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              {statusValue === "COMPLETED" && (
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Treatment End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                    value={endDateValue}
                    onChange={(e) => setEndDateValue(e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-end">
                <Button type="submit" disabled={isPending}>
                  Update Status
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Treatment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <TreatmentStatusBadge status={treatment.status} />
          </CardContent>
        </Card>
      )}
      </div>

      <TreatmentSummaryCard
        totalCharges={summary.totalCharges}
        totalPaid={summary.totalPaid}
        balance={summary.balance}
        depositBalance={summary.depositBalance ?? 0}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Charges</CardTitle>
          {canWrite && (
            <ChargeForm
              treatmentId={treatment.id}
              depositBalance={summary.depositBalance ?? 0}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Deposit Applied</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Net Price</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatment.charges.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No charges yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatment.charges.map((charge, idx) => (
                      <TableRow
                        key={charge.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedCharge(charge)}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          {new Date(charge.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{charge.categoryLabel}</TableCell>
                        <TableCell>{formatMoney(charge.totalPrice)}</TableCell>
                        <TableCell>
                          {charge.depositApplied > 0
                            ? `-${formatMoney(charge.depositApplied)}`
                            : formatMoney(0)}
                        </TableCell>
                        <TableCell>{formatMoney(charge.discount)}</TableCell>
                        <TableCell
                          className={`font-medium ${
                            charge.netPrice > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatMoney(charge.netPrice)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              charge.isPaid
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "font-medium text-red-600 dark:text-red-400"
                            }
                          >
                            {charge.isPaid ? "Yes" : "No"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {treatment.charges.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No charges yet
                  </p>
                ) : (
                  treatment.charges.map((charge, idx) => (
                    <Card
                      key={charge.id}
                      className="cursor-pointer shadow-sm"
                      onClick={() => setSelectedCharge(charge)}
                    >
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">
                            #{idx + 1} {charge.categoryLabel}
                          </p>
                          <span
                            className={
                              charge.isPaid
                                ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                                : "text-sm font-medium text-red-600 dark:text-red-400"
                            }
                          >
                            {charge.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <MobileField label="Date">
                          {new Date(charge.createdAt).toLocaleDateString()}
                        </MobileField>
                        <MobileField label="Total">
                          {formatMoney(charge.totalPrice)}
                        </MobileField>
                        <MobileField label="Deposit Applied">
                          {charge.depositApplied > 0
                            ? `-${formatMoney(charge.depositApplied)}`
                            : formatMoney(0)}
                        </MobileField>
                        <MobileField label="Discount">
                          {formatMoney(charge.discount)}
                        </MobileField>
                        <MobileField label="Net">
                          <span
                            className={`font-medium ${
                              charge.netPrice > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatMoney(charge.netPrice)}
                          </span>
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

      {selectedCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
            <button
              type="button"
              className="absolute right-3 top-3 text-muted-foreground"
              onClick={() => setSelectedCharge(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold">Charge detail</h3>
            <ResponsiveList
              className="mt-4"
              table={
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCharge.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.serviceCategory}</TableCell>
                        <TableCell>{line.notes?.trim() || "—"}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>{formatMoney(line.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
              cards={
                <div className="space-y-2">
                  {selectedCharge.lines.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <p className="font-medium">{line.serviceCategory}</p>
                      <MobileField label="Notes">
                        {line.notes?.trim() || "—"}
                      </MobileField>
                      <MobileField label="Qty">{line.quantity}</MobileField>
                      <MobileField label="Price">
                        {formatMoney(line.unitPrice)}
                      </MobileField>
                    </div>
                  ))}
                </div>
              }
            />
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>Total: {formatMoney(selectedCharge.totalPrice)}</p>
              <p>Deposit applied: {formatMoney(selectedCharge.depositApplied)}</p>
              <p>Net: {formatMoney(selectedCharge.netPrice)}</p>
              <p>Paid: {selectedCharge.isPaid ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-base">Payments</CardTitle>
          {canWrite && (
            <PaymentForm
              treatmentId={treatment.id}
              charges={treatment.charges.map((c) => ({
                id: c.id,
                description: c.categoryLabel,
                serviceCategory: c.categoryLabel,
                netPrice: c.netPrice,
                isPaid: c.isPaid,
              }))}
              onPaymentRecorded={(paymentId) => {
                setLastPaymentId(paymentId);
                router.refresh();
              }}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatment.payments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No payments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatment.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paymentDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatMoney(payment.amount)}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell>{payment.reference ?? "—"}</TableCell>
                        <TableCell>
                          {formatMoney(payment.balanceAfter)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <Link
                                href={`/dashboard/treatments/${treatment.id}/receipt/${payment.id}`}
                              />
                            }
                          >
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {treatment.payments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No payments yet
                  </p>
                ) : (
                  treatment.payments.map((payment) => (
                    <Card key={payment.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <MobileField label="Date">
                            {payment.paymentDate.toLocaleDateString()}
                          </MobileField>
                          <p className="font-medium">
                            {formatMoney(payment.amount)}
                          </p>
                        </div>
                        <MobileField label="Method">{payment.method}</MobileField>
                        <MobileField label="Reference">
                          {payment.reference ?? "—"}
                        </MobileField>
                        <MobileField label="Balance">
                          {formatMoney(payment.balanceAfter)}
                        </MobileField>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          render={
                            <Link
                              href={`/dashboard/treatments/${treatment.id}/receipt/${payment.id}`}
                            />
                          }
                        >
                          Receipt
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
          {lastPaymentId && (
            <div className="px-4 pb-4">
              <Button
                className="w-full sm:w-auto"
                render={
                  <Link
                    href={`/dashboard/treatments/${treatment.id}/receipt/${lastPaymentId}`}
                  />
                }
              >
                Generate Receipt
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TreatmentNotesTable
        notes={linkedNotes}
        patientId={treatment.patient.id}
        treatmentId={treatment.id}
        canWrite={canWrite}
      />

      {canWrite && (
        <Card className="border-destructive/40">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-destructive">
              Delete this treatment
            </CardTitle>
            <CardDescription className="text-xs">
              Only delete if this treatment was entered incorrectly or contains
              errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              Delete this treatment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
