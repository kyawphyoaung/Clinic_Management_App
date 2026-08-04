import type { Metadata } from "next";
import Link from "next/link";
import { getBillingPayments } from "@/lib/actions/treatments";
import { listAllDeposits } from "@/lib/actions/deposits";
import { PaymentMethod } from "@/prisma/generated/prisma/client";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";
import { SimplePaginationBar } from "@/components/admin/simple-pagination";
import { paginateItems } from "@/lib/utils/paginate";

export const metadata: Metadata = {
  title: "Patient Billing",
};

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function PatientBillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab === "deposits" ? "deposits" : "treatment";

  const filters = {
    search: params.search,
    method: params.method,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const pageNum = Number(params.page) || 1;
  const sizeNum = Number(params.pageSize) || 20;

  let total = 0;
  let totalPages = 1;
  let page = pageNum;
  let pageSize = sizeNum;
  let treatmentItems: Awaited<ReturnType<typeof getBillingPayments>> = [];
  let depositItems: Awaited<ReturnType<typeof listAllDeposits>> = [];

  if (tab === "treatment") {
    const payments = await getBillingPayments(filters);
    const result = paginateItems(payments, pageNum, sizeNum);
    treatmentItems = result.pageItems;
    total = result.total;
    totalPages = result.totalPages;
    page = result.page;
    pageSize = result.pageSize;
  } else {
    const deposits = await listAllDeposits(filters);
    const result = paginateItems(deposits, pageNum, sizeNum);
    depositItems = result.pageItems;
    total = result.total;
    totalPages = result.totalPages;
    page = result.page;
    pageSize = result.pageSize;
  }

  const query = {
    tab,
    search: params.search,
    method: params.method,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    pageSize: String(pageSize),
  };

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Patient Billing</h1>
        <p className="text-sm text-muted-foreground">
          {total} record{total !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <Link
          href="/dashboard/patient_billing?tab=treatment"
          className={tabClass(tab === "treatment")}
        >
          Treatment Billing
        </Link>
        <Link
          href="/dashboard/patient_billing?tab=deposits"
          className={tabClass(tab === "deposits")}
        >
          Deposit Billing
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <input type="hidden" name="tab" value={tab} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="search">Search patient</Label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Method</Label>
              <Select id="method" name="method" defaultValue={params.method ?? ""}>
                <option value="">All methods</option>
                {Object.values(PaymentMethod).map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={params.dateFrom ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={params.dateTo ?? ""}
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit">Apply</Button>
              <Button
                variant="outline"
                render={
                  <Link href={`/dashboard/patient_billing?tab=${tab}`} />
                }
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {tab === "treatment" ? (
            <ResponsiveList
              table={
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatmentItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      treatmentItems.map((payment) => {
                        const categoriesFromAllocations =
                          payment.allocations.flatMap((a) =>
                            a.charge.lines.map((l) => l.serviceCategory)
                          );
                        const categories =
                          categoriesFromAllocations.length > 0
                            ? [...new Set(categoriesFromAllocations)]
                            : [
                                ...new Set(
                                  payment.treatment.charges.flatMap((c) =>
                                    c.lines.map((l) => l.serviceCategory)
                                  )
                                ),
                              ];
                        const treatmentLabel =
                          payment.treatment.diagnosis?.trim() ||
                          `Treatment on ${payment.treatment.treatmentDate.toLocaleDateString()}`;
                        const patient = payment.treatment.patient;
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {payment.paymentDate.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/dashboard/patients/${patient.id}`}
                                className="underline-offset-2 hover:underline"
                              >
                                {patient.fullName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/dashboard/treatments/${payment.treatmentId}?from=treatments`}
                                className="underline-offset-2 hover:underline"
                              >
                                {treatmentLabel}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs">
                              {categories.length > 0
                                ? categories.join(", ")
                                : "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatMoney(payment.amount)}
                            </TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{payment.reference ?? "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              }
              cards={
                <div className="space-y-3 p-4">
                  {treatmentItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No payments found
                    </p>
                  ) : (
                    treatmentItems.map((payment) => {
                      const categoriesFromAllocations =
                        payment.allocations.flatMap((a) =>
                          a.charge.lines.map((l) => l.serviceCategory)
                        );
                      const categories =
                        categoriesFromAllocations.length > 0
                          ? [...new Set(categoriesFromAllocations)]
                          : [
                              ...new Set(
                                payment.treatment.charges.flatMap((c) =>
                                  c.lines.map((l) => l.serviceCategory)
                                )
                              ),
                            ];
                      const treatmentLabel =
                        payment.treatment.diagnosis?.trim() ||
                        `Treatment on ${payment.treatment.treatmentDate.toLocaleDateString()}`;
                      const patient = payment.treatment.patient;
                      return (
                        <Card key={payment.id} className="shadow-sm">
                          <CardContent className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">
                                <Link
                                  href={`/dashboard/patients/${patient.id}`}
                                  className="underline-offset-2 hover:underline"
                                >
                                  {patient.fullName}
                                </Link>
                              </p>
                              <p className="font-medium">
                                {formatMoney(payment.amount)}
                              </p>
                            </div>
                            <MobileField label="Date">
                              {payment.paymentDate.toLocaleDateString()}
                            </MobileField>
                            <MobileField label="Treatment">
                              <Link
                                href={`/dashboard/treatments/${payment.treatmentId}?from=treatments`}
                                className="underline-offset-2 hover:underline"
                              >
                                {treatmentLabel}
                              </Link>
                            </MobileField>
                            <MobileField label="Category">
                              {categories.length > 0
                                ? categories.join(", ")
                                : "—"}
                            </MobileField>
                            <MobileField label="Method">
                              {payment.method}
                            </MobileField>
                            <MobileField label="Reference">
                              {payment.reference ?? "—"}
                            </MobileField>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              }
            />
          ) : (
            <ResponsiveList
              table={
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Recorded by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depositItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No deposits found
                        </TableCell>
                      </TableRow>
                    ) : (
                      depositItems.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.paymentDate}</TableCell>
                          <TableCell>
                            <Link
                              href={`/dashboard/patients/${d.patient.id}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {d.patient.fullName}
                            </Link>
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({d.patient.displayId})
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(d.amount)}
                          </TableCell>
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
                  {depositItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No deposits found
                    </p>
                  ) : (
                    depositItems.map((d) => (
                      <Card key={d.id} className="shadow-sm">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">
                              <Link
                                href={`/dashboard/patients/${d.patient.id}`}
                                className="underline-offset-2 hover:underline"
                              >
                                {d.patient.fullName}
                              </Link>
                            </p>
                            <p className="font-medium">
                              {formatMoney(d.amount)}
                            </p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {d.patient.displayId}
                          </p>
                          <MobileField label="Date">{d.paymentDate}</MobileField>
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
          )}
          <SimplePaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath="/dashboard/patient_billing"
            query={query}
          />
        </CardContent>
      </Card>
    </div>
  );
}
