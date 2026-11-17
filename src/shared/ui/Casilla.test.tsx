import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Casilla } from "./Casilla";

describe("Casilla", () => {
  it("la etiqueta manda el clic a la casilla", () => {
    const alCambiar = vi.fn();
    render(<Casilla etiqueta="Autorizo el tratamiento" marcada={false} alCambiar={alCambiar} />);

    // Esto es lo que hace que el blanco táctil sea la fila y no la caja de
    // 16 px: si la etiqueta no está unida al control, pulsar el texto no hace
    // nada y hay que acertar en la caja.
    fireEvent.click(screen.getByText("Autorizo el tratamiento"));
    expect(alCambiar).toHaveBeenCalledWith(true);
  });

  it("la descripción se anuncia con la casilla, no al lado", () => {
    render(
      <Casilla
        etiqueta="Recibir avisos"
        descripcion="Un correo por cada curso asignado."
        marcada
        alCambiar={() => {}}
      />
    );
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "Un correo por cada curso asignado."
    );
  });

  it("conserva el `aria-describedby` de quien la usa y añade el suyo", () => {
    // Hay pantallas que apuntan a un texto legal desplegable. Quedarse solo
    // con uno de los dos deja a alguien sin la mitad de la explicación.
    render(
      <>
        <p id="texto-legal">El texto completo de la autorización.</p>
        <Casilla
          etiqueta="Acepto"
          descripcion="Puedes retirarla cuando quieras."
          aria-describedby="texto-legal"
          marcada={false}
          alCambiar={() => {}}
        />
      </>
    );
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "El texto completo de la autorización. Puedes retirarla cuando quieras."
    );
  });

  it("deshabilitada lo está en el control, no solo en el color", () => {
    // Se comprueba el atributo y no un clic simulado a propósito: `fireEvent`
    // lanza el evento directamente sobre el nodo, así que atraviesa el
    // `disabled` que un navegador de verdad respeta. Un clic que «pasa» aquí
    // no probaría nada.
    render(<Casilla etiqueta="Bloqueada" marcada={false} alCambiar={() => {}} deshabilitada />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
