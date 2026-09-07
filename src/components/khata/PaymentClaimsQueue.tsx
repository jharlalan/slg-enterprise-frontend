/**
 * PaymentClaimsQueue — the owner's approval queue for remote payment
 * claims. Shows the screenshot inline (via fileUrl(), since uploads
 * are served by the backend, not the Next.js frontend) so the owner
 * can verify without downloading anything separately.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { verificationService } from "@/services/verificationService";
import { fileUrl } from "@/services/tokenStorage";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { PaymentClaim } from "@/types/portal";

export function PaymentClaimsQueue({
  claims,
  onReviewed,
}: {
  claims: PaymentClaim[];
  onReviewed: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(claimId: string) {
    setBusyId(claimId);
    setError(null);
    try {
      await verificationService.review(claimId, "APPROVE");
      onReviewed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(claimId: string) {
    if (!rejectionReason.trim()) return;
    setBusyId(claimId);
    setError(null);
    try {
      await verificationService.review(claimId, "REJECT", rejectionReason);
      setRejectingId(null);
      setRejectionReason("");
      onReviewed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
      <BilingualLabel hi="भुगतान सत्यापन कतार" en="Payment Verification Queue" weight="bold" size="heading" />
      {error && <p style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</p>}

      {claims.length === 0 && (
        <p style={{ color: colors.textSecondary, marginTop: spacing.md }}>
          कोई लंबित दावा नहीं / No pending claims
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, marginTop: spacing.md }}>
        {claims.map((claim) => (
          <div key={claim.id} style={{ border: `1px solid ${colors.border}`, borderRadius: radii.button, padding: spacing.md }}>
            <div style={{ display: "flex", gap: spacing.md }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(claim.payment_proof_url)}
                alt="payment proof"
                style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: radii.button }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {claim.customer_code} — ₹{claim.claimed_amount.toFixed(2)}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>
                  Ref: {claim.upi_transaction_ref} · {new Date(claim.claimed_at).toLocaleString()}
                </div>

                {rejectingId === claim.id ? (
                  <div style={{ marginTop: spacing.sm, display: "flex", gap: spacing.sm }}>
                    <input
                      type="text"
                      placeholder="कारण / Reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      style={{ flex: 1, padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
                    />
                    <button onClick={() => handleReject(claim.id)} disabled={busyId === claim.id} style={rejectButtonStyle}>
                      पुष्टि करें / Confirm
                    </button>
                    <button onClick={() => setRejectingId(null)} style={cancelButtonStyle}>
                      रद्द करें / Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: spacing.sm, display: "flex", gap: spacing.sm }}>
                    <button onClick={() => handleApprove(claim.id)} disabled={busyId === claim.id} style={approveButtonStyle}>
                      ✓ स्वीकृत / Approve
                    </button>
                    <button onClick={() => setRejectingId(claim.id)} disabled={busyId === claim.id} style={rejectButtonStyle}>
                      ✕ अस्वीकृत / Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const approveButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.success,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
};

const rejectButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.danger,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  cursor: "pointer",
};
