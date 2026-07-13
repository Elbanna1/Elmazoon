"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { analyticsService, type AuditLogParams } from "@/services/analytics.service";

/**
 * The audit trail. Read-only by nature — there is no mutation here and there must
 * not be one: a log an admin can edit is not a log.
 */
export function useAuditLog(params: AuditLogParams) {
  return useQuery({
    queryKey: qk.auditLog.list(params),
    queryFn: () => analyticsService.auditLog(params),
    // Without this the table blanks to a skeleton on every page and filter change.
    placeholderData: keepPreviousData,
  });
}
