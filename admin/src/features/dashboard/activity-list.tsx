"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Activity,
  CornerDownLeft,
  FileText,
  MessageSquareText,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, ErrorState, ListSkeleton } from "@/shared/ui/states";
import type { ActivityDto } from "@/types/api";

/**
 * "آخر النشاط" from `GET /api/dashboard/overview`.
 *
 * `type` is a server-defined string with no enum in the spec. The values observed
 * live are `NewQuestion`, `NewComment`, `NewReply` — but the match stays loose,
 * and anything unrecognised still renders with a neutral icon and the server's own
 * message. Dropping an entry we could not classify would quietly hide real events
 * from the Ma'zoun, which is the one thing an activity feed must never do.
 *
 * Order matters: `NewReply` must be tested before the generic comment rule, or a
 * reply would be captioned as a plain comment.
 */
const KINDS: Array<{ match: RegExp; icon: LucideIcon; tone: string }> = [
  { match: /reply|رد/i, icon: CornerDownLeft, tone: "bg-gold-50 text-gold-600" },
  { match: /question|سؤال/i, icon: MessageSquareText, tone: "bg-gold-50 text-gold-600" },
  { match: /comment|تعليق/i, icon: MessagesSquare, tone: "bg-ink-50 text-ink-500" },
  { match: /article|fatwa|فتوى/i, icon: FileText, tone: "bg-success/10 text-success" },
];

function kindFor(type: string) {
  return (
    KINDS.find((kind) => kind.match.test(type)) ?? {
      icon: Activity,
      tone: "bg-ink-50 text-ink-400",
    }
  );
}

function hrefFor(item: ActivityDto): string | null {
  if (item.articleId) return `/admin/articles/${item.articleId}/edit`;
  if (/question|سؤال/i.test(item.type)) return "/admin/questions";
  if (/comment|تعليق/i.test(item.type)) return "/admin/comments";
  return null;
}

export function ActivityList({
  items,
  isLoading,
  error,
  onRetry,
}: {
  items: ActivityDto[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onRetry: () => void;
}) {
  if (isLoading) return <ListSkeleton rows={4} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} className="py-8" />;
  if (!items?.length) {
    return (
      <EmptyState
        title="لا يوجد نشاط بعد"
        description="ستظهر هنا الأسئلة والتعليقات والفتاوى الجديدة."
        className="py-8"
      />
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => {
        const kind = kindFor(item.type);
        const Icon = kind.icon;
        const href = hrefFor(item);
        const at = new Date(item.at);

        const body = (
          <>
            <p className="text-sm leading-snug text-ink-800">{item.message}</p>
            <p className="mt-1 text-xs text-ink-400">
              {Number.isNaN(at.getTime())
                ? "—"
                : formatDistanceToNow(at, { addSuffix: true, locale: ar })}
            </p>
          </>
        );

        return (
          <li key={`${item.type}-${item.id}-${index}`} className="flex gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}
            >
              <Icon className="size-[1.125rem]" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              {href ? (
                <Link href={href} className="block transition-opacity hover:opacity-70">
                  {body}
                </Link>
              ) : (
                body
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
