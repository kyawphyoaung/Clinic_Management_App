import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClinicById } from "@/lib/actions/clinics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  params: Promise<{ id: string }>;
};

export default async function ClinicDetailPage({ params }: PageProps) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/clinics" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{clinic.name}</h1>
          <p className="text-sm text-muted-foreground">Clinic ID: {clinic.code}</p>
        </div>
        <Badge variant="secondary">{clinic.patients.length} Patients</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Patients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinic.patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No patients assigned
                  </TableCell>
                </TableRow>
              ) : (
                clinic.patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-mono text-xs">{patient.displayId}</TableCell>
                    <TableCell>{patient.fullName}</TableCell>
                    <TableCell>{patient.status}</TableCell>
                    <TableCell>
                      {patient.currentAgent?.partnerId ?? patient.currentAgent?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
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
