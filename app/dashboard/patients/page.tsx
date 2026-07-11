import Link from "next/link";
import { getPatients } from "@/lib/actions/patients";
import { getAgentsForSelect } from "@/lib/actions/agents";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
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
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    source?: string;
    agentId?: string;
  }>;
};

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [patients, agents] = await Promise.all([
    getPatients({
      search: params.search,
      status: params.status,
      source: params.source,
      agentId: params.agentId,
    }),
    getAgentsForSelect(),
  ]);

  const statusLabels: Record<PatientStatus, string> = {
    PENDING: "Pending",
    APPOINTED: "Appointed",
    TREATING: "Treating",
    COMPLETED: "Completed",
  };

  const sourceLabels: Record<PatientSource, string> = {
    WALKIN: "Walk-in",
    BOOKING: "Booking",
    AGENT: "Agent",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button render={<Link href="/dashboard/patients/new" />}>
          Register Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="search">Search by name or phone</Label>
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
                    {statusLabels[s]}
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
                    {agent.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit">Apply Filters</Button>
              <Button variant="outline" render={<Link href="/dashboard/patients" />}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Surveys</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.phone ?? "—"}</TableCell>
                    <TableCell>{patient.age ?? "—"}</TableCell>
                    <TableCell>{sourceLabels[patient.source]}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={patient.status}
                        label={statusLabels[patient.status]}
                      />
                    </TableCell>
                    <TableCell>{patient.agent?.name ?? "—"}</TableCell>
                    <TableCell>{patient._count.surveys}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/dashboard/patients/${patient.id}`} />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
