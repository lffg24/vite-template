import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { DialogoTransicion, VistaTareas, estaVencida, iniciales, type ColumnaTablero, type TareaVista } from ".";

const COLUMNAS: ColumnaTablero[] = [
  { id: "a", titulo: "Pendiente", tono: "info" },
  { id: "b", titulo: "En curso", tono: "marca", limite: 1 },
  { id: "c", titulo: "Hecha", tono: "exito" },
];
const TAREAS: TareaVista[] = [
  { id: "1", clave: "T-1", titulo: "Revisar pliegos", columna: "a", prioridad: "alta", vence: "2020-01-01" },
  { id: "2", clave: "T-2", titulo: "Armar propuesta", columna: "b", prioridad: "baja" },
  { id: "3", clave: "T-3", titulo: "Enviar oferta", columna: "b", responsables: [{ id: "p", nombre: "Laura Gómez" }] },
];

describe("modelo", () => {
  it("vencida es antes de hoy, por día", () => {
    expect(estaVencida("2020-01-01")).toBe(true);
    expect(estaVencida("2999-01-01")).toBe(false);
    expect(estaVencida(undefined)).toBe(false);
  });
  it("las iniciales son primera y última palabra", () => {
    expect(iniciales("Laura Gómez")).toBe("LG");
    expect(iniciales("Ana María de la Cruz")).toBe("AC");
    expect(iniciales("  ")).toBe("?");
  });
});

describe("VistaTareas", () => {
  it("el menú «Mover a» pide el movimiento y no lo hace por su cuenta", () => {
    const pedir = vi.fn();
    render(<VistaTareas columnas={COLUMNAS} tareas={TAREAS} alSolicitarMovimiento={pedir} />);

    fireEvent.click(screen.getByRole("button", { name: /más acciones para revisar pliegos/i }));
    fireEvent.click(screen.getByRole("button", { name: "Hecha" }));

    expect(pedir).toHaveBeenCalledTimes(1);
    expect(pedir.mock.calls[0][0].id).toBe("1");
    expect(pedir.mock.calls[0][1].id).toBe("c");
    // La tarea sigue donde estaba: mover es decisión de quien consume.
    const pendiente = screen.getByRole("region", { name: "Tablero de tareas" }).querySelectorAll("section")[0];
    expect(within(pendiente as HTMLElement).getByText("Revisar pliegos")).toBeInTheDocument();
  });

  it("la columna avisa cuando pasa su límite", () => {
    render(<VistaTareas columnas={COLUMNAS} tareas={TAREAS} />);
    expect(screen.getByText(/2\/1/)).toBeInTheDocument();
    expect(screen.getByText(/pasa el límite/i)).toBeInTheDocument();
  });

  it("buscar filtra las dos vistas por igual", () => {
    render(<VistaTareas columnas={COLUMNAS} tareas={TAREAS} />);
    fireEvent.change(screen.getByLabelText(/buscar tareas/i), { target: { value: "oferta" } });
    expect(screen.getByText(/1 de 3 tareas con el filtro/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lista" }));
    expect(screen.getByText(/1 de 3 tareas con el filtro/i)).toBeInTheDocument();
    expect(screen.getByText("Enviar oferta")).toBeInTheDocument();
    expect(screen.queryByText("Revisar pliegos")).toBeNull();
  });

  it("abre el detalle desde el título y muestra el estado vivo", () => {
    render(
      <VistaTareas
        columnas={COLUMNAS}
        tareas={TAREAS}
        detalle={(t) => ({ descripcion: `Detalle de ${t.titulo}`, campos: [{ etiqueta: "Entidad", valor: "Alcaldía" }] })}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Revisar pliegos" }));
    expect(screen.getByText("Detalle de Revisar pliegos")).toBeInTheDocument();
    expect(screen.getByText("Alcaldía")).toBeInTheDocument();
  });
});

describe("DialogoTransicion", () => {
  it("si guardar falla, sigue abierto, muestra el error y conserva lo escrito", async () => {
    const alCerrar = vi.fn();
    render(
      <DialogoTransicion abierto alCerrar={alCerrar} titulo="Mover a «NO GO»" alConfirmar={() => Promise.reject(new Error("Sin conexión con el servicio"))}>
        <input aria-label="Motivo" defaultValue="escrito" />
      </DialogoTransicion>
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Sin conexión con el servicio")).toBeInTheDocument();
    expect(alCerrar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Motivo")).toHaveValue("escrito");
  });

  it("Confirmar espera a que sea válido", () => {
    render(<DialogoTransicion abierto alCerrar={() => {}} titulo="x" valido={false} alConfirmar={() => {}} />);
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
  });
});
