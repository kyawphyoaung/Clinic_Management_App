import type { Metadata } from "next";
import Link from "next/link";
import { getAllMonthlyCommissions } from "@/lib/actions/commission-admin";
import { MonthlyCommissionTable } from "@/components/admin/monthly-commission-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimplePaginationBar } from "@/components/admin/simple-pagination";
import { paginateItems } from "@/lib/utils/paginate";

export const metadata: Metadata = {
  title: "Agent Billing",
};

type PageProps = {
  searchParams: Promise<{
    search?: string;
    monthFrom?: string;
    monthTo?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function AgentBillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rows = await getAllMonthlyCommissions({
    search: params.search,
    monthFrom: params.monthFrom,
    monthTo: params.monthTo,
    sort: params.sort,
  });
  const { pageItems, total, totalPages, page, pageSize } = paginateItems(
    rows,
    Number(params.page) || 1,
    Number(params.pageSize) || 20
  );
  const query = {
    search: params.search,
    monthFrom: params.monthFrom,
    monthTo: params.monthTo,
    sort: params.sort,
    pageSize: String(pageSize),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent Billing</h1>
        <p className="text-sm text-muted-foreground">
          Overview of agent commissions by month
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="search">Agent name</Label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search agent..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthFrom">From month</Label>
              <Input
                id="monthFrom"
                name="monthFrom"
                type="month"
                defaultValue={params.monthFrom ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthTo">To month</Label>
              <Input
                id="monthTo"
                name="monthTo"
                type="month"
                defaultValue={params.monthTo ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort">Sort by</Label>
              <Select id="sort" name="sort" defaultValue={params.sort ?? "month"}>
                <option value="month">Month</option>
                <option value="agent">Agent Name</option>
                <option value="amount">Amount</option>
              </Select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit">Apply</Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/agent_billing" />}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <MonthlyCommissionTable rows={pageItems} showAgent />
          <SimplePaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath="/dashboard/agent_billing"
            query={query}
          />
        </CardContent>
      </Card>
    </div>
  );
}
