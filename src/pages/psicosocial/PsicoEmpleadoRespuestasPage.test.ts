import { describe, expect, it } from "vitest";
import {
  applicableQuestionIdsForConditionals,
  mergeConditionalRules,
} from "./PsicoEmpleadoRespuestasPage";
import type { PreguntaRespuesta } from "@/features/psicosocial/api/psicoEmpleadoService";

function question(orden: number): PreguntaRespuesta {
  return {
    pregunta_id: orden,
    orden,
    texto: `Pregunta ${orden}`,
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
});
