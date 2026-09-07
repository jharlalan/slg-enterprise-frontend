import { apiClient } from "@/services/apiClient";
import type { CustomerStatement } from "@/types/khata";
import type { PaymentClaim, PaymentQRResponse } from "@/types/portal";

type ApiEnvelope<T> = { success: true; data: T };

export const portalService = {
  async getMyStatement(): Promise<CustomerStatement> {
    const { data } = await apiClient.get<ApiEnvelope<CustomerStatement>>("/portal/statement");
    return data.data;
  },

  async generatePaymentQR(amount: number): Promise<PaymentQRResponse> {
    const { data } = await apiClient.get<ApiEnvelope<PaymentQRResponse>>("/portal/payment-qr", {
      params: { amount },
    });
    return data.data;
  },

  async submitClaim(claimedAmount: number, upiTransactionRef: string, proofFile: File): Promise<PaymentClaim> {
    const form = new FormData();
    form.append("claimed_amount", String(claimedAmount));
    form.append("upi_transaction_ref", upiTransactionRef);
    form.append("proof", proofFile);
    const { data } = await apiClient.post<ApiEnvelope<PaymentClaim>>("/portal/payment-claims", form);
    return data.data;
  },

  async getMyClaims(): Promise<PaymentClaim[]> {
    const { data } = await apiClient.get<ApiEnvelope<PaymentClaim[]>>("/portal/payment-claims");
    return data.data;
  },
};
