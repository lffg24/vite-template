import { expect, test } from "@playwright/test";

const instrumento = {
  titulo: "Califica tu experiencia",
  version: 2,
  presentacion: "presentacion-de-prueba",
  preguntas: [
    { id: "11111111-1111-4111-8111-111111111111", orden: 1, tipo: "CSAT", enunciado: "¿Cómo fue la atención?", obligatorio: true },
    { id: "22222222-2222-4222-8222-222222222222", orden: 2, tipo: "NPS_RELACIONAL", enunciado: "¿Nos recomendarías?", obligatorio: true },
  ],
};

for (const ancho of [390, 1440]) {
  test(`el QR público permite calificar a ${ancho}px sin desbordar`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 844 });
    await page.route("**/auth/me", (ruta) => ruta.fulfill({ status: 401, body: "{}" }));
    await page.route("**/cx/publico/qr-estable", (ruta) => ruta.fulfill({ json: instrumento }));
    let enviado: Record<string, unknown> | null = null;
    await page.route("**/cx/publico/qr-estable/respuestas", async (ruta) => {
      enviado = ruta.request().postDataJSON();
      await ruta.fulfill({ json: { id: "envio-1", version_id: "version-2", repetido: false } });
    });

    await page.goto("/cx/qr-estable");
    await expect(page.getByRole("heading", { name: "Califica tu experiencia" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "5 de 5" })).toBeVisible();
    const ilustracion = page.locator('img[src*="feedback-rating"]');
    await expect(ilustracion).toBeVisible();
    expect(await ilustracion.evaluate((imagen: HTMLImageElement) => imagen.naturalWidth)).toBeGreaterThan(0);
    expect(await ilustracion.evaluate((imagen) => imagen.getBoundingClientRect().width)).toBeGreaterThanOrEqual(ancho === 390 ? 112 : 160);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(ancho);
    const altoAccion = await page.getByRole("button", { name: "Siguiente" }).evaluate((nodo) => nodo.getBoundingClientRect().height);
    expect(altoAccion).toBeGreaterThanOrEqual(56);

    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByRole("alert")).toContainText("Selecciona una respuesta");
    await page.getByRole("radio", { name: "5 de 5" }).locator("..").click();
    await expect(page.getByRole("radio", { name: "5 de 5" })).toBeChecked();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("radio", { name: "10 de 10" }).locator("..").click();
    await expect(page.getByRole("radio", { name: "10 de 10" })).toBeChecked();
    await page.getByRole("button", { name: "Enviar calificación" }).click();

    await expect(page.getByRole("heading", { name: "Gracias por tu calificación" })).toBeVisible();
    await expect(page.locator('img[src*="satisfactorio"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(ancho);
    expect(enviado).toMatchObject({
      presentacion: instrumento.presentacion,
      respuestas: [
        { item_id: instrumento.preguntas[0].id, valor: 5 },
        { item_id: instrumento.preguntas[1].id, valor: 10 },
      ],
    });
  });
}
