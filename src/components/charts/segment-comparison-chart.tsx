"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SegmentComparisonMetric } from "@/types/traffic";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";

export function SegmentComparisonChart({ data }: { data: SegmentComparisonMetric[] }) {
  return (
    <div className="h-[280px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: -14 }} layout="vertical">
          <CartesianGrid {...gridStyle} vertical horizontal={false} />
          <XAxis type="number" {...axisStyle} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis
            type="category"
            dataKey="highway"
            {...axisStyle}
            width={62}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const metric = payload[0].payload as SegmentComparisonMetric;
              return (
                <ChartTooltipCard
                  title={metric.name}
                  rows={[
                    {
                      label: "Peak congestion",
                      value: `${metric.peakCongestionPct}%`,
                      color: CHART_COLORS.rose,
                    },
                    { label: "Avg speed", value: `${metric.avgSpeedMph} mph`, color: CHART_COLORS.cyan },
                    { label: "Reliability", value: `${metric.reliabilityScore}/100`, color: CHART_COLORS.emerald },
                    { label: "Daily volume", value: `${metric.dailyVolumeK}k veh`, color: CHART_COLORS.violet },
                    { label: "Delay", value: `${metric.delayMinPerMile} min/mi`, color: CHART_COLORS.amber },
                  ]}
                  footer="Simulated corridor comparison"
                />
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10.5, color: "#94a3b8", paddingTop: 4 }}
            iconType="circle"
            iconSize={7}
          />
          <Bar
            dataKey="peakCongestionPct"
            name="Peak congestion %"
            fill={CHART_COLORS.rose}
            fillOpacity={0.78}
            radius={[0, 3, 3, 0]}
            maxBarSize={13}
          />
          <Bar
            dataKey="reliabilityScore"
            name="Reliability score"
            fill={CHART_COLORS.emerald}
            fillOpacity={0.7}
            radius={[0, 3, 3, 0]}
            maxBarSize={13}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
