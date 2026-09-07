/**
 * PhoneChangeCard — self-service phone number change, OTP-verified.
 * Old number is automatically preserved in phone_history on the
 * backend (see CustomerRepository.update_phone) — this component just
 * drives the two-step request/confirm flow.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { portalService } from "@/services/portalService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

export function PhoneChangeCard({ currentPhone, onChanged }: { currentPhone: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp() {
    setError(null);
    setBusy(true);
    try {
      await portalService.requestPhoneChangeOtp(newPhone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setBusy(true);
    try {
      await portalService.confirmPhoneChange(newPhone, otpCode);
      setOpen(false);
      setStep("phone");
      setNewPhone("");
      setOtpCode("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }}>
        <span style={{ color: colors.textSecondary }}>{currentPhone}</span>
        <button
          onClick={() => setOpen(true)}
          style={{ border: "none", background: "none", color: colors.sevaTeal, fontWeight: 700, cursor: "pointer" }}
        >
          बदलें / Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: spacing.sm, padding: spacing.md, background: colors.sevaTealLight, borderRadius: radii.button }}>
      <BilingualLabel hi="नया फ़ोन नंबर" en="Change Phone Number" weight="bold" size="tileLabel" />
      <p style={{ fontSize: "0.8rem", color: colors.textSecondary, margin: "4px 0" }}>
        पुष्टि OTP आपके पंजीकृत ईमेल पर भेजा जाएगा / A confirmation OTP will be sent to your registered email
      </p>
      {step === "phone" ? (
        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
          <input
            type="tel"
            placeholder="नया नंबर / New number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            style={{ flex: 1, padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
          />
          <button onClick={handleRequestOtp} disabled={busy} style={confirmButtonStyle}>
            OTP भेजें / Send
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
          <input
            type="text"
            placeholder="OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            style={{ flex: 1, padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
          />
          <button onClick={handleConfirm} disabled={busy} style={confirmButtonStyle}>
            पुष्टि करें / Confirm
          </button>
        </div>
      )}
      {error && <p style={{ color: colors.danger, fontSize: "0.85rem", marginTop: spacing.sm }}>{error}</p>}
      <button
        onClick={() => setOpen(false)}
        style={{ border: "none", background: "none", color: colors.textSecondary, fontSize: "0.85rem", marginTop: spacing.sm, cursor: "pointer" }}
      >
        रद्द करें / Cancel
      </button>
    </div>
  );
}

const confirmButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.sevaTeal,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
};
