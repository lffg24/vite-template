// src/lib/utils.test.ts
//
// `cn` tiene que resolver los nombres de la casa, no solo los de Tailwind.
//
// Esta prueba existe porque el fallo era invisible: la clase sobrante se queda
// en el atributo y cual gana lo decide el orden de la hoja compilada. Una
// pantalla pedia `rounded-none` a una pieza, la pieza seguia con su radio, y
// nada en el codigo lo delataba.

import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn resuelve las escalas de la casa", () => {
  it("un radio gana al otro, con cualquiera de los dos nombres", () => {
    // Antes devolvia las dos clases: `rounded-rel-*` no estaba en la tabla.
    expect(cn("rounded-rel-panel", "rounded-none")).toBe("rounded-none");
    expect(cn("rounded-rel-card", "rounded-rel-panel")).toBe("rounded-rel-panel");
    // `rounded-lg` y `rounded-rel-control` valen lo mismo y son el mismo grupo.
    expect(cn("rounded-lg", "rounded-rel-card")).toBe("rounded-rel-card");
    expect(cn("rounded-rel-card", "rounded-lg")).toBe("rounded-lg");
  });

  it("`shadow-none` si quita el relieve de la casa", () => {
    // Antes no lo quitaba: un `shadow-<algo>` desconocido se clasificaba como
    // COLOR de sombra, y el color no entra en conflicto con la sombra.
    expect(cn("shadow-rel-card", "shadow-none")).toBe("shadow-none");
    expect(cn("shadow-rel-card", "shadow-rel-floating")).toBe("shadow-rel-floating");
  });

  it("no se lleva por delante lo que no es del grupo", () => {
    expect(cn("shadow-rel-card", "text-rel-dark")).toBe("shadow-rel-card text-rel-dark");
    expect(cn("rounded-rel-card", "border", "bg-rel-surface")).toBe(
      "rounded-rel-card border bg-rel-surface"
    );
  });
});
