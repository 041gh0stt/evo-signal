import { PageTitleSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FunilLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <PageTitleSkeleton />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      {/* Colunas do kanban */}
      <div className="flex gap-4 overflow-hidden">
        {[5, 3, 4, 2].map((count, col) => (
          <div key={col} className="w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
