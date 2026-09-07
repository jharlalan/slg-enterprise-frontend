/**
 * CartTable — a real tabular layout: Sl No, Product Name, Quantity,
 * Unit, Unit Price, Price (= unit price × quantity), per explicit
 * product decision. Add/Subtract buttons are deliberately large, bold,
 * and color-coded (green = add, red = subtract) rather than small
 * plain steppers, so they're unambiguous at a glance on a shop-floor
 * tablet. Tapping the unit price still opens the override modal
 * (Owner: unrestricted, Cashier: band-checked server-side).
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
      <div style={{ padding: spacing.lg, textAlign: "center", color: colors.textSecondary, background: colors.white, borderRadius: radii.tile }}>
        <BilingualLabel hi="टोकरी खाली है" en="Cart is empty — scan, search, or enter a barcode to begin" />
      </div>
    );
  }

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, overflowX: "auto", border: `1px solid ${colors.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
            <Th align="center" width="48px">क्र.सं. / Sl No</Th>
            <Th align="left">उत्पाद / Product Name</Th>
            <Th align="center" width="160px">मात्रा / Quantity</Th>
            <Th align="center" width="70px">इकाई / Unit</Th>
            <Th align="right" width="110px">इकाई मूल्य / Unit Price</Th>
            <Th align="right" width="110px">मूल्य / Price</Th>
            <Th align="center" width="40px" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => {
            const unitPrice = line.overridePrice ?? line.defaultPrice;
            const price = unitPrice * line.quantity;
            return (
              <tr key={line.barcode} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <Td align="center">{index + 1}</Td>
                <Td align="left">
                  <div style={{ fontWeight: typography.weight.medium }}>{line.name}</div>
                </Td>
                <Td align="center">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
                    <button
                      onClick={() => onQuantityChange(line.barcode, Math.max(0, line.quantity - 1))}
                      style={{ ...stepperButtonStyle, background: colors.danger }}
                      aria-label="subtract"
                    >
                      −
                    </button>
                    <span style={{ minWidth: "28px", textAlign: "center", fontWeight: 700, fontSize: "1.05rem" }}>
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => onQuantityChange(line.barcode, line.quantity + 1)}
                      disabled={line.quantity >= line.availableStock}
                      style={{
                        ...stepperButtonStyle,
                        background: colors.leafGreen,
                        opacity: line.quantity >= line.availableStock ? 0.4 : 1,
                      }}
                      aria-label="add"
                    >
                      +
                    </button>
                  </div>
                </Td>
                <Td align="center">{line.unit}</Td>
                <Td align="right">
                  <button
                    onClick={() => onRequestPriceOverride(line.barcode)}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      color: line.overridePrice ? colors.warning : colors.textPrimary,
                      fontSize: "0.95rem",
                      fontWeight: line.overridePrice ? 700 : 400,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ₹{unitPrice.toFixed(2)}
                  </button>
                </Td>
                <Td align="right">
                  <strong>₹{price.toFixed(2)}</strong>
                </Td>
                <Td align="center">
                  <button
                    onClick={() => onRemove(line.barcode)}
                    style={{ border: "none", background: "none", color: colors.danger, fontSize: "1.2rem", cursor: "pointer" }}
                    aria-label="remove item"
                  >
                    ✕
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align, width }: { children?: React.ReactNode; align: "left" | "center" | "right"; width?: string }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: spacing.sm,
        fontSize: "0.8rem",
        color: colors.textSecondary,
        width,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align: "left" | "center" | "right" }) {
  return (
    <td style={{ textAlign: align, padding: spacing.sm }}>
      {children}
    </td>
  );
}

const stepperButtonStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: radii.pill,
  border: "none",
  color: colors.white,
  fontSize: "1.5rem",
  fontWeight: 700,
  cursor: "pointer",
  lineHeight: 1,
};
