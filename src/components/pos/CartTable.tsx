/**
 * CartTable — the running list of scanned/added items during a sale.
 * Quantity uses large +/- steppers (not a typed number field) per the
 * icon-first, low-literacy-friendly POS direction; tapping the price
 * itself opens the override modal (Owner: unrestricted, Cashier: band-
 * checked server-side regardless of what's allowed client-side).
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import type { CartLine } from "@/types/order";

export type CartTableProps = {
  lines: CartLine[];
  onQuantityChange: (barcode: string, newQuantity: number) => void;
  onRemove: (barcode: string) => void;
  onRequestPriceOverride: (barcode: string) => void;
};

export function CartTable({
  lines,
  onQuantityChange,
  onRemove,
  onRequestPriceOverride,
}: CartTableProps) {
  if (lines.length === 0) {
    return (
      <div style={{ padding: spacing.lg, textAlign: "center", color: colors.textSecondary }}>
        <BilingualLabel hi="टोकरी खाली है" en="Cart is empty — scan an item to begin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      {lines.map((line) => {
        const activePrice = line.overridePrice ?? line.defaultPrice;
        const subtotal = activePrice * line.quantity;
        return (
          <div
            key={line.barcode}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.md,
              background: colors.white,
              borderRadius: radii.button,
              padding: spacing.md,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: typography.weight.medium, fontSize: typography.scale.body }}>
                {line.name}
              </div>
              <button
                onClick={() => onRequestPriceOverride(line.barcode)}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  color: line.overridePrice ? colors.warning : colors.textSecondary,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ₹{activePrice.toFixed(2)} / {line.unit}
                {line.overridePrice ? " (बदला हुआ / overridden)" : ""}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <button
                onClick={() => onQuantityChange(line.barcode, Math.max(0, line.quantity - 1))}
                style={stepperButtonStyle}
                aria-label="decrease quantity"
              >
                −
              </button>
              <span style={{ minWidth: "32px", textAlign: "center", fontWeight: 700 }}>
                {line.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(line.barcode, line.quantity + 1)}
                disabled={line.quantity >= line.availableStock}
                style={{
                  ...stepperButtonStyle,
                  opacity: line.quantity >= line.availableStock ? 0.4 : 1,
                }}
                aria-label="increase quantity"
              >
                +
              </button>
            </div>

            <div style={{ minWidth: "80px", textAlign: "right", fontWeight: 700 }}>
              ₹{subtotal.toFixed(2)}
            </div>

            <button
              onClick={() => onRemove(line.barcode)}
              style={{ border: "none", background: "none", color: colors.danger, fontSize: "1.3rem", cursor: "pointer" }}
              aria-label="remove item"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

const stepperButtonStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: radii.pill,
  border: `1px solid ${colors.border}`,
  background: colors.huskCream,
  fontSize: "1.3rem",
  fontWeight: 700,
  cursor: "pointer",
  color: colors.textPrimary,
};
