import { z } from "zod";
import type { QuestionnaireDefinition } from "@/lib/constants/questionnaires";

const clientDemographicsSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  age: z
    .number({ error: "Age is required" })
    .int()
    .min(1, "Age must be at least 1")
    .max(150, "Age must be 150 or less"),
  gender: z.string().min(1, "Gender is required"),
});

export function buildClientSurveySchema(
  questionnaire: QuestionnaireDefinition,
  isWalkIn: boolean
) {
  const answerShape: Record<string, z.ZodTypeAny> = {};
  for (const question of questionnaire.questions) {
    answerShape[question.id] = z
      .union([z.number(), z.string()])
      .refine((val) => val !== "" && val !== null && val !== undefined, {
        message: "Please select an answer",
      });
  }

  return z.object({
    answers: z.object(answerShape),
    demographics: isWalkIn ? clientDemographicsSchema : z.undefined().optional(),
  });
}

export type ClientSurveyFormValues = z.infer<
  ReturnType<typeof buildClientSurveySchema>
>;
