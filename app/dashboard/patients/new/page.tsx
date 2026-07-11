import Link from "next/link";
import { getAgentsForSelect } from "@/lib/actions/agents";
import { PatientForm } from "@/components/admin/patient-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewPatientPage() {
  const agents = await getAgentsForSelect();

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
          <h1 className="text-2xl font-semibold">Register Patient</h1>
          <p className="text-sm text-muted-foreground">
            Manually register a new patient. Names support trilingual characters.
          </p>
        </div>
      </div>
      <PatientForm agents={agents} />
    </div>
  );
}
