export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentClaim {
  id: string;
  customer_id: string;
  customer_code: string;
  claimed_amount: number;
  upi_transaction_ref: string;
  payment_proof_url: string;
  claimed_at: string;
  status: ClaimStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface PaymentQRResponse {
  payload: string;
  image: string;
  amount: number;
}
