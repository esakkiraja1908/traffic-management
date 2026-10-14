"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, inputClasses } from "@/components/ui/controls";
import { CreateIncidentSchema, type CreateIncidentInput, type RoadSegment } from "@/types/traffic";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "collision", label: "Collision" },
  { value: "stalled_vehicle", label: "Stalled vehicle" },
  { value: "roadwork", label: "Roadwork" },
  { value: "weather_hazard", label: "Weather hazard" },
  { value: "signal_failure", label: "Signal failure" },
  { value: "congestion_alert", label: "Congestion alert" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

const EMPTY_FORM = {
  title: "",
  type: "collision",
  severity: "moderate",
  segmentId: "",
  lanesBlocked: "",
  estimatedClearanceMin: "30",
  respondingUnit: "",
  description: "",
};

export function IncidentForm({
  segments,
  submitting,
  onCancel,
  onSubmit,
}: {
  segments: RoadSegment[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateIncidentInput) => Promise<void>;
}) {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!form.segmentId && segments.length) {
      setForm((current) => ({ ...current, segmentId: segments[0].id }));
    }
  }, [segments, form.segmentId]);

  const segmentOptions = segments.map((segment) => ({
    value: segment.id,
    label: `${segment.highway} ${segment.direction} · ${segment.name}`,
  }));

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = CreateIncidentSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setSuccess(false);
      return;
    }
    setErrors({});
    await onSubmit(parsed.data);
    setSuccess(true);
    setForm({ ...EMPTY_FORM, segmentId: segments[0]?.id ?? "" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-200">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Local demo storage
        </p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-amber-200/60">
          Incidents created here are saved in this browser only. They are not dispatched to any real
          traffic authority or emergency service.
        </p>
      </div>

      <Field label="Incident title" htmlFor="incident-title" error={errors.title}>
        <input
          id="incident-title"
          type="text"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="e.g. Two-vehicle collision blocking inner lanes"
          className={inputClasses}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Incident type" htmlFor="incident-type" error={errors.type}>
          <Select
            id="incident-type"
            ariaLabel="Incident type"
            value={form.type}
            onChange={(value) => update("type", value)}
            options={TYPE_OPTIONS}
          />
        </Field>
        <Field label="Severity" htmlFor="incident-severity" error={errors.severity}>
          <Select
            id="incident-severity"
            ariaLabel="Incident severity"
            value={form.severity}
            onChange={(value) => update("severity", value)}
            options={SEVERITY_OPTIONS}
          />
        </Field>
      </div>

      <Field label="Affected road segment" htmlFor="incident-segment" error={errors.segmentId}>
        <Select
          id="incident-segment"
          ariaLabel="Affected road segment"
          value={form.segmentId}
          onChange={(value) => update("segmentId", value)}
          options={segmentOptions.length ? segmentOptions : [{ value: "", label: "Loading…" }]}
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Lane impact"
          htmlFor="incident-lanes"
          error={errors.lanesBlocked}
          hint="e.g. Left 2 Lanes, Right Shoulder"
        >
          <input
            id="incident-lanes"
            type="text"
            value={form.lanesBlocked}
            onChange={(event) => update("lanesBlocked", event.target.value)}
            placeholder="Left 2 Lanes"
            className={inputClasses}
          />
        </Field>
        <Field
          label="Estimated clearance (minutes)"
          htmlFor="incident-clearance"
          error={errors.estimatedClearanceMin}
        >
          <input
            id="incident-clearance"
            type="number"
            min={5}
            max={720}
            value={form.estimatedClearanceMin}
            onChange={(event) => update("estimatedClearanceMin", event.target.value)}
            className={inputClasses}
          />
        </Field>
      </div>

      <Field label="Responding unit" htmlFor="incident-unit" error={errors.respondingUnit}>
        <input
          id="incident-unit"
          type="text"
          value={form.respondingUnit}
          onChange={(event) => update("respondingUnit", event.target.value)}
          placeholder="e.g. CHP Central-14"
          className={inputClasses}
        />
      </Field>

      <Field
        label="Operational description"
        htmlFor="incident-description"
        error={errors.description}
      >
        <textarea
          id="incident-description"
          rows={3}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Describe the situation, lane configuration and expected impact."
          className={cn(inputClasses, "resize-none")}
        />
      </Field>

      {success ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Incident saved to local demo storage and added to the register.
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3.5">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          {submitting ? "Saving incident…" : "Create incident"}
        </Button>
      </div>
    </form>
  );
}

