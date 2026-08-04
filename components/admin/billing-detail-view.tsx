"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { approveMonthCommissionsAction } from "@/lib/actions/commission-admin";
import { formatMoney } from "@/lib/utils/money";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export type BillingDetailPatient = {
  patient: {
    id: string;
    fullName: string;
    displayId: string;
    status: string;
  };
  totalCharges: number;
  totalCommission: number;
  treatments: Array<{
    treatmentId: string;
    diagnosis: string | null;
    treatmentDate: string;
    endDate: string | null;
    status: string;
    reviewStatus: string;
    commissionAmount: number;
    totalCharges: number;
    charges: Array<{
      serviceCategory: string;
      description: string;
      netPrice: number;
    }>;
  }>;
};

export type PaymentStatusKind = "waiting" | "pending" | "paid" | "empty";

type BillingDetailViewProps = {
  billingId: string;
  agentId?: string;
  periodMonth?: string;
  agentName: string;
  monthLabel: string;
  commissionPercent: number;
  patientCount: number;
  totalCharges: number;
  totalCommission: number;
  patients: BillingDetailPatient[];
  paymentStatus: PaymentStatusKind;
  /** Admin dashboard only */
  showAdminActions?: boolean;
};

function paymentStatusLabel(status: PaymentStatusKind) {
  switch (status) {
    case "waiting":
      return "Waiting for Approval";
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    default:
      return "No commissions";
  }
}

function paymentStatusClass(status: PaymentStatusKind) {
  switch (status) {
    case "waiting":
      return "bg-amber-500/15 text-amber-400 border-amber-500/40";
    case "pending":
      return "bg-blue-500/15 text-blue-400 border-blue-500/40";
    case "paid":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function CommissionTotalsBlock({
  totalCharges,
  commissionPercent,
  commissionAmount,
}: {
  totalCharges: number;
  commissionPercent: number;
  commissionAmount: number;
}) {
  return (
    <div className="mt-3 space-y-1 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Treatment Total</span>
        <span className="font-medium tabular-nums">
          {formatMoney(totalCharges)}
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Commission Rate</span>
        <span className="font-medium">{commissionPercent}%</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Commission</span>
        <span className="font-medium tabular-nums">
          {formatMoney(commissionAmount)}
        </span>
      </div>
    </div>
  );
}

export function BillingDetailView({
  billingId,
  agentId,
  periodMonth,
  agentName,
  monthLabel,
  commissionPercent,
  patientCount,
  totalCharges,
  totalCommission,
  patients,
  paymentStatus,
  showAdminActions = false,
}: BillingDetailViewProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [approvedLocal, setApprovedLocal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const effectiveStatus =
    approvedLocal && paymentStatus === "waiting" ? "pending" : paymentStatus;

  function toggle(id: string) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleApprove() {
    if (!agentId || !periodMonth) return;
    startTransition(async () => {
      await approveMonthCommissionsAction(agentId, periodMonth);
      setApprovedLocal(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Billing Detail</h1>
          <p className="font-mono text-sm text-muted-foreground">{billingId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={paymentStatusClass(effectiveStatus)}
          >
            {paymentStatusLabel(effectiveStatus)}
          </Badge>
          {showAdminActions && effectiveStatus === "waiting" && (
            <Button
              type="button"
              disabled={isPending}
              onClick={handleApprove}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Approve
            </Button>
          )}
          {showAdminActions &&
            (effectiveStatus === "pending" || approvedLocal) &&
            effectiveStatus !== "paid" && (
              <Button
                type="button"
                variant="outline"
                render={
                  <Link
                    href={`/dashboard/commission-payment?billingId=${encodeURIComponent(billingId)}`}
                  />
                }
              >
                Make Payment
              </Button>
            )}
          {showAdminActions &&
            (effectiveStatus === "pending" || approvedLocal) &&
            effectiveStatus !== "waiting" &&
            effectiveStatus !== "paid" && (
              <span className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400">
                Approved
              </span>
            )}
        </div>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-0 pb-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Agent</p>
            <p className="font-medium">{agentName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Month</p>
            <p className="font-medium">{monthLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed Patients</p>
            <p className="font-medium">{patientCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Charges</p>
            <p className="font-medium">{formatMoney(totalCharges)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="font-medium">{commissionPercent}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Commission</p>
            <p className="font-medium">{formatMoney(totalCommission)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Patient Breakdown</h2>
        {patients.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No commission rows for this Billing ID
            </CardContent>
          </Card>
        ) : (
          patients.map((group) => {
            const isOpen = open[group.patient.id] ?? true;
            return (
              <Card key={group.patient.id}>
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => toggle(group.patient.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      {isOpen ? (
                        <ChevronDown className="mt-1 size-4" />
                      ) : (
                        <ChevronRight className="mt-1 size-4" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          {group.patient.fullName}
                        </CardTitle>
                        <CardDescription>
                          {group.patient.displayId} · {group.patient.status}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {group.treatments.length} treatment
                      {group.treatments.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="space-y-4 border-t pt-4">
                    {group.treatments.map((t) => (
                      <div
                        key={t.treatmentId}
                        className="rounded-md border p-3 text-sm"
                      >
                        <p className="font-medium">
                          {t.diagnosis ?? "Treatment"} · {t.status}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <p>
                            <span className="text-muted-foreground">
                              Start Date:{" "}
                            </span>
                            <span className="font-semibold text-sky-400">
                              {new Date(t.treatmentDate).toLocaleDateString()}
                            </span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              End Date:{" "}
                            </span>
                            <span className="font-semibold text-violet-400">
                              {t.endDate
                                ? new Date(t.endDate).toLocaleDateString()
                                : "—"}
                            </span>
                          </p>
                        </div>
                        <ResponsiveList
                          className="mt-2"
                          table={
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">
                                    Amount
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {t.charges.map((c, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{c.serviceCategory}</TableCell>
                                    <TableCell>{c.description}</TableCell>
                                    <TableCell className="text-right">
                                      {formatMoney(c.netPrice)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          }
                          cards={
                            <div className="space-y-2">
                              {t.charges.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                                >
                                  <p className="font-medium">
                                    {c.serviceCategory}
                                  </p>
                                  <MobileField label="Description">
                                    {c.description}
                                  </MobileField>
                                  <MobileField label="Amount">
                                    {formatMoney(c.netPrice)}
                                  </MobileField>
                                </div>
                              ))}
                            </div>
                          }
                        />
                        <CommissionTotalsBlock
                          totalCharges={t.totalCharges}
                          commissionPercent={commissionPercent}
                          commissionAmount={t.commissionAmount}
                        />
                      </div>
                    ))}
                    <CommissionTotalsBlock
                      totalCharges={group.totalCharges}
                      commissionPercent={commissionPercent}
                      commissionAmount={group.totalCommission}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardContent className="py-4">
          <CommissionTotalsBlock
            totalCharges={totalCharges}
            commissionPercent={commissionPercent}
            commissionAmount={totalCommission}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function derivePaymentStatus(
  statuses: string[]
): PaymentStatusKind {
  if (statuses.length === 0) return "empty";
  if (statuses.some((s) => s === "PENDING_REVIEW")) return "waiting";
  if (statuses.every((s) => s === "PAID")) return "paid";
  if (statuses.some((s) => s === "APPROVED")) return "pending";
  return "paid";
}
