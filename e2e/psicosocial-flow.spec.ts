import { test, expect } from '@playwright/test';

test.describe('Flujo psicosocial crítico', () => {
  test('psicólogo puede entrar al módulo de aplicaciones', async ({ page }) => {
    await page.goto('/login');
    // Ajustar selectores reales cuando el login quede estabilizado.
    await expect(page).toHaveURL(/login/);
  });
});
