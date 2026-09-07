import { apiClient } from "@/services/apiClient";
import type { PaymentClaim } from "@/types/portal";

type ApiEnvelope<T> = { success: true; data: T };

export const verificationService = {
  async listPending(): Promise<PaymentClaim[]> {
    const { data } = await apiClient.get<ApiEnvelope<PaymentClaim[]>>("/verification/pending");
    return data.data;
  },

  async review(claimId: string, action: "APPROVE" | "REJECT", rejectionReason?: string): Promise<PaymentClaim> {
    const { data } = await apiClient.post<ApiEnvelope<PaymentClaim>>(`/verification/${claimId}/review`, {
      action,
      rejection_reason: rejectionReason,
    });
    return data.data;
  },
};
