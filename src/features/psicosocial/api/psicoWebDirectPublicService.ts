import { requestPublicJson } from "./httpClient";

import type {
  WebDirectAssignedEvaluation,
  WebDirectConditionalRule,
  WebDirectDemographicValues,
  WebDirectForm,
  WebDirectInstrumentCode,
  WebDirectQuestion,
} from "../web-direct";
import type { WebDirectAttemptState } from "../web-direct/webDirectAttempt";

type ApiQuestion = {
  pregunta_id: number;
  orden: number;
  texto: string;
  parametros?: Record<string, unknown> | string | null;
};

type ApiConditionalRule = {
  codigo: string;
  label?: string | null;
  ordenes?: number[];
  respuesta?: boolean | null;
};

type ApiInstrument = {
  evaluacion_id: number;
  instrument_code: WebDirectInstrumentCode;
  total_preguntas: number;
  preguntas: ApiQuestion[];
  condicionales?: ApiConditionalRule[];
};

export type WebDirectWelcome = {
  aplicacion_id: number;
  aplicacion_nombre: string;
  empresa_nombre: string;
};

export type WebDirectIdentityResult = {
  session_token: string;
  expires_at: string;
  nombre: string;
  forma_asignada: WebDirectForm;
};

export type WebDirectInstrumentContent = {
  evaluation: WebDirectAssignedEvaluation;
  questions: WebDirectQuestion[];
  conditionalRules: WebDirectConditionalRule[];
};

export type WebDirectSessionContent = {
  companyName: string;
  applicationName: string;
  form: WebDirectForm;
  evaluations: WebDirectAssignedEvaluation[];
  instruments: Record<WebDirectInstrumentCode, WebDirectInstrumentContent | undefined>;
  demographics: WebDirectDemographicValues;
};

function parseParameters(value: ApiQuestion["parametros"]): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function instrumentName(code: WebDirectInstrumentCode) {
  return {
    PSICO_INTRA_A: "Cuestionario intralaboral · Forma A",
    PSICO_INTRA_B: "Cuestionario intralaboral · Forma B",
    PSICO_EXTRA: "Factores extralaborales",
    PSICO_ESTRES: "Cuestionario de estrés",
  }[code];
}

function normalizeQuestion(question: ApiQuestion, instrumentCode: WebDirectInstrumentCode): WebDirectQuestion {
  const parameters = parseParameters(question.parametros);
  const options = Array.isArray(parameters.opciones)
    ? parameters.opciones.map((option) => String(option).trim()).filter(Boolean)
    : [];
  const fallback = options.length > 0
    ? options
    : instrumentCode === "PSICO_ESTRES"
      ? ["Siempre", "Casi siempre", "A veces", "Nunca"]
      : ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];
  return {
    questionId: Number(question.pregunta_id),
    order: Number(question.orden),
    text: String(question.texto ?? ""),
    required: true,
    options: fallback.map((option) => ({ label: option, value: option })),
    dimensionCode: parameters.dimension_code ? String(parameters.dimension_code) : null,
    domainCode: parameters.dominio_code ? String(parameters.dominio_code) : null,
  };
}

function normalizeConditional(rule: ApiConditionalRule): WebDirectConditionalRule {
  return {
    code: String(rule.codigo),
    label: rule.label ? String(rule.label) : undefined,
    questionOrders: Array.isArray(rule.ordenes) ? rule.ordenes.map(Number) : [],
    answer: typeof rule.respuesta === "boolean" ? rule.respuesta : null,
  };
}

function normalizeDemographics(values: Record<string, unknown>): WebDirectDemographicValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)]),
  );
}

export async function getWebDirectWelcome(publicToken: string): Promise<WebDirectWelcome> {
  return requestPublicJson<WebDirectWelcome>(`/public/psychosocial/${encodeURIComponent(publicToken)}`);
}

export async function identifyWebDirectParticipant(
  publicToken: string,
  identification: { documentNumber: string; birthDate: string },
): Promise<WebDirectIdentityResult> {
  return requestPublicJson<WebDirectIdentityResult>(
    `/public/psychosocial/${encodeURIComponent(publicToken)}/identify`,
    {
      method: "POST",
      body: JSON.stringify({
        numero_documento: identification.documentNumber,
        fecha_nacimiento: identification.birthDate,
      }),
    },
  );
}

export async function getWebDirectSessionContent(sessionToken: string): Promise<WebDirectSessionContent> {
  const response = await requestPublicJson<{
    empresa_nombre: string;
    aplicacion_nombre: string;
    forma_asignada: WebDirectForm;
    datos_generales: Record<string, unknown>;
    instrumentos: ApiInstrument[];
  }>("/public/psychosocial/session/content", {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  const entries = response.instrumentos.map((instrument) => {
    const evaluation: WebDirectAssignedEvaluation = {
      evaluationId: Number(instrument.evaluacion_id),
      instrumentCode: instrument.instrument_code,
      name: instrumentName(instrument.instrument_code),
      totalQuestions: Number(instrument.total_preguntas),
      status: "pending",
    };
    const content: WebDirectInstrumentContent = {
      evaluation,
      questions: instrument.preguntas
        .map((question) => normalizeQuestion(question, instrument.instrument_code))
        .sort((left, right) => left.order - right.order || left.questionId - right.questionId),
      conditionalRules: (instrument.condicionales ?? []).map(normalizeConditional),
    };
    return [instrument.instrument_code, content] as const;
  });
  return {
    companyName: response.empresa_nombre,
    applicationName: response.aplicacion_nombre,
    form: response.forma_asignada,
    evaluations: entries.map(([, item]) => item.evaluation),
    instruments: Object.fromEntries(entries) as WebDirectSessionContent["instruments"],
    demographics: normalizeDemographics(response.datos_generales ?? {}),
  };
}

export async function submitWebDirectAttempt(
  sessionToken: string,
  state: WebDirectAttemptState,
) {
  const instruments = state.stages
    .filter((stage) => stage.code !== "DATOS_GENERALES")
    .map((stage) => {
      const code = stage.code as WebDirectInstrumentCode;
      const answers = Object.values(state.answersByInstrument[code] ?? {})
        .sort((left, right) => left.order - right.order)
        .map((answer) => ({
          pregunta_id: answer.questionId,
          orden: answer.order,
          respuesta: answer.value,
        }));
      return {
        instrument_code: code,
        evaluacion_id: stage.evaluationId,
        respuestas: answers,
        condicionales: Object.entries(state.conditionalAnswersByInstrument[code] ?? {}).map(
          ([codigo, respuesta]) => ({ codigo, respuesta }),
        ),
      };
    });
  return requestPublicJson<{ ok: boolean; estado: string; idempotent?: boolean }>(
    "/public/psychosocial/session/submit",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ instrumentos: instruments, datos_generales: state.demographics }),
    },
  );
}
