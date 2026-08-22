import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTreatmentById } from "@/lib/actions/treatments";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { canWriteTreatments } from "@/lib/permissions";
import { SoapNoteEditor } from "@/components/admin/soap-note-editor";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "New SOAP Note",
};

export default async function NewSoapNotePage({ params }: PageProps) {
  const { id: treatmentId } = await params;
  const [treatment, session] = await Promise.all([
    getTreatmentById(treatmentId),
    requireAuth(),
  ]);
  if (!treatment) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: treatment.patient.id },
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
      countryOfResidence: true,
      nationality: true,
    },
  });
  if (!patient) notFound();

  const canWrite = canWriteTreatments(session.user.role);
  const doctorName =
    treatment.doctor?.fullName || session.user.name || "Doctor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/dashboard/treatments/${treatmentId}`} />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add SOAP Note</h1>
          <p className="text-sm text-muted-foreground">
            {patient.fullName}
            {treatment.shortId ? ` · ${treatment.shortId}` : ""}
          </p>
        </div>
      </div>

      <SoapNoteEditor
        treatmentId={treatmentId}
        patient={{
          ...patient,
          dateOfBirth: patient.dateOfBirth.toISOString(),
        }}
        doctorName={doctorName}
        canWrite={canWrite}
      />
    </div>
  );
}
