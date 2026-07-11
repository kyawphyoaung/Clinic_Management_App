import { z } from "zod";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";

export const supportedLanguageSchema = z.enum(["en", "mm", "zh"]);

export const demographicsSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  age: z.coerce.number().int().min(1).max(150),
  gender: z.string().min(1, "Gender is required"),
});

export function buildSurveySubmissionSchema(formId: string, isWalkIn: boolean) {
  const questionnaire = QUESTIONNAIRES[formId];
  if (!questionnaire) {
    throw new Error(`Unknown form: ${formId}`);
  }

  const answerShape: Record<string, z.ZodTypeAny> = {};
  for (const question of questionnaire.questions) {
    answerShape[question.id] = z.union([z.number(), z.string()]);
  }

  const base = z.object({
    formId: z.literal(formId),
    language: supportedLanguageSchema,
    answers: z.object(answerShape),
    patientId: z.string().uuid().optional(),
    demographics: isWalkIn ? demographicsSchema : z.undefined().optional(),
  });

  if (isWalkIn) {
    return base.refine((data) => !!data.demographics, {
      message: "Demographics are required for walk-in patients",
      path: ["demographics"],
    });
  }

  return base.refine((data) => !!data.patientId, {
    message: "Patient ID is required for pre-registered patients",
    path: ["patientId"],
  });
}

export type SurveySubmissionInput = z.infer<
  ReturnType<typeof buildSurveySubmissionSchema>
>;
