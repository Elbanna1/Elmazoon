"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/ui/page-header";
import { ErrorState } from "@/shared/ui/states";
import { ArticleForm } from "@/features/articles/article-form";
import { useArticle, useUpdateArticle } from "@/hooks/use-articles";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 hands route params to client components as a promise.
  const { id } = use(params);

  const query = useArticle(id);
  const update = useUpdateArticle(id);

  return (
    <>
      <PageHeader
        title={query.data?.title ?? "تعديل الفتوى"}
        description="يظهر التعديل على الموقع فور الحفظ."
      />

      <div className="max-w-3xl">
        {query.isLoading ? (
          <div className="space-y-6 rounded-2xl border border-ink-100 bg-surface p-6 shadow-subtle">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data ? (
          <ArticleForm
            // Remount when a different article loads, so the form's defaults are
            // re-read rather than retaining the previous article's body.
            key={query.data._id}
            article={query.data}
            onSubmit={(values) => update.mutate(values)}
            isSubmitting={update.isPending}
            submitLabel="حفظ التعديل"
          />
        ) : null}
      </div>
    </>
  );
}
