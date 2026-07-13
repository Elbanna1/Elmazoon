import { api } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type { NotificationListDto } from "@/types/api";

/**
 * Notifications.
 *
 * Two audiences, two endpoints, one shape. `/api/notifications` is the admin's
 * feed (401 without a session); `/api/notifications/my` is the visitor's, scoped
 * server-side to the HttpOnly `visitor_id` cookie.
 *
 * Marking as read takes the id on the query string, not in a body — and omitting
 * the id marks everything, which is what "mark all read" is.
 */
export const notificationsService = {
  async listForAdmin(options: { unreadOnly?: boolean; take?: number } = {}): Promise<NotificationListDto> {
    const { data } = await api.get<NotificationListDto>(endpoints.notifications.admin, {
      params: {
        ...(options.unreadOnly ? { unreadOnly: true } : {}),
        ...(options.take ? { take: options.take } : {}),
      },
    });
    return data;
  },

  /** No id → mark every unread notification as read. */
  async markAdminRead(id?: string): Promise<void> {
    await api.post(endpoints.notifications.adminRead, null, {
      params: id ? { id } : undefined,
    });
  },

  async listForVisitor(take?: number): Promise<NotificationListDto> {
    const { data } = await api.get<NotificationListDto>(endpoints.notifications.mine, {
      params: take ? { take } : undefined,
    });
    return data;
  },

  async markVisitorRead(id?: string): Promise<void> {
    await api.post(endpoints.notifications.mineRead, null, {
      params: id ? { id } : undefined,
    });
  },
};
