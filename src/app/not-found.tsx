import Link from "next/link";
import { Compass } from "lucide-react";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <Panel variant="strong" className="mx-auto max-w-xl">
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
          <Compass className="h-5 w-5 text-cyan-400" aria-hidden="true" />
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Error 404
        </p>
        <h1 className="text-[16px] font-semibold text-slate-100">This route is not mapped</h1>
        <p className="max-w-sm text-[12px] leading-relaxed text-slate-500">
          The requested workspace does not exist. Return to the operational overview to continue
          monitoring the network.
        </p>
        <Link
          href="/"
          className="focus-ring mt-1 inline-flex h-9 items-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-4 text-[12.5px] font-medium text-cyan-100 transition hover:bg-cyan-500/25"
        >
          Back to Overview
        </Link>
      </div>
    </Panel>
  );
}
