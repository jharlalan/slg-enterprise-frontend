import { apiClient } from "@/services/apiClient";
import type { CustomerSummary } from "@/types/customer";

type ApiEnvelope<T> = { success: true; data: T };

export const customerService = {
  async findByPhone(phone: string): Promise<CustomerSummary | null> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerSummary | null>>(
      `/customers/by-phone/${phone}`
    );
    return data.data;
  },
};
