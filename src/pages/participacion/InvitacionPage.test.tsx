import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import InvitacionPage from "./InvitacionPage";
import { abrirInvitacion, aceptarInvitacion } from "@/services/participacionService";
import type { AterrizajeInvitacion, ErrorPublico } from "@/types/participacion";

vi.mock("@/services/participacionService", () => ({
  abrirInvitacion: vi.fn(),
  aceptarInvitacion: vi.fn(),
}));

const INVITACION: AterrizajeInvitacion = {
  curso: "Trabajo en alturas",
  empresa: "Constructora del Norte",
  numero_version: 3,
  lecciones: 4,
  duracion_estimada_min: 40,
  identidad: { nombre: "Maria F. O***", documento: "CC ***907" },
  expira_en: "2026-10-07T12:00:00Z",
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
    <MemoryRouter initialEntries={["/c/i/tok3n"]}>
      <Routes>
        <Route path="/c/i/:token" element={<InvitacionPage />} />
      </Routes>
    </MemoryRouter>
  );
}

async function marcarTodo() {
  for (const c of await screen.findAllByRole("checkbox")) fireEvent.click(c);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lo que la pantalla NO pide", () => {
  it("no tiene ningún campo de identidad", async () => {
    // Es el arreglo del P0, y por eso se comprueba estructuralmente: no es que
    // el documento se valide mejor, es que no hay dónde escribirlo. Una prueba
    // de comportamiento volvería a pasar el día que alguien reponga el campo
    // «solo para el caso opcional».
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);

    montar();
    await screen.findByText("Trabajo en alturas");

    expect(screen.queryByLabelText(/documento/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^nombres/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^apellidos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("no manda ningún dato de identidad al confirmar", async () => {
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);
    vi.mocked(aceptarInvitacion).mockResolvedValue({
      inscripcion_id: "i1",
      participante_id: "p1",
      estado: "EN_CURSO",
      secreto: "s3cr3to",
      nueva: true,
    });

    montar();
    await marcarTodo();
    fireEvent.click(screen.getByRole("button", { name: /confirmar y empezar/i }));

    await vi.waitFor(() => expect(aceptarInvitacion).toHaveBeenCalledTimes(1));
    const [token, aceptaciones] = vi.mocked(aceptarInvitacion).mock.calls[0];
    expect(token).toBe("tok3n");
    // Solo las aceptaciones, con la versión exacta presentada.
    expect(aceptaciones).toEqual([
      { clave: "autorizacion_datos_participante", texto_id_presentado: "t1" },
      { clave: "declaracion_veracidad", texto_id_presentado: "t2" },
    ]);
  });
});

describe("la identidad que muestra", () => {
  it("la enseña enmascarada, tal como llega del servidor", async () => {
    // Este enlace puede acabar reenviado: el documento completo convertiría una
    // invitación perdida en una filtración.
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);

    montar();

    expect(await screen.findByText("Maria F. O***")).toBeInTheDocument();
    expect(screen.getByText("CC ***907")).toBeInTheDocument();
  });

  it("dice qué hacer si no eres tú", async () => {
    // Sin esto, quien recibe una invitación ajena por error no tiene ninguna
    // señal de que continuar deja una constancia con el nombre de otro.
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);

    montar();
    await screen.findByText("Maria F. O***");

    expect(screen.getByText(/si no eres tú, no continúes/i)).toBeInTheDocument();
  });
});

describe("las autorizaciones", () => {
  it("no deja confirmar hasta marcarlas todas", async () => {
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);

    montar();
    const boton = await screen.findByRole("button", { name: /confirmar y empezar/i });
    expect(boton).toBeDisabled();

    await marcarTodo();
    expect(boton).toBeEnabled();
  });

  it("el texto colapsado no describe la casilla", async () => {
    // `hidden` saca el elemento del árbol de accesibilidad: apuntar ahí deja un
    // `aria-describedby` que no resuelve a nada.
    vi.mocked(abrirInvitacion).mockResolvedValue(INVITACION);

    montar();
    for (const c of await screen.findAllByRole("checkbox")) {
      const id = c.getAttribute("aria-describedby");
      if (!id) continue;
      expect(document.getElementById(id)?.hasAttribute("hidden")).toBe(false);
    }
  });
});

describe("cuando la invitación ya no sirve", () => {
  it("no dice por qué", async () => {
    // «Ya se usó» confirmaría que se acertó un código; «caducó», que existió.
    const err = new Error("x") as ErrorPublico;
    err.motivo = "invitacion_no_disponible";
    vi.mocked(abrirInvitacion).mockRejectedValue(err);

    montar();

    expect(
      await screen.findByText(/esta invitación no está disponible/i)
    ).toBeInTheDocument();
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/revocada|consumida|ya se usó exactamente/i);
  });
});
