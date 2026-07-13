"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  LogIn,
  LogOut,
  MessageSquareText,
  Pencil,
  ShieldAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";
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
import { EmptyState, ErrorState, TableSkeleton } from "@/shared/ui/states";
import { useAuditLog } from "@/hooks/use-audit-log";
import { AuditAction } from "@/types/api";
import { cn } from "@/lib/utils";

const LIMIT = 20;

/**
 * How each action is presented.
 *
 * Keyed by the server's own action names — the ones its enum binder accepts, not
 * the ones that would read most naturally. Anything the server sends that is not
 * in this table still renders (see `describe`); it simply gets no icon and no
 * colour, which is the right failure for a log: never hide a line you did not
 * expect, because that is precisely the line worth reading.
 */
const ACTIONS: Record<AuditAction, { label: string; icon: LucideIcon; tone: string }> = {
  [AuditAction.Login]: { label: "تسجيل دخول", icon: LogIn, tone: "bg-ink-50 text-ink-600" },
  [AuditAction.LoginFailed]: {
    label: "محاولة دخول فاشلة",
    icon: ShieldAlert,
    tone: "bg-danger/10 text-danger",
  },
  [AuditAction.Logout]: { label: "تسجيل خروج", icon: LogOut, tone: "bg-ink-50 text-ink-600" },
  [AuditAction.PublishArticle]: {
    label: "نشر فتوى",
    icon: FileText,
    tone: "bg-success/10 text-success",
  },
  [AuditAction.EditArticle]: { label: "تعديل فتوى", icon: Pencil, tone: "bg-gold-50 text-gold-700" },
  [AuditAction.DeleteArticle]: {
    label: "حذف فتوى",
    icon: Trash2,
    tone: "bg-danger/10 text-danger",
  },
  [AuditAction.AnswerQuestion]: {
    label: "الرد على سؤال",
    icon: MessageSquareText,
    tone: "bg-success/10 text-success",
  },
  [AuditAction.DeleteQuestion]: {
    label: "حذف سؤال",
    icon: Trash2,
    tone: "bg-danger/10 text-danger",
  },
};

const FILTERS: Array<{ id: AuditAction | "All"; label: string }> = [
  { id: "All", label: "الكل" },
  { id: AuditAction.PublishArticle, label: "نشر فتوى" },
  { id: AuditAction.EditArticle, label: "تعديل فتوى" },
  { id: AuditAction.DeleteArticle, label: "حذف فتوى" },
  { id: AuditAction.AnswerQuestion, label: "الرد على سؤال" },
  { id: AuditAction.DeleteQuestion, label: "حذف سؤال" },
  { id: AuditAction.Login, label: "تسجيل دخول" },
  { id: AuditAction.LoginFailed, label: "محاولة فاشلة" },
];

/** An unrecognised action is shown verbatim rather than swallowed. */
function describe(action: AuditAction) {
  return ACTIONS[action] ?? { label: action, icon: FileText, tone: "bg-ink-50 text-ink-600" };
}

/**
 * The audit log.
 *
 * Read-only, and deliberately so: every other screen in this admin is a place to
 * change something, and this is the one place that records that a change was made.
 */
export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditAction | "All">("All");

  const params = useMemo(() => ({ page, limit: LIMIT, action }), [page, action]);
  const query = useAuditLog(params);

  const items = query.data?.items ?? [];
  const filtering = action !== "All";

  return (
    <>
      <PageHeader
        title="سجل النشاط"
        description="سجل بما تم في لوحة التحكم: الدخول، والنشر، والتعديل، والحذف."
      />

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="تصفية سجل النشاط"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setAction(filter.id);
              // Staying on page 5 of a filter with one result shows an empty table.
              setPage(1);
            }}
            aria-pressed={action === filter.id}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
              action === filter.id
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-100 bg-surface text-ink-600 hover:border-ink-200 hover:text-ink-900",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <TableSkeleton rows={8} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filtering ? "لا توجد نتائج مطابقة" : "لا يوجد نشاط بعد"}
          description={
            filtering
              ? "لم يُسجَّل هذا النوع من النشاط بعد. جرّب تصنيفًا آخر."
              : "سيظهر هنا كل إجراء يتم في لوحة التحكم."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-subtle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإجراء</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead className="hidden md:table-cell">التفاصيل</TableHead>
                <TableHead className="hidden lg:table-cell">عنوان IP</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((entry) => {
                const { label, icon: Icon, tone } = describe(entry.action);

                return (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                          tone,
                        )}
                      >
                        <Icon className="size-3" />
                        {label}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-ink-700">{entry.adminEmail}</TableCell>

                    <TableCell className="hidden max-w-xs truncate text-sm text-ink-500 md:table-cell">
                      {entry.summary ?? "—"}
                    </TableCell>

                    {/* An IP is data, not prose: it must read left-to-right even here. */}
                    <TableCell
                      dir="ltr"
                      className="hidden text-start text-xs text-ink-400 lg:table-cell"
                    >
                      {entry.ipAddress ?? "—"}
                    </TableCell>

                    <TableCell className="ltr-nums whitespace-nowrap text-xs text-ink-400">
                      {format(new Date(entry.occurredAt), "yyyy/MM/dd — HH:mm")}
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
    </>
  );
}
