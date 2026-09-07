import { apiClient } from "@/services/apiClient";
import type { DashboardSummary } from "@/types/dashboard";

type ApiEnvelope<T> = { success: true; data: T };

export const dashboardService = {
  async getSummary(date?: string): Promise<DashboardSummary> {
    const { data } = await apiClient.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary", {
      params: date ? { date } : undefined,
    });
    return data.data;
  },
};
