import { apiClient } from "@/services/apiClient";
import type { CustomerSummary, Gender } from "@/types/customer";
import type { CustomerAddress } from "@/types/address";

type ApiEnvelope<T> = { success: true; data: T };

export interface QuickCreateCustomerPayload {
  full_name: string;
  phone: string;
  gender: Gender;
  village_code: string;
  address: CustomerAddress;
  email?: string;
  aadhaar_number?: string;
}

export const customerService = {
  async findByPhone(phone: string): Promise<CustomerSummary | null> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerSummary | null>>(
      `/customers/by-phone/${phone}`
    );
    return data.data;
  },

  async search(query: string): Promise<CustomerSummary[]> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerSummary[]>>("/customers/search", {
      params: { q: query },
    });
    return data.data;
  },

  async quickCreate(payload: QuickCreateCustomerPayload): Promise<CustomerSummary> {
    const { data } = await apiClient.post<ApiEnvelope<CustomerSummary>>("/customers", payload);
    return data.data;
  },
};
