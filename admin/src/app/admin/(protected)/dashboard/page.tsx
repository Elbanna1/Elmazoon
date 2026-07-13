"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquareText,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { WeeklyChart } from "@/shared/ui/weekly-chart";
import { EmptyState, ErrorState, ListSkeleton, StatCardSkeleton } from "@/shared/ui/states";
import { StatusPill } from "@/shared/ui/status-pill";
import { ActivityList } from "@/features/dashboard/activity-list";
import { useDashboardCharts, useDashboardOverview } from "@/hooks/use-dashboard";
import { useAllComments } from "@/hooks/use-comments";
import { useQuestions } from "@/hooks/use-questions";
import { QuestionStatus } from "@/types/api";

/** "منذ ٣ أيام" rather than a raw timestamp. */
export function relative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: ar });
}

export default function DashboardPage() {
  const overview = useDashboardOverview(5);
  const charts = useDashboardCharts(30, 12);
  const comments = useAllComments({ page: 1, limit: 5 });

  const recentQuestions = useQuestions({
    page: 1,
    limit: 5,
    search: "",
    status: QuestionStatus.All,
  });

  const o = overview.data;

  return (
    <>
      <PageHeader
        title="لوحة تحكم الدكتور محمد البحراوي"
        description="إدارة الموقع والرد على الأسئلة والفتاوى والتعليقات."
      />

      {/* Cards ------------------------------------------------------------ */}
      {overview.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : overview.isError ? (
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="إجمالي الأسئلة"
            value={o?.questions.total ?? 0}
            icon={MessageSquareText}
          />
          <StatCard
            label="أسئلة بانتظار الرد"
            value={o?.questions.pending ?? 0}
            icon={Clock}
            tone={(o?.questions.pending ?? 0) > 0 ? "warning" : "success"}
          />
          <StatCard
            label="تم الرد عليها"
            value={o?.questions.answered ?? 0}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard label="عدد الفتاوى" value={o?.articles.total ?? 0} icon={FileText} tone="gold" />
          <StatCard
            label="عدد التعليقات"
            value={o?.comments.total ?? 0}
            icon={MessagesSquare}
            tone="gold"
          />
        </div>
      )}

      {/* One small chart, and only when there is something in it. */}
      <div className="mt-6">
        <WeeklyChart
          title="الأسئلة خلال الأسبوع"
          data={charts.data?.questionsPerDay}
          isLoading={charts.isLoading}
        />
      </div>

      {/* Recent ----------------------------------------------------------- */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-ink-100 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">آخر الأسئلة</CardTitle>
            <Button render={<Link href="/admin/questions" />} variant="ghost" size="sm">
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuestions.isLoading ? (
              <ListSkeleton rows={3} />
            ) : recentQuestions.isError ? (
              <ErrorState
                error={recentQuestions.error}
                onRetry={() => void recentQuestions.refetch()}
                className="py-8"
              />
            ) : !recentQuestions.data?.items.length ? (
              <EmptyState
                title="لا توجد أسئلة بعد"
                description="ستظهر هنا الأسئلة فور إرسالها."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {recentQuestions.data.items.map((question) => (
                  <li key={question._id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500">
                      {question.name.trim().charAt(0) || "؟"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-900">{question.name}</p>
                        <StatusPill answered={Boolean(question.response)} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
                        {question.question}
                      </p>
                      <p className="mt-1 text-xs text-ink-400">{relative(question.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-ink-100 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">آخر التعليقات</CardTitle>
            <Button render={<Link href="/admin/comments" />} variant="ghost" size="sm">
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {comments.isLoading ? (
              <ListSkeleton rows={3} />
            ) : comments.isError ? (
              <ErrorState
                error={comments.error}
                onRetry={() => void comments.refetch()}
                className="py-8"
              />
            ) : !comments.data?.items.length ? (
              <EmptyState
                title="لا توجد تعليقات بعد"
                description="ستظهر هنا التعليقات على الفتاوى."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {comments.data.items.map((comment) => (
                  <li key={comment._id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-500">
                      {comment.name.trim().charAt(0) || "؟"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{comment.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
                        {comment.comment}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-400">
                        على «{comment.articleTitle}» · {relative(comment.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity --------------------------------------------------------- */}
      <Card className="mt-6 border-ink-100 shadow-subtle">
        <CardHeader>
          <CardTitle className="text-base">آخر النشاط</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList
            items={o?.recentActivity}
            isLoading={overview.isLoading}
            error={overview.isError ? overview.error : undefined}
            onRetry={() => void overview.refetch()}
          />
        </CardContent>
      </Card>
    </>
  );
}
