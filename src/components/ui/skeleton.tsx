import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden="true" />;
}

export function ChartSkeleton({ className }: { className?: string }) {
  const heights = [42, 68, 35, 78, 55, 88, 46, 72, 30, 64, 82, 50];
  return (
    <div className={cn("flex h-full w-full flex-col justify-end gap-2 p-4", className)}>
      <div className="flex flex-1 items-end gap-1.5">
        {heights.map((height, index) => (
          <div
            key={index}
            className="skeleton flex-1 rounded-t-sm"
            style={{ height: `${height}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <Skeleton className="h-2.5 w-1/3" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2.5 w-40" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-3/5" />
            <Skeleton className="h-2 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
