import { KpiCardsSkeleton, PageTitleSkeleton, TableSkeleton } from "@/components/layout/page-skeleton";

export default function ClientesLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <PageTitleSkeleton />
      <KpiCardsSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
