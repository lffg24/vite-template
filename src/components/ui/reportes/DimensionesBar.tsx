import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

import type { NivelDimItem } from "@/services/reportes";

export default function DimensionesBar({ data }: { data: NivelDimItem[] }) {
  const sorted = [...data].sort((a, b) => a.avg_0_100 - b.avg_0_100);
  const color = (nivel: string) =>
    nivel === "Muy bajo"
      ? "#dc2626"
      : nivel === "Bajo"
      ? "#f97316"
      : nivel === "Medio"
      ? "#f59e0b"
      : nivel === "Alto"
      ? "#16a34a"
      : "#15803d";

  return (
    <div className="w-full h-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
          />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="dimension" width={160} />
          <Tooltip />
          <Bar dataKey="avg_0_100" radius={[4, 4, 4, 4]}>
            {sorted.map((entry, i) => (
              // @ts-ignore – fill por barra
              <Cell key={`cell-${i}`} fill={color(entry.nivel)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
