"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpeedDistributionBin } from "@/types/traffic";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";
import { getCongestionColorHex } from "@/lib/utils";

export function SpeedDistributionChart({ data }: { data: SpeedDistributionBin[] }) {
  return (
    <div className="h-[224px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="rangeLabel" {...axisStyle} interval={0} tick={{ fill: "#64748b", fontSize: 9.5 }} />
          <YAxis {...axisStyle} width={40} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const bin = payload[0].payload as SpeedDistributionBin;
              return (
                <ChartTooltipCard
                  title={bin.rangeLabel}
                  rows={[
                    { label: "Segments", value: `${bin.segmentCount}`, color: getCongestionColorHex(bin.regime) },
                    { label: "Share", value: `${bin.percentage}%`, color: CHART_COLORS.cyan },
                  ]}
                  footer={`Regime: ${bin.regime}`}
                />
              );
            }}
          />
          <Bar dataKey="segmentCount" name="Segments" radius={[3, 3, 0, 0]} maxBarSize={42}>
            {data.map((bin) => (
              <Cell key={bin.rangeLabel} fill={getCongestionColorHex(bin.regime)} fillOpacity={0.82} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
