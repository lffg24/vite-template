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
  contacto: null,
};

/** La misma encuesta, publicada en una versión que sí pide contacto. */
const conContacto: FormularioCalificacion = {
  ...formulario,
  contacto: {
    pide_telefono: true,
    autorizacion: {
      clave: "autorizacion_datos_encuestado_cx",
      texto_id: "texto-vigente-1",
      version: 1,
      finalidad: "Contactarte respecto de tu calificación.",
      contenido: "Autorizo el tratamiento de mis datos personales.",
    },
  },
};

/** Responde las dos preguntas y llega al final del recorrido. */
async function responderTodo() {
  fireEvent.click(screen.getByRole("radio", { name: "5 de 5" }));
  fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
  await screen.findByRole("radio", { name: "10 de 10" });
  fireEvent.click(screen.getByRole("radio", { name: "10 de 10" }));
}

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
  it("avanza suavemente después de seleccionar con puntero y conserva el botón Anterior", async () => {
    montar();
    await screen.findByText(/¿Cómo fue la atención/);

    fireEvent.click(screen.getByRole("radio", { name: "4 de 5" }));

    expect(await screen.findByText(/¿Nos recomendarías/, {}, { timeout: 1500 })).toBeTruthy();
    expect(screen.getByRole("button", { name: /anterior/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(screen.getByRole("radio", { name: "4 de 5" })).toBeChecked();
  });

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

  it("no pide ningún dato cuando la versión es anónima", async () => {
    montar();
    await screen.findByText(/¿Cómo fue la atención/);
    await responderTodo();
    fireEvent.click(screen.getByRole("button", { name: /enviar calificación/i }));
    await screen.findByRole("heading", { name: /gracias por tu calificación/i });
    // Ni paso intermedio ni campo de contacto: el recorrido de siempre.
    expect(screen.queryByLabelText(/correo/i)).toBeNull();
    expect(vi.mocked(enviarCalificacion).mock.calls[0][1].contacto).toBeNull();
  });

  describe("versión que pide contacto", () => {
    beforeEach(() => vi.mocked(abrirCalificacion).mockResolvedValue(conContacto));

    it("ofrece el contacto al final, con la casilla sin premarcar", async () => {
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

      expect(await screen.findByRole("heading", { name: /quieres que te contactemos/i })).toBeTruthy();
      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(enviarCalificacion).not.toHaveBeenCalled();
      // El teléfono se ofrece porque esta versión lo pidió.
      expect(screen.getByLabelText(/teléfono/i)).toBeTruthy();
    });

    it("permite enviar la calificación sin dejar datos", async () => {
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
      await screen.findByRole("heading", { name: /quieres que te contactemos/i });
      fireEvent.click(screen.getByRole("button", { name: /enviar sin dejar mis datos/i }));

      await screen.findByRole("heading", { name: /gracias por tu calificación/i });
      expect(vi.mocked(enviarCalificacion).mock.calls[0][1].contacto).toBeNull();
    });

    it("no envía datos sin la autorización marcada", async () => {
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
      await screen.findByRole("heading", { name: /quieres que te contactemos/i });
      fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: "Ana Ríos" } });
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: "ana@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: /enviar con mis datos/i }));

      expect(screen.getByRole("alert").textContent).toMatch(/marca la autorización/i);
      expect(enviarCalificacion).not.toHaveBeenCalled();
    });

    it("exige nombre y correo cuando la persona sí autoriza", async () => {
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
      await screen.findByRole("heading", { name: /quieres que te contactemos/i });
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: /enviar con mis datos/i }));

      expect(screen.getByRole("alert").textContent).toMatch(/nombre y el correo son obligatorios/i);
      expect(enviarCalificacion).not.toHaveBeenCalled();
    });

    it("envía el contacto contra la versión del texto que se presentó", async () => {
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
      await screen.findByRole("heading", { name: /quieres que te contactemos/i });
      fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: "  Ana Ríos  " } });
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: "ana@example.com" } });
      fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: "3001234567" } });
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: /enviar con mis datos/i }));

      await screen.findByRole("heading", { name: /gracias por tu calificación/i });
      expect(vi.mocked(enviarCalificacion).mock.calls[0][1].contacto).toEqual({
        nombre: "Ana Ríos",
        correo: "ana@example.com",
        telefono: "3001234567",
        consentimiento: true,
        texto_id_presentado: "texto-vigente-1",
      });
    });

    it("no ofrece el teléfono si la versión no lo pidió", async () => {
      vi.mocked(abrirCalificacion).mockResolvedValue({
        ...conContacto,
        contacto: { ...conContacto.contacto!, pide_telefono: false },
      });
      montar();
      await screen.findByText(/¿Cómo fue la atención/);
      await responderTodo();
      fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
      await screen.findByRole("heading", { name: /quieres que te contactemos/i });
      expect(screen.queryByLabelText(/teléfono/i)).toBeNull();
    });
  });

  it("no muestra el formulario cuando el enlace no está disponible", async () => {
    vi.mocked(abrirCalificacion).mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } });
    montar();
    expect(await screen.findByRole("heading", { name: /no está disponible/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /enviar calificación/i })).toBeNull();
  });
});
