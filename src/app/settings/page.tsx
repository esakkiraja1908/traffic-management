"use client";

import * as React from "react";
import {
  CheckCircle2,
  Cpu,
  Eye,
  Gauge,
  PlugZap,
  RotateCcw,
  Server,
  Settings2,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, SegmentedControl, inputClasses } from "@/components/ui/controls";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { useSettings } from "@/components/providers/settings-provider";
import { useToast } from "@/components/providers/toast-provider";
import { checkBackendHealth, resetIncidentsToSeed } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type HealthState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; message: string; latencyMs: number | null }
  | { status: "fail"; message: string };

export default function SettingsPage() {
  const { settings, hydrated, updateSettings, resetSettings } = useSettings();
  const { pushToast } = useToast();
  const [health, setHealth] = React.useState<HealthState>({ status: "idle" });

  async function handleHealthCheck() {
    setHealth({ status: "checking" });
    const result = await checkBackendHealth(settings);
    if (result.ok) {
      setHealth({ status: "ok", message: result.message, latencyMs: result.latencyMs });
      pushToast({
        variant: "success",
        title: "Backend reachable",
        description: result.latencyMs ? `Responded in ${result.latencyMs} ms.` : result.message,
      });
    } else {
      setHealth({ status: "fail", message: result.message });
      pushToast({
        variant: "warning",
        title: "Backend not reachable",
        description: "The application will continue in simulation mode.",
      });
    }
  }

  function handleResetDemoData() {
    resetIncidentsToSeed();
    pushToast({
      variant: "info",
      title: "Demo data reset",
      description: "Local incident store restored to the seeded METR-LA scenario.",
    });
  }

  if (!hydrated) {
    return (
      <Panel className="p-4">
        <div className="space-y-3">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton h-9 w-full rounded-lg" />
          <div className="skeleton h-9 w-full rounded-lg" />
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge variant="muted">
            <Settings2 className="h-3 w-3" aria-hidden="true" />
            Configuration stored in this browser
          </Badge>
          <Badge variant={settings.preferLiveBackend ? "success" : "warning"} dot>
            {settings.preferLiveBackend ? "Live backend preferred" : "Simulation mode"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleResetDemoData}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset demo data
          </Button>
          <Button variant="secondary" onClick={resetSettings}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restore defaults
          </Button>
        </div>
      </div>

      <NoticeBanner
        tone="info"
        title="No secrets are stored here"
        message="These fields configure browser-side endpoints only. Do not paste credentials or private API keys — anything entered is persisted in localStorage and sent with requests from the browser."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Backend & model service"
            description="Point the typed API layer at a FastAPI service in front of LibCity"
            icon={Server}
            action={<Badge variant="muted">Environment defaults supported</Badge>}
          />
          <div className="space-y-3.5 p-4">
            <Field
              label="Traffic API base URL"
              htmlFor="api-base-url"
              hint="Environment default: NEXT_PUBLIC_TRAFFIC_API_URL"
            >
              <input
                id="api-base-url"
                type="url"
                value={settings.apiBaseUrl}
                onChange={(event) => updateSettings({ apiBaseUrl: event.target.value })}
                placeholder="https://traffic-api.example.com"
                className={inputClasses}
              />
            </Field>

            <Field
              label="LibCity model endpoint"
              htmlFor="libcity-endpoint"
              hint="Environment default: NEXT_PUBLIC_LIBCITY_MODEL_ENDPOINT"
            >
              <input
                id="libcity-endpoint"
                type="url"
                value={settings.libCityEndpoint}
                onChange={(event) => updateSettings({ libCityEndpoint: event.target.value })}
                placeholder="https://libcity-inference.example.com"
                className={inputClasses}
              />
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[11.5px] font-medium text-slate-200">Prefer live backend</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">
                  When enabled, the API layer attempts real HTTP calls first and falls back to
                  deterministic simulation on any failure.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.preferLiveBackend}
                aria-label="Prefer live backend"
                onClick={() => updateSettings({ preferLiveBackend: !settings.preferLiveBackend })}
                className={cn(
                  "focus-ring relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  settings.preferLiveBackend ? "bg-cyan-500/70" : "bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                    settings.preferLiveBackend ? "left-[18px]" : "left-0.5"
                  )}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => void handleHealthCheck()}>
                <PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
                Test connection
              </Button>
              {health.status === "ok" ? (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {health.message}
                  {health.latencyMs ? ` · ${health.latencyMs} ms` : ""}
                </span>
              ) : health.status === "fail" ? (
                <span className="flex items-center gap-1.5 text-[11px] text-rose-400">
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {health.message}
                </span>
              ) : health.status === "checking" ? (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
                  Contacting backend…
                </span>
              ) : null}
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-slate-950/40 px-3 py-2.5">
              <p className="label-caps flex items-center gap-1.5">
                <Cpu className="h-3 w-3" aria-hidden="true" />
                Expected backend contract
              </p>
              <ul className="mt-1.5 space-y-1 font-mono text-[10.5px] text-slate-400">
                <li>GET /health → 200 OK</li>
                <li>GET /segments → RoadSegment[]</li>
                <li>GET /observations/current → snapshot</li>
                <li>GET /analytics?corridor= → dataset</li>
                <li>GET /incidents · POST /incidents</li>
                <li>POST /predict → forecast tensor payload</li>
              </ul>
            </div>
          </div>
        </Panel>


        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Simulation & refresh"
              description="Control how the deterministic demo engine behaves"
              icon={Timer}
            />
            <div className="space-y-3.5 p-4">
              <Field label="Refresh interval" htmlFor="refresh-interval">
                <SegmentedControl
                  ariaLabel="Refresh interval"
                  value={String(settings.refreshIntervalSec)}
                  onChange={(value) => updateSettings({ refreshIntervalSec: Number(value) })}
                  options={[
                    { value: "15", label: "15 s" },
                    { value: "30", label: "30 s" },
                    { value: "60", label: "60 s" },
                    { value: "300", label: "5 min" },
                  ]}
                  size="md"
                />
              </Field>

              <Field
                label="Severe congestion threshold"
                htmlFor="severe-threshold"
                hint={`Segments at or below ${settings.severeCongestionThresholdMph} mph are flagged severe.`}
              >
                <div className="flex items-center gap-3">
                  <input
                    id="severe-threshold"
                    type="range"
                    min={10}
                    max={45}
                    step={1}
                    value={settings.severeCongestionThresholdMph}
                    onChange={(event) =>
                      updateSettings({ severeCongestionThresholdMph: Number(event.target.value) })
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
                  />
                  <span className="w-16 shrink-0 font-mono text-[12px] text-slate-200">
                    {settings.severeCongestionThresholdMph} mph
                  </span>
                </div>
              </Field>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-[11.5px] font-medium text-slate-200">Reduced motion</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-500">
                    Suppress non-essential animation and transitions.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.reducedMotion}
                  aria-label="Reduced motion"
                  onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                  className={cn(
                    "focus-ring relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    settings.reducedMotion ? "bg-cyan-500/70" : "bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                      settings.reducedMotion ? "left-[18px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </Panel>


          <Panel className="overflow-hidden">
            <PanelHeader
              title="Map rendering"
              description="Basemap provider and sensor label defaults"
              icon={Eye}
            />
            <div className="space-y-3.5 p-4">
              <Field label="Preferred basemap">
                <SegmentedControl
                  ariaLabel="Preferred basemap"
                  value={settings.mapTileStyle === "osm_standard" ? "osm_standard" : "dark_matter"}
                  onChange={(value) =>
                    updateSettings({ mapTileStyle: value as "dark_matter" | "osm_standard" })
                  }
                  options={[
                    { value: "dark_matter", label: "CARTO Dark Matter" },
                    { value: "osm_standard", label: "OpenStreetMap" },
                  ]}
                  size="md"
                />
              </Field>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-[11.5px] font-medium text-slate-200">Show sensor labels</p>
                  <p className="mt-0.5 text-[10.5px] text-slate-500">
                    Display METR-LA sensor IDs on hover in the live map.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showSensorLabels}
                  aria-label="Show sensor labels"
                  onClick={() => updateSettings({ showSensorLabels: !settings.showSensorLabels })}
                  className={cn(
                    "focus-ring relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    settings.showSensorLabels ? "bg-cyan-500/70" : "bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                      settings.showSensorLabels ? "left-[18px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              <p className="text-[10.5px] leading-relaxed text-slate-500">
                If the configured tile server cannot be reached, the map automatically falls back to a
                schematic vector rendering of the same corridor geometry instead of showing a blank
                panel.
              </p>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Data provenance"
              description="What this deployment is and is not doing"
              icon={ShieldAlert}
            />
            <ul className="space-y-2 p-4">
              {[
                {
                  icon: Gauge,
                  text: "Traffic conditions are deterministic simulations unless a live backend is enabled and healthy.",
                },
                {
                  icon: Cpu,
                  text: "LibCity model metrics shown on Model Insights are published benchmark references, not measurements from this deployment.",
                },
                {
                  icon: ShieldAlert,
                  text: "Incidents persist in localStorage only and are never sent to a real authority.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index} className="flex gap-2.5">
                    <Icon
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] leading-relaxed text-slate-400">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

