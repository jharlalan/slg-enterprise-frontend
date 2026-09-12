/**
 * Customer self-registration — open to anyone. Duplicate phone numbers
 * are rejected by the backend with a clear "please log in instead"
 * message rather than silently creating a second account.
 *
 * full_name, phone, gender, and address are mandatory; email/Aadhaar
 * stay optional. Aadhaar QR scan/upload pre-fills name/gender/address,
 * still fully editable before submitting.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { AddressFields } from "@/components/shared/AddressFields";
import { AadhaarQRCapture, type AadhaarQRResult } from "@/components/shared/AadhaarQRCapture";
import { VerifyButton } from "@/components/shared/VerifyButton";
import { customerAuthService } from "@/services/customerAuthService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { toE164, PHONE_DIGIT_LENGTH } from "@/utils/phone";
import { emptyAddress, type CustomerAddress } from "@/types/address";
import type { Gender } from "@/types/customer";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneDigits, setPhoneDigitsRaw] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");
  const [email, setEmailRaw] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [villageCode, setVillageCode] = useState("");

  function setPhoneDigits(v: string) {
    setPhoneDigitsRaw(v);
    setPhoneVerified(false); // a changed value invalidates any prior verification
  }
  function setEmail(v: string) {
    setEmailRaw(v);
    setEmailVerified(false);
  }
  const [address, setAddress] = useState<CustomerAddress>(emptyAddress());
  const [password, setPassword] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDuplicatePhone, setIsDuplicatePhone] = useState(false);
  const [busy, setBusy] = useState(false);

  function handleAadhaarFetched(result: AadhaarQRResult) {
    if (result.full_name) setFullName(result.full_name);
    if (result.gender) setGender(result.gender);
    if (result.address) setAddress((prev) => ({ ...prev, ...result.address }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsDuplicatePhone(false);
    if (!gender) {
      setError("कृपया लिंग चुनें / Please select a gender");
      return;
    }
    setBusy(true);
    try {
      await customerAuthService.register({
        full_name: fullName,
        phone: toE164(phoneDigits),
        gender,
        email: email || undefined,
        village_code: villageCode.toUpperCase(),
        address,
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
          width: "380px",
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        <BilingualLabel hi="नया खाता बनाएं" en="Create Account" size="heading" weight="bold" layout="stacked" />

        <AadhaarQRCapture endpoint="/customer-auth/aadhaar-qr/decode" onFetched={handleAadhaarFetched} />

        <input
          type="text"
          placeholder="पूरा नाम / Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={inputStyle}
        />
        <PhoneInput value={phoneDigits} onChange={setPhoneDigits} required />
        <VerifyButton
          kind="phone"
          value={toE164(phoneDigits)}
          valid={phoneDigits.length === PHONE_DIGIT_LENGTH}
          verified={phoneVerified}
          onVerified={() => setPhoneVerified(true)}
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          required
          style={{ ...inputStyle, color: gender ? colors.textPrimary : colors.textSecondary }}
        >
          <option value="" disabled>
            लिंग चुनें / Select gender
          </option>
          <option value="male">पुरुष / Male</option>
          <option value="female">महिला / Female</option>
          <option value="other">अन्य / Other</option>
        </select>
        <input
          type="email"
          placeholder="ईमेल (वैकल्पिक) / Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        {email.length > 0 && (
          <VerifyButton
            kind="email"
            value={email}
            valid={EMAIL_PATTERN.test(email)}
            verified={emailVerified}
            onVerified={() => setEmailVerified(true)}
          />
        )}

        <BilingualLabel hi="पता" en="Address" weight="bold" size="tileLabel" />
        <AddressFields
          address={address}
          onAddressChange={setAddress}
          villageCode={villageCode}
          onVillageCodeChange={setVillageCode}
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
