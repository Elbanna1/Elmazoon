"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/errors";
import { commentsService, type AdminCommentsParams } from "@/services/comments.service";

/** Every comment on the site, flat and paged, newest first. */
export function useAllComments(params: AdminCommentsParams) {
  return useQuery({
    queryKey: qk.comments.adminList(params),
    queryFn: () => commentsService.all(params),
    // Without this the list blanks to a skeleton on every page change.
    placeholderData: keepPreviousData,
  });
}

/**
 * A comment changing invalidates the comment list, the dashboard (its comment
 * totals just moved) and the notifications feed.
 */
function useCommentInvalidation() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: qk.comments.all });
    queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
    queryClient.invalidateQueries({ queryKey: qk.notifications.all });
  };
}

export function useReplyToComment() {
  const invalidate = useCommentInvalidation();

  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => commentsService.reply(id, reply),
    onSuccess: () => {
      toast.success("تم نشر الرد.");
      invalidate();
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر نشر الرد.", { description: error.detail ?? error.message });
    },
  });
}

export function useDeleteComment() {
  const invalidate = useCommentInvalidation();

  return useMutation({
    mutationFn: (id: string) => commentsService.remove(id),
    onSuccess: () => {
      toast.success("تم حذف التعليق.");
      invalidate();
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر حذف التعليق.", { description: error.detail ?? error.message });
    },
  });
}
