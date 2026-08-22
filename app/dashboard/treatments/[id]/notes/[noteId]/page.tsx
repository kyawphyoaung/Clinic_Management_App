import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientNote } from "@/lib/actions/patient-notes";
import { requireAuth } from "@/lib/session";
import { canWriteTreatments } from "@/lib/permissions";
import { SoapNoteEditor, type NotePin } from "@/components/admin/soap-note-editor";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string; noteId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { noteId } = await params;
  const note = await getPatientNote(noteId);
  return {
    title: note ? `SOAP Note – ${note.title}` : "SOAP Note",
  };
}

export default async function EditSoapNotePage({ params }: PageProps) {
  const { id: treatmentId, noteId } = await params;
  const [note, session] = await Promise.all([
    getPatientNote(noteId),
    requireAuth(),
  ]);

  if (!note || note.treatment?.id !== treatmentId) notFound();

  const canWrite = canWriteTreatments(session.user.role);
  const pins = Array.isArray(note.pins) ? (note.pins as NotePin[]) : [];

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
          <h1 className="text-2xl font-semibold">{note.title}</h1>
          <p className="text-sm text-muted-foreground">
            {note.patient.fullName}
          </p>
        </div>
      </div>

      <SoapNoteEditor
        treatmentId={treatmentId}
        patient={{
          id: note.patient.id,
          fullName: note.patient.fullName,
          dateOfBirth:
            note.patient.dateOfBirth instanceof Date
              ? note.patient.dateOfBirth.toISOString()
              : String(note.patient.dateOfBirth),
          countryOfResidence: note.patient.countryOfResidence,
          nationality: note.patient.nationality,
        }}
        doctorName={note.createdBy.fullName}
        canWrite={canWrite}
        note={{
          id: note.id,
          title: note.title,
          subjective: note.subjective,
          objective: note.objective,
          assessment: note.assessment,
          plan: note.plan,
          bloodPressure: note.bloodPressure,
          heartRate: note.heartRate,
          weight: note.weight,
          height: note.height,
          bodyTemperature: note.bodyTemperature,
          diagramType: note.diagramType,
          pins,
          updatedAt: note.updatedAt,
          createdAt: note.createdAt,
          createdBy: note.createdBy,
        }}
      />
    </div>
  );
}
