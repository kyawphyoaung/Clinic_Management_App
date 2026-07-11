import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientById } from "@/lib/actions/patients";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { calculateScore, getLocalizedResult } from "@/lib/utils/scoring";
import type { SupportedLanguage } from "@/lib/constants/questionnaires";
import { PatientSource, PatientStatus } from "@/prisma/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/admin/status-select";
import { StatusBadge } from "@/components/admin/status-badge";
import { PatientSurveyLinks } from "@/components/admin/patient-survey-links";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  const statusOptions = [
    { value: PatientStatus.PENDING, label: "Pending" },
    { value: PatientStatus.APPOINTED, label: "Appointed" },
    { value: PatientStatus.TREATING, label: "Treating" },
    { value: PatientStatus.COMPLETED, label: "Completed" },
  ];

  const sourceLabels: Record<PatientSource, string> = {
    WALKIN: "Walk-in",
    BOOKING: "Booking",
    AGENT: "Agent Referral",
  };

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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            Patient ID: {patient.id}
          </p>
        </div>
      </div>

      <PatientSurveyLinks patientId={patient.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{patient.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age</span>
              <span>{patient.age ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span className="capitalize">{patient.gender ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span>{sourceLabels[patient.source]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent</span>
              <span>{patient.agent?.name ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusSelect
                patientId={patient.id}
                currentStatus={patient.status}
                options={statusOptions}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span>{patient.createdAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{patient.updatedAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Surveys</span>
              <span>{patient.surveys.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status</span>
              <StatusBadge
                status={patient.status}
                label={
                  statusOptions.find((o) => o.value === patient.status)?.label ??
                  patient.status
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Survey Results</h2>
        {patient.surveys.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No survey responses yet
            </CardContent>
          </Card>
        ) : (
          patient.surveys.map((survey) => {
            const questionnaire = QUESTIONNAIRES[survey.formType];
            const rawAnswers = survey.rawAnswers as Record<string, unknown>;
            const scoreResult = calculateScore(survey.formType, rawAnswers);
            const language = survey.language as SupportedLanguage;
            const localized = scoreResult
              ? getLocalizedResult(scoreResult, language)
              : null;

            return (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {questionnaire?.title.en ?? survey.formType}
                      </CardTitle>
                      <CardDescription>
                        Submitted {survey.createdAt.toLocaleString()} · Language:{" "}
                        {language.toUpperCase()}
                      </CardDescription>
                    </div>
                    {localized && (
                      <Badge variant="secondary">
                        Score: {localized.totalScore}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {localized ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Severity / Diagnosis
                        </p>
                        <p className="mt-1 font-medium">{localized.severity}</p>
                      </div>
                      {localized.clinicalNote && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Clinical Note
                          </p>
                          <p className="mt-1 text-sm">{localized.clinicalNote}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Unable to calculate score for this form type.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
