import { PageTitleSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PixelEventsLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <PageTitleSkeleton />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
