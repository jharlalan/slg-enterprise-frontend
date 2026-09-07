/**
 * Customer self-registration — open to anyone. Duplicate phone numbers
 * are rejected by the backend with a clear "please log in instead"
 * message rather than silently creating a second account.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { customerAuthService } from "@/services/customerAuthService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [password, setPassword] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDuplicatePhone, setIsDuplicatePhone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsDuplicatePhone(false);
    setBusy(true);
    try {
      await customerAuthService.register({
        full_name: fullName,
        phone,
        email,
        village_code: villageCode.toUpperCase(),
        password,
        aadhaar_number: aadhaar || undefined,
      });
      router.push("/portal");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.code === "PHONE_ALREADY_REGISTERED") setIsDuplicatePhone(true);
      } else {
        setError("त्रुटि / Something went wrong");
      }
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
        onSubmit={handleSubmit}
        style={{
          background: colors.white,
          padding: spacing.xl,
          borderRadius: radii.tile,
          width: "340px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        <BilingualLabel hi="नया खाता बनाएं" en="Create Account" size="heading" weight="bold" layout="stacked" />

        <input
          type="text"
          placeholder="पूरा नाम / Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="tel"
          placeholder="फ़ोन नंबर / Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="ईमेल / Email (OTP यहीं भेजा जाएगा / OTP will be sent here)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="गाँव कोड / Village code (e.g. RAMP)"
          value={villageCode}
          onChange={(e) => setVillageCode(e.target.value.toUpperCase())}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="पासवर्ड / Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="आधार नंबर (वैकल्पिक) / Aadhaar number (optional)"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
          style={inputStyle}
        />

        {error && (
          <div style={{ color: colors.danger, fontSize: "0.9rem" }}>
            {error}
            {isDuplicatePhone && (
              <div style={{ marginTop: "4px" }}>
                <a href="/portal/login" style={{ color: colors.sevaTeal, fontWeight: 700 }}>
                  लॉगिन करें / Log in instead →
                </a>
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? "..." : "खाता बनाएं / Create Account"}
        </button>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: colors.textSecondary }}>
          पहले से खाता है? / Already have an account?{" "}
          <a href="/portal/login" style={{ color: colors.sevaTeal, fontWeight: 700 }}>
            लॉगिन करें / Log in
          </a>
        </p>
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
  marginTop: spacing.sm,
};
