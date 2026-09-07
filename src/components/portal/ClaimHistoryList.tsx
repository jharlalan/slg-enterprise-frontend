import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import type { PaymentClaim } from "@/types/portal";

const STATUS_COLOR: Record<string, string> = {
  PENDING: colors.warning,
  APPROVED: colors.success,
  REJECTED: colors.danger,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "समीक्षा में / Pending",
  APPROVED: "स्वीकृत / Approved",
  REJECTED: "अस्वीकृत / Rejected",
};

export function ClaimHistoryList({ claims }: { claims: PaymentClaim[] }) {
  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, marginTop: spacing.lg }}>
      <BilingualLabel hi="मेरे दावे" en="My Payment Claims" weight="bold" size="heading" />
      <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: spacing.sm }}>
        {claims.length === 0 && <p style={{ color: colors.textSecondary }}>कोई दावा नहीं / No claims yet</p>}
        {claims.map((claim) => (
          <div
            key={claim.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: spacing.sm,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>₹{claim.claimed_amount.toFixed(2)}</div>
              <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
                {new Date(claim.claimed_at).toLocaleString()} · {claim.upi_transaction_ref}
              </div>
              {claim.status === "REJECTED" && claim.rejection_reason && (
                <div style={{ fontSize: "0.85rem", color: colors.danger }}>कारण / Reason: {claim.rejection_reason}</div>
              )}
            </div>
            <div style={{ color: STATUS_COLOR[claim.status], fontWeight: 700 }}>{STATUS_LABEL[claim.status]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
