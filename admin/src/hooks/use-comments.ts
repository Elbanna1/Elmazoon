"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/errors";
import { revalidatePublicSite } from "@/lib/revalidate";
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
 *
 * It also has to reach past this app entirely: the comment thread is rendered
 * into the public fatwa's statically-generated page, so a reply the admin can see
 * here is not one a visitor can see until that page is rebuilt. `articleId` is
 * carried through the mutation for exactly this — it is the only way to name
 * which public page went stale.
 */
function useCommentInvalidation() {
  const queryClient = useQueryClient();

  return (articleId?: string) => {
    queryClient.invalidateQueries({ queryKey: qk.comments.all });
    queryClient.invalidateQueries({ queryKey: qk.dashboard.all });
    queryClient.invalidateQueries({ queryKey: qk.notifications.all });
    revalidatePublicSite(articleId);
  };
}

export function useReplyToComment() {
  const invalidate = useCommentInvalidation();

  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string; articleId?: string }) =>
      commentsService.reply(id, reply),
    onSuccess: (_data, { articleId }) => {
      toast.success("تم نشر الرد.");
      invalidate(articleId);
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر نشر الرد.", { description: error.detail ?? error.message });
    },
  });
}

export function useDeleteComment() {
  const invalidate = useCommentInvalidation();

  return useMutation({
    mutationFn: ({ id }: { id: string; articleId?: string }) => commentsService.remove(id),
    onSuccess: (_data, { articleId }) => {
      toast.success("تم حذف التعليق.");
      invalidate(articleId);
    },
    onError: (error: ApiError) => {
      toast.error("تعذّر حذف التعليق.", { description: error.detail ?? error.message });
    },
  });
}
