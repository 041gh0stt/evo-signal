import { KpiCardsSkeleton, PageTitleSkeleton, CardSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <PageTitleSkeleton />
      <KpiCardsSkeleton count={4} />
      {/* Filtro de período */}
      <div className="flex gap-2">
        {[60, 80, 70, 90].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-lg" style={{ width: `${w}px` }} />
        ))}
      </div>
      {/* Gráfico + funil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <Skeleton className="h-4 w-36" />
          {[80, 60, 45, 30].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 rounded-full" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
