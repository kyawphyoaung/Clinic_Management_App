import Link from "next/link";
import { formatMoney } from "@/lib/utils/money";
import type { MonthlyCommissionRow } from "@/lib/actions/commission-admin";
import { formatMonthLabel, toBillingId } from "@/lib/utils/commission";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MonthlyCommissionTableProps = {
  rows: MonthlyCommissionRow[];
  showAgent?: boolean;
};

export function MonthlyCommissionTable({
  rows,
  showAgent = false,
}: MonthlyCommissionTableProps) {
  return (
    <ResponsiveList
      table={
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billing ID</TableHead>
              <TableHead>Month</TableHead>
              {showAgent && <TableHead>Agent Name</TableHead>}
              <TableHead>Completed Patients</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showAgent ? 8 : 7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No commission records yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const billingId = row.partnerId
                  ? toBillingId(row.periodMonth, row.partnerId)
                  : null;
                const detailHref = billingId
                  ? `/dashboard/billing/${encodeURIComponent(billingId)}`
                  : null;

                return (
                  <TableRow
                    key={`${row.agentId}-${row.periodMonth}`}
                    className={detailHref ? "hover:bg-muted/40" : undefined}
                  >
                    <TableCell className="font-mono text-xs">
                      {billingId && detailHref ? (
                        <Link
                          href={detailHref}
                          className="underline-offset-2 hover:underline"
                        >
                          {billingId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {detailHref ? (
                        <Link href={detailHref} className="block">
                          {formatMonthLabel(row.periodMonth)}
                        </Link>
                      ) : (
                        formatMonthLabel(row.periodMonth)
                      )}
                    </TableCell>
                    {showAgent && (
                      <TableCell>
                        <Link
                          href={`/dashboard/agents/${row.agentId}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {row.agentName}
                        </Link>
                      </TableCell>
                    )}
                    <TableCell>{row.patientCount}</TableCell>
                    <TableCell>{row.commissionPercent}%</TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(row.amount)}
                    </TableCell>
                    <TableCell>
                      {row.pendingCount > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500/50 text-blue-400"
                          render={
                            <Link
                              href={`/dashboard/commission/review?agentId=${row.agentId}&month=${row.periodMonth}`}
                            />
                          }
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-sm text-green-400">Approved</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.pendingCount > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Waiting for approval
                        </span>
                      ) : row.approvedCount > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link
                              href={
                                billingId
                                  ? `/dashboard/commission-payment?billingId=${encodeURIComponent(
                                      billingId
                                    )}`
                                  : `/dashboard/commission-payment?agentId=${row.agentId}&month=${row.periodMonth}`
                              }
                            />
                          }
                        >
                          Payment
                        </Button>
                      ) : (
                        <span className="text-sm text-green-400">Paid</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      }
      cards={
        <div className="space-y-3 p-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commission records yet
            </p>
          ) : (
            rows.map((row) => {
              const billingId = row.partnerId
                ? toBillingId(row.periodMonth, row.partnerId)
                : null;
              const detailHref = billingId
                ? `/dashboard/billing/${encodeURIComponent(billingId)}`
                : null;

              return (
                <Card
                  key={`${row.agentId}-${row.periodMonth}`}
                  className="shadow-sm"
                >
                  <CardContent className="space-y-2 p-4">
                    <p className="font-mono text-xs">
                      {billingId && detailHref ? (
                        <Link
                          href={detailHref}
                          className="underline-offset-2 hover:underline"
                        >
                          {billingId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <MobileField label="Month">
                      {detailHref ? (
                        <Link
                          href={detailHref}
                          className="underline-offset-2 hover:underline"
                        >
                          {formatMonthLabel(row.periodMonth)}
                        </Link>
                      ) : (
                        formatMonthLabel(row.periodMonth)
                      )}
                    </MobileField>
                    {showAgent && (
                      <MobileField label="Agent">
                        <Link
                          href={`/dashboard/agents/${row.agentId}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {row.agentName}
                        </Link>
                      </MobileField>
                    )}
                    <MobileField label="Patients">
                      {row.patientCount}
                    </MobileField>
                    <MobileField label="Rate">
                      {row.commissionPercent}%
                    </MobileField>
                    <MobileField label="Amount">
                      <span className="font-medium">
                        {formatMoney(row.amount)}
                      </span>
                    </MobileField>
                    <div className="flex flex-col gap-2 pt-1">
                      {row.pendingCount > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-500/50 text-blue-400"
                          render={
                            <Link
                              href={`/dashboard/commission/review?agentId=${row.agentId}&month=${row.periodMonth}`}
                            />
                          }
                        >
                          Review
                        </Button>
                      ) : (
                        <p className="text-sm text-green-400">Approved</p>
                      )}
                      {row.pendingCount > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Waiting for approval
                        </p>
                      ) : row.approvedCount > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          render={
                            <Link
                              href={
                                billingId
                                  ? `/dashboard/commission-payment?billingId=${encodeURIComponent(
                                      billingId
                                    )}`
                                  : `/dashboard/commission-payment?agentId=${row.agentId}&month=${row.periodMonth}`
                              }
                            />
                          }
                        >
                          Payment
                        </Button>
                      ) : (
                        <p className="text-sm text-green-400">Paid</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      }
    />
  );
}
