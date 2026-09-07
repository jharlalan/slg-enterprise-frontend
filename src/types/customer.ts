export interface CustomerSummary {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  village_code: string;
  current_debt: number;
  credit_limit: number | null;
}
