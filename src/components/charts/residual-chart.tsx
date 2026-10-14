"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";

interface ResidualRow {
  timestamp: string;
  actualMph: number;
  predictedMph: number;
  residualMph: number;
}

export function ResidualChart({ data }: { data: ResidualRow[] }) {
  return (
    <div className="h-[228px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="timestamp" {...axisStyle} interval={1} />
          <YAxis {...axisStyle} width={42} tickFormatter={(v: number) => `${v}`} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ResidualRow;
              return (
                <ChartTooltipCard
                  title={`Residual @ ${row.timestamp}`}
                  rows={[
                    { label: "Actual", value: `${row.actualMph} mph`, color: CHART_COLORS.emerald },
                    { label: "Predicted", value: `${row.predictedMph} mph`, color: CHART_COLORS.cyan },
                    {
                      label: "Residual",
                      value: `${row.residualMph > 0 ? "+" : ""}${row.residualMph} mph`,
                      color: row.residualMph > 0 ? CHART_COLORS.amber : CHART_COLORS.rose,
                    },
                  ]}
                  footer="Positive residual = model under-predicted speed"
                />
              );
            }}
          />
          <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" />
          <Bar dataKey="residualMph" name="Residual" radius={[3, 3, 0, 0]} maxBarSize={22}>
            {data.map((row) => (
              <Cell
                key={row.timestamp}
                fill={row.residualMph >= 0 ? CHART_COLORS.amber : CHART_COLORS.rose}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
