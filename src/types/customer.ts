export interface CustomerSummary {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  village_code: string;
  address?: string | null;
  current_debt: number;
  credit_limit: number | null;
}
