import { apiClient } from "@/services/apiClient";

export interface ShopProfile {
  name_line1: string;
  name_line2: string;
  address: string;
  phone_numbers: string;
}

type ApiEnvelope<T> = { success: true; data: T };

export const shopProfileService = {
  async get(): Promise<ShopProfile> {
    const { data } = await apiClient.get<ApiEnvelope<ShopProfile>>("/shop/profile");
    return data.data;
  },
};
