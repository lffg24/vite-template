import { describe, expect, it } from "vitest";
import {
  applicableQuestionIdsForConditionals,
  batterySummaryProgress,
  calculateInstrumentProgress,
  isQuestionAnswerValid,
  mergeConditionalRules,
  questionOptions,
} from "./PsicoEmpleadoRespuestasPage";
import type { PreguntaRespuesta, PsicoEvaluacionEmpleado } from "@/features/psicosocial/api/psicoEmpleadoService";

function question(orden: number): PreguntaRespuesta {
  return {
    pregunta_id: orden,
    orden,
    texto: `Pregunta ${orden}`,
  };
}

function stressQuestion(orden: number, preguntaId = orden): PreguntaRespuesta {
  return {
    pregunta_id: preguntaId,
    orden,
    texto: `Estrés ${orden}`,
    parametros: {
      opciones: ["Siempre", "Casi siempre", "A veces", "Nunca"],
      valores: [9, 6, 3, 0],
      instrument_code: "PSICO_ESTRES",
    },
  };
}

describe("PsicoEmpleadoRespuestasPage conditional rules", () => {
  it("agrega los dos bloques oficiales de Forma A cuando el backend no los entrega", () => {
    const rules = mergeConditionalRules([], "PSICO_INTRA_A");

    expect(rules.map((rule) => rule.codigo)).toEqual(["servicio_clientes_usuarios", "jefe_personas"]);
    expect(rules[0].ordenes).toEqual([106, 107, 108, 109, 110, 111, 112, 113, 114]);
    expect(rules[1].ordenes).toEqual([115, 116, 117, 118, 119, 120, 121, 122, 123]);
  });

  it("omite preguntas 106 a 123 cuando ambas condiciones están en No", () => {
    const preguntas = Array.from({ length: 123 }, (_, i) => question(i + 1));
    const rules = mergeConditionalRules([], "PSICO_INTRA_A");

    const applicableIds = applicableQuestionIdsForConditionals(preguntas, rules, {
      servicio_clientes_usuarios: false,
      jefe_personas: false,
    });

    expect(applicableIds).toHaveLength(105);
    expect(applicableIds.at(-1)).toBe(105);
    expect(applicableIds).not.toContain(106);
    expect(applicableIds).not.toContain(115);
    expect(applicableIds).not.toContain(123);
  });

  it("mantiene el bloque de jefatura aplicable cuando el switch está en Sí", () => {
    const preguntas = Array.from({ length: 123 }, (_, i) => question(i + 1));
    const rules = mergeConditionalRules([], "PSICO_INTRA_A");

    const applicableIds = applicableQuestionIdsForConditionals(preguntas, rules, {
      servicio_clientes_usuarios: false,
      jefe_personas: true,
    });

    expect(applicableIds).toHaveLength(114);
    expect(applicableIds).not.toContain(106);
    expect(applicableIds).toContain(115);
    expect(applicableIds).toContain(123);
  });

  it("agrega el bloque oficial de Forma B para servicio a clientes", () => {
    const rules = mergeConditionalRules([], "PSICO_INTRA_B");

    expect(rules.map((rule) => rule.codigo)).toEqual(["servicio_clientes_usuarios"]);
    expect(rules[0].ordenes).toEqual([89, 90, 91, 92, 93, 94, 95, 96, 97]);
  });

  it("omite preguntas 89 a 97 en Forma B cuando servicio a clientes está en No", () => {
    const preguntas = Array.from({ length: 97 }, (_, i) => question(i + 1));
    const rules = mergeConditionalRules([], "PSICO_INTRA_B");

    const applicableIds = applicableQuestionIdsForConditionals(preguntas, rules, {
      servicio_clientes_usuarios: false,
    });

    expect(applicableIds).toHaveLength(88);
    expect(applicableIds.at(-1)).toBe(88);
    expect(applicableIds).not.toContain(89);
    expect(applicableIds).not.toContain(97);
  });

  it("actualiza el avance de Forma A descontando bloques no aplicables", () => {
    const preguntas = Array.from({ length: 123 }, (_, i) => question(i + 1));
    const rules = mergeConditionalRules([], "PSICO_INTRA_A");

    const progress = calculateInstrumentProgress(
      preguntas,
      rules,
      { 1: "Siempre", 2: "Casi siempre", 3: "Algunas veces" },
      { servicio_clientes_usuarios: false, jefe_personas: false },
    );

    expect(progress).toEqual({
      total: 107,
      answered: 5,
      pending: 102,
      progress: 4.7,
    });
  });

  it("actualiza el avance de Forma B descontando el bloque de servicio a clientes", () => {
    const preguntas = Array.from({ length: 97 }, (_, i) => question(i + 1));
    const rules = mergeConditionalRules([], "PSICO_INTRA_B");

    const progress = calculateInstrumentProgress(
      preguntas,
      rules,
      { 1: "Siempre", 2: "Casi siempre", 3: "Algunas veces" },
      { servicio_clientes_usuarios: false },
    );

    expect(progress).toEqual({
      total: 89,
      answered: 4,
      pending: 85,
      progress: 4.5,
    });
  });

  it("usa el avance local de la batería activa en el resumen lateral", () => {
    const ev: PsicoEvaluacionEmpleado = {
      evaluacion_id: 2,
      instrument_code: "PSICO_INTRA_A",
      total_preguntas: 123,
      respondidas: 3,
      score_count: 0,
      estado_respuestas: "borrador",
      editable: true,
    };

    expect(batterySummaryProgress(ev, 2, { total: 107, answered: 5, pending: 102, progress: 4.7 })).toBe(4.7);
    expect(batterySummaryProgress(ev, 99, { total: 107, answered: 5, pending: 102, progress: 4.7 })).toBe(2.4);
  });

  it("usa las opciones oficiales de cada pregunta en lugar del fallback global", () => {
    const pregunta = stressQuestion(1);

    expect(questionOptions(pregunta)).toEqual(["Siempre", "Casi siempre", "A veces", "Nunca"]);
    expect(isQuestionAnswerValid(pregunta, "A veces")).toBe(true);
    expect(isQuestionAnswerValid(pregunta, "Casi nunca")).toBe(false);
  });

  it("no cuenta respuestas fuera de la escala oficial como avance", () => {
    const preguntas = [stressQuestion(1), stressQuestion(2)];

    const progress = calculateInstrumentProgress(
      preguntas,
      [],
      { 1: "Casi nunca", 2: "Nunca" },
      {},
    );

    expect(progress).toEqual({
      total: 2,
      answered: 1,
      pending: 1,
      progress: 50,
    });
  });
});
