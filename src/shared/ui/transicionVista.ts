/** WebKit cierra la página al transicionar del curso a una lección en móvil. */
export function transicionVistaSegura(
  agente = typeof navigator === "undefined" ? "" : navigator.userAgent,
  disponible = typeof document !== "undefined" && typeof document.startViewTransition === "function",
): boolean {
  const webkit = /AppleWebKit/i.test(agente) && !/(Chrome|Chromium|Edg|OPR)/i.test(agente);
  return disponible && !webkit;
}
