import { apiClient } from "@/services/apiClient";
import type { Order, OrderCreatePayload } from "@/types/order";

type ApiEnvelope<T> = { success: true; data: T };

export const orderService = {
  async create(payload: OrderCreatePayload): Promise<Order> {
    const { data } = await apiClient.post<ApiEnvelope<Order>>("/orders", payload);
    return data.data;
  },
  async get(orderId: string): Promise<Order> {
    const { data } = await apiClient.get<ApiEnvelope<Order>>(`/orders/${orderId}`);
    return data.data;
  },
  async list(paymentStatus?: string): Promise<Order[]> {
    const { data } = await apiClient.get<ApiEnvelope<Order[]>>("/orders", {
      params: paymentStatus ? { payment_status: paymentStatus } : undefined,
    });
    return data.data;
  },
};
