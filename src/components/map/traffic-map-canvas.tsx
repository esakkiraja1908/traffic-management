"use client";

import * as React from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RoadSegment, TrafficIncident } from "@/types/traffic";
import { getCongestionColorHex, cn } from "@/lib/utils";
import { OfflineFallback } from "@/components/ui/states";
import { SchematicTrafficMap } from "@/components/map/schematic-traffic-map";

export const LA_MAP_CENTER: [number, number] = [34.0522, -118.3535];
export const LA_MAP_BOUNDS: L.LatLngBoundsExpression = [
  [33.7, -118.75],
  [34.42, -117.95],
];

export const TILE_PROVIDERS = {
  dark_matter: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "CARTO Dark Matter",
  },
  osm_standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: "OpenStreetMap Standard",
  },
} as const;

export type TileProviderKey = keyof typeof TILE_PROVIDERS;

interface TrafficMapCanvasProps {
  segments: RoadSegment[];
  incidents: TrafficIncident[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  showSegments: boolean;
  showSensors: boolean;
  showIncidents: boolean;
  showLabels: boolean;
  tileProvider: TileProviderKey;
  focusTarget?: { center: [number, number]; zoom?: number; token: number } | null;
  zoomRequest?: { delta: number; token: number } | null;
  className?: string;
}

function MapController({
  focusTarget,
  zoomRequest,
  onTileError,
}: {
  focusTarget?: TrafficMapCanvasProps["focusTarget"];
  zoomRequest?: TrafficMapCanvasProps["zoomRequest"];
  onTileError: () => void;
}) {
  const map = useMap();

  React.useEffect(() => {
    map.attributionControl.setPrefix("");
  }, [map]);

  React.useEffect(() => {
    if (focusTarget) {
      map.flyTo(focusTarget.center, focusTarget.zoom ?? 13, { duration: 0.8 });
    }
  }, [focusTarget, map]);

  React.useEffect(() => {
    if (zoomRequest) {
      map.setZoom(map.getZoom() + zoomRequest.delta, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomRequest?.token]);

  useMapEvents({ tileerror: () => onTileError() });

  return null;
}

function IncidentMarkers({ incidents }: { incidents: TrafficIncident[] }) {
  return (
    <>
      {incidents
        .filter((i) => i.status !== "resolved")
        .map((incident) => {
          const color =
            incident.severity === "critical"
              ? "#f43f5e"
              : incident.severity === "major"
                ? "#f97316"
                : incident.severity === "moderate"
                  ? "#f59e0b"
                  : "#38bdf8";
          return (
            <React.Fragment key={incident.id}>
              <CircleMarker
                center={incident.coordinates}
                radius={13}
                pathOptions={{
                  color,
                  weight: 1,
                  opacity: 0.5,
                  fillColor: color,
                  fillOpacity: 0.1,
                }}
              />
              <CircleMarker
                center={incident.coordinates}
                radius={5}
                pathOptions={{ color: "#0b1220", weight: 1.5, fillColor: color, fillOpacity: 1 }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <span className="font-medium">{incident.title}</span>
                  <br />
                  <span className="text-[11px] opacity-70">
                    {incident.highway} · {incident.severity} · {incident.status}
                  </span>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
    </>
  );
}

export function TrafficMapCanvas({
  segments,
  incidents,
  selectedSegmentId,
  onSelectSegment,
  showSegments,
  showSensors,
  showIncidents,
  showLabels,
  tileProvider,
  focusTarget,
  zoomRequest,
  className,
}: TrafficMapCanvasProps) {
  const [tileFailed, setTileFailed] = React.useState(false);
  const provider = TILE_PROVIDERS[tileProvider];
  const handleTileError = React.useCallback(() => setTileFailed(true), []);

  if (tileFailed) {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <SchematicTrafficMap
          segments={segments}
          incidents={incidents}
          selectedSegmentId={selectedSegmentId}
          onSelectSegment={onSelectSegment}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer
        center={LA_MAP_CENTER}
        zoom={10}
        minZoom={8}
        maxZoom={17}
        zoomControl={false}
        scrollWheelZoom
        maxBounds={LA_MAP_BOUNDS}
        maxBoundsViscosity={0.6}
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          key={provider.url}
          url={provider.url}
          attribution={provider.attribution}
          subdomains={tileProvider === "dark_matter" ? "abcd" : "abc"}
          maxZoom={19}
          eventHandlers={{ tileerror: handleTileError }}
        />
        <MapController
          focusTarget={focusTarget}
          zoomRequest={zoomRequest}
          onTileError={handleTileError}
        />

        {showSegments
          ? segments.map((segment) => {
              const selected = segment.id === selectedSegmentId;
              const color = getCongestionColorHex(segment.congestionLevel);
              return (
                <React.Fragment key={segment.id}>
                  {selected ? (
                    <Polyline
                      positions={segment.coordinates}
                      pathOptions={{
                        color: "#22d3ee",
                        weight: segment.lanes * 2.4 + 12,
                        opacity: 0.22,
                      }}
                    />
                  ) : null}
                  <Polyline
                    positions={segment.coordinates}
                    pathOptions={{
                      color,
                      weight: Math.max(3, segment.lanes * 1.1),
                      opacity: selected ? 1 : 0.82,
                      lineCap: "round",
                    }}
                    eventHandlers={{ click: () => onSelectSegment(segment.id) }}
                  >
                    <Tooltip sticky direction="top" opacity={1}>
                      <span className="font-medium">
                        {segment.highway} {segment.direction}
                      </span>
                      <br />
                      <span className="text-[11px] opacity-75">{segment.name}</span>
                      <br />
                      <span className="text-[11px]">
                        {segment.currentSpeedMph} mph · {segment.congestionLevel} · sensor{" "}
                        {segment.sensorId}
                      </span>
                    </Tooltip>
                  </Polyline>
                </React.Fragment>
              );
            })
          : null}

        {showSensors
          ? segments.map((segment) => {
              const selected = segment.id === selectedSegmentId;
              return (
                <CircleMarker
                  key={`sensor-${segment.id}`}
                  center={segment.center}
                  radius={selected ? 6 : 3.5}
                  pathOptions={{
                    color: selected ? "#22d3ee" : "#0f172a",
                    weight: 1.5,
                    fillColor: getCongestionColorHex(segment.congestionLevel),
                    fillOpacity: 1,
                  }}
                  eventHandlers={{ click: () => onSelectSegment(segment.id) }}
                >
                  {showLabels ? (
                    <Tooltip direction="right" offset={[6, 0]} opacity={1}>
                      <span className="font-mono text-[11px]">{segment.sensorId}</span>
                    </Tooltip>
                  ) : null}
                </CircleMarker>
              );
            })
          : null}

        {showIncidents ? <IncidentMarkers incidents={incidents} /> : null}
      </MapContainer>
    </div>
  );
}

export function MapUnavailableFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <OfflineFallback
      title="Basemap tiles could not be loaded"
      description="The map tile server is unreachable from this network. Traffic geometry is still available in the schematic view, or retry loading the geographic basemap."
      onRetry={onRetry}
    />
  );
}
