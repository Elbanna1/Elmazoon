"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/errors";
import { questionsService, type QuestionListParams } from "@/services/questions.service";
import type { Paged, QuestionDto } from "@/types/api";

export function useQuestions(params: QuestionListParams) {
  return useQuery({
    queryKey: qk.questions.list(params),
    queryFn: () => questionsService.list(params),
    // Without this the table blanks to a skeleton on every page change, which
    // makes paging feel like a full reload.
    placeholderData: keepPreviousData,
  });
}

export function useAnswerQuestion(params: QuestionListParams) {
  const queryClient = useQueryClient();
  const key = qk.questions.list(params);

  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      questionsService.answer(id, { response }),

    // Optimistic: the answer appears the instant it is saved.
    onMutate: async ({ id, response }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Paged<QuestionDto>>(key);

      queryClient.setQueryData<Paged<QuestionDto>>(key, (old) =>
        old
          ? { ...old, items: old.items.map((q) => (q._id === id ? { ...q, response } : q)) }
          : old,
      );

      return { previous };
    },

    onError: (error: ApiError, _vars, context) => {
      // Put the old answer back. Leaving the optimistic one on screen would tell
      // the admin their fatwa was published when it was not.
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("تعذّر حفظ الرد.", { description: error.detail ?? error.message });
    },

    onSuccess: () => {
      toast.success("تم نشر الرد.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.questions.all });
      // Answering changes the pending/answered split the dashboard reports.
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
    },
  });
}

export function useDeleteQuestion(params: QuestionListParams) {
  const queryClient = useQueryClient();
  const key = qk.questions.list(params);

  return useMutation({
    mutationFn: (id: string) => questionsService.remove(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Paged<QuestionDto>>(key);

      queryClient.setQueryData<Paged<QuestionDto>>(key, (old) =>
        old
          ? {
              ...old,
              items: old.items.filter((q) => q._id !== id),
              totalCount: Math.max(0, old.totalCount - 1),
            }
          : old,
      );

      return { previous };
    },

    onError: (error: ApiError, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error("تعذّر حذف السؤال.", {
        description: error.detail ?? error.message,
      });
    },

    onSuccess: () => {
      toast.success("تم حذف السؤال.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.questions.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
    },
  });
}
