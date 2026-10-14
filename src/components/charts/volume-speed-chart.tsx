"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyTrafficPoint } from "@/types/traffic";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";

export function VolumeSpeedChart({ data }: { data: HourlyTrafficPoint[] }) {
  return (
    <div className="h-[248px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.32} />
              <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="hourLabel" {...axisStyle} interval={2} />
          <YAxis
            yAxisId="volume"
            {...axisStyle}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            width={44}
          />
          <YAxis
            yAxisId="speed"
            orientation="right"
            {...axisStyle}
            width={38}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as HourlyTrafficPoint;
              return (
                <ChartTooltipCard
                  title={`${label} — hourly profile`}
                  rows={[
                    {
                      label: "Volume",
                      value: `${point.volumeVehPerHr.toLocaleString()} veh/h`,
                      color: CHART_COLORS.cyan,
                    },
                    { label: "Avg speed", value: `${point.avgSpeedMph} mph`, color: CHART_COLORS.blue },
                    {
                      label: "Congestion",
                      value: `${point.congestionIndex}%`,
                      color: CHART_COLORS.amber,
                    },
                    {
                      label: "Free-flow ref.",
                      value: `${point.freeFlowSpeedMph} mph`,
                      color: CHART_COLORS.slate,
                    },
                  ]}
                  footer="Simulated corridor profile"
                />
              );
            }}
          />
          <Area
            yAxisId="volume"
            type="monotone"
            dataKey="volumeVehPerHr"
            stroke={CHART_COLORS.cyan}
            strokeWidth={1.8}
            fill="url(#volumeFill)"
            name="Volume"
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="avgSpeedMph"
            stroke={CHART_COLORS.blue}
            strokeWidth={2}
            dot={false}
            name="Avg speed"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
