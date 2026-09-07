/**
 * Customer portal login — phone number, then OTP. Unlike staff login,
 * this is villager-facing, so it uses the same bilingual, icon-first
 * treatment as the rest of the customer-visible app.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { customerAuthService } from "@/services/customerAuthService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await customerAuthService.requestOtp(phone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await customerAuthService.verifyOtp(phone, otpCode);
      router.push("/portal");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "गलत OTP / Incorrect OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.huskCream,
        padding: spacing.lg,
      }}
    >
      <form
        onSubmit={step === "phone" ? handleRequestOtp : handleVerifyOtp}
        style={{
          background: colors.white,
          padding: spacing.xl,
          borderRadius: radii.tile,
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.md,
        }}
      >
        <BilingualLabel hi="मेरा खाता" en="My Account" size="heading" weight="bold" layout="stacked" />

        {step === "phone" ? (
          <>
            <BilingualLabel hi="फ़ोन नंबर डालें" en="Enter your phone number" size="tileLabel" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              required
              style={inputStyle}
            />
          </>
        ) : (
          <>
            <BilingualLabel hi="OTP डालें" en={`Enter the OTP sent to ${phone}`} size="tileLabel" />
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="000000"
              required
              style={inputStyle}
            />
          </>
        )}

        {error && <p style={{ color: colors.danger, fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? "..." : step === "phone" ? "OTP भेजें / Send OTP" : "पुष्टि करें / Verify"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: spacing.md,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: typography.scale.body,
  fontFamily: typography.fontFamilyCombined,
};

const buttonStyle: React.CSSProperties = {
  padding: spacing.md,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: typography.weight.bold,
  fontSize: typography.scale.body,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
};
