"use server";

import { prisma } from "@/lib/db";
import { QUESTIONNAIRES } from "@/lib/constants/questionnaires";
import {
  buildSurveySubmissionSchema,
  type SurveySubmissionInput,
} from "@/lib/validations/survey";
import { calculateScore, getLocalizedResult } from "@/lib/utils/scoring";
import { getFirstZodError } from "@/lib/utils/zod";
import { toInputJsonValue } from "@/lib/utils/json";
import { createPatientWithVisit } from "@/lib/utils/create-patient-with-visit";
import { PatientSource } from "@/prisma/generated/prisma/client";

export type SurveyActionResult =
  | {
      success: true;
      totalScore: number;
      severity: string;
      clinicalNote?: string;
      patientId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function submitSurvey(
  input: SurveySubmissionInput
): Promise<SurveyActionResult> {
  try {
    if (!QUESTIONNAIRES[input.formId]) {
      return { success: false, error: "Invalid form type" };
    }

    const isWalkIn = !input.patientId;
    const schema = buildSurveySubmissionSchema(input.formId, isWalkIn);
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: getFirstZodError(parsed.error, "Invalid submission data"),
      };
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      let patientId = data.patientId;

      if (isWalkIn && data.demographics) {
        const dob = new Date();
        dob.setFullYear(dob.getFullYear() - data.demographics.age);

        const { patient } = await createPatientWithVisit(
          tx,
          {
            displayId: "pending",
            patientNumber: "pending",
            fullName: data.demographics.name,
            gender: data.demographics.gender,
            dateOfBirth: dob,
            source: PatientSource.WALKIN,
          },
          { source: "WALKIN" }
        );
        patientId = patient.id;
      } else if (patientId) {
        const existing = await tx.patient.findUnique({
          where: { id: patientId },
        });
        if (!existing) {
          throw new Error("Patient not found");
        }
      } else {
        throw new Error("Patient identification required");
      }

      await tx.surveyResponse.create({
        data: {
          patientId: patientId!,
          formType: data.formId,
          rawAnswers: toInputJsonValue(
            data.answers as Record<string, string | number>
          ),
          language: data.language,
        },
      });

      return patientId!;
    });

    const scoreResult = calculateScore(input.formId, input.answers);
    if (!scoreResult) {
      return { success: false, error: "Scoring failed" };
    }

    const localized = getLocalizedResult(scoreResult, input.language);

    return {
      success: true,
      totalScore: localized.totalScore,
      severity: localized.severity,
      clinicalNote: localized.clinicalNote,
      patientId: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Submission failed",
    };
  }
}
