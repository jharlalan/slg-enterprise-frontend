/**
 * PaymentPanel — implements the payment split matrix from the spec:
 * CASH/UPI (full settlement), SPLIT (partial + rest to khata), CREDIT
 * (zero down payment, full khata).
 *
 * Customer identification no longer happens here — it's resolved
 * upfront by CustomerSelectionStep before any items can even be
 * added (see pos/page.tsx). This panel only needs to know whether
 * that resolved customer is anonymous, so CREDIT/SPLIT can be
 * disabled up front rather than letting a submission fail server-side
 * (the backend still enforces this too — see OrderCreateRequest's
 * validator — this is purely a "don't let the cashier hit a wall
 * they could have avoided" frontend improvement).
 *
 * Also shows the discount input (toggle between % and a flat ₹ amount)
 * and the gross → discount → grand total breakdown — discount is
 * applied before any payment-mode validation, so amountPaid/SPLIT math
 * always operates on the post-discount grand total, matching the
 * backend's own calculation (which similarly treats % and ₹ as two
 * alternative inputs, not additive — see billing_service.py).
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import type { PaymentMode } from "@/types/order";

export type PaymentPanelProps = {
  grossTotal: number;
  discountMode: "percent" | "amount";
  discountValue: number;
  onDiscountModeChange: (mode: "percent" | "amount") => void;
  onDiscountValueChange: (value: number) => void;
  netTotal: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  customerIsAnonymous: boolean;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onAmountPaidChange: (amount: number) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const MODES: { mode: PaymentMode; hi: string; en: string; needsCustomer: boolean }[] = [
  { mode: "CASH", hi: "नकद", en: "Cash", needsCustomer: false },
  { mode: "UPI", hi: "यूपीआई", en: "UPI", needsCustomer: false },
  { mode: "SPLIT", hi: "आंशिक", en: "Partial", needsCustomer: true },
  { mode: "CREDIT", hi: "पूरा उधार", en: "Full Credit", needsCustomer: true },
];

export function PaymentPanel(props: PaymentPanelProps) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: radii.tile,
        padding: spacing.lg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <BilingualLabel hi="कुल राशि" en="Total" weight="bold" size="heading" />

      <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: colors.textSecondary }}>
          <span>उप-योग / Subtotal</span>
          <span>₹{props.grossTotal.toFixed(2)}</span>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: colors.textSecondary }}>छूट / Discount</span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => props.onDiscountModeChange("percent")}
                style={discountModeButtonStyle(props.discountMode === "percent")}
              >
                %
              </button>
              <button
                onClick={() => props.onDiscountModeChange("amount")}
                style={discountModeButtonStyle(props.discountMode === "amount")}
              >
                ₹
              </button>
            </div>
          </div>
          <input
            type="number"
            min={0}
            max={props.discountMode === "percent" ? 100 : undefined}
            step={props.discountMode === "percent" ? "0.1" : "1"}
            value={props.discountValue || ""}
            onChange={(e) => {
              const raw = parseFloat(e.target.value) || 0;
              const clamped = props.discountMode === "percent" ? Math.min(100, Math.max(0, raw)) : Math.max(0, raw);
              props.onDiscountValueChange(clamped);
            }}
            placeholder={props.discountMode === "percent" ? "0" : "0.00"}
            style={{
              width: "100%",
              marginTop: "4px",
              padding: spacing.sm,
              borderRadius: radii.button,
              border: `1px solid ${colors.border}`,
              textAlign: "right",
              boxSizing: "border-box",
            }}
          />
        </div>

        {props.discountValue > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: colors.danger }}>
            <span>छूट राशि / Discount Amount</span>
            <span>−₹{(props.grossTotal - props.netTotal).toFixed(2)}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: "4px", marginTop: "4px" }}>
          <BilingualLabel hi="कुल देय" en="Grand Total" weight="bold" size="body" />
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: colors.harvestGold }}>
            ₹{props.netTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.md }}>
        {MODES.map(({ mode, hi, en, needsCustomer }) => {
          const disabled = needsCustomer && props.customerIsAnonymous;
          return (
            <button
              key={mode}
              onClick={() => !disabled && props.onPaymentModeChange(mode)}
              disabled={disabled}
              title={disabled ? "उधार के लिए ग्राहक चुनें / Select a customer for credit" : undefined}
              style={{
                flex: "1 1 auto",
                minWidth: "80px",
                padding: spacing.md,
                borderRadius: radii.button,
                border: `2px solid ${props.paymentMode === mode ? colors.leafGreen : colors.border}`,
                background: props.paymentMode === mode ? `${colors.leafGreen}18` : colors.white,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {hi} / {en}
            </button>
          );
        })}
      </div>

      {(props.paymentMode === "SPLIT" || props.paymentMode === "CREDIT") && props.customerIsAnonymous && (
        <p style={{ color: colors.danger, fontSize: "0.85rem", marginTop: spacing.sm }}>
          उधार के लिए ग्राहक चुनें — ऊपर "बदलें" पर क्लिक करें / Select a customer for credit — click
          &quot;Change&quot; above
        </p>
      )}

      {props.paymentMode === "SPLIT" && (
        <div style={{ marginTop: spacing.md }}>
          <BilingualLabel hi="अभी जमा राशि" en="Amount paid now" size="body" />
          <input
            type="number"
            step="0.01"
            value={props.amountPaid}
            onChange={(e) => props.onAmountPaidChange(parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />
          <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
            बाकी / Remaining to khata: ₹{Math.max(0, props.netTotal - props.amountPaid).toFixed(2)}
          </p>
        </div>
      )}

      <button
        onClick={props.onSubmit}
        disabled={props.submitting}
        style={{
          marginTop: spacing.lg,
          width: "100%",
          padding: spacing.md,
          borderRadius: radii.button,
          border: "none",
          background: colors.leafGreen,
          color: colors.white,
          fontWeight: 700,
          fontSize: "1.2rem",
          minHeight: spacing.tapTargetMin,
          cursor: "pointer",
          opacity: props.submitting ? 0.6 : 1,
        }}
      >
        {props.submitting ? "..." : "बिल बनाएं / Complete Sale"}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: spacing.md,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "1rem",
  marginTop: "4px",
};

function discountModeButtonStyle(active: boolean): React.CSSProperties {
  return {
    width: "32px",
    height: "28px",
    borderRadius: radii.button,
    border: `1px solid ${active ? colors.leafGreen : colors.border}`,
    background: active ? colors.leafGreen : colors.white,
    color: active ? colors.white : colors.textPrimary,
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: 0,
  };
}
