import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ModoIdentidadBadge } from "./Insignias";
import type { ModoIdentidad } from "@/types/capacitaciones";

describe("la insignia del modo de identidad", () => {
  it("con invitación individual avisa de que el acceso es personal", () => {
    render(<ModoIdentidadBadge modo="INVITACION_INDIVIDUAL" />);
    expect(screen.getByText("Invitación personal")).toBeInTheDocument();
  });

  it("con autodeclarada dice que el enlace sirve para entrar", () => {
    // Contraprueba de la anterior sobre el mismo componente.
    render(<ModoIdentidadBadge modo="AUTODECLARADA" />);
    expect(screen.getByText("Enlace abierto")).toBeInTheDocument();
  });

  it("sin modo NO afirma que el enlace esté abierto", () => {
    // El caso que motiva que esto tenga pruebas: un backend que todavía no
    // devuelve el campo. Escrito con un ternario, `undefined` caía en la rama
    // «enlace abierto» y la tabla afirmaba, sin datos, justo lo contrario de lo
    // que pasa por defecto — y de ahí sale repartir el enlace que no sirve.
    render(<ModoIdentidadBadge modo={undefined as unknown as ModoIdentidad} />);

    expect(screen.queryByText("Enlace abierto")).not.toBeInTheDocument();
    expect(screen.queryByText("Invitación personal")).not.toBeInTheDocument();
    expect(screen.getByText("Modo sin determinar")).toBeInTheDocument();
  });
});
