export default function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;
}

/** Placeholder matching the shape of a QuestionCard, to keep CLS at zero. */
export function QuestionSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-6 shadow-subtle">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[85%]" />
      </div>
      <div className="mt-5 rounded-lg bg-ink-50/60 p-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-[70%]" />
      </div>
    </div>
  );
}

/** Placeholder matching the shape of an ArticleCard. */
export function ArticleSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-subtle">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-[70%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[60%]" />
      </div>
    </div>
  );
}
