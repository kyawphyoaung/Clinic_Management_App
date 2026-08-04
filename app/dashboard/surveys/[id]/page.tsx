import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSurveyResponseById } from "@/lib/actions/surveys-admin";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import { calculateScore, getLocalizedResult } from "@/lib/utils/scoring";
import type { SupportedLanguage } from "@/lib/constants/questionnaires";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const survey = await getSurveyResponseById(id);
  return {
    title: survey ? `Survey - ${survey.patient.fullName}` : "Survey Detail",
  };
}

export default async function SurveyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const survey = await getSurveyResponseById(id);
  if (!survey) notFound();

  const questionnaire = QUESTIONNAIRES[survey.formType];
  const rawAnswers = survey.rawAnswers as Record<string, unknown>;
  const language = survey.language as SupportedLanguage;
  const scoreResult = calculateScore(survey.formType, rawAnswers);
  const localized = scoreResult
    ? getLocalizedResult(scoreResult, language)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href="/dashboard/surveys" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {questionnaire?.title.en ?? survey.formType}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/dashboard/patients/${survey.patient.id}`}
              className="underline-offset-2 hover:underline"
            >
              {survey.patient.fullName}
            </Link>{" "}
            · {survey.patient.displayId} · Submitted{" "}
            {survey.createdAt.toLocaleString()}
          </p>
        </div>
        {localized && (
          <Badge variant="secondary">Score: {localized.totalScore}</Badge>
        )}
      </div>

      {localized && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
            <CardDescription>{localized.severity}</CardDescription>
          </CardHeader>
          {localized.clinicalNote && (
            <CardContent>
              <p className="text-sm text-muted-foreground">Clinical Note</p>
              <p className="mt-1 text-sm">{localized.clinicalNote}</p>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Answers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionnaire ? (
            questionnaire.questions.map((question) => {
              const answer = rawAnswers[question.id];
              const optionLabel = question.options?.find(
                (o) => String(o.value) === String(answer)
              )?.label[language];
              return (
                <div key={question.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm text-muted-foreground">
                    {question.text[language] ?? question.text.en}
                  </p>
                  <p className="mt-1 font-medium">
                    {optionLabel ?? String(answer ?? "—")}
                  </p>
                </div>
              );
            })
          ) : (
            <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(rawAnswers, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
