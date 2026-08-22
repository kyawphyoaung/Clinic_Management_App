import type { Metadata } from "next";
import Link from "next/link";
import { getTreatments, suggestTreatments } from "@/lib/actions/treatments";
import { getDoctorsForSelect } from "@/lib/actions/users";
import { TreatmentStatus } from "@/prisma/generated/prisma/client";
import { getTreatmentStatusLabel } from "@/components/admin/treatment-status-badge";
import { TreatmentsTable } from "@/components/admin/treatments-table";
import { SearchSuggestInput } from "@/components/admin/search-suggest-input";
import { TablePagination } from "@/components/admin/table-pagination";
import { requireAuth } from "@/lib/session";
import { canWriteTreatments } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Treatments",
};

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function TreatmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 20;
  const sort = params.sort ?? "created";

  const [
    { treatments, total, totalPages, page: currentPage, pageSize: size },
    doctors,
    session,
  ] = await Promise.all([
    getTreatments({
      search: params.search,
      status: params.status,
      doctorId: params.doctorId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sort,
      page,
      pageSize,
    }),
    getDoctorsForSelect(),
    requireAuth(),
  ]);

  const canWrite = canWriteTreatments(session.user.role);

  const query = {
    search: params.search,
    status: params.status,
    doctorId: params.doctorId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sort,
    pageSize: String(size),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Treatments</h1>
        <p className="text-sm text-muted-foreground">
          {total} treatment{total !== 1 ? "s" : ""} found
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="pageSize" value={String(size)} />
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
              <Label htmlFor="search">
                Search patient name, patient ID, or diagnosis
              </Label>
              <SearchSuggestInput
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search..."
                suggest={suggestTreatments}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={params.status ?? ""}>
                <option value="">All statuses</option>
                {Object.values(TreatmentStatus).map((s) => (
                  <option key={s} value={s}>
                    {getTreatmentStatusLabel(s)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doctorId">Doctor</Label>
              <Select
                id="doctorId"
                name="doctorId"
                defaultValue={params.doctorId ?? ""}
              >
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.doctorCode ? `${d.doctorCode} · ${d.fullName}` : d.fullName}
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
            <div className="space-y-1.5">
              <Label htmlFor="sort">Sort by</Label>
              <Select id="sort" name="sort" defaultValue={sort}>
                <option value="created">Newest</option>
                <option value="patient">Patient Name</option>
                <option value="date">Treatment Date</option>
                <option value="diagnosis">Diagnosis</option>
                <option value="status">Status</option>
              </Select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <Button type="submit">Apply</Button>
              <Button variant="outline" render={<Link href="/dashboard/treatments" />}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TreatmentsTable treatments={treatments} canWrite={canWrite} />
          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={size}
            basePath="/dashboard/treatments"
            query={query}
          />
        </CardContent>
      </Card>
    </div>
  );
}
