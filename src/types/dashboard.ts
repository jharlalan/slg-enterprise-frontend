export interface InventoryValuation {
  total_cost_value: number;
  total_selling_value: number;
  total_units: number;
  product_count: number;
  low_stock_count: number;
  potential_margin: number;
}

export interface ReceivablesSummary {
  total_outstanding: number;
  customer_count: number;
}

export interface PaymentModeBreakdown {
  order_count: number;
  amount_collected: number;
  debt_added: number;
  gross_sales: number;
}

export interface DailyReconciliation {
  date: string;
  by_payment_mode: Record<string, PaymentModeBreakdown>;
  totals: {
    total_orders: number;
    total_cash_and_upi_collected: number;
    total_debt_added: number;
    total_gross_sales: number;
  };
}

export interface CashierShiftEntry {
  user_id: string | null;
  username: string;
  order_count: number;
  amount_collected: number;
  gross_sales: number;
}

export interface NotificationHealthEntry {
  channel: string;
  status: string;
  count: number;
}

export interface VillageDebtSummary {
  village_code: string;
  village_name: string;
  total_debt: number;
  customer_count: number;
}

export interface AgingEntry {
  customer_id: string;
  full_name: string;
  village_code: string;
  current_debt: number;
  days_outstanding: number;
  bucket: string;
}

export interface DashboardSummary {
  inventory_valuation: InventoryValuation;
  receivables: ReceivablesSummary;
  daily_reconciliation: DailyReconciliation;
  cashier_shift_summary: CashierShiftEntry[];
  notification_health: NotificationHealthEntry[];
  pending_verification_count: number;
  village_debt_summary: VillageDebtSummary[];
  aging_buckets: AgingEntry[];
}
