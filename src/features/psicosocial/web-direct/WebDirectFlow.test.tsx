import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebDirectJourneyScreen } from "./WebDirectJourneyScreen";
import { WebDirectQuestionScreen } from "./WebDirectQuestionScreen";
import { buildWebDirectJourney, getApplicableWebDirectQuestions, getNextPendingWebDirectConditional } from "./webDirectFlow";
import type { WebDirectAssignedEvaluation, WebDirectQuestion } from "./types";

const evaluations: WebDirectAssignedEvaluation[] = [
  { evaluationId: 2, instrumentCode: "PSICO_INTRA_B", name: "Forma B", totalQuestions: 97, status: "current" },
  { evaluationId: 1, instrumentCode: "PSICO_INTRA_A", name: "Forma A", totalQuestions: 123, status: "current" },
  { evaluationId: 3, instrumentCode: "PSICO_EXTRA", name: "Extralaboral", totalQuestions: 31, status: "pending" },
  { evaluationId: 4, instrumentCode: "PSICO_ESTRES", name: "Estrés", totalQuestions: 31, status: "pending" },
];

const questions: WebDirectQuestion[] = [
  {
    questionId: 20,
    order: 2,
    text: "Segunda pregunta",
    options: [
      { label: "Siempre", value: "Siempre" },
      { label: "Nunca", value: "Nunca" },
    ],
    dimensionCode: "claridad_rol",
    domainCode: "control_sobre_el_trabajo",
  },
  {
    questionId: 10,
    order: 1,
    text: "Primera pregunta",
    helpText: "Texto de apoyo específico para esta pregunta.",
    options: [
      { label: "Siempre", value: "Siempre" },
      { label: "Nunca", value: "Nunca" },
    ],
    dimensionCode: "demandas_ambientales_esfuerzo",
    domainCode: "demandas_del_trabajo",
  },
];

describe("recorrido WEB_DIRECT por asignación", () => {
  it("usa únicamente la Forma A asignada y deja datos generales al final", () => {
    const result = buildWebDirectJourney("A", evaluations, "pending");

    expect(result.missingInstrumentCodes).toEqual([]);
    expect(result.stages.map((stage) => stage.code)).toEqual([
      "PSICO_INTRA_A",
      "PSICO_EXTRA",
      "PSICO_ESTRES",
      "DATOS_GENERALES",
    ]);
    expect(result.stages.some((stage) => stage.code === "PSICO_INTRA_B")).toBe(false);
  });

  it("usa únicamente la Forma B asignada y detecta instrumentos faltantes", () => {
    const result = buildWebDirectJourney("B", evaluations.filter((evaluation) => evaluation.instrumentCode !== "PSICO_ESTRES"), "pending");

    expect(result.stages.map((stage) => stage.code)).toEqual([
      "PSICO_INTRA_B",
      "PSICO_EXTRA",
      "DATOS_GENERALES",
    ]);
    expect(result.missingInstrumentCodes).toEqual(["PSICO_ESTRES"]);
  });

  it("ordena por el número oficial y aplica únicamente las condiciones recibidas", () => {
    const result = getApplicableWebDirectQuestions(questions, [
      { code: "bloque-configurado", questionOrders: [2], answer: false },
    ]);

    expect(result.map((question) => question.order)).toEqual([1]);
    expect(questions.map((question) => question.order)).toEqual([2, 1]);
  });

  it("reserva las preguntas controladas hasta responder su pregunta de contexto", () => {
    const pending = getApplicableWebDirectQuestions(questions, [
      { code: "contexto-final", questionOrders: [2], answer: null },
    ]);
    const enabled = getApplicableWebDirectQuestions(questions, [
      { code: "contexto-final", questionOrders: [2], answer: true },
    ]);

    expect(pending.map((question) => question.order)).toEqual([1]);
    expect(enabled.map((question) => question.order)).toEqual([1, 2]);
  });

  it("ubica las preguntas de contexto justo antes de sus bloques oficiales", () => {
    const rules = [
      { code: "clientes", questionOrders: [106, 107, 108], answer: null },
      { code: "jefatura", questionOrders: [115, 116], answer: null },
    ];

    expect(getNextPendingWebDirectConditional(rules, 104, 105)).toBeUndefined();
    expect(getNextPendingWebDirectConditional(rules, 105)?.code).toBe("clientes");
    expect(getNextPendingWebDirectConditional([{ ...rules[0], answer: true }, rules[1]], 114)?.code).toBe("jefatura");
  });

  it("expone el recorrido como sesión única sin guardar ni retomar", () => {
    const { stages } = buildWebDirectJourney("B", evaluations, "pending");
    render(
      <WebDirectJourneyScreen
        form="B"
        stages={stages}
        onStartStage={() => undefined}
        onBack={() => undefined}
      />,
    );

    expect(screen.getByText(/Forma B, extralaboral, estrés y al final tus datos generales/i)).toBeInTheDocument();
    expect(screen.getByText(/Si sales antes de enviarla, deberás comenzar de nuevo/i)).toBeInTheDocument();
    expect(screen.queryByText(/guardar y salir|retomar|continuar después/i)).not.toBeInTheDocument();
    const orderedItems = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(orderedItems[0]).toMatch(/Intralaboral.*Forma B/i);
    expect(orderedItems.at(-1)).toMatch(/Datos generales/i);
  });

  it("conserva instrumento, orden, dimensión y dominio al responder", () => {
    const onAnswer = vi.fn();
    const onNext = vi.fn();
    render(
      <WebDirectQuestionScreen
        form="B"
        instrumentCode="PSICO_INTRA_B"
        instrumentLabel="Cuestionario intralaboral"
        questions={questions}
        currentQuestionId={10}
        answers={{}}
        onAnswer={onAnswer}
        onPrevious={() => undefined}
        onNext={onNext}
      />,
    );

    expect(screen.getByRole("heading", { name: "Primera pregunta" })).toBeInTheDocument();
    expect(screen.getByText("Texto de apoyo específico para esta pregunta.")).toBeInTheDocument();
    expect(screen.queryByText("Selecciona la opción que mejor refleje tu experiencia.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Siempre" }));
    expect(onAnswer).toHaveBeenCalledWith({
      questionId: 10,
      order: 1,
      value: "Siempre",
      instrumentCode: "PSICO_INTRA_B",
      dimensionCode: "demandas_ambientales_esfuerzo",
      domainCode: "demandas_del_trabajo",
    });
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ questionId: 10, order: 1 }));
  });
});
