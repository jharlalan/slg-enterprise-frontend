export type UnitOfMeasure = "KG" | "LITER" | "PIECE" | "PACKET" | "BAG";
export type ProductCategory = "KHAD" | "BEEJ" | "ANAJ" | "OTHER";

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit_of_measure: UnitOfMeasure;
  cost_price: number;
  default_selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreatePayload {
  name: string;
  category: ProductCategory;
  unit_of_measure: UnitOfMeasure;
  cost_price: number;
  default_selling_price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  barcode?: string;
}

export interface ProductUpdatePayload {
  name?: string;
  category?: ProductCategory;
  cost_price?: number;
  default_selling_price?: number;
  low_stock_threshold?: number;
}

export interface StockIntakePayload {
  quantity: number;
  notes?: string;
}

export interface StockAdjustmentPayload {
  quantity_change: number;
  movement_type: "DAMAGE_WRITE_OFF" | "MANUAL_ADJUSTMENT";
  notes: string;
}
