import { KpiCardsSkeleton, PageTitleSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LinksLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <PageTitleSkeleton />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <KpiCardsSkeleton count={3} />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
