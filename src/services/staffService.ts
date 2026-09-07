import { apiClient } from "@/services/apiClient";

export interface CreateCashierPayload {
  username: string;
  password: string;
  roles: string[];
  max_price_override_pct?: number;
}

export const staffService = {
  async createCashier(payload: CreateCashierPayload) {
    const { data } = await apiClient.post("/auth/users", payload);
    return data.data;
  },
};
