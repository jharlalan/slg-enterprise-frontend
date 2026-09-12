import type { CustomerAddress } from "@/types/address";

export type Gender = "male" | "female" | "other";

export interface LedgerEntry {
  id: string;
  transaction_type: "DEBIT" | "CREDIT";
  reference_type: string;
  invoice_number: string | null;
  amount: number;
  previous_balance: number;
  running_balance: number;
  payment_mode: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface CustomerDetail {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  verified?: boolean;
  gender?: Gender | null;
  email?: string | null;
  village_code: string;
  address?: CustomerAddress | null;
  address_formatted?: string | null;
  current_debt: number;
  credit_limit: number | null;
}

export interface CustomerStatement {
  customer: CustomerDetail;
  entries: LedgerEntry[];
}

export interface VillageDebtSummary {
  village_code: string;
  village_name: string;
  total_debt: number;
  customer_count: number;
}

export type AgingBucketLabel = "UNDER_15" | "15_TO_30" | "31_TO_60" | "OVER_60";

export interface AgingEntry {
  customer_id: string;
  full_name: string;
  village_code: string;
  current_debt: number;
  days_outstanding: number;
  bucket: AgingBucketLabel;
}
