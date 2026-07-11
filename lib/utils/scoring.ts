import {
  QUESTIONNAIRES,
  type QuestionnaireDefinition,
  type SupportedLanguage,
} from "@/lib/constants/questionnaires";

export type ScoringResult = {
  totalScore: number;
  severity: Record<SupportedLanguage, string>;
  clinicalNote?: Record<SupportedLanguage, string>;
};

export function getQuestionnaire(
  formType: string
): QuestionnaireDefinition | null {
  return QUESTIONNAIRES[formType] ?? null;
}

export function calculateScore(
  formType: string,
  rawAnswers: Record<string, unknown>
): ScoringResult | null {
  const questionnaire = getQuestionnaire(formType);
  if (!questionnaire) return null;
  return questionnaire.scoringRules.calculate(rawAnswers);
}

export function getLocalizedResult(
  result: ScoringResult,
  language: SupportedLanguage
) {
  return {
    totalScore: result.totalScore,
    severity: result.severity[language],
    clinicalNote: result.clinicalNote?.[language],
  };
}
