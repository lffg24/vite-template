import { expect, test } from "@playwright/test";

const opportunity = {
  id: "11111111-1111-4111-8111-111111111111",
  workflow_state: "ABIERTA",
  lane: "NUEVA",
  row_version: 1,
  updated_at: "2026-11-24T12:00:00Z",
  external_process_id: "SECOP-123",
  buyer_name: "Entidad de prueba",
  object_original: "Servicio de bienestar laboral",
  official_status: "VERIFICADO",
  budget_amount: null,
  budget_currency: "COP",
  next_deadline: null,
  deadline_precision: null,
  current_revision: "r1",
  service_category: null,
  department: null,
  municipalities_json: null,
  territory_evidence_status: null,
  volume_amount: null,
  volume_unit: null,
  volume_evidence_status: null,
  completeness: 0,
  published_documents: 0,
  read_documents: 0,
  decision: null,
};

test("licitaciones y su historial caben en móvil y escritorio", async ({ page }, testInfo) => {
  await page.route("http://127.0.0.1:8000/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path === "/auth/me") {
      body = { id: 1, nombre: "Analista REL", empresa_id: null, roles: [], permissions: ["licitaciones.opportunities.view"] };
    } else if (path === "/acceso/navegacion") {
      body = { destinos: ["/licitaciones"] };
    } else if (path === "/licitaciones/opportunities") {
      body = { total: 1, items: [opportunity] };
    } else if (path === `/licitaciones/opportunities/${opportunity.id}`) {
      body = {
        opportunity,
        fields: [],
        reviews: [{ id: "review-1", revision: "r1", field_key: "apertura", status: "VERIFICADO", value_json: true, rationale: "Confirmado", actor_user_id: "1", created_at: "2026-11-24T12:00:00Z" }],
        decisions: [],
      };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/licitaciones");
    await expect(page.getByText("Entidad de prueba")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`licitaciones-${width}-bandeja.png`), fullPage: true });
    await page.getByRole("button", { name: /Entidad de prueba/ }).click();
    await expect(page.getByText("Historial de revisiones")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`licitaciones-${width}-historial.png`), fullPage: true });
  }
});
