/**
 * VerifyButton — inline "Verify" affordance for a phone or email field
 * on a registration form. Request -> OTP code entry -> Confirm, all in
 * place next to the field. The parent form doesn't send any "verified"
 * flag at submit time — the backend independently re-checks whether
 * THIS EXACT phone/email string was OTP-verified recently (see
 * RegistrationVerificationService), so verifying then editing the
 * value invalidates the checkmark automatically (the parent resets
 * `verified` back to false on change — see onVerifiedChange usage).
 */
import { useState } from "react";
import { apiClient, ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

type VerifyKind = "phone" | "email";

const ENDPOINTS: Record<VerifyKind, { request: string; confirm: string; field: string }> = {
  phone: {
    request: "/customer-auth/verify/phone/request",
    confirm: "/customer-auth/verify/phone/confirm",
    field: "phone",
  },
  email: {
    request: "/customer-auth/verify/email/request",
    confirm: "/customer-auth/verify/email/confirm",
    field: "email",
  },
};

export type VerifyButtonProps = {
  kind: VerifyKind;
  /** The exact value to verify — full "+91XXXXXXXXXX" for phone, the
   * raw address for email. Must be non-empty and validly formatted
   * before a code can be requested. */
  value: string;
  valid: boolean;
  verified: boolean;
  onVerified: () => void;
};

export function VerifyButton({ kind, value, valid, verified, onVerified }: VerifyButtonProps) {
  const [step, setStep] = useState<"idle" | "otp">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const cfg = ENDPOINTS[kind];

  async function handleRequest() {
    setError(null);
    setBusy(true);
    try {
      await apiClient.post(cfg.request, { [cfg.field]: value });
      setStep("otp");
      setSentMessage(
        kind === "phone"
          ? "कोड भेजा गया / Code sent to this number"
          : "कोड ईमेल किया गया / Code emailed to this address"
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setBusy(true);
    try {
      await apiClient.post(cfg.confirm, { [cfg.field]: value, otp_code: otpCode });
      onVerified();
      setStep("idle");
      setOtpCode("");
      setSentMessage(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "गलत कोड / Incorrect code");
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <span style={{ color: colors.success, fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
        ✓ सत्यापित / Verified
      </span>
    );
  }

  if (step === "otp") {
    // Deliberately a <div>, not a nested <form> — this renders inside
    // the parent registration form, and a <form> inside a <form> is
    // invalid HTML with unreliable submit behavior across browsers
    // (confirmed: it caused the OUTER form to reset instead of this
    // one submitting). type="button" + explicit onClick/onKeyDown
    // avoids the whole class of bug.
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
        <div style={{ display: "flex", gap: spacing.xs }}>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (otpCode) void handleConfirm();
              }
            }}
            placeholder="OTP"
            style={otpInputStyle}
          />
          <button type="button" onClick={handleConfirm} disabled={busy || !otpCode} style={smallButtonStyle}>
            पुष्टि / Confirm
          </button>
        </div>
        {sentMessage && !error && <p style={hintStyle}>{sentMessage}</p>}
        {error && <p style={errorStyle}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRequest}
        disabled={busy || !valid}
        style={{ ...smallButtonStyle, opacity: valid ? 1 : 0.5 }}
      >
        {busy ? "..." : "🔑 सत्यापित करें / Verify"}
      </button>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

const smallButtonStyle: React.CSSProperties = {
  padding: `4px ${spacing.sm}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.leafGreen}`,
  background: colors.white,
  color: colors.leafGreen,
  fontWeight: 700,
  fontSize: "0.8rem",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const otpInputStyle: React.CSSProperties = {
  width: "90px",
  padding: "4px 8px",
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.85rem",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: colors.textSecondary,
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: colors.danger,
  margin: 0,
};
