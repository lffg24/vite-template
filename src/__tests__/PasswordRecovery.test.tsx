import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SolicitarRecuperacionClave from "@/pages/SolicitarRecuperacionClave";
import RestablecerClave from "@/pages/RestablecerClave";


describe("recuperación de contraseña", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("muestra una respuesta genérica después de solicitar el enlace", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, message: "generic" }), { status: 200, headers: { "Content-Type": "application/json" } }) as any);
    render(<MemoryRouter><SolicitarRecuperacionClave /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: "ANA@EXAMPLE.COM" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace seguro/i }));

    expect(await screen.findByText(/si existe una cuenta asociada/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/password-reset/request"), expect.objectContaining({ method: "POST" }));
  });

  it("consume el token y permite volver al login", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, message: "actualizada" }), { status: 200, headers: { "Content-Type": "application/json" } }) as any);
    render(
      <MemoryRouter initialEntries={["/restablecer-clave?token=" + "t".repeat(43)]}>
        <Routes>
          <Route path="/restablecer-clave" element={<RestablecerClave />} />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "NuevaClave!2026" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "NuevaClave!2026" } });
    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => expect(screen.getByText(/contraseña actualizada/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /ir al login/i })).toBeInTheDocument();
  });
});
