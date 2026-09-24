import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FALLBACK_SOCIO_CATALOGOS,
  SOCIO_CURRENT_YEAR,
  SOCIO_ESTRATO_OPTIONS,
  SOCIO_SEXO_OPTIONS,
} from "@/features/psicosocial/components/sociodemografia/SociodemografiaFields";
import {
  getWebDirectSessionContent,
  getWebDirectWelcome,
  identifyWebDirectParticipant,
  submitWebDirectAttempt,
  type WebDirectSessionContent,
  type WebDirectWelcome,
} from "@/features/psicosocial/api/psicoWebDirectPublicService";
import {
  WebDirectConditionalQuestionScreen,
  WebDirectConsentScreen,
  WebDirectDeclarationScreen,
  WebDirectDemographicsScreen,
  WebDirectIdentificationScreen,
  WebDirectInstrumentCompleteScreen,
  WebDirectInstrumentIntroScreen,
  WebDirectInstructionsScreen,
  WebDirectJourneyScreen,
  WebDirectParticipantShell,
  WebDirectQuestionScreen,
  WebDirectReviewScreen,
  WebDirectSubmittedScreen,
  WebDirectTrainingScreen,
  WebDirectWelcomeScreen,
  getApplicableWebDirectQuestions,
  useWebDirectAttempt,
  type WebDirectConditionalRule,
  type WebDirectDemographicOption,
  type WebDirectDemographicSection,
  type WebDirectIdentification,
  type WebDirectInstrumentCode,
} from "@/features/psicosocial/web-direct";

type PreparationStep = "welcome" | "identification" | "training" | "instructions" | "consent" | "attempt";

const INSTRUMENT_GUIDANCE = [
  "Responde todas las preguntas de acuerdo con tu experiencia habitual.",
  "Elige una sola opción por pregunta y evita dejar respuestas pendientes.",
  "Tus respuestas se enviarán juntas únicamente al finalizar la batería.",
];

function options(values: string[]): WebDirectDemographicOption[] {
  return values.map((value) => ({ label: value, value }));
}

const DEMOGRAPHIC_SECTIONS: WebDirectDemographicSection[] = [
  {
    id: "personal",
    title: "Información personal",
    fields: [
      { id: "sexo", label: "Sexo", type: "select", required: true, options: options(SOCIO_SEXO_OPTIONS) },
      { id: "anio_nacimiento", label: "Año de nacimiento", type: "number", required: true, min: 1900, max: SOCIO_CURRENT_YEAR },
      { id: "estado_civil", label: "Estado civil", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.estado_civil) },
      { id: "nivel_estudios", label: "Nivel de estudios", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.nivel_estudios) },
      { id: "ocupacion_profesion", label: "Ocupación / profesión", type: "text", required: true, autoComplete: "organization-title" },
    ],
  },
  {
    id: "residencia",
    title: "Residencia",
    fields: [
      { id: "ciudad_residencia", label: "Ciudad / municipio de residencia", type: "text", required: true, autoComplete: "address-level2" },
      { id: "departamento_residencia", label: "Departamento de residencia", type: "text", autoComplete: "address-level1" },
      { id: "estrato", label: "Estrato", type: "select", required: true, options: options(SOCIO_ESTRATO_OPTIONS) },
      { id: "tipo_vivienda", label: "Tipo de vivienda", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.tipo_vivienda) },
      { id: "personas_dependen", label: "Personas que dependen económicamente", type: "number", required: true, min: 0, max: 99 },
    ],
  },
  {
    id: "laboral",
    title: "Información laboral",
    description: "La profesión y el cargo son datos independientes. Ambos pueden ajustarse para esta aplicación.",
    fields: [
      { id: "ciudad_trabajo", label: "Ciudad / municipio donde trabaja", type: "text", required: true },
      { id: "departamento_trabajo", label: "Departamento donde trabaja", type: "text" },
      { id: "cargo", label: "Nombre del cargo", type: "text", placeholder: "Ej. Coordinador de operaciones" },
      { id: "area", label: "Área", type: "text" },
      { id: "tipo_cargo", label: "Tipo de cargo", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.tipo_cargo) },
      { id: "antiguedad_empresa", label: "Antigüedad en la empresa (años)", type: "number", required: true, min: 0, max: 80 },
      { id: "antiguedad_cargo", label: "Antigüedad en el cargo (años)", type: "number", required: true, min: 0, max: 80 },
      { id: "tipo_contrato", label: "Tipo de contrato", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.tipo_contrato) },
      { id: "horas_diarias_trabajo", label: "Horas diarias de trabajo", type: "number", required: true, min: 1, max: 24 },
      { id: "tipo_salario", label: "Tipo de salario", type: "select", required: true, options: options(FALLBACK_SOCIO_CATALOGOS.tipo_salario) },
    ],
  },
];

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function LoadingState() {
  return (
    <WebDirectParticipantShell stepLabel="Acceso a la batería">
      <Card role="status" className="mx-auto max-w-xl rounded-3xl border-border p-8 text-center shadow-soft">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-black">Preparando tu acceso</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Estamos validando la aplicación asignada.</p>
      </Card>
    </WebDirectParticipantShell>
  );
}

function AccessError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <WebDirectParticipantShell stepLabel="Acceso a la batería">
      <Card role="alert" className="mx-auto max-w-xl rounded-3xl border-destructive/25 p-7 shadow-soft">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-black">No pudimos abrir este acceso</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        <Button type="button" variant="outline" className="mt-6" onClick={onRetry}>Intentar de nuevo</Button>
      </Card>
    </WebDirectParticipantShell>
  );
}

function WebDirectAttemptController({
  sessionToken,
  content,
  onBackToConsent,
}: {
  sessionToken: string;
  content: WebDirectSessionContent;
  onBackToConsent: () => void;
}) {
  const [state, dispatch] = useWebDirectAttempt(content.form, content.evaluations, content.demographics);
  const [currentQuestionByInstrument, setCurrentQuestionByInstrument] = useState<Partial<Record<WebDirectInstrumentCode, number>>>({});
  const [conditionalDrafts, setConditionalDrafts] = useState<Partial<Record<WebDirectInstrumentCode, Record<string, boolean>>>>({});

  const activeCode = state.activeStageCode && state.activeStageCode !== "DATOS_GENERALES"
    ? state.activeStageCode as WebDirectInstrumentCode
    : null;
  const activeContent = activeCode ? content.instruments[activeCode] : undefined;
  const conditionalRules = useMemo(() => (activeContent?.conditionalRules ?? []).map((rule) => ({
    ...rule,
    answer: state.conditionalAnswersByInstrument[activeCode as WebDirectInstrumentCode]?.[rule.code] ?? null,
  })), [activeCode, activeContent?.conditionalRules, state.conditionalAnswersByInstrument]);
  const unansweredConditional = activeCode
    ? conditionalRules.find((rule) => rule.answer === null || rule.answer === undefined)
    : undefined;

  if (state.phase === "journey") {
    return (
      <WebDirectJourneyScreen
        form={state.form}
        stages={state.stages}
        missingInstrumentCodes={state.missingInstrumentCodes}
        onBack={onBackToConsent}
        onStartStage={(stage) => dispatch({ type: "start_stage", code: stage.code })}
      />
    );
  }

  if (state.phase === "instrument_intro" && activeCode && activeContent) {
    const index = state.stages.findIndex((stage) => stage.code === activeCode);
    return (
      <WebDirectInstrumentIntroScreen
        instrumentLabel={activeContent.evaluation.name}
        form={activeCode.startsWith("PSICO_INTRA") ? state.form : undefined}
        questionCount={activeContent.questions.length}
        guidance={INSTRUMENT_GUIDANCE}
        progress={{ current: index + 1, total: state.stages.length }}
        onBack={() => dispatch({ type: "back_to_journey" })}
        onStart={() => dispatch({ type: "begin_instrument" })}
      />
    );
  }

  if (state.phase === "instrument" && activeCode && activeContent) {
    if (unansweredConditional) {
      const draft = conditionalDrafts[activeCode]?.[unansweredConditional.code];
      return (
        <WebDirectConditionalQuestionScreen
          instrumentLabel={activeContent.evaluation.name}
          rule={unansweredConditional}
          value={typeof draft === "boolean" ? draft : null}
          onChange={(ruleCode, value) => setConditionalDrafts((current) => ({
            ...current,
            [activeCode]: { ...current[activeCode], [ruleCode]: value },
          }))}
          onBack={() => dispatch({ type: "back_to_instrument_intro" })}
          onContinue={() => {
            if (typeof draft === "boolean") {
              dispatch({ type: "set_conditional", instrumentCode: activeCode, ruleCode: unansweredConditional.code, value: draft });
            }
          }}
        />
      );
    }

    const questions = getApplicableWebDirectQuestions(activeContent.questions, conditionalRules);
    const currentQuestionId = currentQuestionByInstrument[activeCode] ?? questions[0]?.questionId;
    return (
      <WebDirectQuestionScreen
        form={state.form}
        instrumentCode={activeCode}
        instrumentLabel={activeContent.evaluation.name}
        questions={activeContent.questions}
        conditionalRules={conditionalRules}
        currentQuestionId={currentQuestionId}
        answers={Object.fromEntries(Object.entries(state.answersByInstrument[activeCode] ?? {}).map(([id, answer]) => [id, answer.value]))}
        onAnswer={(answer) => dispatch({ type: "answer", answer })}
        onPrevious={(question) => {
          const index = questions.findIndex((item) => item.questionId === question.questionId);
          if (index > 0) setCurrentQuestionByInstrument((current) => ({ ...current, [activeCode]: questions[index - 1].questionId }));
        }}
        onNext={(question) => {
          const index = questions.findIndex((item) => item.questionId === question.questionId);
          if (index >= questions.length - 1) dispatch({ type: "complete_active_stage" });
          else setCurrentQuestionByInstrument((current) => ({ ...current, [activeCode]: questions[index + 1].questionId }));
        }}
        answerState={state.answersByInstrument[activeCode]?.[currentQuestionId] ? "selected" : "idle"}
      />
    );
  }

  if (state.phase === "instrument_complete" && activeCode && activeContent) {
    const currentIndex = state.stages.findIndex((stage) => stage.code === activeCode);
    const nextStage = state.stages.find((stage) => stage.status === "current");
    return (
      <WebDirectInstrumentCompleteScreen
        instrumentLabel={activeContent.evaluation.name}
        answeredQuestions={Object.keys(state.answersByInstrument[activeCode] ?? {}).length}
        nextComponentLabel={nextStage?.title ?? "el siguiente componente"}
        progress={{ current: currentIndex + 1, total: state.stages.length }}
        onContinue={() => dispatch({ type: "continue_after_instrument" })}
      />
    );
  }

  if (state.phase === "demographics") {
    return (
      <WebDirectDemographicsScreen
        sections={DEMOGRAPHIC_SECTIONS}
        values={state.demographics}
        onValuesChange={(values) => dispatch({ type: "set_demographics", values })}
        onBack={() => dispatch({ type: "back_to_journey" })}
        onContinue={(values) => {
          dispatch({ type: "set_demographics", values });
          dispatch({ type: "complete_active_stage" });
        }}
      />
    );
  }

  if (state.phase === "review") {
    return (
      <WebDirectReviewScreen
        form={state.form}
        stages={state.stages}
        onBack={() => dispatch({ type: "back_to_journey" })}
        onContinue={() => dispatch({ type: "open_declaration" })}
      />
    );
  }

  if (state.phase === "declaration" || state.phase === "submitting") {
    const submitting = state.phase === "submitting";
    return (
      <WebDirectDeclarationScreen
        accepted={state.declarationAccepted}
        submitting={submitting}
        error={state.submissionError}
        onAcceptedChange={(accepted) => dispatch({ type: "set_declaration", accepted })}
        onBack={() => dispatch({ type: "back_to_review" })}
        onSubmit={async () => {
          dispatch({ type: "submit_started" });
          try {
            await submitWebDirectAttempt(sessionToken, state);
            dispatch({ type: "submit_succeeded", receipt: { completedAt: new Date().toLocaleString("es-CO") } });
          } catch (error) {
            dispatch({ type: "submit_failed", message: messageFrom(error, "No fue posible enviar la batería. Intenta nuevamente.") });
          }
        }}
      />
    );
  }

  return <WebDirectSubmittedScreen completedAt={state.receipt?.completedAt} receiptReference={state.receipt?.reference} />;
}

export default function WebDirectPublicPage() {
  const { publicToken = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<WebDirectWelcome | null>(null);
  const [step, setStep] = useState<PreparationStep>("welcome");
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [content, setContent] = useState<WebDirectSessionContent | null>(null);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [acceptedDocuments, setAcceptedDocuments] = useState<string[]>([]);

  const loadWelcome = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setWelcome(await getWebDirectWelcome(publicToken));
    } catch (error) {
      setLoadError(messageFrom(error, "El enlace no está disponible o ya no está vigente."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadWelcome(); }, [publicToken]);

  if (loading) return <LoadingState />;
  if (loadError || !welcome) return <AccessError message={loadError ?? "Acceso no disponible."} onRetry={() => void loadWelcome()} />;

  const context = { companyName: welcome.empresa_nombre, applicationName: welcome.aplicacion_nombre };
  if (step === "welcome") return <WebDirectWelcomeScreen context={context} onStart={() => setStep("identification")} />;
  if (step === "identification") {
    return (
      <WebDirectIdentificationScreen
        context={context}
        isSubmitting={identifying}
        error={identityError}
        onBack={() => setStep("welcome")}
        onSubmit={async (identification: WebDirectIdentification) => {
          setIdentifying(true);
          setIdentityError(null);
          try {
            const identity = await identifyWebDirectParticipant(publicToken, identification);
            const sessionContent = await getWebDirectSessionContent(identity.session_token);
            setSessionToken(identity.session_token);
            setContent(sessionContent);
            setStep("training");
          } catch (error) {
            setIdentityError(messageFrom(error, "No fue posible validar la información suministrada."));
          } finally {
            setIdentifying(false);
          }
        }}
      />
    );
  }

  if (!content || !sessionToken) return <AccessError message="La sesión no pudo prepararse." onRetry={() => setStep("identification")} />;
  if (step === "training") {
    return (
      <WebDirectTrainingScreen
        formLabel={`Forma ${content.form}`}
        topics={["Propósito de la batería", "Cómo responder", "Confidencialidad del proceso"]}
        transcript={<p>La batería reúne preguntas intralaborales, extralaborales y de estrés. Responde desde tu experiencia, sin ayuda de terceros y en un lugar tranquilo. Los datos generales se completan al final.</p>}
        completed={trainingCompleted}
        onComplete={() => setTrainingCompleted(true)}
        onBack={() => setStep("identification")}
        onContinue={() => setStep("instructions")}
      />
    );
  }
  if (step === "instructions") {
    return (
      <WebDirectInstructionsScreen
        formLabel={`Forma ${content.form}`}
        instructions={<><p>Lee cada afirmación completa y selecciona la opción que mejor represente la frecuencia con la que ocurre en tu experiencia.</p><p>Completa la batería en este intento. Si cierras la página antes del envío final, deberás comenzar nuevamente.</p></>}
        onBack={() => setStep("training")}
        onContinue={() => setStep("consent")}
      />
    );
  }
  if (step === "consent") {
    return (
      <WebDirectConsentScreen
        documents={[{
          id: "privacidad",
          title: "Privacidad y tratamiento de la información",
          description: "Consulta el alcance de privacidad y seguridad aplicable al proceso.",
          version: "vigente",
          href: "/recursos/seguridad-cumplimiento",
        }]}
        acceptedDocumentIds={acceptedDocuments}
        onAcceptedDocumentIdsChange={setAcceptedDocuments}
        onBack={() => setStep("instructions")}
        onContinue={() => setStep("attempt")}
      />
    );
  }
  return <WebDirectAttemptController sessionToken={sessionToken} content={content} onBackToConsent={() => setStep("consent")} />;
}
