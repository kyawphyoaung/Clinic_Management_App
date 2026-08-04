import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PatientRegistrationForm } from "@/components/registration/patient-registration-form";
import { Button } from "@/components/ui/button";

export default function StaffNewPatientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/dashboard/patients" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Digitize Paper Registration</h1>
          <p className="text-sm text-muted-foreground">
            Staff-only form to enter a signed paper registration into the system.
          </p>
        </div>
      </div>
      <PatientRegistrationForm mode="staff" />
    </div>
  );
}
