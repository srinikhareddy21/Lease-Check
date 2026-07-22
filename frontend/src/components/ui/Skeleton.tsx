export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/70 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6">
      <Skeleton className="w-10 h-10 rounded-xl mb-4" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-full mb-4" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}
