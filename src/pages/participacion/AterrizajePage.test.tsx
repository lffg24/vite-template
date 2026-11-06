// src/pages/participacion/AterrizajePage.test.tsx
//
// Lo que se prueba aquí es que la portada del enlace de GRUPO no prometa una
// inscripción que el backend va a negar.
//
// El defecto era exactamente ese: como la respuesta del aterrizaje no llevaba
// el modo, la pantalla ofrecía «Comenzar», llevaba al formulario, pedía el
// documento y solo entonces `POST /inscribir` respondía 403. Quien organizaba
// repartía el enlace de grupo sin saber que ya no servía para entrar.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AterrizajePage from "./AterrizajePage";
import {
  abrirEnlace,
  inscribirse,
  reanudarConDocumento,
} from "@/services/participacionService";
import type { Aterrizaje } from "@/types/participacion";

vi.mock("@/services/participacionService", () => ({
  abrirEnlace: vi.fn(),
  inscribirse: vi.fn(),
  reanudarConDocumento: vi.fn(),
}));

const BASE: Aterrizaje = {
  curso: "Inducción general SG-SST",
  empresa: "Constructora del Norte",
  numero_version: 2,
  lecciones: 4,
  duracion_estimada_min: 45,
  exige_invitacion: false,
  textos: [
    {
      clave: "autorizacion_datos_participante",
      texto_id: "t1",
      version: 1,
      finalidad: "Autorizo el tratamiento de mis datos personales.",
      contenido: "Texto de la autorización.",
    },
    {
      clave: "declaracion_veracidad",
      texto_id: "t2",
      version: 1,
      finalidad: "Declaro que los datos son veraces.",
      contenido: "Texto de la declaración.",
    },
  ],
};

function montar() {
  return render(
    <MemoryRouter initialEntries={["/c/tok3n"]}>
      <Routes>
        <Route path="/c/:token" element={<AterrizajePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cuando la asignación exige invitación personal", () => {
  beforeEach(() => {
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: true });
  });

  it("no ofrece «Comenzar»", async () => {
    montar();
    // Se espera a que la portada esté pintada antes de afirmar una ausencia:
    // sin esto la prueba pasaría igual con la pantalla todavía cargando, que es
    // como se escriben las negativas que no prueban nada.
    await screen.findByRole("heading", { name: BASE.curso });

    expect(screen.queryByRole("button", { name: /comenzar/i })).toBeNull();
  });

  it("explica que hace falta un enlace propio y a quién pedírselo", async () => {
    montar();

    expect(
      await screen.findByText(/capacitación se hace con una invitación personal/i)
    ).toBeTruthy();
    expect(screen.getByText(/te envía un enlace\s+propio, solo tuyo/i)).toBeTruthy();
  });

  it("sigue sirviendo para ver de qué va el curso", async () => {
    // El enlace no se cierra del todo a propósito: es adonde llega quien lo
    // recibió por WhatsApp, y dejarlo mudo lo convertiría en un error.
    montar();

    expect(await screen.findByRole("heading", { name: BASE.curso })).toBeTruthy();
    expect(screen.getByText(BASE.empresa)).toBeTruthy();
    expect(screen.getByText(/4 lecciones/)).toBeTruthy();
  });

  it("no revela si esta persona está en la lista de la empresa", async () => {
    // Decirlo filtraría quién trabaja allí a cualquiera que abra el enlace.
    montar();
    await screen.findByRole("heading", { name: BASE.curso });

    expect(screen.queryByText(/no estás inscrit/i)).toBeNull();
    expect(screen.queryByText(/no figuras/i)).toBeNull();
  });

  it("deja reanudar a quien ya había empezado", async () => {
    // Perder el acceso a la reanudación por no tener invitación dejaría fuera a
    // quien SÍ entró en su momento.
    montar();

    expect(await screen.findByRole("button", { name: /ya había empezado/i })).toBeTruthy();
  });
});

describe("cuando la asignación admite el enlace de grupo", () => {
  it("sí ofrece «Comenzar» — CONTRAPRUEBA", async () => {
    // Sin esta, las cinco de arriba pasarían con una pantalla que nunca deja
    // entrar a nadie, que sería un defecto distinto y peor.
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: false });
    montar();

    expect(await screen.findByRole("button", { name: /comenzar/i })).toBeTruthy();
  });

  it("no muestra el aviso de invitación personal", async () => {
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: false });
    montar();
    await screen.findByRole("heading", { name: BASE.curso });

    expect(screen.queryByText(/invitación personal/i)).toBeNull();
  });

  it("reanuda con el mismo enlace y el documento, sin mostrar códigos", async () => {
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: false });
    vi.mocked(reanudarConDocumento).mockResolvedValue({} as never);
    montar();

    fireEvent.click(await screen.findByRole("button", { name: /ya había empezado/i }));

    expect(await screen.findByRole("heading", { name: /continúa tu capacitación/i })).toBeTruthy();
    expect(screen.queryByText(/código de continuación/i)).toBeNull();
    fireEvent.change(screen.getByLabelText(/número de documento/i), {
      target: { value: "1018442907" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^continuar$/i }));

    expect(reanudarConDocumento).toHaveBeenCalledWith("tok3n", "CC", "1018442907");
  });
});

describe("la pantalla no decide la regla", () => {
  it("obedece al servidor aunque el modo sea invisible en la respuesta", async () => {
    // `exige_invitacion` lo calcula el backend con la MISMA función que produce
    // el 403. Si el cliente reimplementara la condición, las dos se separarían
    // y volveríamos a prometer lo que se niega. Aquí se comprueba que la
    // pantalla no infiere nada del resto de la respuesta: mismos datos, único
    // cambio el booleano, resultado opuesto.
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: true });
    const { unmount } = montar();
    await screen.findByRole("heading", { name: BASE.curso });
    expect(screen.queryByRole("button", { name: /comenzar/i })).toBeNull();
    unmount();

    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: false });
    montar();
    expect(await screen.findByRole("button", { name: /comenzar/i })).toBeTruthy();
  });

  it("nunca llama a inscribirse por su cuenta", async () => {
    vi.mocked(abrirEnlace).mockResolvedValue({ ...BASE, exige_invitacion: true });
    montar();
    await screen.findByRole("heading", { name: BASE.curso });

    expect(vi.mocked(inscribirse)).not.toHaveBeenCalled();
  });
});
