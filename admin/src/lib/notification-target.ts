import type { NotificationDto } from "@/types/api";

/**
 * Where clicking a notification takes you.
 *
 * `type` is a server-defined string with no enum in the spec, so it is matched
 * loosely and in both languages. Anything unrecognised lands on the notifications
 * page itself rather than nowhere — a dead click is worse than a general one.
 */
export function targetFor(notification: NotificationDto): string {
  if (notification.articleId) return "/admin/comments";
  if (/question|سؤال/i.test(notification.type ?? "")) return "/admin/questions";
  if (/comment|تعليق/i.test(notification.type ?? "")) return "/admin/comments";
  return "/admin/notifications";
}
