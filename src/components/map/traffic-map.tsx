"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LocateFixed, Minus, Plus, RotateCcw } from "lucide-react";
import type { RoadSegment, TrafficIncident } from "@/types/traffic";
import type { TileProviderKey } from "@/components/map/traffic-map-canvas";
import { LA_MAP_CENTER } from "@/components/map/traffic-map-canvas";
import { MapLegend } from "@/components/map/map-legend";
import { cn } from "@/lib/utils";

const TrafficMapCanvas = dynamic(
  () => import("@/components/map/traffic-map-canvas").then((m) => m.TrafficMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#060a14]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/25 border-t-cyan-400" />
          <p className="text-[11px] text-slate-500">Initialising geospatial canvas…</p>
        </div>
      </div>
    ),
  }
);

export interface TrafficMapProps {
  segments: RoadSegment[];
  incidents: TrafficIncident[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  showSegments?: boolean;
  showSensors?: boolean;
  showIncidents?: boolean;
  showLabels?: boolean;
  tileProvider?: TileProviderKey;
  showLegend?: boolean;
  className?: string;
}

export function TrafficMap({
  segments,
  incidents,
  selectedSegmentId,
  onSelectSegment,
  showSegments = true,
  showSensors = true,
  showIncidents = true,
  showLabels = true,
  tileProvider = "dark_matter",
  showLegend = true,
  className,
}: TrafficMapProps) {
  const [focusTarget, setFocusTarget] = React.useState<
    { center: [number, number]; zoom?: number; token: number } | null
  >(null);
  const [zoomRequest, setZoomRequest] = React.useState<{ delta: number; token: number } | null>(null);

  const selected = segments.find((s) => s.id === selectedSegmentId) ?? null;

  React.useEffect(() => {
    if (selected) {
      setFocusTarget({ center: selected.center, zoom: 12.5, token: Date.now() });
    }
  }, [selected]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
      <TrafficMapCanvas
        segments={segments}
        incidents={incidents}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={onSelectSegment}
        showSegments={showSegments}
        showSensors={showSensors}
        showIncidents={showIncidents}
        showLabels={showLabels}
        tileProvider={tileProvider}
        focusTarget={focusTarget}
        zoomRequest={zoomRequest}
      />

      {/* Zoom / reset control cluster */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1.5">
        <MapButton
          label="Zoom in"
          onClick={() => setZoomRequest({ delta: 1, token: Date.now() })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </MapButton>
        <MapButton
          label="Zoom out"
          onClick={() => setZoomRequest({ delta: -1, token: Date.now() })}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </MapButton>
        <MapButton
          label="Recentre on Los Angeles"
          onClick={() => setFocusTarget({ center: LA_MAP_CENTER, zoom: 10, token: Date.now() })}
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
        </MapButton>
        <MapButton
          label="Reset selection and view"
          onClick={() => {
            onSelectSegment(null);
            setFocusTarget({ center: LA_MAP_CENTER, zoom: 10, token: Date.now() });
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </MapButton>
      </div>

      {showLegend ? (
        <div className="absolute bottom-3 left-3 z-[500]">
          <MapLegend />
        </div>
      ) : null}
    </div>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-slate-950/85 text-slate-300 backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-300"
    >
      {children}
    </button>
  );
}
