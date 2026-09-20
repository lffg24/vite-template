import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";

import { FiltroChips } from "./FiltroChips";
import { IndicadorKpi } from "./IndicadorKpi";
import { PageHeader } from "./PageHeader";
import { Pill } from "./Pill";
import { AnilloProgreso, BarraProgreso } from "./Progreso";

describe("Pill", () => {
  it("el estado se LEE en el texto; el punto es decorativo", () => {
    const { container } = render(<Pill tono="peligro">Vencido</Pill>);

    expect(screen.getByText("Vencido")).toBeInTheDocument();
    const punto = container.querySelector("[aria-hidden='true']");
    expect(punto).not.toBeNull();
    expect(punto?.className).toContain("bg-rel-danger");
  });

  it("sin punto, no dibuja ninguno", () => {
    const { container } = render(
      <Pill tono="neutro" punto={false}>
        SST
      </Pill>
    );
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });
});

describe("BarraProgreso", () => {
  it("anuncia su valor y lo que mide", () => {
    render(<BarraProgreso valor={0.25} etiqueta="Avance del curso" />);
    const barra = screen.getByRole("progressbar", { name: "Avance del curso" });
    expect(barra).toHaveAttribute("aria-valuenow", "25");
  });

  it("un valor fuera de rango no dibuja una barra que se sale", () => {
    // Un 1,2 de un cálculo con redondeo, o un NaN de dividir por cero.
    const { rerender } = render(<BarraProgreso valor={1.2} etiqueta="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<BarraProgreso valor={Number.NaN} etiqueta="x" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});

describe("AnilloProgreso", () => {
  it("es un progressbar con porcentaje entero", () => {
    render(<AnilloProgreso valor={0.846} etiqueta="Cumplimiento general" />);
    expect(screen.getByRole("progressbar", { name: "Cumplimiento general" })).toHaveAttribute(
      "aria-valuenow",
      "85"
    );
  });
});

describe("FiltroChips", () => {
  const opciones = [
    { valor: "todas", etiqueta: "Todas", cuenta: 3 },
    { valor: "vigentes", etiqueta: "Vigentes", cuenta: 2, tono: "exito" as const },
    { valor: "vencidas", etiqueta: "Vencidas", cuenta: 1, tono: "peligro" as const },
  ];

  it("marca el activo y avisa el cambio", () => {
    const alCambiar = vi.fn();
    render(
      <FiltroChips etiqueta="Estado" opciones={opciones} valor="todas" alCambiar={alCambiar} />
    );

    expect(screen.getByRole("group", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Todas/ })).toHaveAttribute("aria-pressed", "true");
    // Contraprueba: los demás NO están pulsados.
    expect(screen.getByRole("button", { name: /Vencidas/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(screen.getByRole("button", { name: /Vencidas/ }));
    expect(alCambiar).toHaveBeenCalledWith("vencidas");
  });
});

describe("IndicadorKpi", () => {
  it("el número va con su contexto", () => {
    render(<IndicadorKpi etiqueta="Finalizadas" valor={132} contexto="de 157 asignaciones" />);
    expect(screen.getByText("132")).toBeInTheDocument();
    expect(screen.getByText("de 157 asignaciones")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("pinta el antetítulo sobre el título", () => {
    render(<PageHeader antetitulo="Empresa" titulo="Matriz de capacitación" icono={Building2} />);
    expect(screen.getByText("Empresa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Matriz de capacitación" })).toBeInTheDocument();
  });

  it("sin antetítulo no deja un párrafo vacío", () => {
    const { container } = render(<PageHeader titulo="Cursos" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("la variante ilustrada conserva título y acción aunque la imagen sea decorativa", () => {
    render(
      <PageHeader
        variant="dark-illustrated"
        antetitulo="Gestión"
        titulo="Empresas"
        descripcion="Administra clientes"
        illustration="companyManagement"
        accion={<button type="button">Nueva empresa</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva empresa" })).toBeInTheDocument();
    expect(screen.getByText("Administra clientes")).toBeInTheDocument();
  });
});
