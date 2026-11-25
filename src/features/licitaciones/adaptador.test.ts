import { describe, expect, it } from "vitest";

import { aTarea, columnaDe, reglaDeMovimiento } from "./adaptador";
import type { Opportunity } from "./service";

const base = {
  id: "u1", workflow_state: "NUEVA", lane: "x", row_version: 1, updated_at: "", external_process_id: "CO1.BDOS.1",
  buyer_name: "Alcaldía de Soacha", object_original: "Programa SST", official_status: "x", budget_amount: "480000000",
  budget_currency: "COP", next_deadline: "2026-12-04T14:00:00Z", deadline_precision: null, current_revision: "r1",
  service_category: "SST", department: null, municipalities_json: null, territory_evidence_status: null,
  volume_amount: null, volume_unit: null, volume_evidence_status: null, completeness: 0.5, decision: null,
} as Opportunity;

describe("adaptador de licitaciones", () => {
  it("la columna es la decisión si existe; si no, el estado", () => {
    expect(columnaDe({ decision: "NO_GO", workflow_state: "CERRADA" })).toBe("NO_GO");
    expect(columnaDe({ decision: null, workflow_state: "NUEVA" })).toBe("NUEVA");
    expect(columnaDe({ decision: null, workflow_state: "EN_REVISION" })).toBe("EN_REVISION");
    // Un estado que no conocemos no desaparece de la pantalla: cae en revisión.
    expect(columnaDe({ decision: null, workflow_state: "OTRO" })).toBe("EN_REVISION");
  });

  it("traduce la oportunidad a tarea con clave, fecha por día y etiquetas", () => {
    const t = aTarea(base);
    expect(t.clave).toBe("CO1.BDOS.1");
    expect(t.vence).toBe("2026-12-04");
    expect(t.titulo).toContain("Alcaldía de Soacha");
    expect(t.etiquetas?.map((e) => e.texto)).toContain("SST");
    expect(t.origen).toBe(base);
  });

  it("solo las columnas de decisión se alcanzan, y con permiso", () => {
    const t = aTarea(base);
    expect(reglaDeMovimiento(t, "NO_GO", true)).toEqual({ tipo: "decision" });
    expect(reglaDeMovimiento(t, "NO_GO", false)).toMatchObject({ tipo: "rechazo" });
    expect(reglaDeMovimiento(t, "EN_REVISION", true)).toMatchObject({ tipo: "rechazo" });
  });

  it("una decisión cerrada no se reabre", () => {
    const cerrada = aTarea({ ...base, decision: "GO", workflow_state: "CERRADA" });
    expect(reglaDeMovimiento(cerrada, "NO_GO", true)).toMatchObject({
      tipo: "rechazo",
      motivo: expect.stringContaining("ya tiene"),
    });
  });
});
