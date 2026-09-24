import type {
  WebDirectAnswer,
  WebDirectAssignedEvaluation,
  WebDirectDemographicValues,
  WebDirectForm,
  WebDirectInstrumentCode,
  WebDirectJourneyCode,
  WebDirectJourneyStage,
} from "./types";
import { buildWebDirectJourney, getIncompleteWebDirectStages } from "./webDirectFlow";

export type WebDirectAttemptPhase =
  | "journey"
  | "instrument_intro"
  | "instrument"
  | "instrument_complete"
  | "demographics"
  | "review"
  | "declaration"
  | "submitting"
  | "submitted";

export type WebDirectSubmissionReceipt = {
  completedAt?: string | null;
  reference?: string | null;
};

export type WebDirectAttemptState = {
  phase: WebDirectAttemptPhase;
  form: WebDirectForm;
  stages: WebDirectJourneyStage[];
  missingInstrumentCodes: WebDirectInstrumentCode[];
  activeStageCode: WebDirectJourneyCode | null;
  answersByInstrument: Partial<Record<WebDirectInstrumentCode, Record<number, WebDirectAnswer>>>;
  demographics: WebDirectDemographicValues;
  declarationAccepted: boolean;
  submissionError: string | null;
  receipt: WebDirectSubmissionReceipt | null;
};

export type WebDirectAttemptAction =
  | { type: "start_stage"; code: WebDirectJourneyCode }
  | { type: "begin_instrument" }
  | { type: "answer"; answer: WebDirectAnswer }
  | { type: "set_demographics"; values: WebDirectDemographicValues }
  | { type: "complete_active_stage" }
  | { type: "continue_after_instrument" }
  | { type: "open_declaration" }
  | { type: "back_to_review" }
  | { type: "set_declaration"; accepted: boolean }
  | { type: "submit_started" }
  | { type: "submit_failed"; message: string }
  | { type: "submit_succeeded"; receipt?: WebDirectSubmissionReceipt };

function normalizeStages(stages: WebDirectJourneyStage[]): WebDirectJourneyStage[] {
  let currentAssigned = false;
  return stages.map((stage) => {
    if (stage.status === "completed") return stage;
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...stage, status: "current" };
    }
    return { ...stage, status: "pending" };
  });
}

export function createWebDirectAttemptState(
  form: WebDirectForm,
  evaluations: WebDirectAssignedEvaluation[],
): WebDirectAttemptState {
  const journey = buildWebDirectJourney(form, evaluations, "pending");
  return {
    phase: "journey",
    form,
    stages: normalizeStages(journey.stages),
    missingInstrumentCodes: journey.missingInstrumentCodes,
    activeStageCode: null,
    answersByInstrument: {},
    demographics: {},
    declarationAccepted: false,
    submissionError: null,
    receipt: null,
  };
}

function nextIncompleteStage(stages: WebDirectJourneyStage[]): WebDirectJourneyStage | undefined {
  return stages.find((stage) => stage.status !== "completed");
}

export function webDirectAttemptReducer(
  state: WebDirectAttemptState,
  action: WebDirectAttemptAction,
): WebDirectAttemptState {
  switch (action.type) {
    case "start_stage": {
      if (state.phase !== "journey" || state.missingInstrumentCodes.length > 0) return state;
      const nextStage = nextIncompleteStage(state.stages);
      if (!nextStage || nextStage.code !== action.code) return state;
      return {
        ...state,
        phase: action.code === "DATOS_GENERALES" ? "demographics" : "instrument_intro",
        activeStageCode: action.code,
        submissionError: null,
      };
    }
    case "begin_instrument":
      if (state.phase !== "instrument_intro" || state.activeStageCode === "DATOS_GENERALES" || !state.activeStageCode) return state;
      return { ...state, phase: "instrument" };
    case "answer":
      if (state.phase !== "instrument" || state.activeStageCode !== action.answer.instrumentCode) return state;
      return {
        ...state,
        answersByInstrument: {
          ...state.answersByInstrument,
          [action.answer.instrumentCode]: {
            ...state.answersByInstrument[action.answer.instrumentCode],
            [action.answer.questionId]: action.answer,
          },
        },
      };
    case "set_demographics":
      if (state.phase !== "demographics") return state;
      return { ...state, demographics: action.values };
    case "complete_active_stage": {
      if (!state.activeStageCode || !["instrument", "demographics"].includes(state.phase)) return state;
      const stages = normalizeStages(state.stages.map((stage) => (
        stage.code === state.activeStageCode ? { ...stage, status: "completed" as const } : stage
      )));
      const allComplete = getIncompleteWebDirectStages(stages).length === 0;
      return {
        ...state,
        stages,
        phase: allComplete ? "review" : "instrument_complete",
      };
    }
    case "continue_after_instrument":
      if (state.phase !== "instrument_complete") return state;
      return { ...state, phase: "journey", activeStageCode: null };
    case "open_declaration":
      if (state.phase !== "review" || getIncompleteWebDirectStages(state.stages).length > 0) return state;
      return { ...state, phase: "declaration", submissionError: null };
    case "back_to_review":
      if (state.phase !== "declaration") return state;
      return { ...state, phase: "review", submissionError: null };
    case "set_declaration":
      if (state.phase !== "declaration") return state;
      return { ...state, declarationAccepted: action.accepted, submissionError: null };
    case "submit_started":
      if (state.phase !== "declaration" || !state.declarationAccepted || getIncompleteWebDirectStages(state.stages).length > 0) return state;
      return { ...state, phase: "submitting", submissionError: null };
    case "submit_failed":
      if (state.phase !== "submitting") return state;
      return { ...state, phase: "declaration", submissionError: action.message };
    case "submit_succeeded":
      if (state.phase !== "submitting") return state;
      return { ...state, phase: "submitted", submissionError: null, receipt: action.receipt ?? {} };
    default:
      return state;
  }
}
