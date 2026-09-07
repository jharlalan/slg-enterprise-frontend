/**
 * ProductFormModal — used for both creating a new product and editing
 * an existing one, since the fields are almost identical. Available
 * to both Owner and Cashier (per product decision — cost price is
 * visible/editable by both, no restriction). `unit_of_measure` and
 * `barcode` are only shown/settable at creation — the backend
 * deliberately doesn't allow editing them afterward (see
 * ProductUpdateRequest's docstring), since changing either after
 * stock movements exist would make historical records ambiguous.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import type { Product, ProductCategory, UnitOfMeasure } from "@/types/product";

export type ProductFormValues = {
  name: string;
  category: ProductCategory;
  unit_of_measure: UnitOfMeasure;
  cost_price: string;
  default_selling_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  barcode: string;
};

const CATEGORIES: { value: ProductCategory; hi: string; en: string }[] = [
  { value: "KHAD", hi: "खाद", en: "Fertilizer" },
  { value: "BEEJ", hi: "बीज", en: "Seeds" },
  { value: "ANAJ", hi: "अनाज", en: "Grain" },
  { value: "OTHER", hi: "अन्य", en: "Other" },
];

const UNITS: UnitOfMeasure[] = ["KG", "LITER", "PIECE", "PACKET", "BAG"];

function emptyForm(): ProductFormValues {
  return {
    name: "",
    category: "OTHER",
    unit_of_measure: "PIECE",
    cost_price: "",
    default_selling_price: "",
    stock_quantity: "",
    low_stock_threshold: "0",
    barcode: "",
  };
}

function fromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    unit_of_measure: product.unit_of_measure,
    cost_price: String(product.cost_price),
    default_selling_price: String(product.default_selling_price),
    stock_quantity: String(product.stock_quantity),
    low_stock_threshold: String(product.low_stock_threshold),
    barcode: product.barcode,
  };
}

export type ProductFormModalProps = {
  /** Pass an existing product to edit it; omit to create a new one. */
  editingProduct?: Product | null;
  onSave: (values: ProductFormValues) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string | null;
};

export function ProductFormModal({ editingProduct, onSave, onClose, saving, error }: ProductFormModalProps) {
  const isEditing = Boolean(editingProduct);
  const [values, setValues] = useState<ProductFormValues>(
    editingProduct ? fromProduct(editingProduct) : emptyForm()
  );

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <BilingualLabel
          hi={isEditing ? "उत्पाद संपादित करें" : "नया उत्पाद जोड़ें"}
          en={isEditing ? "Edit Product" : "Add New Product"}
          weight="bold"
          size="heading"
        />

        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.md }}>
          <input
            type="text"
            placeholder="नाम / Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: spacing.sm }}>
            <select value={values.category} onChange={(e) => set("category", e.target.value as ProductCategory)} style={{ ...inputStyle, flex: 1 }}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.hi} / {c.en}
                </option>
              ))}
            </select>

            {/* Unit of measure only settable at creation — fixed afterward */}
            {!isEditing && (
              <select value={values.unit_of_measure} onChange={(e) => set("unit_of_measure", e.target.value as UnitOfMeasure)} style={{ ...inputStyle, flex: 1 }}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: "flex", gap: spacing.sm }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>लागत मूल्य / Cost Price</label>
              <input
                type="number"
                step="0.01"
                value={values.cost_price}
                onChange={(e) => set("cost_price", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>बिक्री मूल्य / Selling Price</label>
              <input
                type="number"
                step="0.01"
                value={values.default_selling_price}
                onChange={(e) => set("default_selling_price", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: spacing.sm }}>
            {/* Opening stock only set at creation — afterward, stock
                changes go through Intake/Adjust, not this form, so the
                append-only stock_movements trail stays complete. */}
            {!isEditing && (
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>शुरुआती स्टॉक / Opening Stock</label>
                <input
                  type="number"
                  value={values.stock_quantity}
                  onChange={(e) => set("stock_quantity", e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>कम स्टॉक सीमा / Low Stock Threshold</label>
              <input
                type="number"
                value={values.low_stock_threshold}
                onChange={(e) => set("low_stock_threshold", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label style={labelStyle}>बारकोड (वैकल्पिक) / Barcode (optional — auto-generated if blank)</label>
              <input
                type="text"
                value={values.barcode}
                onChange={(e) => set("barcode", e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {error && <p style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</p>}

        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.lg }}>
          <button onClick={onClose} style={{ ...actionButtonStyle, background: colors.border }}>
            रद्द करें / Cancel
          </button>
          <button
            onClick={() => onSave(values)}
            disabled={saving}
            style={{ ...actionButtonStyle, background: colors.leafGreen, color: colors.white }}
          >
            {saving ? "..." : isEditing ? "सहेजें / Save" : "जोड़ें / Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(43, 33, 24, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: spacing.lg,
};

const modalStyle: React.CSSProperties = {
  background: colors.white,
  borderRadius: radii.tile,
  padding: spacing.xl,
  width: "100%",
  maxWidth: "420px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: colors.textSecondary,
  display: "block",
  marginBottom: "2px",
};

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: spacing.md,
  borderRadius: radii.button,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
};
