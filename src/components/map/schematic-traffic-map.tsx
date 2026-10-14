"use client";

import * as React from "react";
import type { RoadSegment, TrafficIncident } from "@/types/traffic";
import { getCongestionColorHex, cn } from "@/lib/utils";

/**
 * Vector fallback map. Projects the real METR-LA corridor geometry (lat/lng)
 * into an SVG viewBox so operators still see network topology when map tiles
 * cannot be fetched. Not a geographic basemap — labeled as schematic.
 */
const BOUNDS = { minLat: 33.7, maxLat: 34.42, minLng: -118.75, maxLng: -117.95 };
const WIDTH = 1000;
const HEIGHT = 620;

function project([lat, lng]: [number, number]): [number, number] {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * WIDTH;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * HEIGHT;
  return [x, y];
}

export function SchematicTrafficMap({
  segments,
  incidents,
  selectedSegmentId,
  onSelectSegment,
  className,
}: {
  segments: RoadSegment[];
  incidents: TrafficIncident[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-lg bg-[#060a14]", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full"
        role="img"
        aria-label="Schematic traffic network view of the Los Angeles METR-LA corridor geometry"
      >
        <defs>
          <pattern id="schematic-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(148,163,184,0.07)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#schematic-grid)" />

        {segments.map((segment) => {
          const points = segment.coordinates.map(project).map(([x, y]) => `${x},${y}`).join(" ");
          const selected = segment.id === selectedSegmentId;
          const color = getCongestionColorHex(segment.congestionLevel);
          return (
            <g key={segment.id}>
              {selected ? (
                <polyline
                  points={points}
                  fill="none"
                  stroke="#22d3ee"
                  strokeOpacity={0.3}
                  strokeWidth={segment.lanes * 4 + 14}
                  strokeLinecap="round"
                />
              ) : null}
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeOpacity={selected ? 1 : 0.85}
                strokeWidth={Math.max(4, segment.lanes * 1.8)}
                strokeLinecap="round"
                className="cursor-pointer transition-[stroke-opacity]"
                onClick={() => onSelectSegment(segment.id)}
              />
            </g>
          );
        })}

        {segments.map((segment) => {
          const [x, y] = project(segment.center);
          const selected = segment.id === selectedSegmentId;
          return (
            <g key={`node-${segment.id}`} onClick={() => onSelectSegment(segment.id)} className="cursor-pointer">
              <circle cx={x} cy={y} r={selected ? 8 : 4.5} fill="#0b1220" stroke="#22d3ee" strokeWidth={selected ? 2.5 : 0} />
              <circle cx={x} cy={y} r={selected ? 5 : 3} fill={getCongestionColorHex(segment.congestionLevel)} />
              {selected ? (
                <text x={x + 11} y={y - 8} fill="#67e8f9" fontSize="12" fontFamily="monospace">
                  {segment.sensorId}
                </text>
              ) : null}
            </g>
          );
        })}

        {incidents
          .filter((i) => i.status !== "resolved")
          .map((incident) => {
            const [x, y] = project(incident.coordinates);
            const color =
              incident.severity === "critical"
                ? "#f43f5e"
                : incident.severity === "major"
                  ? "#f97316"
                  : "#f59e0b";
            return (
              <g key={incident.id}>
                <circle cx={x} cy={y} r={16} fill={color} fillOpacity={0.12} />
                <circle cx={x} cy={y} r={6} fill={color} stroke="#0b1220" strokeWidth={2} />
              </g>
            );
          })}
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-amber-500/25 bg-slate-950/80 px-2.5 py-1.5 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-300">
          Schematic view
        </p>
        <p className="mt-0.5 text-[10px] text-amber-200/60">
          Basemap tiles unavailable · real corridor geometry projected to vector canvas
        </p>
      </div>
    </div>
  );
}
