import type { CustomerAddress } from "@/types/address";

export type Gender = "male" | "female" | "other";

export interface CustomerSummary {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  verified?: boolean;
  gender?: Gender | null;
  village_code: string;
  address?: CustomerAddress | null;
  address_formatted?: string | null;
  current_debt: number;
  credit_limit: number | null;
}
