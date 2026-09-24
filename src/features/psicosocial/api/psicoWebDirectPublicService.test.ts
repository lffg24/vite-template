import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestPublicJson } from "./httpClient";
import {
  getWebDirectSessionContent,
  submitWebDirectAttempt,
} from "./psicoWebDirectPublicService";
import { createWebDirectAttemptState } from "../web-direct";

vi.mock("./httpClient", () => ({ requestPublicJson: vi.fn() }));

const request = vi.mocked(requestPublicJson);

describe("psicoWebDirectPublicService", () => {
  beforeEach(() => request.mockReset());

  it("normaliza la forma asignada, conserva el orden y no mezcla profesión con cargo", async () => {
    request.mockResolvedValue({
      empresa_nombre: "Empresa prueba",
      aplicacion_nombre: "Aplicación septiembre",
      forma_asignada: "B",
      datos_generales: {
        ocupacion_profesion: "Ingeniera industrial",
        cargo: "Coordinadora HSEQ",
      },
      instrumentos: [
        {
          evaluacion_id: 31,
          instrument_code: "PSICO_INTRA_B",
          total_preguntas: 2,
          preguntas: [
            { pregunta_id: 102, orden: 2, texto: "Pregunta dos", parametros: { opciones: ["Sí", "No"] } },
            { pregunta_id: 101, orden: 1, texto: "Pregunta uno", parametros: { opciones: ["Siempre", "Nunca"], dimension_code: "liderazgo", dominio_code: "relaciones" } },
          ],
          condicionales: [{ codigo: "clientes", label: "¿Atiende clientes?", ordenes: [2], respuesta: null }],
        },
        { evaluacion_id: 32, instrument_code: "PSICO_EXTRA", total_preguntas: 0, preguntas: [], condicionales: [] },
        { evaluacion_id: 33, instrument_code: "PSICO_ESTRES", total_preguntas: 0, preguntas: [], condicionales: [] },
      ],
    });

    const result = await getWebDirectSessionContent("temporary-session");

    expect(result.form).toBe("B");
    expect(result.evaluations.map((item) => item.instrumentCode)).toEqual(["PSICO_INTRA_B", "PSICO_EXTRA", "PSICO_ESTRES"]);
    expect(result.instruments.PSICO_INTRA_A).toBeUndefined();
    expect(result.instruments.PSICO_INTRA_B?.questions.map((item) => item.order)).toEqual([1, 2]);
    expect(result.instruments.PSICO_INTRA_B?.questions[0]).toMatchObject({ dimensionCode: "liderazgo", domainCode: "relaciones" });
    expect(result.demographics.ocupacion_profesion).toBe("Ingeniera industrial");
    expect(result.demographics.cargo).toBe("Coordinadora HSEQ");
    expect(request).toHaveBeenCalledWith("/public/psychosocial/session/content", {
      headers: { Authorization: "Bearer temporary-session" },
    });
  });

  it("envía la batería completa una sola vez con respuestas condicionales", async () => {
    request.mockResolvedValue({ ok: true, estado: "completa" });
    const state = createWebDirectAttemptState("A", [
      { evaluationId: 1, instrumentCode: "PSICO_INTRA_A", name: "Intralaboral A", totalQuestions: 1, status: "completed" },
      { evaluationId: 2, instrumentCode: "PSICO_EXTRA", name: "Extralaboral", totalQuestions: 1, status: "completed" },
      { evaluationId: 3, instrumentCode: "PSICO_ESTRES", name: "Estrés", totalQuestions: 1, status: "completed" },
    ], { sexo: "Femenino" });
    state.answersByInstrument = {
      PSICO_INTRA_A: { 10: { questionId: 10, order: 1, value: "Siempre", instrumentCode: "PSICO_INTRA_A" } },
      PSICO_EXTRA: { 20: { questionId: 20, order: 1, value: "Nunca", instrumentCode: "PSICO_EXTRA" } },
      PSICO_ESTRES: { 30: { questionId: 30, order: 1, value: "A veces", instrumentCode: "PSICO_ESTRES" } },
    };
    state.conditionalAnswersByInstrument = { PSICO_INTRA_A: { clientes: false } };

    await submitWebDirectAttempt("temporary-session", state);

    const [, init] = request.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.instrumentos).toHaveLength(3);
    expect(body.instrumentos[0]).toMatchObject({
      instrument_code: "PSICO_INTRA_A",
      evaluacion_id: 1,
      condicionales: [{ codigo: "clientes", respuesta: false }],
    });
    expect(body.datos_generales).toEqual({ sexo: "Femenino" });
  });
});
