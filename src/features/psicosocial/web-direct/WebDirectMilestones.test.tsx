import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebDirectConditionalQuestionScreen } from "./WebDirectConditionalQuestionScreen";
import { WebDirectDemographicsScreen } from "./WebDirectDemographicsScreen";
import { WebDirectInstrumentCompleteScreen } from "./WebDirectInstrumentCompleteScreen";
import { WebDirectInstrumentIntroScreen } from "./WebDirectInstrumentIntroScreen";
import type { WebDirectDemographicSection, WebDirectDemographicValues } from "./types";

const sections: WebDirectDemographicSection[] = [
  {
    id: "personal",
    title: "Información personal",
    fields: [
      { id: "sexo", label: "Sexo", type: "select", required: true, options: [{ label: "Femenino", value: "Femenino" }] },
      { id: "anio_nacimiento", label: "Año de nacimiento", type: "number", required: true, min: 1900, max: 2026 },
    ],
  },
  {
    id: "laboral",
    title: "Contexto laboral",
    fields: [
      { id: "ocupacion_profesion", label: "Ocupación o profesión", type: "text", required: true },
      { id: "cargo", label: "Cargo actual", type: "text", required: true },
    ],
  },
];

describe("hitos del recorrido WEB_DIRECT", () => {
  it("presenta la introducción de la forma asignada sin prometer reanudación", () => {
    render(
      <WebDirectInstrumentIntroScreen
        instrumentLabel="Cuestionario intralaboral"
        form="B"
        questionCount={97}
        estimatedMinutes="20–25 min"
        guidance={["Responde según tu experiencia habitual", "No hay respuestas buenas ni malas"]}
        progress={{ current: 1, total: 4 }}
        onBack={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(screen.getByText(/Tienes asignada la Forma B/i)).toBeInTheDocument();
    expect(screen.getByText("97")).toBeInTheDocument();
    expect(screen.queryByText(/continuar más tarde|guardar y salir/i)).not.toBeInTheDocument();
  });

  it("bloquea la pregunta condicional hasta responder y entrega la regla configurada", () => {
    const onChange = vi.fn();
    const onContinue = vi.fn();
    const rule = { code: "jefe_personas", label: "¿Eres jefe de otras personas?", questionOrders: [115, 116] };
    const { rerender } = render(
      <WebDirectConditionalQuestionScreen
        instrumentLabel="Cuestionario intralaboral"
        rule={rule}
        value={null}
        onChange={onChange}
        onBack={() => undefined}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Sí" }));
    expect(onChange).toHaveBeenCalledWith("jefe_personas", true);

    rerender(
      <WebDirectConditionalQuestionScreen
        instrumentLabel="Cuestionario intralaboral"
        rule={{ ...rule, answer: true }}
        value={true}
        onChange={onChange}
        onBack={() => undefined}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("aclara que un instrumento completo permanece solo en la sesión actual", () => {
    render(
      <WebDirectInstrumentCompleteScreen
        instrumentLabel="Cuestionario intralaboral · Forma A"
        answeredQuestions={123}
        nextComponentLabel="Factores extralaborales"
        progress={{ current: 1, total: 4 }}
        onContinue={() => undefined}
      />,
    );

    expect(screen.getByText("123 respuestas completadas")).toBeInTheDocument();
    expect(screen.getByText(/permanece en la sesión actual/i)).toBeInTheDocument();
    expect(screen.getByText(/No se muestran puntajes, resultados ni niveles de riesgo/i)).toBeInTheDocument();
  });

  it("mantiene editables los valores precargados y entrega datos generales completos", () => {
    const onContinue = vi.fn();

    function ControlledForm() {
      const [values, setValues] = useState<WebDirectDemographicValues>({
        sexo: "Femenino",
        anio_nacimiento: "1990",
        ocupacion_profesion: "Psicóloga",
        cargo: "Analista",
      });
      return (
        <WebDirectDemographicsScreen
          sections={sections}
          values={values}
          onValuesChange={setValues}
          onBack={() => undefined}
          onContinue={onContinue}
        />
      );
    }

    render(<ControlledForm />);
    expect(screen.getByLabelText(/^Ocupación o profesión/)).toHaveValue("Psicóloga");
    expect(screen.getByLabelText(/^Cargo actual/)).toHaveValue("Analista");
    fireEvent.change(screen.getByLabelText(/^Cargo actual/), { target: { value: "Coordinadora HSEQ" } });
    fireEvent.click(screen.getByRole("button", { name: /Continuar al resumen/i }));

    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({
      ocupacion_profesion: "Psicóloga",
      cargo: "Coordinadora HSEQ",
    }));
  });

  it("muestra errores junto a los campos obligatorios", () => {
    render(
      <WebDirectDemographicsScreen
        sections={sections}
        values={{}}
        onValuesChange={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Continuar al resumen/i }));
    expect(screen.getAllByText("Completa este campo para continuar.")).toHaveLength(4);
    expect(screen.getByLabelText(/^Sexo/)).toHaveAttribute("aria-invalid", "true");
  });
});
