import { apiClient } from "@/services/apiClient";
import type {
  Product,
  ProductCreatePayload,
  StockAdjustmentPayload,
  StockIntakePayload,
} from "@/types/product";

type ApiEnvelope<T> = { success: true; data: T };

export const productService = {
  async list(params?: { category?: string; search?: string }): Promise<Product[]> {
    const { data } = await apiClient.get<ApiEnvelope<Product[]>>("/products", { params });
    return data.data;
  },

  async getByBarcode(barcode: string): Promise<Product> {
    const { data } = await apiClient.get<ApiEnvelope<Product>>(`/products/barcode/${barcode}`);
    return data.data;
  },

  async lowStock(): Promise<Product[]> {
    const { data } = await apiClient.get<ApiEnvelope<Product[]>>("/products/low-stock");
    return data.data;
  },

  async create(payload: ProductCreatePayload): Promise<Product> {
    const { data } = await apiClient.post<ApiEnvelope<Product>>("/products", payload);
    return data.data;
  },

  async intake(productId: string, payload: StockIntakePayload): Promise<Product> {
    const { data } = await apiClient.post<ApiEnvelope<Product>>(
      `/products/${productId}/intake`,
      payload
    );
    return data.data;
  },

  async adjust(productId: string, payload: StockAdjustmentPayload): Promise<Product> {
    const { data } = await apiClient.post<ApiEnvelope<Product>>(
      `/products/${productId}/adjust`,
      payload
    );
    return data.data;
  },

  async getBarcodeImage(productId: string): Promise<{ barcode: string; image: string }> {
    const { data } = await apiClient.get<ApiEnvelope<{ barcode: string; image: string }>>(
      `/products/${productId}/barcode-image`
    );
    return data.data;
  },
};
