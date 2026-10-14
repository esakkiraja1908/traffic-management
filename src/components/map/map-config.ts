/**
 * Leaflet-free map configuration.
 *
 * This module must never import `leaflet` or `react-leaflet`. Constants that
 * non-map components need (e.g. the traffic map wrapper) live here so that
 * Leaflet — which touches `window` at module scope — is never pulled into the
 * server bundle through a value import.
 */

export const LA_MAP_CENTER: [number, number] = [34.0522, -118.3535];

export const LA_MAP_BOUNDS: [[number, number], [number, number]] = [
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
