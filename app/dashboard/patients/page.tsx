import Link from "next/link";
import type { Metadata } from "next";
import { getPatients, getAgentsForAssignment } from "@/lib/actions/patients";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
import {
  getPatientStatusLabel,
  StatusBadge,
} from "@/components/admin/status-badge";
import { CopyRegistrationLinkButton } from "@/components/admin/copy-registration-link-button";
import { TablePagination } from "@/components/admin/table-pagination";
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

export const metadata: Metadata = {
  title: "Patients List",
};

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    source?: string;
    agentId?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function formatRegisteredAt(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 20;
  const sort = params.sort ?? "date";

  const [{ patients, total, totalPages, page: currentPage, pageSize: size }, agents] =
    await Promise.all([
      getPatients({
        search: params.search,
        status: params.status,
        source: params.source,
        agentId: params.agentId,
        sort,
        page,
        pageSize,
      }),
      getAgentsForAssignment(),
    ]);

  const sourceLabels: Record<PatientSource, string> = {
    WALKIN: "Walk-in",
    BOOKING: "Online Registration",
    AGENT: "Agent Referral",
  };

  const query = {
    search: params.search,
    status: params.status,
    source: params.source,
    agentId: params.agentId,
    sort,
    pageSize: String(size),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {total} patient{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <CopyRegistrationLinkButton
            path="/register"
            label="Copy Patient Registration Link"
            successMessage="Registration link copied to clipboard!"
          />
          <Button
            className="w-full sm:w-auto"
            render={<Link href="/dashboard/patients/new" />}
          >
            Digitize Registration
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="search">Search by name, display ID, or phone</Label>
              <Input
                id="search"
                name="search"
                defaultValue={params.search ?? ""}
                placeholder="Search..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={params.status ?? ""}>
                <option value="">All statuses</option>
                {Object.values(PatientStatus).map((s) => (
                  <option key={s} value={s}>
                    {getPatientStatusLabel(s)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Select id="source" name="source" defaultValue={params.source ?? ""}>
                <option value="">All sources</option>
                {Object.values(PatientSource).map((s) => (
                  <option key={s} value={s}>
                    {sourceLabels[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agentId">Agent</Label>
              <Select id="agentId" name="agentId" defaultValue={params.agentId ?? ""}>
                <option value="">All agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName}
                    {agent.partnerId ? ` (${agent.partnerId})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort">Sort by</Label>
              <Select id="sort" name="sort" defaultValue={sort}>
                <option value="date">Date Registered</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pageSize">Rows per page</Label>
              <Select id="pageSize" name="pageSize" defaultValue={String(size)}>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end lg:col-span-6">
              <Button type="submit" className="w-full sm:w-auto">
                Apply Filters
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                render={<Link href="/dashboard/patients" />}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-35">Display ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered At</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-23 text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-xs">
                        {patient.displayId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.fullName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={patient.status}
                          label={getPatientStatusLabel(patient.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {formatRegisteredAt(patient.createdAt)}
                      </TableCell>
                      <TableCell>{sourceLabels[patient.source]}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link href={`/dashboard/patients/${patient.id}`} />
                          }
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 lg:hidden">
            {patients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No patients found
              </p>
            ) : (
              patients.map((patient) => (
                <Card key={patient.id} className="shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs text-muted-foreground">
                        {patient.displayId}
                      </p>
                      <StatusBadge
                        status={patient.status}
                        label={getPatientStatusLabel(patient.status)}
                      />
                    </div>
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered At: {formatRegisteredAt(patient.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Source: {sourceLabels[patient.source]}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full"
                      render={
                        <Link href={`/dashboard/patients/${patient.id}`} />
                      }
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={size}
            basePath="/dashboard/patients"
            query={query}
          />
        </CardContent>
      </Card>
    </div>
  );
}
