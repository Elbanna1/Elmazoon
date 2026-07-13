"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/errors";
import { articlesService, type ArticleListParams } from "@/services/articles.service";
import type { ArticleDto, ArticleFormValues, Paged } from "@/types/api";

export function useArticles(params: ArticleListParams) {
  return useQuery({
    queryKey: qk.articles.list(params),
    queryFn: () => articlesService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useArticle(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.articles.detail(id),
    queryFn: () => articlesService.byId(id),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: ArticleFormValues) => articlesService.create(values),
    onSuccess: () => {
      toast.success("تم نشر الفتوى.");
      queryClient.invalidateQueries({ queryKey: qk.articles.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
      router.push("/admin/articles");
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر نشر الفتوى.", {
        description: error.detail ?? error.message,
      });
    },
  });
}

export function useUpdateArticle(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: ArticleFormValues) => articlesService.update(id, values),
    onSuccess: () => {
      toast.success("تم تحديث الفتوى.");
      queryClient.invalidateQueries({ queryKey: qk.articles.all });
      queryClient.invalidateQueries({ queryKey: qk.articles.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
      router.push("/admin/articles");
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر تحديث الفتوى.", {
        description: error.detail ?? error.message,
      });
    },
  });
}

export function useDeleteArticle(params: ArticleListParams) {
  const queryClient = useQueryClient();
  const key = qk.articles.list(params);

  return useMutation({
    mutationFn: (id: string) => articlesService.remove(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Paged<ArticleDto>>(key);

      queryClient.setQueryData<Paged<ArticleDto>>(key, (old) =>
        old ? { ...old, items: old.items.filter((a) => a._id !== id) } : old,
      );

      return { previous };
    },

    onError: (error: ApiError, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("تعذّر حذف الفتوى.", {
        description: error.detail ?? error.message,
      });
    },

    onSuccess: () => {
      toast.success("تم حذف الفتوى.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.articles.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
    },
  });
}
