"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { submitSurvey } from "@/lib/actions/survey";
import {
  QUESTIONNAIRES,
  type QuestionnaireDefinition,
  type SupportedLanguage,
} from "@/lib/constants/questionnaires";
import {
  GENDER_OPTIONS,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  UI_LABELS,
} from "@/lib/constants/labels";
import { demographicsSchema } from "@/lib/validations/survey";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type SurveyFormProps = {
  formId: string;
  patientId?: string;
  patientName?: string;
};

type SurveyResult = {
  totalScore: number;
  severity: string;
  clinicalNote?: string;
};

function buildFormSchema(
  questionnaire: QuestionnaireDefinition,
  isWalkIn: boolean
) {
  const answerShape: Record<string, z.ZodTypeAny> = {};
  for (const question of questionnaire.questions) {
    answerShape[question.id] = z.union([z.number(), z.string()], {
      errorMap: () => ({ message: "Please select an answer" }),
    });
  }

  const base = z.object({
    answers: z.object(answerShape),
    demographics: isWalkIn ? demographicsSchema : z.undefined().optional(),
  });

  return base;
}

export function SurveyForm({ formId, patientId, patientName }: SurveyFormProps) {
  const questionnaire = QUESTIONNAIRES[formId];
  const router = useRouter();
  const isWalkIn = !patientId;

  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAnswers = Object.fromEntries(
    questionnaire.questions.map((q) => [q.id, ""])
  );

  const formSchema = buildFormSchema(questionnaire, isWalkIn);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: defaultAnswers,
      demographics: isWalkIn
        ? { name: "", age: undefined as unknown as number, gender: "" }
        : undefined,
    },
  });

  const answers = watch("answers");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);

    const response = await submitSurvey({
      formId,
      language,
      answers: values.answers,
      patientId,
      demographics: values.demographics,
    });

    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }

    setResult({
      totalScore: response.totalScore,
      severity: response.severity,
      clinicalNote: response.clinicalNote,
    });
  }

  if (result) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{UI_LABELS.yourResults[language]}</CardTitle>
          <CardDescription>{questionnaire.title[language]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {UI_LABELS.totalScore[language]}
            </p>
            <p className="text-3xl font-bold">{result.totalScore}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {UI_LABELS.severity[language]}
            </p>
            <Badge className="text-sm">{result.severity}</Badge>
          </div>
          {result.clinicalNote && (
            <>
              <Separator />
              <Alert>
                <AlertTitle>{UI_LABELS.clinicalNote[language]}</AlertTitle>
                <AlertDescription>{result.clinicalNote}</AlertDescription>
              </Alert>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button render={<Link href="/" />}>
              {UI_LABELS.backToForms[language]}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{questionnaire.title[language]}</CardTitle>
              {patientName && (
                <CardDescription className="mt-1">
                  {patientName}
                </CardDescription>
              )}
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="language">{UI_LABELS.selectLanguage[language]}</Label>
              <Select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="mt-1.5"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang][language]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isWalkIn && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {UI_LABELS.patientInfo[language]}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">{UI_LABELS.name[language]}</Label>
              <Input
                id="name"
                {...register("demographics.name")}
                placeholder={UI_LABELS.name[language]}
              />
              {errors.demographics?.name && (
                <p className="text-sm text-destructive">
                  {errors.demographics.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">{UI_LABELS.age[language]}</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={150}
                {...register("demographics.age")}
              />
              {errors.demographics?.age && (
                <p className="text-sm text-destructive">
                  {errors.demographics.age.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">{UI_LABELS.gender[language]}</Label>
              <Select
                id="gender"
                {...register("demographics.gender")}
                defaultValue=""
              >
                <option value="" disabled>
                  {UI_LABELS.gender[language]}
                </option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label[language]}
                  </option>
                ))}
              </Select>
              {errors.demographics?.gender && (
                <p className="text-sm text-destructive">
                  {errors.demographics.gender.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-8 pt-6">
          {questionnaire.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <p className="font-medium leading-relaxed">
                {question.text[language]}
              </p>
              <div className="space-y-2">
                {question.options?.map((option) => {
                  const optionId = `${question.id}-${option.value}`;
                  const isChecked =
                    String(answers?.[question.id]) === String(option.value);

                  return (
                    <label
                      key={optionId}
                      htmlFor={optionId}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        id={optionId}
                        name={`answers.${question.id}`}
                        value={String(option.value)}
                        checked={isChecked}
                        onChange={() =>
                          setValue(
                            `answers.${question.id}` as `answers.${string}`,
                            option.value,
                            { shouldValidate: true }
                          )
                        }
                        className="mt-1"
                      />
                      <span className="text-sm leading-relaxed">
                        {option.label[language]}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.answers?.[question.id as keyof typeof errors.answers] && (
                <p className="text-sm text-destructive">
                  {UI_LABELS.required[language]}
                </p>
              )}
              {index < questionnaire.questions.length - 1 && (
                <Separator className="mt-6" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-4" />
          {UI_LABELS.backToForms[language]}
        </Button>
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {UI_LABELS.submit[language]}
        </Button>
      </div>
    </form>
  );
}
