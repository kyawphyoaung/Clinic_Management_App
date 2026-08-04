"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import { approveMonthCommissionsAction } from "@/lib/actions/commission-admin";
import { formatMoney } from "@/lib/utils/money";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type ReviewPatient = {
  patient: {
    id: string;
    fullName: string;
    displayId: string;
    status: string;
  };
  totalCharges: number;
  totalCommission: number;
  treatments: Array<{
    commissionId: string;
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

type CommissionReviewClientProps = {
  agentId: string;
  agentName: string;
  periodMonth: string;
  monthLabel: string;
  patients: ReviewPatient[];
  totalCommission: number;
  totalCharges: number;
  commissionPercent: number;
  pendingCount: number;
};

function TotalsBlock({
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

export function CommissionReviewClient({
  agentId,
  agentName,
  periodMonth,
  monthLabel,
  patients,
  totalCommission,
  totalCharges,
  commissionPercent,
  pendingCount,
}: CommissionReviewClientProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [approvedLocal, setApprovedLocal] = useState(pendingCount === 0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleApproveAll() {
    startTransition(async () => {
      await approveMonthCommissionsAction(agentId, periodMonth);
      setApprovedLocal(true);
      router.refresh();
    });
  }

  function handleExportCsv() {
    const lines = [
      [
        "Patient",
        "Display ID",
        "Treatment",
        "Start",
        "End",
        "Category",
        "Charge",
        "Amount",
        "Commission",
        "Month",
      ].join(","),
    ];

    for (const group of patients) {
      for (const t of group.treatments) {
        for (const charge of t.charges) {
          lines.push(
            [
              `"${group.patient.fullName}"`,
              group.patient.displayId,
              `"${t.diagnosis ?? t.treatmentId}"`,
              t.treatmentDate,
              t.endDate ?? "",
              charge.serviceCategory,
              `"${charge.description}"`,
              charge.netPrice.toFixed(2),
              t.commissionAmount.toFixed(2),
              periodMonth,
            ].join(",")
          );
        }
      }
    }

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-review-${agentName.replace(/\s+/g, "-")}-${periodMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const showApproved = approvedLocal || pendingCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Commission Review</h1>
          <p className="text-sm text-muted-foreground">
            {agentName} · {monthLabel} · Rate {commissionPercent}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" />
            Export to Excel
          </Button>
          {showApproved ? (
            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-400">
              Approved
            </span>
          ) : (
            <Button type="button" disabled={isPending} onClick={handleApproveAll}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Approve All
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 py-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Charges</p>
            <p className="text-lg font-semibold">{formatMoney(totalCharges)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Commission</p>
            <p className="text-lg font-semibold">
              {formatMoney(totalCommission)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Patients</p>
            <p className="text-lg font-semibold">{patients.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No completed treatments for this month
            </CardContent>
          </Card>
        ) : (
          patients.map((group) => {
            const isOpen = open[group.patient.id] ?? true;
            return (
              <Card key={group.patient.id}>
                <CardHeader
                  className="cursor-pointer"
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
                          {group.patient.fullName} ({group.patient.displayId})
                        </CardTitle>
                        <CardDescription>
                          Patient status: {group.patient.status}
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
                  <CardContent className="space-y-4 border-t border-border pt-4">
                    {group.treatments.map((t) => (
                      <div
                        key={t.treatmentId}
                        className="rounded-md border border-border p-3 text-sm"
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
                        <TotalsBlock
                          totalCharges={t.totalCharges}
                          commissionPercent={commissionPercent}
                          commissionAmount={t.commissionAmount}
                        />
                      </div>
                    ))}
                    <TotalsBlock
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
          <TotalsBlock
            totalCharges={totalCharges}
            commissionPercent={commissionPercent}
            commissionAmount={totalCommission}
          />
        </CardContent>
      </Card>
    </div>
  );
}
