import { api } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type { AuditAction, AuditLogEntry, AuditLogEnvelope, Paged } from "@/types/api";

export interface AuditLogParams {
  page: number;
  limit: number;
  /** Omit for every action. The server filters; it does not merely accept the param. */
  action?: AuditAction | "All";
}

export const analyticsService = {
  /**
   * The admin audit trail: who signed in, what they published, what they deleted.
   *
   * Paged exactly like `/api/dashboard/comments` — `{ data, currentPage, totalPages,
   * totalItems }` in the body, nothing in the headers — and normalised to `Paged<T>`
   * here so the page does not have to know that.
   */
  async auditLog({ page, limit, action }: AuditLogParams): Promise<Paged<AuditLogEntry>> {
    const { data } = await api.get<AuditLogEnvelope>(endpoints.analytics.auditLog, {
      params: {
        page,
        limit,
        // Sending `action=All` would filter for a literal action named "All" and
        // return nothing. "Everything" is expressed by omitting the param.
        ...(action && action !== "All" ? { action } : {}),
      },
    });

    const items = data?.data ?? [];

    return {
      items,
      page: data?.currentPage ?? page,
      totalPages: data?.totalPages ?? 1,
      totalCount: data?.totalItems ?? items.length,
    };
  },
};
