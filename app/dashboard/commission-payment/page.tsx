import type { Metadata } from "next";
import {
  getApprovedBillingIds,
  getPaidCommissionGroups,
} from "@/lib/actions/commission-admin";
import { CommissionPaymentForm } from "@/components/admin/commission-payment-form";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { formatMoney } from "@/lib/utils/money";
import { formatMonthLabel, toBillingId } from "@/lib/utils/commission";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimplePaginationBar } from "@/components/admin/simple-pagination";
import { paginateItems } from "@/lib/utils/paginate";

export const metadata: Metadata = {
  title: "Commission Payments",
};

type PageProps = {
  searchParams: Promise<{
    agentId?: string;
    month?: string;
    billingId?: string;
    partnerId?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function CommissionPaymentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [groups, approvedOptions] = await Promise.all([
    getPaidCommissionGroups(),
    getApprovedBillingIds(),
  ]);
  const { pageItems, total, totalPages, page, pageSize } = paginateItems(
    groups,
    Number(params.page) || 1,
    Number(params.pageSize) || 20
  );

  const defaultBillingId =
    params.billingId ||
    (params.month && params.partnerId
      ? toBillingId(params.month, params.partnerId)
      : undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Commission Payments</h1>
        <p className="text-sm text-muted-foreground">
          Record commission payouts by Billing ID (MMYY-AGENTID)
        </p>
      </div>

      <CommissionPaymentForm
        options={approvedOptions}
        defaultBillingId={defaultBillingId}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Billing ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No payouts recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((group) => (
                      <TableRow key={group.billingId}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/dashboard/billing/${encodeURIComponent(group.billingId)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {group.billingId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {group.agentName}
                          {group.partnerId ? ` (${group.partnerId})` : ""}
                        </TableCell>
                        <TableCell>
                          {formatMonthLabel(group.periodMonth)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatMoney(group.amount)}
                        </TableCell>
                        <TableCell>
                          {group.method === "BANK"
                            ? "Banking"
                            : group.method === "CASH"
                              ? "Cash"
                              : group.method ?? "—"}
                        </TableCell>
                        <TableCell>
                          {group.paidAt
                            ? group.paidAt.toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>{group.reference ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
            cards={
              <div className="space-y-3 p-4">
                {pageItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No payouts recorded yet
                  </p>
                ) : (
                  pageItems.map((group) => (
                    <Card key={group.billingId} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <p className="font-mono text-xs">
                          <Link
                            href={`/dashboard/billing/${encodeURIComponent(group.billingId)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {group.billingId}
                          </Link>
                        </p>
                        <p className="font-medium">
                          {group.agentName}
                          {group.partnerId ? ` (${group.partnerId})` : ""}
                        </p>
                        <MobileField label="Month">
                          {formatMonthLabel(group.periodMonth)}
                        </MobileField>
                        <MobileField label="Amount">
                          <span className="font-medium">
                            {formatMoney(group.amount)}
                          </span>
                        </MobileField>
                        <MobileField label="Method">
                          {group.method === "BANK"
                            ? "Banking"
                            : group.method === "CASH"
                              ? "Cash"
                              : group.method ?? "—"}
                        </MobileField>
                        <MobileField label="Paid At">
                          {group.paidAt
                            ? group.paidAt.toLocaleDateString()
                            : "—"}
                        </MobileField>
                        <MobileField label="Reference">
                          {group.reference ?? "—"}
                        </MobileField>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
          <SimplePaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath="/dashboard/commission-payment"
            query={{
              billingId: params.billingId,
              pageSize: String(pageSize),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
