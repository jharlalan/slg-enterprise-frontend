/**
 * PriceOverrideModal — deliberately simple (one number input). The
 * actual permission check (Owner unrestricted, Cashier band-limited)
 * happens server-side in BillingService; this modal doesn't need to
 * know the rules, it just submits whatever price is entered and lets
 * the backend accept or reject it.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";

export type PriceOverrideModalProps = {
  productName: string;
  defaultPrice: number;
  currentOverride?: number;
  onConfirm: (newPrice: number) => void;
  onCancel: () => void;
};

export function PriceOverrideModal({
  productName,
  defaultPrice,
  currentOverride,
  onConfirm,
  onCancel,
}: PriceOverrideModalProps) {
  const [value, setValue] = useState(String(currentOverride ?? defaultPrice));

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <BilingualLabel hi="कीमत बदलें" en={`Override price — ${productName}`} weight="bold" size="heading" />
        <p style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
          कैटलॉग कीमत / Catalog price: ₹{defaultPrice.toFixed(2)}
        </p>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: "100%",
            padding: spacing.md,
            fontSize: "1.3rem",
            borderRadius: radii.button,
            border: `1px solid ${colors.border}`,
            marginTop: spacing.md,
          }}
          autoFocus
        />
        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.lg }}>
          <button onClick={onCancel} style={{ ...actionButtonStyle, background: colors.border }}>
            रद्द करें / Cancel
          </button>
          <button
            onClick={() => onConfirm(parseFloat(value))}
            style={{ ...actionButtonStyle, background: colors.leafGreen, color: colors.white }}
          >
            पुष्टि करें / Confirm
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
};

const modalStyle: React.CSSProperties = {
  background: colors.white,
  borderRadius: radii.tile,
  padding: spacing.xl,
  width: "320px",
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
