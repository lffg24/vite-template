import type { ReactNode } from "react";

/**
 * Gráficas accesibles para resultados CX. Viven en el núcleo porque la misma
 * semántica de muestra, leyenda y lectura se debe conservar entre pantallas.
 * El SVG resume; la pantalla acompaña cada gráfica con `TablaDatos`.
 */
export function GraficaComposicionNps({ distribucion }: { distribucion: Record<string, number> }) {
  const grupos = [
    { clave: "promotores", etiqueta: "Promotores" },
    { clave: "pasivos", etiqueta: "Pasivos" },
    { clave: "detractores", etiqueta: "Detractores" },
  ];
  const total = grupos.reduce((suma, grupo) => suma + (distribucion[grupo.clave] ?? 0), 0);
  const clasesRelleno: Record<string, string> = { promotores: "fill-rel-success", pasivos: "fill-rel-neutral", detractores: "fill-rel-danger" };
  const clasesFondo: Record<string, string> = { promotores: "bg-rel-success", pasivos: "bg-rel-neutral", detractores: "bg-rel-danger" };
  let x = 0;
  return <figure className="space-y-3" aria-label="Composición de promotores, pasivos y detractores">
    <svg viewBox="0 0 100 14" role="img" aria-label={`Composición NPS, ${total} respuestas`} className="h-12 w-full overflow-visible rounded-rel-control">
      {grupos.map((grupo) => {
        const cantidad = distribucion[grupo.clave] ?? 0;
        const ancho = total ? (cantidad / total) * 100 : 0;
        const inicio = x; x += ancho;
        return <rect key={grupo.clave} x={inicio} y="2" width={ancho} height="10" className={clasesRelleno[grupo.clave]}>
          <title>{`${grupo.etiqueta}: ${cantidad} (${total ? Math.round(cantidad / total * 100) : 0}%)`}</title>
        </rect>;
      })}
    </svg>
    <figcaption className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-rel-dark">
      {grupos.map((grupo) => <span key={grupo.clave} className="inline-flex items-center gap-2"><i aria-hidden="true" className={`h-3 w-3 rounded-full ${clasesFondo[grupo.clave]}`} />{grupo.etiqueta}: {distribucion[grupo.clave] ?? 0}</span>)}
    </figcaption>
  </figure>;
}

export function GraficaHistogramaNps({ valores }: { valores: Record<string, number> }) {
  const max = Math.max(1, ...Array.from({ length: 11 }, (_, i) => valores[String(i)] ?? 0));
  return <figure aria-label="Histograma NPS de cero a diez">
    <svg viewBox="0 0 330 120" role="img" aria-label="Respuestas por puntuación NPS, de cero a diez" className="h-40 w-full">
      {Array.from({ length: 11 }, (_, i) => {
        const cantidad = valores[String(i)] ?? 0;
        const altura = 86 * cantidad / max;
        const color = i >= 9 ? "fill-rel-success" : i >= 7 ? "fill-rel-neutral" : "fill-rel-danger";
        return <g key={i}><rect x={i * 30 + 3} y={98 - altura} width="22" height={altura} className={color}><title>{`${i}: ${cantidad} respuestas`}</title></rect><text x={i * 30 + 14} y="116" textAnchor="middle" className="fill-rel-muted text-[10px]">{i}</text></g>;
      })}
    </svg>
    <figcaption className="text-xs text-rel-muted">Detractores 0–6 · Pasivos 7–8 · Promotores 9–10</figcaption>
  </figure>;
}

export function GraficaEvolucionMensual({ puntos, minimo = -100, maximo = 100 }: { puntos: { mes: string; valor: number | null }[]; minimo?: number; maximo?: number }) {
  const y = (valor: number) => 92 - ((valor - minimo) / Math.max(1, maximo - minimo)) * 80;
  const disponibles = puntos.map((p, i) => p.valor === null ? null : { x: 12 + i * (276 / Math.max(1, puntos.length - 1)), y: y(p.valor), p }).filter(Boolean) as { x: number; y: number; p: { mes: string; valor: number | null } }[];
  const segmentos: string[] = [];
  let actual: string[] = [];
  puntos.forEach((p, i) => {
    if (p.valor === null) { if (actual.length) segmentos.push(actual.join(" ")); actual = []; return; }
    actual.push(`${12 + i * (276 / Math.max(1, puntos.length - 1))},${y(p.valor)}`);
  });
  if (actual.length) segmentos.push(actual.join(" "));
  return <figure aria-label="Evolución mensual del indicador CX">
    <svg viewBox="0 0 300 112" role="img" aria-label="Tendencia mensual; se interrumpe en meses bajo el mínimo de muestra" className="h-40 w-full">
      <line x1="8" x2="292" y1="52" y2="52" className="stroke-rel-border" strokeDasharray="3 3" />
      {segmentos.filter((s) => s.includes(" ")).map((segmento, i) => <polyline key={i} points={segmento} fill="none" className="stroke-rel-primary" strokeWidth="3" />)}
      {disponibles.map(({ x, y, p }) => <circle key={p.mes} cx={x} cy={y} r="4" className="fill-rel-primary"><title>{`${p.mes}: ${p.valor}`}</title></circle>)}
      {puntos.map((p, i) => <text key={p.mes} x={12 + i * (276 / Math.max(1, puntos.length - 1))} y="108" textAnchor="middle" className="fill-rel-muted text-[9px]">{p.mes.slice(5)}</text>)}
    </svg>
    <figcaption className="text-xs text-rel-muted">El tramo se corta cuando el mes no alcanza el n mínimo.</figcaption>
  </figure>;
}

function Barras({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  return <figure aria-label={etiqueta} className="space-y-3">{children}</figure>;
}

export function GraficaBarrasFactores({ filas }: { filas: { nombre: string; media: number | null; n: number }[] }) {
  return <Barras etiqueta="Medias por factor, escala de uno a cinco"><ul className="space-y-3">{filas.map((fila) => <li key={fila.nombre} className="grid grid-cols-[minmax(5rem,9rem)_1fr_auto] items-center gap-3 text-sm"><span className="truncate">{fila.nombre}</span><span className="h-3 rounded-full bg-rel-surface-subtle"><span className="block h-3 rounded-full bg-rel-primary" style={{ width: `${Math.max(0, Math.min(100, (fila.media ?? 0) / 5 * 100))}%` }} title={`Media ${fila.media ?? "Sin datos"}`} /></span><span className="tabular-nums">{fila.media ?? "Sin datos"} · n={fila.n}</span></li>)}</ul></Barras>;
}

export function GraficaPalancasFactores({ filas }: { filas: { nombre: string; promotores: { media: number | null; n: number }; detractores: { media: number | null; n: number } }[] }) {
  return <Barras etiqueta="Comparación de medias por factor entre promotores y detractores"><div className="space-y-3">{filas.map((fila) => <div key={fila.nombre} className="grid grid-cols-[minmax(5rem,9rem)_1fr] gap-3 text-sm"><span className="truncate">{fila.nombre}</span><div className="space-y-1"><div className="flex items-center gap-2"><span className="w-3 text-rel-muted">P</span><span className="h-2 flex-1 rounded-full bg-rel-surface-subtle"><span className="block h-2 rounded-full bg-rel-success" style={{ width: `${(fila.promotores.media ?? 0) / 5 * 100}%` }} /></span><span>{fila.promotores.media ?? "Sin datos"} · n={fila.promotores.n}</span></div><div className="flex items-center gap-2"><span className="w-3 text-rel-muted">D</span><span className="h-2 flex-1 rounded-full bg-rel-surface-subtle"><span className="block h-2 rounded-full bg-rel-danger" style={{ width: `${(fila.detractores.media ?? 0) / 5 * 100}%` }} /></span><span>{fila.detractores.media ?? "Sin datos"} · n={fila.detractores.n}</span></div></div></div>)}</div><figcaption className="flex gap-4 text-xs text-rel-muted"><span>Promotores</span><span>Detractores</span></figcaption></Barras>;
}
