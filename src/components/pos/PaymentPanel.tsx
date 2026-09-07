/**
 * PaymentPanel — implements the payment split matrix from the spec:
 * CASH/UPI (full settlement), SPLIT (partial + rest to khata), CREDIT
 * (zero down payment, full khata). Customer phone/name/village only
 * become required inputs once SPLIT or CREDIT is selected, mirroring
 * the backend's own validation (an anonymous walk-in can't go on credit).
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import type { PaymentMode } from "@/types/order";

export type PaymentPanelProps = {
  netTotal: number;
  paymentMode: PaymentMode;
  amountPaid: number;
  customerPhone: string;
  customerFullName: string;
  villageCode: string;
  isNewCustomer: boolean;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onAmountPaidChange: (amount: number) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCustomerFullNameChange: (name: string) => void;
  onVillageCodeChange: (code: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const MODES: { mode: PaymentMode; hi: string; en: string }[] = [
  { mode: "CASH", hi: "नकद", en: "Cash" },
  { mode: "UPI", hi: "यूपीआई", en: "UPI" },
  { mode: "SPLIT", hi: "आंशिक", en: "Partial" },
  { mode: "CREDIT", hi: "पूरा उधार", en: "Full Credit" },
];

export function PaymentPanel(props: PaymentPanelProps) {
  const needsCustomer = props.paymentMode === "SPLIT" || props.paymentMode === "CREDIT";

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
      <div style={{ fontSize: "2rem", fontWeight: 700, color: colors.harvestGold, margin: `${spacing.sm} 0` }}>
        ₹{props.netTotal.toFixed(2)}
      </div>

      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.md }}>
        {MODES.map(({ mode, hi, en }) => (
          <button
            key={mode}
            onClick={() => props.onPaymentModeChange(mode)}
            style={{
              flex: "1 1 auto",
              minWidth: "80px",
              padding: spacing.md,
              borderRadius: radii.button,
              border: `2px solid ${props.paymentMode === mode ? colors.leafGreen : colors.border}`,
              background: props.paymentMode === mode ? `${colors.leafGreen}18` : colors.white,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {hi} / {en}
          </button>
        ))}
      </div>

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

      {needsCustomer && (
        <div style={{ marginTop: spacing.md, display: "flex", flexDirection: "column", gap: spacing.sm }}>
          <BilingualLabel hi="ग्राहक जानकारी" en="Customer details (required for khata)" weight="bold" />
          <input
            type="tel"
            placeholder="फ़ोन नंबर / Phone number"
            value={props.customerPhone}
            onChange={(e) => props.onCustomerPhoneChange(e.target.value)}
            style={inputStyle}
          />
          {props.isNewCustomer && (
            <>
              <input
                type="text"
                placeholder="पूरा नाम / Full name"
                value={props.customerFullName}
                onChange={(e) => props.onCustomerFullNameChange(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="गाँव कोड / Village code (e.g. RAMP)"
                value={props.villageCode}
                onChange={(e) => props.onVillageCodeChange(e.target.value.toUpperCase())}
                style={inputStyle}
              />
            </>
          )}
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
