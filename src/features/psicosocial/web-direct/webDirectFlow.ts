import type {
  WebDirectAssignedEvaluation,
  WebDirectConditionalRule,
  WebDirectForm,
  WebDirectInstrumentCode,
  WebDirectJourneyStage,
  WebDirectQuestion,
  WebDirectStageStatus,
} from "./types";

const INTRA_BY_FORM: Record<WebDirectForm, WebDirectInstrumentCode> = {
  A: "PSICO_INTRA_A",
  B: "PSICO_INTRA_B",
};

const STAGE_COPY: Record<
  WebDirectInstrumentCode,
  { title: string; description: string }
> = {
  PSICO_INTRA_A: {
    title: "Cuestionario intralaboral · Forma A",
    description: "Preguntas sobre las condiciones de tu trabajo habitual.",
  },
  PSICO_INTRA_B: {
    title: "Cuestionario intralaboral · Forma B",
    description: "Preguntas sobre las condiciones de tu trabajo habitual.",
  },
  PSICO_EXTRA: {
    title: "Factores extralaborales",
    description: "Preguntas sobre condiciones fuera del trabajo.",
  },
  PSICO_ESTRES: {
    title: "Cuestionario de estrés",
    description: "Preguntas sobre síntomas relacionados con el estrés.",
  },
};

export type WebDirectJourneyResult = {
  stages: WebDirectJourneyStage[];
  missingInstrumentCodes: WebDirectInstrumentCode[];
};

function stageFromEvaluation(evaluation: WebDirectAssignedEvaluation): WebDirectJourneyStage {
  const copy = STAGE_COPY[evaluation.instrumentCode];
  return {
    code: evaluation.instrumentCode,
    evaluationId: evaluation.evaluationId,
    title: copy.title,
    description: copy.description,
    totalQuestions: evaluation.totalQuestions,
    status: evaluation.status,
  };
}

export function buildWebDirectJourney(
  form: WebDirectForm,
  evaluations: WebDirectAssignedEvaluation[],
  demographicStatus: WebDirectStageStatus,
): WebDirectJourneyResult {
  const requiredCodes: WebDirectInstrumentCode[] = [
    INTRA_BY_FORM[form],
    "PSICO_EXTRA",
    "PSICO_ESTRES",
  ];
  const byCode = new Map(evaluations.map((evaluation) => [evaluation.instrumentCode, evaluation]));
  const missingInstrumentCodes = requiredCodes.filter((code) => !byCode.has(code));
  const stages = requiredCodes
    .map((code) => byCode.get(code))
    .filter((evaluation): evaluation is WebDirectAssignedEvaluation => Boolean(evaluation))
    .map(stageFromEvaluation);

  stages.push({
    code: "DATOS_GENERALES",
    title: "Datos generales",
    description: "Información sociodemográfica y ocupacional.",
    status: demographicStatus,
  });

  return { stages, missingInstrumentCodes };
}

export function getApplicableWebDirectQuestions(
  questions: WebDirectQuestion[],
  conditionalRules: WebDirectConditionalRule[] = [],
): WebDirectQuestion[] {
  const omittedOrders = new Set(
    conditionalRules
      .filter((rule) => rule.answer === false)
      .flatMap((rule) => rule.questionOrders),
  );

  return [...questions]
    .filter((question) => !omittedOrders.has(question.order))
    .sort((left, right) => left.order - right.order || left.questionId - right.questionId);
}

export function getJourneyCompletion(stages: WebDirectJourneyStage[]): number {
  if (!stages.length) return 0;
  const complete = stages.filter((stage) => stage.status === "completed").length;
  return Math.round((complete / stages.length) * 100);
}

export function getMissingRequiredQuestionIds(
  questions: WebDirectQuestion[],
  answers: Record<number, string>,
  conditionalRules: WebDirectConditionalRule[] = [],
): number[] {
  return getApplicableWebDirectQuestions(questions, conditionalRules)
    .filter((question) => question.required ?? true)
    .filter((question) => !answers[question.questionId]?.trim())
    .map((question) => question.questionId);
}

export function getIncompleteWebDirectStages(
  stages: WebDirectJourneyStage[],
): WebDirectJourneyStage[] {
  return stages.filter((stage) => stage.status !== "completed");
}
