import { apiClient } from "@/services/apiClient";
import type {
  AgingEntry,
  CustomerDetail,
  CustomerStatement,
  VillageDebtSummary,
} from "@/types/khata";

type ApiEnvelope<T> = { success: true; data: T };

export const khataService = {
  async listCustomers(search?: string): Promise<CustomerDetail[]> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerDetail[]>>("/khata/customers", {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  async getStatement(customerId: string): Promise<CustomerStatement> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerStatement>>(
      `/khata/customers/${customerId}/statement`
    );
    return data.data;
  },

  async recordPayment(
    customerId: string,
    amount: number,
    paymentMode: "CASH" | "UPI",
    notes?: string
  ) {
    const { data } = await apiClient.post(`/khata/customers/${customerId}/payments`, {
      amount,
      payment_mode: paymentMode,
      notes,
    });
    return data.data;
  },

  async updateCreditLimit(customerId: string, creditLimit: number | null) {
    const { data } = await apiClient.patch(`/khata/customers/${customerId}/credit-limit`, {
      credit_limit: creditLimit,
    });
    return data.data;
  },

  async villageSummary(): Promise<VillageDebtSummary[]> {
    const { data } = await apiClient.get<ApiEnvelope<VillageDebtSummary[]>>("/khata/village-summary");
    return data.data;
  },

  async agingBuckets(): Promise<AgingEntry[]> {
    const { data } = await apiClient.get<ApiEnvelope<AgingEntry[]>>("/khata/aging");
    return data.data;
  },

  async sendReminder(customerId: string): Promise<boolean> {
    const { data } = await apiClient.post<ApiEnvelope<{ sent: boolean }>>(
      `/khata/customers/${customerId}/send-reminder`
    );
    return data.data.sent;
  },
};
