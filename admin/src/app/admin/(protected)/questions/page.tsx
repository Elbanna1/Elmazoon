"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SearchInput } from "@/shared/ui/search-input";
import { DeleteDialog } from "@/shared/ui/confirmation-dialog";
import { StatusPill } from "@/shared/ui/status-pill";
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/states";
import { AnswerDialog } from "@/features/questions/answer-dialog";
import { useAnswerQuestion, useDeleteQuestion, useQuestions } from "@/hooks/use-questions";
import { QuestionStatus, type QuestionDto } from "@/types/api";
import { cn } from "@/lib/utils";

const LIMIT = 20;

const FILTERS: Array<{ id: QuestionStatus; label: string }> = [
  { id: QuestionStatus.All, label: "الكل" },
  { id: QuestionStatus.Pending, label: "بانتظار الرد" },
  { id: QuestionStatus.Answered, label: "تم الرد" },
];

export default function QuestionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuestionStatus>(QuestionStatus.All);

  // The same params object is the cache key, and the mutations patch that key.
  const params = useMemo(() => ({ page, limit: LIMIT, search, status }), [page, search, status]);

  const query = useQuestions(params);
  const answer = useAnswerQuestion(params);
  const remove = useDeleteQuestion(params);

  const [answering, setAnswering] = useState<QuestionDto | null>(null);
  const [deleting, setDeleting] = useState<QuestionDto | null>(null);

  const items = query.data?.items ?? [];
  const filtering = Boolean(search.trim()) || status !== QuestionStatus.All;

  return (
    <>
      <PageHeader title="الأسئلة" description="الرد على أسئلة الزوّار، وتعديل الردود المنشورة." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            // Staying on page 7 of a search with two results shows an empty table
            // and reads as a failure.
            setPage(1);
          }}
          placeholder="ابحث في الأسئلة…"
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الأسئلة">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatus(filter.id);
                setPage(1);
              }}
              aria-pressed={status === filter.id}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                status === filter.id
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-100 bg-surface text-ink-600 hover:border-ink-200 hover:text-ink-900",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={6} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filtering ? "لا توجد نتائج مطابقة" : "لا توجد أسئلة بعد"}
          description={
            filtering
              ? "جرّب كلمة أخرى أو غيّر التصنيف."
              : "ستظهر هنا الأسئلة فور إرسالها من الموقع."
          }
          action={
            filtering ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus(QuestionStatus.All);
                }}
              >
                إلغاء التصفية
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          className={cn(
            "overflow-x-auto rounded-2xl border border-ink-100 bg-surface shadow-subtle transition-opacity",
            // A background refetch dims the table rather than swapping it for a
            // skeleton, so the rows being read do not vanish underneath.
            query.isFetching && "opacity-60",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-start">الاسم</TableHead>
                <TableHead className="text-start">السؤال</TableHead>
                <TableHead className="text-start whitespace-nowrap">التاريخ</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((question) => {
                const date = new Date(question.createdAt);

                return (
                  <TableRow key={question._id}>
                    <TableCell className="align-top">
                      <span className="text-sm font-medium text-ink-900">{question.name}</span>
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="max-w-md">
                        <p className="line-clamp-2 text-sm leading-relaxed text-ink-700">
                          {question.question}
                        </p>
                        {question.response && (
                          <p className="mt-1.5 line-clamp-1 border-s-2 border-gold-300 ps-2 text-xs text-ink-500">
                            {question.response}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top whitespace-nowrap">
                      <span className="ltr-nums text-sm text-ink-400">
                        {Number.isNaN(date.getTime()) ? "—" : format(date, "yyyy/MM/dd")}
                      </span>
                    </TableCell>

                    <TableCell className="align-top">
                      <StatusPill answered={Boolean(question.response)} />
                    </TableCell>

                    <TableCell className="align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`إجراءات سؤال ${question.name}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAnswering(question)}>
                            <Pencil className="size-4" />
                            {question.response ? "تعديل الرد" : "الرد"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleting(question)}
                            className="text-danger focus:text-danger"
                          >
                            <Trash2 className="size-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={query.data?.page ?? page}
        totalPages={query.data?.totalPages ?? 1}
        totalCount={query.data?.totalCount}
        isFetching={query.isFetching}
        onPageChange={setPage}
      />

      <AnswerDialog
        question={answering}
        open={Boolean(answering)}
        onOpenChange={(open) => !open && setAnswering(null)}
        isSaving={answer.isPending}
        onSubmit={(response) => {
          if (!answering) return;
          answer.mutate({ id: answering._id, response }, { onSuccess: () => setAnswering(null) });
        }}
      />

      <DeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        name={deleting?.question.slice(0, 60) ?? null}
        kind="question"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting._id, { onSettled: () => setDeleting(null) });
        }}
      />
    </>
  );
}
