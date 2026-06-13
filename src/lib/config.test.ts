import { describe, expect, it } from "vitest";

import { resolveApiUrl } from "./config";

describe("resolveApiUrl", () => {
  it("usa el proxy same-origin en Cloudflare Pages cuando la API configurada es Railway", () => {
    expect(
      resolveApiUrl("https://eva-360-production.up.railway.app", "abril-360.pages.dev")
    ).toBe("/api");
  });

  it("usa el proxy same-origin en hosting real si quedo configurado localhost por error", () => {
    expect(resolveApiUrl("http://localhost:8000", "abril-360.pages.dev")).toBe("/api");
  });

  it("conserva localhost cuando el frontend tambien corre local", () => {
    expect(resolveApiUrl("http://localhost:8000", "localhost")).toBe("http://localhost:8000");
  });

  it("conserva una API propia bajo dominio estable", () => {
    expect(resolveApiUrl("https://api.abril360.com", "app.abril360.com")).toBe(
      "https://api.abril360.com"
    );
  });
});
