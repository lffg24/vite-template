import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebDirectDeclarationScreen } from "./WebDirectDeclarationScreen";
import { WebDirectReviewScreen } from "./WebDirectReviewScreen";
import { WebDirectSubmittedScreen } from "./WebDirectSubmittedScreen";
import { getMissingRequiredQuestionIds } from "./webDirectFlow";
import type { WebDirectJourneyStage, WebDirectQuestion } from "./types";

const completedStages: WebDirectJourneyStage[] = [
  { code: "PSICO_INTRA_B", evaluationId: 10, title: "Cuestionario intralaboral · Forma B", description: "Condiciones de trabajo", totalQuestions: 97, status: "completed" },
  { code: "PSICO_EXTRA", evaluationId: 11, title: "Factores extralaborales", description: "Condiciones fuera del trabajo", totalQuestions: 31, status: "completed" },
  { code: "PSICO_ESTRES", evaluationId: 12, title: "Cuestionario de estrés", description: "Síntomas relacionados con el estrés", totalQuestions: 31, status: "completed" },
  { code: "DATOS_GENERALES", title: "Datos generales", description: "Información sociodemográfica y ocupacional", status: "completed" },
];

describe("cierre del intento WEB_DIRECT", () => {
  it("presenta los cuatro componentes completos en el orden del intento", () => {
    render(
      <WebDirectReviewScreen form="B" stages={completedStages} onBack={() => undefined} onContinue={() => undefined} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Cuestionario intralaboral · Forma B");
    expect(items[3]).toHaveTextContent("Datos generales");
    expect(screen.getByRole("button", { name: /Continuar a declaración final/i })).toBeEnabled();
    expect(screen.queryByText(/puntaje|nivel de riesgo|resultado individual/i)).not.toBeInTheDocument();
  });

  it("impide avanzar cuando queda un componente pendiente", () => {
    const stages = completedStages.map((stage) => stage.code === "PSICO_ESTRES" ? { ...stage, status: "current" as const } : stage);
    render(<WebDirectReviewScreen form="B" stages={stages} onBack={() => undefined} onContinue={() => undefined} />);

    expect(screen.getByRole("alert")).toHaveTextContent("todavía no está completa");
    expect(screen.getByRole("button", { name: /Continuar a declaración final/i })).toBeDisabled();
  });

  it("mantiene bloqueado el envío hasta aceptar expresamente la declaración", () => {
    const onAcceptedChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <WebDirectDeclarationScreen accepted={false} onAcceptedChange={onAcceptedChange} onBack={() => undefined} onSubmit={onSubmit} />,
    );

    expect(screen.getByRole("button", { name: /Confirmar y finalizar/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto expresamente/i }));
    expect(onAcceptedChange).toHaveBeenCalledWith(true);

    rerender(
      <WebDirectDeclarationScreen accepted onAcceptedChange={onAcceptedChange} onBack={() => undefined} onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirmar y finalizar/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("expone estados de envío y error sin habilitar una segunda confirmación", () => {
    const { rerender } = render(
      <WebDirectDeclarationScreen accepted submitting onAcceptedChange={() => undefined} onBack={() => undefined} onSubmit={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: /Enviando presentación/i })).toBeDisabled();

    rerender(
      <WebDirectDeclarationScreen accepted onAcceptedChange={() => undefined} onBack={() => undefined} onSubmit={() => undefined} error="No pudimos confirmar el envío." />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos confirmar el envío.");
  });

  it("confirma la recepción sin revelar resultados al participante", () => {
    render(
      <WebDirectSubmittedScreen
        completedAt="23 de septiembre de 2026, 8:30 p. m."
        receiptReference="WD-2026-0001"
        responsible={{ name: "María Pérez", email: "maria@example.com" }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Información registrada correctamente");
    expect(screen.getByText("WD-2026-0001")).toBeInTheDocument();
    expect(screen.getByText(/No muestra puntajes, resultados, dimensiones ni niveles de riesgo/i)).toBeInTheDocument();
  });

  it("excluye preguntas no aplicables al validar completitud", () => {
    const questions: WebDirectQuestion[] = [
      { questionId: 1, order: 1, text: "Pregunta 1", required: true, options: [{ label: "Siempre", value: "Siempre" }] },
      { questionId: 2, order: 2, text: "Pregunta condicional", required: true, options: [{ label: "Sí", value: "Sí" }] },
      { questionId: 3, order: 3, text: "Pregunta opcional", required: false, options: [{ label: "Sí", value: "Sí" }] },
    ];

    expect(getMissingRequiredQuestionIds(
      questions,
      { 1: "Siempre" },
      [{ code: "jefatura", questionOrders: [2], answer: false }],
    )).toEqual([]);
    expect(getMissingRequiredQuestionIds(questions, {}, [])).toEqual([1, 2]);
  });
});
