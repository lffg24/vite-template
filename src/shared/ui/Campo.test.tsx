import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";
import { Campo } from "./Campo";

describe("Campo", () => {
  it("la etiqueta apunta al campo, no lo envuelve", () => {
    // Envolver funciona con un `input` suelto y falla con una lista de
    // opciones dentro: el área de clic de la etiqueta se traga la lista.
    render(
      <Campo id="nombre" etiqueta="Nombre completo">
        <Input />
      </Campo>
    );
    expect(screen.getByLabelText("Nombre completo")).toHaveAttribute("id", "nombre");
  });

  it("el error llega al campo, no solo a la pantalla", () => {
    // Es la razón de existir del componente: los ocho locales pintaban el
    // error como párrafo rojo suelto, sin relación con el campo.
    render(
      <Campo id="email" etiqueta="Correo" error="Correo inválido.">
        <Input />
      </Campo>
    );
    const campo = screen.getByLabelText("Correo");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Correo inválido.");
  });

  it("sin error, el campo no queda marcado como inválido", () => {
    render(
      <Campo id="email" etiqueta="Correo">
        <Input />
      </Campo>
    );
    expect(screen.getByLabelText("Correo")).not.toHaveAttribute("aria-invalid");
  });

  it("la ayuda y el error se anuncian los dos", () => {
    render(
      <Campo id="clave" etiqueta="Contraseña" ayuda="Mínimo 12 caracteres." error="Demasiado corta.">
        <Input />
      </Campo>
    );
    expect(screen.getByLabelText("Contraseña")).toHaveAccessibleDescription(
      "Mínimo 12 caracteres. Demasiado corta."
    );
  });

  it("el asterisco de obligatorio no entra en el nombre del campo", () => {
    // Ojo con la consulta: `getByLabelText` compara el TEXTO de la etiqueta,
    // que sí incluye el asterisco. El nombre que anuncia el lector de pantalla
    // es otro cálculo —excluye los subárboles `aria-hidden`— y es el que se
    // comprueba aquí. Lo obligatorio viaja en `required`, no en el símbolo.
    render(
      <Campo id="nombre" etiqueta="Nombre" obligatorio>
        <Input required />
      </Campo>
    );
    const campo = screen.getByRole("textbox");
    expect(campo).toHaveAccessibleName("Nombre");
    expect(campo).toBeRequired();
  });

  it("no pisa lo que el hijo ya declara", () => {
    render(
      <Campo id="campo" etiqueta="Etiqueta" error="Algo falla.">
        <Input id="propio" aria-describedby="otro-sitio" />
      </Campo>
    );
    const campo = screen.getByRole("textbox");
    expect(campo).toHaveAttribute("id", "propio");
    expect(campo).toHaveAttribute("aria-describedby", "otro-sitio");
  });
});
