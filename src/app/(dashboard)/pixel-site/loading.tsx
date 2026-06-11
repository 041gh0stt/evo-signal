import { PageTitleSkeleton, KpiCardsSkeleton, CardSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <PageTitleSkeleton />
      <KpiCardsSkeleton count={4} />
      <CardSkeleton lines={4} />
      <CardSkeleton lines={6} />
    </div>
  );
}
