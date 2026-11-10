import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CalificacionPublicaPage from "./CalificacionPublicaPage";
import { abrirCalificacion, enviarCalificacion } from "@/services/cxPublicoService";
import type { FormularioCalificacion } from "@/services/cxPublicoService";

vi.mock("@/services/cxPublicoService", async (original) => {
  const real = await original<typeof import("@/services/cxPublicoService")>();
  return { ...real, abrirCalificacion: vi.fn(), enviarCalificacion: vi.fn() };
});

const formulario: FormularioCalificacion = {
  titulo: "Califica tu experiencia",
  version: 2,
  presentacion: "credencial-firmada",
  preguntas: [
    { id: "pregunta-1", orden: 1, tipo: "CSAT", enunciado: "¿Cómo fue la atención?", obligatorio: true },
    { id: "pregunta-2", orden: 2, tipo: "NPS_RELACIONAL", enunciado: "¿Nos recomendarías?", obligatorio: true },
  ],
};

function montar() {
  return render(
    <MemoryRouter initialEntries={["/cx/qr-estable"]}>
      <Routes><Route path="/cx/:token" element={<CalificacionPublicaPage />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(abrirCalificacion).mockResolvedValue(formulario);
  vi.mocked(enviarCalificacion).mockResolvedValue({ id: "envio-1", version_id: "version-2", repetido: false });
});

describe("calificación pública", () => {
  it("exige la pregunta obligatoria y confirma el envío con el mismo QR", async () => {
    montar();
    expect(await screen.findByText(/¿Cómo fue la atención/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/selecciona una respuesta/i);
    expect(enviarCalificacion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: "5 de 5" }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(await screen.findByText(/¿Nos recomendarías/)).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "10 de 10" }));
    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));

    expect(await screen.findByRole("heading", { name: /gracias por tu calificación/i })).toBeTruthy();
    expect(enviarCalificacion).toHaveBeenCalledWith("qr-estable", expect.objectContaining({
      presentacion: "credencial-firmada",
      respuestas: [{ item_id: "pregunta-1", valor: 5 }, { item_id: "pregunta-2", valor: 10 }],
    }));
  });

  it("mantiene las respuestas y la clave de idempotencia al reintentar tras fallo de red", async () => {
    vi.mocked(enviarCalificacion).mockRejectedValueOnce(new Error("sin red"));
    montar();
    await screen.findByText(/¿Cómo fue la atención/);
    fireEvent.click(screen.getByRole("radio", { name: "4 de 5" }));
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    await screen.findByText(/¿Nos recomendarías/);
    fireEvent.click(screen.getByRole("radio", { name: "9 de 10" }));
    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByRole("radio", { name: "9 de 10" }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));
    await screen.findByRole("heading", { name: /gracias por tu calificación/i });
    expect(vi.mocked(enviarCalificacion).mock.calls[0][1].idempotency_key)
      .toBe(vi.mocked(enviarCalificacion).mock.calls[1][1].idempotency_key);
  });

  it("no muestra el formulario cuando el enlace no está disponible", async () => {
    vi.mocked(abrirCalificacion).mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    montar();
    expect(await screen.findByRole("heading", { name: /no está disponible/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /enviar calificación/i })).toBeNull();
  });
});
