import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { SurveyForm } from "@/components/survey/survey-form";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ patientId?: string }>;
};

export default async function SurveyPage({ params, searchParams }: PageProps) {
  const { formId } = await params;
  const { patientId } = await searchParams;

  const questionnaire = QUESTIONNAIRES[formId];
  if (!questionnaire) {
    notFound();
  }

  let patientName: string | undefined;
  if (patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { fullName: true, preferredName: true },
    });
    if (!patient) {
      notFound();
    }
    patientName = patient.preferredName ?? patient.fullName;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon-sm" render={<Link href="/" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Clinical Survey</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <SurveyForm
          formId={formId}
          patientId={patientId}
          patientName={patientName}
        />
      </main>
    </div>
  );
}
