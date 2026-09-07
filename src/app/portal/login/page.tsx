/**
 * Customer portal login — supports both OTP and password, per product
 * decision (customers can "always" log in either way). A simple mode
 * toggle keeps both paths in one screen rather than splitting into two
 * separate pages.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { customerAuthService } from "@/services/customerAuthService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing, typography } from "@/theme/tokens";

type Mode = "otp-phone" | "otp-code" | "password";

export default function PortalLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("otp-phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await customerAuthService.requestOtp(phone);
      setMode("otp-code");
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

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await customerAuthService.passwordLogin(phone, password);
      router.push("/portal");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  const submitHandler = mode === "otp-phone" ? handleRequestOtp : mode === "otp-code" ? handleVerifyOtp : handlePasswordLogin;

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
        onSubmit={submitHandler}
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

        {mode !== "otp-code" && (
          <div style={{ display: "flex", gap: spacing.sm }}>
            <button
              type="button"
              onClick={() => setMode("otp-phone")}
              style={tabStyle(mode === "otp-phone")}
            >
              OTP
            </button>
            <button
              type="button"
              onClick={() => setMode("password")}
              style={tabStyle(mode === "password")}
            >
              पासवर्ड / Password
            </button>
          </div>
        )}

        {mode === "otp-phone" && (
          <>
            <BilingualLabel hi="फ़ोन नंबर डालें" en="Enter your phone number" size="tileLabel" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required style={inputStyle} />
            <p style={{ fontSize: "0.8rem", color: colors.textSecondary, margin: 0 }}>
              OTP आपके पंजीकृत ईमेल पर भेजा जाएगा / OTP will be sent to your registered email
            </p>
          </>
        )}

        {mode === "otp-code" && (
          <>
            <BilingualLabel hi="OTP डालें" en={`Enter the OTP emailed for ${phone}`} size="tileLabel" />
            <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" required style={inputStyle} />
          </>
        )}

        {mode === "password" && (
          <>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="फ़ोन / Phone" required style={inputStyle} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="पासवर्ड / Password" required style={inputStyle} />
          </>
        )}

        {error && <p style={{ color: colors.danger, fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? "..." : mode === "otp-phone" ? "OTP भेजें / Send OTP" : mode === "otp-code" ? "पुष्टि करें / Verify" : "लॉगिन / Log In"}
        </button>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: colors.textSecondary }}>
          नया ग्राहक? / New customer?{" "}
          <a href="/portal/register" style={{ color: colors.sevaTeal, fontWeight: 700 }}>
            खाता बनाएं / Register
          </a>
        </p>
      </form>
    </main>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.button,
    border: `1px solid ${active ? colors.leafGreen : colors.border}`,
    background: active ? `${colors.leafGreen}18` : colors.white,
    fontWeight: 700,
    cursor: "pointer",
  };
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
