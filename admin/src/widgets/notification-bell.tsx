"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { targetFor } from "@/lib/notification-target";
import { useAdminNotifications, useMarkNotificationsRead } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data, isLoading } = useAdminNotifications({ take: 8 });
  const markRead = useMarkNotificationsRead();

  const unread = data?.unreadCount ?? 0;
  const items = data?.data ?? [];

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unread > 0 ? `الإشعارات، ${unread} غير مقروء` : "الإشعارات"}
          />
        }
      >
        <Bell className="size-5 text-ink-600" />
        {unread > 0 && (
          <span
            className="ltr-nums absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-semibold text-white"
            // Already in the button's accessible name above; announcing it twice
            // is noise.
            aria-hidden
          >
            {unread > 9 ? "٩+" : unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 border-ink-100 p-0 shadow-card">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-ink-900">الإشعارات</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={markRead.isPending}
              onClick={() => markRead.mutate(undefined)}
            >
              {markRead.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <Separator className="bg-ink-100" />

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-400">لا توجد إشعارات جديدة.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y divide-ink-100">
              {items.map((notification) => (
                <li key={notification._id}>
                  <Link
                    href={targetFor(notification)}
                    onClick={() => {
                      if (!notification.isRead) markRead.mutate(notification._id);
                    }}
                    className={cn(
                      "block px-4 py-3 transition-colors hover:bg-ink-50",
                      !notification.isRead && "bg-gold-50/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.isRead && (
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500"
                          aria-hidden
                        />
                      )}
                      <div className={cn("min-w-0", notification.isRead && "ps-3.5")}>
                        <p className="text-sm leading-snug text-ink-800">{notification.message}</p>
                        <p className="mt-1 text-xs text-ink-400">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <Separator className="bg-ink-100" />

        <div className="p-2">
          <Button
            render={<Link href="/admin/notifications" />}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            عرض كل الإشعارات
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
