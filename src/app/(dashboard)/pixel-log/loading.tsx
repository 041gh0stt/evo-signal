import { KpiCardsSkeleton, PageTitleSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";

export default function PixelLogLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <PageTitleSkeleton />
      <KpiCardsSkeleton count={3} />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
