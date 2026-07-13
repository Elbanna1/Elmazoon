"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { CornerDownLeft, Loader2, MessageSquareReply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/shared/ui/states";
import { useAllComments, useDeleteComment, useReplyToComment } from "@/hooks/use-comments";
import type { AdminCommentDto } from "@/types/api";

const LIMIT = 20;

/**
 * Comments.
 *
 * No moderation: the backend publishes a comment the moment it is written, so
 * there is no queue, no approve button and no "بانتظار المراجعة". The Ma'zoun's
 * only powers over a comment are to reply to it or to remove it.
 */
export default function CommentsPage() {
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ page, limit: LIMIT }), [page]);

  const query = useAllComments(params);
  const reply = useReplyToComment();
  const remove = useDeleteComment();

  const [replying, setReplying] = useState<AdminCommentDto | null>(null);
  const [deleting, setDeleting] = useState<AdminCommentDto | null>(null);

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="التعليقات"
        description="تعليقات الزوّار على الفتاوى. يمكنك الرد عليها أو حذفها."
      />

      {query.isLoading ? (
        <Card className="border-ink-100 shadow-subtle">
          <CardContent className="pt-6">
            <ListSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد تعليقات بعد"
          description="ستظهر هنا تعليقات الزوّار على الفتاوى فور كتابتها."
        />
      ) : (
        <div className="space-y-4">
          {items.map((comment) => (
            <Card key={comment._id} className="border-ink-100 shadow-subtle">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500">
                    {comment.name.trim().charAt(0) || "؟"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink-900">{comment.name}</p>
                      {comment.isReply && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-500">
                          <CornerDownLeft className="size-3" />
                          رد
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-400">
                      على «{comment.articleTitle}» ·{" "}
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[0.9375rem] leading-[1.95] whitespace-pre-line text-ink-700">
                  {comment.comment}
                </p>

                {comment.adminReply && (
                  <div className="mt-4 rounded-xl border-e-2 border-gold-400 bg-gold-50/50 p-4">
                    <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
                      رد المأذون
                    </p>
                    <p className="text-[0.9375rem] leading-[1.95] whitespace-pre-line text-ink-700">
                      {comment.adminReply}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setReplying(comment)}>
                    <MessageSquareReply className="size-3.5" />
                    {comment.adminReply ? "تعديل الرد" : "الرد"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ms-auto text-danger hover:text-danger"
                    onClick={() => setDeleting(comment)}
                  >
                    <Trash2 className="size-3.5" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={query.data?.page ?? page}
        totalPages={query.data?.totalPages ?? 1}
        totalCount={query.data?.totalCount}
        isFetching={query.isFetching}
        onPageChange={setPage}
      />

      <ReplyDialog
        // Remount per comment, so the draft is that comment's and never the last one's.
        key={replying?._id ?? "none"}
        comment={replying}
        open={Boolean(replying)}
        onOpenChange={(open) => !open && setReplying(null)}
        loading={reply.isPending}
        onSubmit={(value) => {
          if (!replying) return;
          reply.mutate(
            { id: replying._id, reply: value, articleId: replying.articleId },
            { onSuccess: () => setReplying(null) },
          );
        }}
      />

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف التعليق؟"
        description="سيتم حذف التعليق نهائيًا من الموقع، ولا يمكن التراجع عن هذا الإجراء."
        confirmLabel="نعم، احذف"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(
            { id: deleting._id, articleId: deleting.articleId },
            { onSettled: () => setDeleting(null) },
          );
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ReplyDialog({
  comment,
  open,
  onOpenChange,
  loading,
  onSubmit,
}: {
  comment: AdminCommentDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(comment?.adminReply ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("لا يمكن حفظ رد فارغ.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>الرد على التعليق</DialogTitle>
          <DialogDescription>يظهر ردّك أسفل التعليق مباشرة على صفحة الفتوى.</DialogDescription>
        </DialogHeader>

        {comment && (
          <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
            <p className="text-xs font-medium text-ink-400">{comment.name} كتب</p>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-700">
              {comment.comment}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reply">ردّك</Label>
          <Textarea
            id="reply"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            rows={5}
            placeholder="اكتب ردّك…"
            disabled={loading}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            نشر الرد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
