import { PageTitleSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Lista lateral */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <PageTitleSkeleton />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex-1 overflow-hidden divide-y divide-zinc-800/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Área de mensagens */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 opacity-30">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-3 w-36 mx-auto" />
        </div>
      </div>
    </div>
  );
}
