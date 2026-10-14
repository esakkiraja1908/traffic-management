"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastTimeStep } from "@/types/traffic";
import { CHART_COLORS, ChartTooltipCard, axisStyle, gridStyle } from "@/components/charts/chart-primitives";

interface ForecastChartRow extends ForecastTimeStep {
  label: string;
  band: [number, number] | null;
}

export function ForecastVsActualChart({
  series,
  showConfidence,
}: {
  series: ForecastTimeStep[];
  showConfidence: boolean;
}) {
  const rows: ForecastChartRow[] = series.map((step) => ({
    ...step,
    label: new Date(step.timestamp).toISOString().slice(11, 16),
    band:
      showConfidence && step.actualSpeedMph === null
        ? [step.confidenceLowerMph, step.confidenceUpperMph]
        : null,
  }));

  return (
    <div className="h-[300px] w-full px-1 pb-1 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 4, right: 14, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="label" {...axisStyle} interval={3} />
          <YAxis {...axisStyle} width={42} tickFormatter={(v: number) => `${v}`} domain={[0, "dataMax + 8"]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ForecastChartRow;
              const rowsOut: { label: string; value: string; color: string }[] = [
                {
                  label: "Predicted",
                  value: `${point.predictedSpeedMph} mph`,
                  color: CHART_COLORS.cyan,
                },
              ];
              if (point.actualSpeedMph !== null) {
                rowsOut.push({
                  label: "Actual",
                  value: `${point.actualSpeedMph} mph`,
                  color: CHART_COLORS.emerald,
                });
              }
              if (point.band) {
                rowsOut.push({
                  label: "90% interval",
                  value: `${point.band[0]} - ${point.band[1]} mph`,
                  color: CHART_COLORS.violet,
                });
              }
              rowsOut.push({
                label: "Historical avg",
                value: `${point.historicalAvgSpeedMph} mph`,
                color: CHART_COLORS.slate,
              });
              return (
                <ChartTooltipCard
                  title={`${point.label} · ${point.relativeMin >= 0 ? "+" : ""}${point.relativeMin} min`}
                  rows={rowsOut}
                  footer={
                    point.actualSpeedMph === null
                      ? "Future step — no observation exists yet"
                      : "Observed step"
                  }
                />
              );
            }}
          />
          <ReferenceLine
            x={rows.find((r) => r.relativeMin === 0)?.label}
            stroke="rgba(148,163,184,0.5)"
            strokeDasharray="3 3"
            label={{ value: "now", fill: "#64748b", fontSize: 10, position: "insideTopRight" }}
          />
          {showConfidence ? (
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill="url(#bandFill)"
              name="90% interval"
              isAnimationActive={false}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="historicalAvgSpeedMph"
            stroke={CHART_COLORS.slate}
            strokeWidth={1.4}
            strokeDasharray="2 4"
            dot={false}
            name="Historical avg"
          />
          <Line
            type="monotone"
            dataKey="actualSpeedMph"
            stroke={CHART_COLORS.emerald}
            strokeWidth={2.2}
            dot={{ r: 2, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
            connectNulls={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="predictedSpeedMph"
            stroke={CHART_COLORS.cyan}
            strokeWidth={2.2}
            dot={{ r: 2, fill: CHART_COLORS.cyan, strokeWidth: 0 }}
            name="Predicted"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
