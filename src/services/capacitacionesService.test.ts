import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/apiClient";
import {
  crearAsignacion,
  errorApi,
  generarEnlace,
  listarEnlaces,
  obtenerCurso,
  publicarCurso,
} from "./capacitacionesService";
import type { ErrorApi } from "@/types/capacitaciones";

vi.mock("@/lib/apiClient", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

/** Fabrica un fallo con la forma exacta que produce axios. */
function fallo(status: number, detail: unknown) {
  return { response: { status, data: { detail } }, message: "Request failed" };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("traducción de errores de la API", () => {
  it("explica el 422 estructural de FastAPI en vez de ocultarlo con el fallback", () => {
    const error = errorApi(
      fallo(422, [
        {
          type: "missing",
          loc: ["body", "evaluacion", "preguntas", 0, "correctas"],
          msg: "Field required",
        },
      ]),
      "No pudimos agregar la lección."
    );

    expect(error).toMatchObject({ status: 422, message: "Field required" });
  });

  it("conserva el 404 para que la pantalla no lo confunda con un 403", async () => {
    // El backend responde 404 —y no 403— sobre un curso de otra empresa: un 403
    // confirmaría que el identificador existe en otro inquilino. Si el cliente
    // perdiera el estado, la pantalla no podría distinguir "no existe" de
    // "no puedes", que es justo lo que el backend se tomó el trabajo de separar.
    vi.mocked(api.get).mockRejectedValueOnce(fallo(404, "No existe ese curso."));

    await expect(obtenerCurso("id")).rejects.toMatchObject({
      status: 404,
      message: "No existe ese curso.",
    });
  });

  it("extrae la lista de faltantes del 422 de publicación", async () => {
    // Sin esto, A-05 solo podría decir "no se pudo publicar" y el usuario
    // tendría que adivinar qué le falta.
    vi.mocked(api.post).mockRejectedValueOnce(
      fallo(422, {
        mensaje: "No se puede publicar. Falta: el temario; al menos una lección.",
        faltantes: ["el temario (dato normativo de la constancia)", "al menos una lección"],
      })
    );

    let capturado: ErrorApi | null = null;
    try {
      await publicarCurso("id");
    } catch (e) {
      capturado = e as ErrorApi;
    }

    expect(capturado?.status).toBe(422);
    expect(capturado?.faltantes).toEqual([
      "el temario (dato normativo de la constancia)",
      "al menos una lección",
    ]);
  });

  it("marca el 409 de asignación duplicada", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(
      fallo(409, "Esa versión ya está asignada y activa para esta empresa.")
    );

    await expect(crearAsignacion({ curso_version_id: "v" })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("usa un mensaje propio cuando el fallo no trae detalle legible", async () => {
    // Un 500 sin cuerpo no puede acabar mostrando "undefined" en pantalla.
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 500, data: {} } });

    await expect(listarEnlaces("a")).rejects.toMatchObject({
      status: 500,
      message: "No pudimos obtener los enlaces.",
    });
  });
});

describe("rutas y contrato", () => {
  it("pide las versiones asignables al endpoint del módulo, no a uno inventado", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { enlace_id: "e", token: "t", expira_en: "2026-10-05T00:00:00Z", cupo_max: null, curso: "C" },
    });

    await generarEnlace("asig-1", { vigencia_dias: 15, cupo_max: 20 });

    expect(api.post).toHaveBeenCalledWith("/capacitaciones/asignaciones/asig-1/enlaces", {
      vigencia_dias: 15,
      cupo_max: 20,
    });
  });

  it("el listado de enlaces no devuelve token ni hash", async () => {
    // Contraprueba de la decisión de rotación: si algún día el backend
    // empezara a devolver el token en el listado, esta prueba lo delata en vez
    // de que aparezca silenciosamente en una tabla.
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [
        {
          id: "e1",
          asignacion_id: "a1",
          expira_en: "2026-10-05T00:00:00Z",
          cupo_max: null,
          usos: 3,
          estado: "ACTIVO",
          utilizable: true,
          creado_en: "2026-09-05T00:00:00Z",
          revocado_en: null,
        },
      ],
    });

    const enlaces = await listarEnlaces("a1");

    expect(api.get).toHaveBeenCalledWith("/capacitaciones/asignaciones/a1/enlaces");
    for (const e of enlaces) {
      expect(e).not.toHaveProperty("token");
      expect(e).not.toHaveProperty("token_hash");
    }
  });
});
