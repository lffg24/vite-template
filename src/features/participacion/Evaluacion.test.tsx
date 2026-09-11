import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { Evaluacion } from "./Evaluacion";
import type { EvaluacionPublica, IntentoCalificado } from "@/types/participacion";

function evaluacion(parcial: Partial<EvaluacionPublica> = {}): EvaluacionPublica {
  return {
    nota_minima: 70,
    intentos_max: 2,
    intentos_usados: 0,
    puede_intentar: true,
    aprobado: false,
    mejor_puntaje: null,
    preguntas: [
      { tipo: "OPCION_UNICA" as const, enunciado: "¿Uno?", opciones: ["a", "b"], puntos: 1 },
      { tipo: "OPCION_UNICA" as const, enunciado: "¿Dos?", opciones: ["c", "d"], puntos: 1 },
    ],
    ...parcial,
  };
}

function intento(parcial: Partial<IntentoCalificado> = {}): IntentoCalificado {
  return {
    numero: 1,
    aciertos: 1,
    preguntas: 2,
    puntaje: 50,
    aprobado: false,
    nota_minima: 70,
    intentos_max: 2,
    intentos_usados: 1,
    puede_reintentar: true,
    // Explícita: omitida, la prueba pasaría sobre `undefined` y dejaría de
    // comprobar que el veredicto no revela nada mientras queden intentos.
    retroalimentacion: [],
    ...parcial,
  };
}

function pintar(props: Partial<Parameters<typeof Evaluacion>[0]> = {}) {
  const alEnviar = vi.fn();
  render(
    <Evaluacion
      evaluacion={evaluacion()}
      enviando={false}
      error={null}
      resultado={null}
      alEnviar={alEnviar}
      alReintentar={vi.fn()}
      alTerminar={vi.fn()}
      {...props}
    />
  );
  return { alEnviar };
}

describe("la evaluación del participante", () => {
  it("no deja enviar hasta responderlas todas, y dice cuántas faltan", () => {
    // Mandar menos respuestas que preguntas calificaría las que faltan como
    // fallos: se perdería un intento por un descuido de la pantalla y no por
    // no saber. El servidor lo rechaza igual; esto evita llegar hasta allí.
    const { alEnviar } = pintar();

    fireEvent.click(screen.getByRole("radio", { name: /^a$/ }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    const boton = screen.getByRole("button", { name: /falta 1 por responder/i });
    expect(boton).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /^c$/ }));
    fireEvent.click(screen.getByRole("button", { name: /enviar respuestas/i }));

    expect(alEnviar).toHaveBeenCalledWith([0, 0]);
  });

  it("manda ÍNDICES, nunca un puntaje", () => {
    // Contraprueba de que la calificación es del servidor. Si el componente
    // mandara un puntaje, cualquiera lo escribiría con la consola abierta y
    // acabaría dentro de una constancia.
    const { alEnviar } = pintar();

    fireEvent.click(screen.getByRole("radio", { name: /^b$/ }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(screen.getByRole("radio", { name: /^d$/ }));
    fireEvent.click(screen.getByRole("button", { name: /enviar respuestas/i }));

    expect(alEnviar).toHaveBeenCalledWith([1, 1]);
    const argumento = alEnviar.mock.calls[0][0];
    expect(argumento.every((x: unknown) => typeof x === "number")).toBe(true);
  });

  it("con el veredicto NO revela cuáles se fallaron", () => {
    // Señalarlas convertiría el segundo intento en copiar la corrección del
    // primero, y entonces el tope de intentos dejaría de medir nada.
    pintar({ resultado: intento() });

    expect(screen.getByText("50 %")).toBeInTheDocument();
    expect(screen.getByText(/1 de 2 correctas/i)).toBeInTheDocument();
    expect(screen.queryByText("¿Uno?")).not.toBeInTheDocument();
    expect(screen.queryByText("¿Dos?")).not.toBeInTheDocument();
  });

  it("cuando ya no hay reintento, muestra la retroalimentación que llegue", () => {
    // El servidor la manda vacía mientras queden intentos; esta pantalla solo
    // pinta lo que le llega. Si algún día llegara de más, se vería aquí.
    pintar({
      resultado: intento({
        puede_reintentar: false,
        retroalimentacion: [
          { enunciado: "¿Uno?", acierto: true, texto: "Bien visto." },
          { enunciado: "¿Dos?", acierto: false, texto: null },
        ],
      }),
    });

    expect(screen.getByText(/bien visto/i)).toBeInTheDocument();
    expect(screen.getByText(/incorrecta · ¿dos\?/i)).toBeInTheDocument();
  });

  it("aprobado ofrece volver al curso, no reintentar", () => {
    pintar({ resultado: intento({ aprobado: true, puntaje: 100, puede_reintentar: false }) });

    expect(screen.getByRole("button", { name: /volver al curso/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /intentar de nuevo/i })).not.toBeInTheDocument();
  });

  it("sin intentos disponibles no vuelve a preguntar", () => {
    pintar({
      evaluacion: evaluacion({
        puede_intentar: false,
        aprobado: true,
        intentos_usados: 1,
        mejor_puntaje: 90,
      }),
    });

    expect(screen.getByText(/ya aprobaste esta evaluación/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("la barra mide lo RESPONDIDO, no la pregunta que se está viendo", () => {
    // Avanzar sin contestar no es progreso, y pintarlo como si lo fuera haría
    // creer que queda menos de lo que queda.
    pintar();
    const barra = screen.getByRole("progressbar", { name: /preguntas respondidas/i });

    expect(barra).toHaveAttribute("aria-valuenow", "0");
    fireEvent.click(screen.getByRole("radio", { name: /^a$/ }));
    expect(barra).toHaveAttribute("aria-valuenow", "1");
  });
});
