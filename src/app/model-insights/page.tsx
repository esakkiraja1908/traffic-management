"use client";

import * as React from "react";
import {
  BookOpen,
  Boxes,
  Cpu,
  Database,
  FileJson,
  GitBranch,
  Info,
  Layers,
  Sigma,
  ShieldAlert,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge, CustomBadge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/controls";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { ModelStatusPill } from "@/components/ui/data-source-badge";
import { ResidualChart } from "@/components/charts/residual-chart";
import { LIBCITY_ATOMIC_FILES, METR_LA_DATASET_FACTS } from "@/data/libcity-dataset";
import { LIBCITY_MODELS } from "@/data/metr-la-models";
import { cn } from "@/lib/utils";
import type { LibCityModelId } from "@/types/traffic";

const MODEL_TABS: { value: string; label: string }[] = LIBCITY_MODELS.map((model) => ({
  value: model.id,
  label: model.name,
}));

export default function ModelInsightsPage() {
  const [modelId, setModelId] = React.useState<string>("GraphWaveNet");
  const model = LIBCITY_MODELS.find((m) => m.id === (modelId as LibCityModelId)) ?? LIBCITY_MODELS[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="cyan">
            <Cpu className="h-3 w-3" aria-hidden="true" />
            LibCity · METR-LA
          </Badge>
          <ModelStatusPill status={model.status} />
          <Badge variant="muted">
            <Database className="h-3 w-3" aria-hidden="true" />
            {METR_LA_DATASET_FACTS.sensorCount} sensors · {METR_LA_DATASET_FACTS.intervalMinutes}-min interval
          </Badge>
        </div>
        <SegmentedControl
          ariaLabel="Model architecture"
          value={modelId}
          onChange={setModelId}
          options={MODEL_TABS}
          size="md"
        />
      </div>

      <NoticeBanner
        tone="warning"
        title="How to read these metrics"
        message="Evaluation figures below are published LibCity / METR-LA benchmark references for these architectures. They are NOT measured results from this deployment, because no trained checkpoint is running here. Connect a FastAPI inference service in Settings to enable live evaluation."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title={model.fullName}
            description={model.architectureType}
            icon={Boxes}
            action={
              <CustomBadge
                label={model.id}
                className="border-cyan-500/25 bg-cyan-500/10 font-mono text-cyan-300"
              />
            }
          />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <InfoTile label="Model type" value={model.architectureType} icon={Layers} />
            <InfoTile
              label="Prediction horizon"
              value={`${model.outputHorizonSteps} steps · ${model.outputHorizonSteps * 5} min`}
              icon={Sigma}
            />
            <InfoTile
              label="Input window"
              value={`${model.inputWindowSteps} steps · ${model.inputWindowSteps * 5} min`}
              icon={GitBranch}
            />
            <InfoTile
              label="Confidence intervals"
              value={model.supportsConfidenceIntervals ? "Supported" : "Not emitted"}
              icon={ShieldAlert}
            />
            <InfoTile label="Spatial mechanism" value={model.spatialMechanism} icon={GitBranch} className="sm:col-span-2" />
            <InfoTile label="Temporal mechanism" value={model.temporalMechanism} icon={Sigma} className="sm:col-span-2" />
            <InfoTile label="Reference" value={model.paperReference} icon={BookOpen} className="sm:col-span-2" />
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              {model.lastEvaluationNote}
            </p>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="METR-LA dataset"
            description="Benchmark dataset backing the forecasting models"
            icon={Database}
          />
          <dl className="divide-y divide-white/[0.05]">
            <DatasetRow label="Dataset name" value={METR_LA_DATASET_FACTS.datasetName} />
            <DatasetRow label="Region" value={METR_LA_DATASET_FACTS.region} />
            <DatasetRow label="Sensors" value={`${METR_LA_DATASET_FACTS.sensorCount} loop detectors`} />
            <DatasetRow label="Raw time steps" value={METR_LA_DATASET_FACTS.rawTimeSteps.toLocaleString()} />
            <DatasetRow label="Sampling interval" value={`${METR_LA_DATASET_FACTS.intervalMinutes} minutes`} />
            <DatasetRow label="Coverage window" value={METR_LA_DATASET_FACTS.dateRangeLabel} />
            <DatasetRow label="Normalizer" value={METR_LA_DATASET_FACTS.normalizer} />
          </dl>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="text-[10.5px] leading-relaxed text-slate-500">
              {METR_LA_DATASET_FACTS.sourceNote}
            </p>
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Evaluation metrics by horizon"
          description="MAE / RMSE / MAPE at 15, 30 and 60-minute forecast horizons"
          icon={Sigma}
          action={
            <CustomBadge
              label="Published benchmark reference"
              className="border-amber-500/25 bg-amber-500/10 text-amber-300"
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="label-caps px-3 py-2 text-left">Horizon</th>
                <th className="label-caps px-3 py-2 text-right">Steps</th>
                <th className="label-caps px-3 py-2 text-right">MAE (mph)</th>
                <th className="label-caps px-3 py-2 text-right">RMSE (mph)</th>
                <th className="label-caps px-3 py-2 text-right">MAPE (%)</th>
                <th className="label-caps px-3 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {model.horizonMetrics.map((metric) => (
                <tr key={metric.horizonMinutes} className="border-b border-white/[0.04]">
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-medium text-slate-200">
                      +{metric.horizonMinutes} min
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] text-slate-400">
                    {metric.horizonSteps}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12.5px] font-medium text-cyan-300">
                    {metric.maeMph.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12.5px] text-slate-200">
                    {metric.rmseMph.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12.5px] text-slate-200">
                    {metric.mapePct.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-[10.5px] text-slate-500">{metric.sourceLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-[10.5px] leading-relaxed text-slate-500">
            Lower MAE, RMSE and MAPE indicate better accuracy. Error grows monotonically with horizon,
            which is the expected behaviour for spatiotemporal traffic forecasting on METR-LA.
          </p>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Actual vs predicted residuals"
          description={`Recent 12-step comparison for ${model.name}`}
          icon={Sigma}
          action={
            <div className="flex items-center gap-1.5">
              <Badge variant="warning">Under-predicted</Badge>
              <Badge variant="danger">Over-predicted</Badge>
            </div>
          }
        />
        <ResidualChart data={model.residualComparison} />
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat
              label="Mean abs residual"
              value={`${(
                model.residualComparison.reduce((a, r) => a + Math.abs(r.residualMph), 0) /
                model.residualComparison.length
              ).toFixed(2)} mph`}
            />
            <MiniStat
              label="Max residual"
              value={`${Math.max(
                ...model.residualComparison.map((r) => Math.abs(r.residualMph))
              ).toFixed(2)} mph`}
            />
            <MiniStat
              label="Bias"
              value={`${
                model.residualComparison.reduce((a, r) => a + r.residualMph, 0) /
                  model.residualComparison.length >
                0
                  ? "+"
                  : ""
              }${(
                model.residualComparison.reduce((a, r) => a + r.residualMph, 0) /
                model.residualComparison.length
              ).toFixed(2)} mph`}
            />
          </div>
        </div>
      </Panel>


      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Spatial dependency graph"
            description="METR_LA.rel edges weighted by Gaussian kernel"
            icon={GitBranch}
            action={
              <CustomBadge
                label={`${model.spatialGraphEdges.length} sampled edges`}
                className="border-white/10 bg-white/[0.04] text-slate-400"
              />
            }
          />
          <ul className="divide-y divide-white/[0.05]">
            {model.spatialGraphEdges.map((edge) => (
              <li key={`${edge.originSensor}-${edge.destinationSensor}`} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11.5px] text-slate-200">
                    {edge.originSensor} → {edge.destinationSensor}
                  </span>
                  <span className="font-mono text-[11px] text-cyan-300">
                    w={edge.gaussianKernelWeight.toFixed(3)}
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] text-slate-500">
                  {edge.corridorName} · {(edge.distanceMeters / 1000).toFixed(2)} km
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <p className="text-[10.5px] leading-relaxed text-slate-500">
              Edge weights use the standard Gaussian kernel over geodesic distance, matching the
              METR-LA adjacency construction used by the reference implementations.
            </p>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Feature importance"
            description="Spatial vs temporal contribution"
            icon={Layers}
            action={
              <CustomBadge
                label="Unavailable in simulation"
                className="border-amber-500/25 bg-amber-500/10 text-amber-300"
              />
            }
          />
          <div className="px-4 py-4">
            <p className="text-[11.5px] leading-relaxed text-slate-400">
              Per-feature attribution requires a loaded checkpoint and gradient access. Because no
              LibCity inference service is connected, Traffic Intelligence intentionally shows no
              feature-importance numbers here rather than inventing them.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Connect a FastAPI inference service exposing /predict and /attributions.",
                "Return per-node, per-feature gradient or permutation importance.",
                "The UI renders a ranked attribution chart automatically once that payload validates.",
              ].map((item, index) => (
                <li key={index} className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] leading-relaxed text-slate-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>


      <Panel className="overflow-hidden">
        <PanelHeader
          title="LibCity atomic file schema"
          description="Structure of the METR-LA dataset files consumed by the adapter"
          icon={FileJson}
          action={
            <CustomBadge
              label="Read-only inspection"
              className="border-white/10 bg-white/[0.04] text-slate-400"
            />
          }
        />
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          {LIBCITY_ATOMIC_FILES.map((file) => (
            <div
              key={file.fileName}
              className="overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                <span className="font-mono text-[11.5px] font-medium text-slate-200">
                  {file.fileName}
                </span>
                <Badge variant="muted">{file.recordCountLabel}</Badge>
              </div>
              <p className="px-3 py-2 text-[10.5px] leading-relaxed text-slate-500">
                {file.description}
              </p>
              <div className="border-t border-white/[0.06] px-3 py-2">
                <p className="label-caps">Columns</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {file.columns.map((column) => (
                    <span
                      key={column}
                      className="rounded border border-cyan-500/20 bg-cyan-500/[0.07] px-1.5 py-0.5 font-mono text-[9.5px] text-cyan-300"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto border-t border-white/[0.06]">
                <table className="w-full">
                  <tbody>
                    {file.sampleRows.map((row, index) => (
                      <tr key={index} className="border-b border-white/[0.04] last:border-0">
                        {Object.entries(row).map(([key, value]) => (
                          <td
                            key={key}
                            className="px-2.5 py-1.5 font-mono text-[10px] text-slate-400 first:text-slate-300"
                          >
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5", className)}
    >
      <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.1em] text-slate-500">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-slate-200">{value}</p>
    </div>
  );
}

function DatasetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="max-w-[58%] text-right text-[11.5px] text-slate-200">{value}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <p className="label-caps">{label}</p>
      <p className="mt-0.5 font-mono text-[13px] font-medium text-slate-100">{value}</p>
    </div>
  );
}

