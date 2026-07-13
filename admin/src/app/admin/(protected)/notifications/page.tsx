"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, ErrorState, ListSkeleton } from "@/shared/ui/states";
import { useAdminNotifications, useMarkNotificationsRead } from "@/hooks/use-notifications";
import { targetFor } from "@/lib/notification-target";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "unread", label: "غير المقروءة" },
] as const;

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);

  const query = useAdminNotifications({ unreadOnly, take: 50 });
  const markRead = useMarkNotificationsRead();

  const items = query.data?.data ?? [];
  const unread = query.data?.unreadCount ?? 0;

  return (
    <>
      <PageHeader
        title="الإشعارات"
        description="كل ما يحدث على الموقع: الأسئلة الجديدة والتعليقات."
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              disabled={markRead.isPending}
              onClick={() => markRead.mutate(undefined)}
            >
              {markRead.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              تعليم الكل كمقروء
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="تصفية الإشعارات">
        {FILTERS.map((filter) => {
          const active = (filter.id === "unread") === unreadOnly;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setUnreadOnly(filter.id === "unread")}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                active
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-100 bg-surface text-ink-600 hover:border-ink-200 hover:text-ink-900",
              )}
            >
              {filter.label}
              {filter.id === "unread" && unread > 0 && (
                <span
                  className={cn(
                    "ltr-nums rounded px-1.5 text-xs",
                    active ? "bg-white/15" : "bg-gold-50 text-gold-700",
                  )}
                >
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {query.isLoading ? (
        <Card className="border-ink-100 shadow-subtle">
          <CardContent className="pt-6">
            <ListSkeleton rows={6} />
          </CardContent>
        </Card>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات بعد"}
          description={
            unreadOnly
              ? "اطّلعت على كل شيء."
              : "ستظهر هنا الأسئلة الجديدة والتعليقات فور وصولها."
          }
          icon={Bell}
        />
      ) : (
        <Card className="overflow-hidden border-ink-100 shadow-subtle">
          <CardContent className="p-0">
            <ul className="divide-y divide-ink-100">
              {items.map((notification) => (
                <li key={notification._id}>
                  <Link
                    href={targetFor(notification)}
                    onClick={() => {
                      // Reading it is what marks it read. A separate "mark read"
                      // click for something you have just read is busywork.
                      if (!notification.isRead) markRead.mutate(notification._id);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 transition-colors hover:bg-ink-50",
                      !notification.isRead && "bg-gold-50/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-2 size-1.5 shrink-0 rounded-full",
                        notification.isRead ? "bg-transparent" : "bg-gold-500",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink-800">{notification.message}</p>
                      <p className="mt-1 text-xs text-ink-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="shrink-0 rounded-md bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">
                        جديد
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
