import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebDirectConsentScreen } from "./WebDirectConsentScreen";
import { WebDirectIdentificationScreen } from "./WebDirectIdentificationScreen";
import { WebDirectInstructionsScreen } from "./WebDirectInstructionsScreen";
import { WebDirectTrainingScreen } from "./WebDirectTrainingScreen";
import { WebDirectWelcomeScreen } from "./WebDirectWelcomeScreen";

const context = {
  companyName: "Empresa de prueba",
  applicationName: "Batería 2026",
  responsible: {
    name: "María Pérez",
    email: "maria@example.com",
    phone: "+57 300 000 0000",
  },
};

describe("flujo público WEB_DIRECT", () => {
  it("presenta la bienvenida sin resultados y permite comenzar", () => {
    const onStart = vi.fn();
    render(<WebDirectWelcomeScreen context={context} onStart={onStart} />);

    expect(screen.getByRole("heading", { name: "Bienvenido a tu proceso de evaluación" })).toBeInTheDocument();
    expect(screen.getByText(/Empresa de prueba te invita/i)).toBeInTheDocument();
    expect(screen.queryByText(/nivel de riesgo/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Comenzar/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("mantiene accesibles los datos del profesional responsable", () => {
    render(<WebDirectWelcomeScreen context={context} onStart={() => undefined} />);
    expect(screen.getByRole("link", { name: "maria@example.com" })).toHaveAttribute("href", "mailto:maria@example.com");
    expect(screen.getByRole("link", { name: "+57 300 000 0000" })).toHaveAttribute("href", "tel:+57 300 000 0000");
  });

  it("valida campos obligatorios antes de entregar la identificación", () => {
    const onSubmit = vi.fn();
    render(
      <WebDirectIdentificationScreen
        context={context}
        onBack={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Validar y continuar/i }));
    expect(screen.getByText("Selecciona tu tipo de documento.")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu número de documento.")).toBeInTheDocument();
    expect(screen.getByText("Selecciona tu fecha de nacimiento.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("entrega documento y fecha de nacimiento sin incluirlos en una ruta", () => {
    const onSubmit = vi.fn();
    render(
      <WebDirectIdentificationScreen
        context={context}
        onBack={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tipo de documento"), { target: { value: "CC" } });
    fireEvent.change(screen.getByLabelText("Número de documento"), { target: { value: "123456789" } });
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "1990-05-12" } });
    fireEvent.submit(screen.getByRole("button", { name: /Validar y continuar/i }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith({ documentType: "CC", documentNumber: "123456789", birthDate: "1990-05-12" });
  });

  it("mantiene bloqueada la capacitación hasta que el contenido esté completado", () => {
    const onContinue = vi.fn();
    const onComplete = vi.fn();
    render(
      <WebDirectTrainingScreen
        formLabel="Forma B"
        topics={["Propósito", "Cómo responder", "Confidencialidad"]}
        transcript={<p>Contenido textual oficial de la capacitación.</p>}
        completed={false}
        onComplete={onComplete}
        onBack={() => undefined}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByText("Contenido textual oficial de la capacitación.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar al instructivo/i })).toBeDisabled();
    expect(screen.getByRole("progressbar", { name: /Paso 3 de 6: 50% completado/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Marcar capacitación como revisada/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("presenta el instructivo recibido sin reinterpretarlo", () => {
    const onContinue = vi.fn();
    render(
      <WebDirectInstructionsScreen
        formLabel="Forma A"
        instructions={<p>Lea cada pregunta y seleccione una sola respuesta.</p>}
        onBack={() => undefined}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByText("Lea cada pregunta y seleccione una sola respuesta.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continuar al consentimiento/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("exige aceptar cada versión documental antes de continuar", () => {
    const onContinue = vi.fn();
    const documents = [
      { id: "consent-v2", title: "Consentimiento informado", description: "Documento vigente.", version: "2.0", href: "/docs/consentimiento-v2.pdf" },
      { id: "privacy-v3", title: "Tratamiento de datos personales", description: "Política vigente.", version: "3.1", href: "/docs/privacidad-v3.pdf" },
    ];

    function ControlledConsent() {
      const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
      return (
        <WebDirectConsentScreen
          documents={documents}
          acceptedDocumentIds={acceptedIds}
          onAcceptedDocumentIdsChange={setAcceptedIds}
          onBack={() => undefined}
          onContinue={onContinue}
        />
      );
    }

    render(<ControlledConsent />);
    const continueButton = screen.getByRole("button", { name: /Aceptar y continuar/i });
    expect(continueButton).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Consentimiento informado/i }));
    expect(continueButton).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Tratamiento de datos personales/i }));
    expect(continueButton).toBeEnabled();
    fireEvent.click(continueButton);
    expect(onContinue).toHaveBeenCalledWith(["consent-v2", "privacy-v3"]);
  });

  it("bloquea el consentimiento cuando no existen documentos vigentes", () => {
    render(
      <WebDirectConsentScreen
        documents={[]}
        acceptedDocumentIds={[]}
        onAcceptedDocumentIdsChange={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/No hay documentos vigentes configurados/i);
    expect(screen.getByRole("button", { name: /Aceptar y continuar/i })).toBeDisabled();
  });
});
