"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyTrafficPoint } from "@/types/traffic";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";

function congestionColor(index: number): string {
  if (index >= 70) return CHART_COLORS.rose;
  if (index >= 50) return CHART_COLORS.orange;
  if (index >= 30) return CHART_COLORS.amber;
  return CHART_COLORS.emerald;
}

export function CongestionForecastChart({ data }: { data: HourlyTrafficPoint[] }) {
  return (
    <div className="h-[230px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="hourLabel" {...axisStyle} interval={2} />
          <YAxis {...axisStyle} width={40} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as HourlyTrafficPoint;
              return (
                <ChartTooltipCard
                  title={`${label} congestion`}
                  rows={[
                    {
                      label: "Observed index",
                      value: `${point.congestionIndex}%`,
                      color: congestionColor(point.congestionIndex),
                    },
                    {
                      label: "Forecast index",
                      value: `${point.predictedCongestionIndex}%`,
                      color: CHART_COLORS.cyan,
                    },
                    { label: "Incidents", value: `${point.incidentCount}`, color: CHART_COLORS.rose },
                  ]}
                  footer="Bars observed · line forecast"
                />
              );
            }}
          />
          <Bar dataKey="congestionIndex" name="Observed congestion" radius={[3, 3, 0, 0]} maxBarSize={18}>
            {data.map((point) => (
              <Cell key={point.hour24} fill={congestionColor(point.congestionIndex)} fillOpacity={0.85} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="predictedCongestionIndex"
            stroke={CHART_COLORS.cyan}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            name="Forecast congestion"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
