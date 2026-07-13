"use client";

import { PageHeader } from "@/shared/ui/page-header";
import { ArticleForm } from "@/features/articles/article-form";
import { useCreateArticle } from "@/hooks/use-articles";

export default function NewArticlePage() {
  const create = useCreateArticle();

  return (
    <>
      <PageHeader title="فتوى جديدة" description="اكتب الفتوى وانشرها على الموقع." />

      <div className="max-w-3xl">
        <ArticleForm
          onSubmit={(values) => create.mutate(values)}
          isSubmitting={create.isPending}
          submitLabel="انشر الفتوى"
        />
      </div>
    </>
  );
}
