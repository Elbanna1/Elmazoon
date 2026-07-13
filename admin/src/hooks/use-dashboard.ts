"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard.service";

/**
 * `overview` is the only dashboard summary this admin needs — it carries the
 * question, article, comment and visitor totals plus the activity feed in one
 * request. `stats` and `analytics` still exist on the backend but are no longer
 * called: they duplicate figures `overview` already returns, and the enterprise
 * analytics screen they fed has been removed.
 */
export function useDashboardOverview(recentCount = 5) {
  return useQuery({
    queryKey: qk.dashboard.overview(recentCount),
    queryFn: () => dashboardService.overview(recentCount),
  });
}

export function useDashboardCharts(days = 30, months = 12) {
  return useQuery({
    queryKey: qk.dashboard.charts(days, months),
    queryFn: () => dashboardService.charts(days, months),
  });
}
