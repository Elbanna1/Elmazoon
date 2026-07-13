import { api } from "@/lib/api";
import { endpoints } from "@/services/endpoints";
import type { ChartsDto, DashboardOverviewDto } from "@/types/api";

export const dashboardService = {
  /**
   * Totals for questions, articles, comments and visitors, plus the recent
   * activity feed — everything the dashboard shows, in one request.
   */
  async overview(recentCount = 5): Promise<DashboardOverviewDto> {
    const { data } = await api.get<DashboardOverviewDto>(endpoints.dashboard.overview, {
      params: { recentCount },
    });
    return data;
  },

  async charts(days = 30, months = 12): Promise<ChartsDto> {
    const { data } = await api.get<ChartsDto>(endpoints.dashboard.charts, {
      params: { days, months },
    });
    return data;
  },
};
