import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SocioSelectField, normalizeSocioOptions } from "./SociodemografiaFields";

describe("SociodemografiaFields", () => {
  it("normaliza opciones sin duplicados por mayusculas o tildes", () => {
    expect(
      normalizeSocioOptions(["Bachiller", "Técnico"], [
        { nombre: "bachiller" },
        { nombre: "Tecnico" },
        { nombre: "Profesional" },
      ]),
    ).toEqual(["Bachiller", "Técnico", "Profesional"]);
  });

  it("cierra el desplegable al hacer click fuera", () => {
    const onChange = vi.fn();
    render(
      <div>
        <SocioSelectField label="Nivel de estudios" value="" options={["Bachiller", "Profesional"]} onChange={onChange} />
        <button>Fuera</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /selecciona una opción/i }));
    expect(screen.getByRole("button", { name: "Bachiller" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Fuera" }));
    expect(screen.queryByRole("button", { name: "Bachiller" })).not.toBeInTheDocument();
  });
});
