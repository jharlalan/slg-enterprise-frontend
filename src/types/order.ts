export type PaymentMode = "CASH" | "UPI" | "SPLIT" | "CREDIT";
export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export interface OrderItemRequest {
  barcode: string;
  quantity: number;
  unit_price_override?: number;
}

export interface OrderCreatePayload {
  customer_phone?: string;
  customer_full_name?: string;
  village_code?: string;
  items: OrderItemRequest[];
  amount_paid: number;
  payment_mode: PaymentMode;
  discount_percent?: number;
  discount_amount?: number;
}

export interface OrderItemOut {
  product_id: string;
  barcode: string;
  name: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  default_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_code: string | null;
  items: OrderItemOut[];
  gross_total: number;
  discount_percent: number;
  discount_amount: number;
  net_total: number;
  amount_paid: number;
  debt_added: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  over_advisory_limit: boolean;
  upi_qr_payload: string | null;
  upi_qr_image?: string | null;
  billed_by: string;
  created_at: string;
}

/** A cart line as tracked client-side before submission — carries the
 * product's known details for display, not just the barcode. */
export interface CartLine {
  barcode: string;
  productId: string;
  name: string;
  unit: string;
  defaultPrice: number;
  overridePrice?: number;
  quantity: number;
  availableStock: number;
}
