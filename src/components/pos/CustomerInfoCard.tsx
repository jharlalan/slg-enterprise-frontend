/**
 * CustomerInfoCard — the persistent, compact display once a customer
 * choice has been resolved (selected/created, or explicitly
 * anonymous). Stays visible throughout billing so the cashier always
 * knows who the sale is for, with a "बदलें / Change" to redo the
 * selection if needed (cart contents are preserved — only the
 * customer choice resets).
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import { formatPhoneForDisplay } from "@/utils/phone";
import type { CustomerSummary } from "@/types/customer";

export type CustomerInfoCardProps = {
  customer: CustomerSummary | null; // null means anonymous
  onChange: () => void;
};

export function CustomerInfoCard({ customer, onChange }: CustomerInfoCardProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: colors.white,
        borderRadius: radii.tile,
        padding: spacing.md,
        border: `1px solid ${colors.border}`,
      }}
    >
      {customer ? (
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <BilingualLabel hi={customer.full_name} en={customer.customer_id} weight="bold" layout="inline" />
            {customer.verified && (
              <span title="Verified customer" style={{ color: colors.success, fontSize: "0.85rem", fontWeight: 700 }}>
                ✓
              </span>
            )}
          </span>
          <div style={{ fontSize: "0.85rem", color: colors.textSecondary, marginTop: "2px" }}>
            {formatPhoneForDisplay(customer.phone)} · {customer.village_code}
            {customer.current_debt > 0 && (
              <span style={{ color: colors.danger, fontWeight: 700 }}> · बकाया/Due: ₹{customer.current_debt.toFixed(2)}</span>
            )}
          </div>
        </div>
      ) : (
        <BilingualLabel hi="🚶 अनाम ग्राहक" en="Anonymous Customer" weight="bold" />
      )}

      <button
        onClick={onChange}
        style={{
          border: `1px solid ${colors.border}`,
          background: colors.white,
          borderRadius: radii.pill,
          padding: `${spacing.xs} ${spacing.md}`,
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        बदलें / Change
      </button>
    </div>
  );
}
