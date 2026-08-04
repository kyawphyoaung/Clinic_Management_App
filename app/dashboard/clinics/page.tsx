import Link from "next/link";
import { getClinics } from "@/lib/actions/clinics";
import { ClinicCreateForm } from "@/components/admin/clinic-create-form";
import { ResponsiveList, MobileField } from "@/components/admin/responsive-list";
import { Button } from "@/components/ui/button";
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

export default async function ClinicsPage() {
  const clinics = await getClinics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clinics</h1>
        <p className="text-sm text-muted-foreground">Manage clinic master data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Clinic</CardTitle>
          <CardDescription>Clinic ID must be unique two digits (e.g. 01)</CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicCreateForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinic List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveList
            table={
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic ID</TableHead>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No clinics yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    clinics.map((clinic) => (
                      <TableRow key={clinic.id}>
                        <TableCell className="font-mono">{clinic.code}</TableCell>
                        <TableCell>{clinic.name}</TableCell>
                        <TableCell>{clinic._count.patients}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href={`/dashboard/clinics/${clinic.id}`} />
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
            }
            cards={
              <div className="space-y-3 p-4">
                {clinics.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No clinics yet
                  </p>
                ) : (
                  clinics.map((clinic) => (
                    <Card key={clinic.id} className="shadow-sm">
                      <CardContent className="space-y-2 p-4">
                        <p className="font-mono text-xs text-muted-foreground">
                          {clinic.code}
                        </p>
                        <p className="font-medium">{clinic.name}</p>
                        <MobileField label="Patients">
                          {clinic._count.patients}
                        </MobileField>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          render={
                            <Link href={`/dashboard/clinics/${clinic.id}`} />
                          }
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
