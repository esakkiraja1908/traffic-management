"use client";

import * as React from "react";
import {
  ArrowRight,
  CheckCheck,
  ListFilter,
  Map as MapIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  Waypoints,
  X,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge, CustomBadge } from "@/components/ui/badge";
import { SegmentedControl, Select, inputClasses } from "@/components/ui/controls";
import { Modal } from "@/components/ui/modal";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { TrafficMap } from "@/components/map/traffic-map";
import { IncidentFeed, INCIDENT_TYPE_META } from "@/components/traffic/incident-feed";
import { IncidentForm } from "@/components/traffic/incident-form";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useToast } from "@/components/providers/toast-provider";
import {
  createIncident,
  resetIncidentsToSeed,
  updateIncidentStatus,
} from "@/lib/api-client";
import {
  cn,
  formatRelativeMinutes,
  getSeverityBadgeStyles,
  getStatusBadgeStyles,
} from "@/lib/utils";
import type {
  CreateIncidentInput,
  IncidentSeverity,
  IncidentStatus,
  TrafficIncident,
} from "@/types/traffic";

type ViewMode = "split" | "list" | "map";
type StatusFilter = "all" | IncidentStatus;
type SeverityFilter = "all" | IncidentSeverity;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "responding", label: "Responding" },
  { value: "clearing", label: "Clearing" },
  { value: "resolved", label: "Resolved" },
];

const SEVERITY_FILTERS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

const STATUS_FLOW: IncidentStatus[] = ["active", "responding", "clearing", "resolved"];

export default function IncidentsPage() {
  const { segments, incidents, loading, error, dataSource, refresh } = useTrafficData();
  const { pushToast } = useToast();

  const [viewMode, setViewMode] = React.useState<ViewMode>("split");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>("all");
  const [selectedIncidentId, setSelectedIncidentId] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [statusUpdating, setStatusUpdating] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;
      if (severityFilter !== "all" && incident.severity !== severityFilter) return false;
      if (!query) return true;
      return (
        incident.title.toLowerCase().includes(query) ||
        incident.segmentName.toLowerCase().includes(query) ||
        incident.highway.toLowerCase().includes(query) ||
        incident.id.toLowerCase().includes(query) ||
        incident.respondingUnit.toLowerCase().includes(query)
      );
    });
  }, [incidents, searchQuery, statusFilter, severityFilter]);

  const selected = incidents.find((i) => i.id === selectedIncidentId) ?? null;

  const handleCreate = React.useCallback(
    async (input: CreateIncidentInput) => {
      setSubmitting(true);
      try {
        const result = await createIncident(input);
        setSelectedIncidentId(result.data.id);
        refresh();
        pushToast({
          variant: "success",
          title: "Incident created",
          description: `${result.data.id} added to local demo storage.`,
        });
      } catch (err) {
        pushToast({
          variant: "error",
          title: "Could not create incident",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, pushToast]
  );

  const handleStatusChange = React.useCallback(
    async (incident: TrafficIncident, status: IncidentStatus) => {
      setStatusUpdating(incident.id);
      try {
        const result = await updateIncidentStatus(incident.id, status);
        refresh();
        pushToast({
          variant: status === "resolved" ? "success" : "info",
          title: `Status updated to ${status}`,
          description: result.notice ?? undefined,
        });
      } finally {
        setStatusUpdating(null);
      }
    },
    [refresh, pushToast]
  );

  const handleReset = React.useCallback(() => {
    resetIncidentsToSeed();
    refresh();
    setSelectedIncidentId(null);
    pushToast({
      variant: "info",
      title: "Demo incidents restored",
      description: "The local incident store was reset to the seeded METR-LA scenario.",
    });
  }, [refresh, pushToast]);

  if (error) {
    return (
      <Panel variant="strong">
        <ErrorState description={error} onRetry={refresh} />
      </Panel>
    );
  }

  const openCount = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <DataSourceBadge mode={dataSource} />
          <Badge variant="danger" dot>
            {openCount} open
          </Badge>
          <Badge variant="muted">{incidents.length} total records</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="View mode"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "split", label: "Split" },
              { value: "list", label: "List" },
              { value: "map", label: "Map", icon: MapIcon },
            ]}
          />
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Reset demo data
          </Button>
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Report incident
          </Button>
        </div>
      </div>

      <NoticeBanner
        tone="warning"
        title="Demo incident store"
        message="All incidents on this page are simulated and persisted only in this browser's local storage. Nothing is transmitted to a real traffic authority, dispatch centre or emergency service."
      />

      <Panel>
        <PanelHeader
          title="Search & filters"
          description="Narrow the register by text, status and severity"
          icon={ListFilter}
        />
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <label className="label-caps mb-1.5 block" htmlFor="incident-search">
              Search
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-[30px] h-3.5 w-3.5 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="incident-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, segment, unit or incident ID…"
              className={cn(inputClasses, "pl-8")}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="focus-ring absolute right-2 top-[34px] rounded p-0.5 text-slate-500 hover:text-slate-200"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="w-[152px]">
            <label className="label-caps mb-1.5 block" htmlFor="status-filter">
              Status
            </label>
            <Select
              id="status-filter"
              ariaLabel="Status filter"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={STATUS_FILTERS}
            />
          </div>
          <div className="w-[160px]">
            <label className="label-caps mb-1.5 block" htmlFor="severity-filter">
              Severity
            </label>
            <Select
              id="severity-filter"
              ariaLabel="Severity filter"
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value as SeverityFilter)}
              options={SEVERITY_FILTERS}
            />
          </div>
          <Badge variant="muted" className="mb-1.5">
            {filtered.length} matching
          </Badge>
        </div>
      </Panel>


      {viewMode === "map" ? (
        <Panel variant="strong" className="overflow-hidden">
          <PanelHeader
            title="Incident map"
            description="Active and in-progress incidents on the METR-LA corridor network"
            icon={MapIcon}
          />
          <div className="h-[560px] w-full p-2">
            {loading ? (
              <div className="skeleton h-full w-full rounded-xl" />
            ) : (
              <TrafficMap
                segments={segments}
                incidents={filtered}
                selectedSegmentId={selectedIncidentId}
                onSelectSegment={() => undefined}
              />
            )}
          </div>
        </Panel>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            viewMode === "split" ? "xl:grid-cols-[1.35fr_1fr]" : ""
          )}
        >
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Incident register"
              description={`${filtered.length} incidents · sorted by status then recency`}
              icon={TriangleAlert}
            />
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length ? (
              <IncidentFeed
                incidents={filtered}
                selectedIncidentId={selectedIncidentId}
                onSelect={(incident) => setSelectedIncidentId(incident.id)}
              />
            ) : (
              <EmptyState
                title="No incidents match the filters"
                description="Try clearing the search query or broadening the status and severity filters."
                icon={TriangleAlert}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSeverityFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </Panel>

          {viewMode === "split" ? (
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Incident details"
                description="Operational record and status workflow"
                icon={Waypoints}
                action={
                  selected ? (
                    <CustomBadge
                      label={selected.id}
                      className="border-white/10 bg-white/[0.04] font-mono text-slate-400"
                    />
                  ) : null
                }
              />
              {selected ? (
                <IncidentDetail
                  incident={selected}
                  updating={statusUpdating === selected.id}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <EmptyState
                  title="No incident selected"
                  description="Select an incident from the register to review its details and advance its operational status."
                  icon={TriangleAlert}
                />
              )}
            </Panel>
          ) : null}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Report a new incident"
        description="Create a simulated incident record in local demo storage"
        size="lg"
      >
        <IncidentForm
          segments={segments}
          submitting={submitting}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>
    </div>
  );
}

function IncidentDetail({
  incident,
  updating,
  onStatusChange,
}: {
  incident: TrafficIncident;
  updating: boolean;
  onStatusChange: (incident: TrafficIncident, status: IncidentStatus) => Promise<void>;
}) {
  const meta = INCIDENT_TYPE_META[incident.type];
  const TypeIcon = meta.icon;
  const severity = getSeverityBadgeStyles(incident.severity);
  const status = getStatusBadgeStyles(incident.status);
  const currentIndex = STATUS_FLOW.indexOf(incident.status);

  const rows = [
    { label: "Incident ID", value: incident.id, mono: true },
    { label: "Type", value: meta.label },
    { label: "Highway", value: incident.highway, mono: true },
    { label: "Segment", value: incident.segmentName },
    { label: "Lanes blocked", value: incident.lanesBlocked },
    { label: "Responding unit", value: incident.respondingUnit },
    { label: "Estimated clearance", value: `${incident.estimatedClearanceMin} min`, mono: true },
    { label: "Speed impact", value: `${incident.speedImpactMph} mph`, mono: true },
    { label: "Reported", value: new Date(incident.reportedAt).toLocaleString() },
    { label: "Last updated", value: formatRelativeMinutes(incident.updatedAt) },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            severity.bg,
            severity.border
          )}
        >
          <TypeIcon className={cn("h-4 w-4", severity.text)} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold leading-snug text-slate-100">
            {incident.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CustomBadge
              label={severity.label}
              className={cn(severity.bg, severity.text, severity.border)}
              dotClass="bg-current"
            />
            <CustomBadge
              label={status.label}
              className={cn(status.bg, status.text, status.border)}
              dotClass="bg-current"
            />
          </div>
        </div>
      </div>

      <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[11.5px] leading-relaxed text-slate-300">
        {incident.description}
      </p>

      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
          >
            <dt className="label-caps">{row.label}</dt>
            <dd className={cn("mt-0.5 text-[11.5px] text-slate-200", row.mono && "font-mono")}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
        <p className="label-caps">Status workflow</p>
        <ol className="mt-2 space-y-1.5">
          {STATUS_FLOW.map((step, index) => {
            const styles = getStatusBadgeStyles(step);
            const reached = index <= currentIndex;
            return (
              <li key={step} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-semibold",
                    reached ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300" : "border-white/10 text-slate-600"
                  )}
                >
                  {reached ? <CheckCheck className="h-2.5 w-2.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className={cn("text-[11.5px]", reached ? "text-slate-200" : "text-slate-600")}>
                  {styles.label}
                </span>
                {step === incident.status ? (
                  <Badge variant="cyan" className="ml-auto">
                    current
                  </Badge>
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
          {incident.status !== "resolved" ? (
            <Button
              variant="primary"
              disabled={updating}
              onClick={() => {
                const nextStatus = STATUS_FLOW[Math.min(currentIndex + 1, STATUS_FLOW.length - 1)];
                void onStatusChange(incident, nextStatus);
              }}
            >
              {updating ? null : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
              Advance to {getStatusBadgeStyles(STATUS_FLOW[Math.min(currentIndex + 1, 3)]).label}
            </Button>
          ) : null}
          {incident.status !== "resolved" ? (
            <Button
              variant="secondary"
              disabled={updating}
              onClick={() => void onStatusChange(incident, "resolved")}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark resolved
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={updating}
              onClick={() => void onStatusChange(incident, "active")}
            >
              Reopen incident
            </Button>
          )}
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-600">
        This record lives in local browser demo storage only. Status changes are not broadcast to any
        real dispatch or traffic management system.
      </p>
    </div>
  );
}

