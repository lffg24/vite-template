import { describe, expect, it } from "vitest";

import { createWebDirectAttemptState, webDirectAttemptReducer } from "./webDirectAttempt";
import type { WebDirectAssignedEvaluation, WebDirectInstrumentCode } from "./types";

const evaluations: WebDirectAssignedEvaluation[] = [
  { evaluationId: 101, instrumentCode: "PSICO_INTRA_A", name: "Forma A", totalQuestions: 123, status: "pending" },
  { evaluationId: 102, instrumentCode: "PSICO_EXTRA", name: "Extralaboral", totalQuestions: 31, status: "pending" },
  { evaluationId: 103, instrumentCode: "PSICO_ESTRES", name: "Estrés", totalQuestions: 31, status: "pending" },
];

function completeInstrument(
  state: ReturnType<typeof createWebDirectAttemptState>,
  code: WebDirectInstrumentCode,
) {
  let next = webDirectAttemptReducer(state, { type: "start_stage", code });
  next = webDirectAttemptReducer(next, { type: "begin_instrument" });
  next = webDirectAttemptReducer(next, {
    type: "answer",
    answer: { questionId: 1, order: 1, value: "Siempre", instrumentCode: code },
  });
  next = webDirectAttemptReducer(next, { type: "complete_active_stage" });
  return next;
}

describe("estado en memoria del intento WEB_DIRECT", () => {
  it("respeta la asignación A y deja datos generales al final", () => {
    const state = createWebDirectAttemptState("A", evaluations);
    expect(state.stages.map((stage) => stage.code)).toEqual([
      "PSICO_INTRA_A",
      "PSICO_EXTRA",
      "PSICO_ESTRES",
      "DATOS_GENERALES",
    ]);
    expect(state.stages[0].status).toBe("current");
    expect(state.stages.slice(1).every((stage) => stage.status === "pending")).toBe(true);
  });

  it("impide iniciar un componente fuera de orden", () => {
    const state = createWebDirectAttemptState("A", evaluations);
    const rejected = webDirectAttemptReducer(state, { type: "start_stage", code: "PSICO_EXTRA" });
    expect(rejected).toBe(state);

    const accepted = webDirectAttemptReducer(state, { type: "start_stage", code: "PSICO_INTRA_A" });
    expect(accepted.phase).toBe("instrument_intro");
    expect(accepted.activeStageCode).toBe("PSICO_INTRA_A");
  });

  it("mantiene respuestas solamente en memoria y por instrumento", () => {
    let state = createWebDirectAttemptState("A", evaluations);
    state = webDirectAttemptReducer(state, { type: "start_stage", code: "PSICO_INTRA_A" });
    state = webDirectAttemptReducer(state, { type: "begin_instrument" });
    state = webDirectAttemptReducer(state, {
      type: "answer",
      answer: { questionId: 25, order: 25, value: "Casi siempre", instrumentCode: "PSICO_INTRA_A", domainCode: "LIDERAZGO" },
    });

    expect(state.answersByInstrument.PSICO_INTRA_A?.[25]).toMatchObject({
      value: "Casi siempre",
      domainCode: "LIDERAZGO",
    });
    expect(state.answersByInstrument.PSICO_EXTRA).toBeUndefined();
  });

  it("avanza secuencialmente hasta revisión con datos generales como cierre", () => {
    let state = createWebDirectAttemptState("A", evaluations);
    state = completeInstrument(state, "PSICO_INTRA_A");
    expect(state.phase).toBe("instrument_complete");
    state = webDirectAttemptReducer(state, { type: "continue_after_instrument" });

    state = completeInstrument(state, "PSICO_EXTRA");
    state = webDirectAttemptReducer(state, { type: "continue_after_instrument" });
    state = completeInstrument(state, "PSICO_ESTRES");
    state = webDirectAttemptReducer(state, { type: "continue_after_instrument" });

    state = webDirectAttemptReducer(state, { type: "start_stage", code: "DATOS_GENERALES" });
    expect(state.phase).toBe("demographics");
    state = webDirectAttemptReducer(state, { type: "set_demographics", values: { cargo: "Coordinadora", ocupacion: "Psicóloga" } });
    state = webDirectAttemptReducer(state, { type: "complete_active_stage" });

    expect(state.phase).toBe("review");
    expect(state.stages.every((stage) => stage.status === "completed")).toBe(true);
    expect(state.demographics.cargo).toBe("Coordinadora");
  });

  it("exige declaración antes del único envío definitivo", () => {
    let state = createWebDirectAttemptState("A", evaluations);
    state = { ...state, phase: "review", stages: state.stages.map((stage) => ({ ...stage, status: "completed" as const })) };
    state = webDirectAttemptReducer(state, { type: "open_declaration" });

    const blocked = webDirectAttemptReducer(state, { type: "submit_started" });
    expect(blocked).toBe(state);

    state = webDirectAttemptReducer(state, { type: "set_declaration", accepted: true });
    state = webDirectAttemptReducer(state, { type: "submit_started" });
    expect(state.phase).toBe("submitting");

    const duplicate = webDirectAttemptReducer(state, { type: "submit_started" });
    expect(duplicate).toBe(state);

    state = webDirectAttemptReducer(state, { type: "submit_succeeded", receipt: { reference: "WD-1" } });
    expect(state.phase).toBe("submitted");
    expect(state.receipt?.reference).toBe("WD-1");
  });

  it("bloquea todo inicio si falta un instrumento asignado", () => {
    const state = createWebDirectAttemptState("A", evaluations.filter((evaluation) => evaluation.instrumentCode !== "PSICO_ESTRES"));
    expect(state.missingInstrumentCodes).toEqual(["PSICO_ESTRES"]);
    expect(webDirectAttemptReducer(state, { type: "start_stage", code: "PSICO_INTRA_A" })).toBe(state);
  });
});
