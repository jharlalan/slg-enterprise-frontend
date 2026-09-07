/**
 * PaymentQRGenerator — lets the customer pick any amount (up to their
 * own judgement, not capped client-side to current_debt since they may
 * reasonably want to pre-pay) and get a scannable UPI QR to pay with
 * PhonePe/GPay/Paytm/etc on their own device.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { portalService } from "@/services/portalService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

export function PaymentQRGenerator({ suggestedAmount }: { suggestedAmount: number }) {
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const result = await portalService.generatePaymentQR(value);
      setQrImage(result.image);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
      <BilingualLabel hi="भुगतान क्यूआर बनाएं" en="Generate Payment QR" weight="bold" size="heading" />
      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ flex: 1, padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
        />
        <button
          onClick={handleGenerate}
          disabled={busy}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: radii.button,
            border: "none",
            background: colors.leafGreen,
            color: colors.white,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          बनाएं / Generate
        </button>
      </div>
      {error && <p style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</p>}
      {qrImage && (
        <div style={{ textAlign: "center", marginTop: spacing.md }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage} alt="Payment QR" style={{ width: "180px", height: "180px" }} />
          <p style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>
            PhonePe / GPay / Paytm से स्कैन करें / Scan with any UPI app
          </p>
        </div>
      )}
    </div>
  );
}
