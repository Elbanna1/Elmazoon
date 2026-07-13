"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Eye, MessagesSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SearchInput } from "@/shared/ui/search-input";
import { DeleteDialog } from "@/shared/ui/confirmation-dialog";
import { ArticlePlaceholder } from "@/shared/ui/article-placeholder";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/shared/ui/states";
import { useArticles, useDeleteArticle } from "@/hooks/use-articles";
import { articleImageUrl } from "@/lib/uploads";
import type { ArticleDto } from "@/types/api";

const LIMIT = 12;

export default function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const params = useMemo(() => ({ page, limit: LIMIT, search }), [page, search]);

  const query = useArticles(params);
  const remove = useDeleteArticle(params);

  const [deleting, setDeleting] = useState<ArticleDto | null>(null);

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="الفتاوى"
        description="نشر الفتاوى وتعديلها وحذفها."
        actions={
          <Button render={<Link href="/admin/articles/new" />}>
            <Plus className="size-4" />
            فتوى جديدة
          </Button>
        }
      />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="ابحث في الفتاوى…"
          className="w-full sm:max-w-xs"
        />
      </div>

      {query.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={search ? "لا توجد نتائج مطابقة" : "لا توجد فتاوى بعد"}
          description={search ? "جرّب كلمة أخرى." : "انشر أول فتوى وستظهر هنا."}
          action={
            !search ? (
              <Button render={<Link href="/admin/articles/new" />}>
                <Plus className="size-4" />
                فتوى جديدة
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => {
            const src = articleImageUrl(article);
            const date = new Date(article.createdAt);

            return (
              <article
                key={article._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-subtle transition-[box-shadow,transform] duration-300 ease-premium hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
                  {/* The image is optional. When there is none, the placeholder is
                      a designed state — not an empty grey box that breaks the row. */}
                  {src ? (
                    <Image
                      src={src}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
                    />
                  ) : (
                    <ArticlePlaceholder />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="line-clamp-2 text-[1.0625rem] leading-snug font-semibold text-ink-900">
                    {article.title}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" />
                      <span className="ltr-nums">
                        {(article.views ?? 0).toLocaleString("ar-EG")}
                      </span>
                      مشاهدة
                    </span>
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="size-3.5" />
                      <span className="ltr-nums">{article.commentCount ?? 0}</span>
                      تعليق
                    </span>
                    <span className="ltr-nums">
                      {Number.isNaN(date.getTime()) ? "—" : format(date, "yyyy/MM/dd")}
                    </span>
                  </div>

                  <div className="mt-auto flex gap-2 pt-5">
                    <Button
                      render={<Link href={`/admin/articles/${article._id}/edit`} />}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="size-3.5" />
                      تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                      onClick={() => setDeleting(article)}
                    >
                      <Trash2 className="size-3.5" />
                      حذف
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination
        page={query.data?.page ?? page}
        totalPages={query.data?.totalPages ?? 1}
        // This endpoint reports pages but no row count; printing a total here
        // would mean inventing one.
        showCount={false}
        isFetching={query.isFetching}
        onPageChange={setPage}
      />

      <DeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        name={deleting?.title ?? null}
        kind="article"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting._id, { onSettled: () => setDeleting(null) });
        }}
      />
    </>
  );
}
