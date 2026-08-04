import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { getAgentByShareToken } from "@/lib/actions/agents";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
import {
  getPatientStatusLabel,
  StatusBadge,
} from "@/components/admin/status-badge";
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

type PageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function SharedAgentPage({ params }: PageProps) {
  const { shareToken } = await params;
  const agent = await getAgentByShareToken(shareToken);

  if (!agent) {
    notFound();
  }

  const sourceLabels: Record<PatientSource, string> = {
    WALKIN: "Walk-in",
    BOOKING: "Booking",
    AGENT: "Agent Referral",
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-6">
          <Building2 className="size-7 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">{agent.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              Referred Patients — Read-only view
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Status Tracker</CardTitle>
            <CardDescription>
              {agent.patients.length} referred patient
              {agent.patients.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.patients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No referred patients yet
                    </TableCell>
                  </TableRow>
                ) : (
                  agent.patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono text-xs">
                        {patient.displayId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {patient.preferredName ?? patient.fullName}
                      </TableCell>
                      <TableCell>{sourceLabels[patient.source]}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={patient.status}
                          label={getPatientStatusLabel(patient.status)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.updatedAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        This is a read-only patient status view. No actions can be performed here.
      </footer>
    </div>
  );
}
