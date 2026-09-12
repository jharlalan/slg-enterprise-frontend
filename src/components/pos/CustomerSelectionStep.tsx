/**
 * CustomerSelectionStep — the very first thing a cashier does on the
 * POS screen, before adding any items. Three paths: search and select
 * an existing customer, quick-create a new one on the spot, or
 * explicitly proceed anonymously (walk-in, no customer attached).
 *
 * This runs for EVERY sale now, not just credit/split ones — a cash
 * customer can be attached to their own purchase history too, which
 * wasn't previously possible (customer info used to only appear once
 * SPLIT/CREDIT was chosen, deep inside the payment step).
 */
import { useEffect, useRef, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { AddressFields } from "@/components/shared/AddressFields";
import { AadhaarQRCapture, type AadhaarQRResult } from "@/components/shared/AadhaarQRCapture";
import { VerifyButton } from "@/components/shared/VerifyButton";
import { customerService } from "@/services/customerService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import { toE164, formatPhoneForDisplay, PHONE_DIGIT_LENGTH } from "@/utils/phone";
import { emptyAddress, type CustomerAddress } from "@/types/address";
import type { CustomerSummary, Gender } from "@/types/customer";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type CustomerSelectionStepProps = {
  onSelect: (customer: CustomerSummary) => void;
  onAnonymous: () => void;
};

export function CustomerSelectionStep({ onSelect, onAnonymous }: CustomerSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchTerm.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await customerService.search(searchTerm.trim());
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, border: `2px solid ${colors.leafGreen}` }}>
      <BilingualLabel hi="ग्राहक चुनें" en="Select Customer" weight="bold" size="heading" />
      <p style={{ color: colors.textSecondary, fontSize: "0.9rem", marginTop: "4px" }}>
        आइटम जोड़ने से पहले ग्राहक चुनें / Select a customer before adding items
      </p>

      {!showNewForm ? (
        <>
          <input
            type="text"
            autoFocus
            placeholder="नाम, फ़ोन या ग्राहक ID खोजें / Search name, phone, or customer ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          {searching && <p style={{ fontSize: "0.85rem", color: colors.textSecondary }}>खोज रहे हैं / Searching...</p>}

          {results.length > 0 && (
            <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "4px", maxHeight: "220px", overflowY: "auto" }}>
              {results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelect(customer)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: spacing.sm,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.button,
                    background: colors.white,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {customer.full_name}
                    {customer.verified && (
                      <span title="Verified customer" style={{ color: colors.success, marginLeft: "6px" }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
                    {customer.customer_id} · {formatPhoneForDisplay(customer.phone)} · {customer.village_code}
                    {customer.current_debt > 0 && (
                      <span style={{ color: colors.danger }}> · बकाया/Due: ₹{customer.current_debt.toFixed(2)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap" }}>
            <button onClick={() => setShowNewForm(true)} style={secondaryButtonStyle}>
              ➕ नया ग्राहक / New Customer
            </button>
            <button onClick={onAnonymous} style={anonymousButtonStyle}>
              🚶 अनाम ग्राहक से जारी रखें / Continue as Anonymous
            </button>
          </div>
        </>
      ) : (
        <NewCustomerForm onCreated={onSelect} onCancel={() => setShowNewForm(false)} />
      )}
    </div>
  );
}

function NewCustomerForm({
  onCreated,
  onCancel,
}: {
  onCreated: (customer: CustomerSummary) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phoneDigits, setPhoneDigitsRaw] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [gender, setGender] = useState<Gender | "">("");
  const [email, setEmailRaw] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [villageCode, setVillageCode] = useState("");
  const [address, setAddress] = useState<CustomerAddress>(emptyAddress());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setPhoneDigits(v: string) {
    setPhoneDigitsRaw(v);
    setPhoneVerified(false); // a changed value invalidates any prior verification
  }
  function setEmail(v: string) {
    setEmailRaw(v);
    setEmailVerified(false);
  }

  function handleAadhaarFetched(result: AadhaarQRResult) {
    if (result.full_name) setFullName(result.full_name);
    if (result.gender) setGender(result.gender);
    if (result.address) setAddress((prev) => ({ ...prev, ...result.address }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!gender) {
      setError("कृपया लिंग चुनें / Please select a gender");
      return;
    }
    setSaving(true);
    try {
      const customer = await customerService.quickCreate({
        full_name: fullName,
        phone: toE164(phoneDigits),
        gender,
        village_code: villageCode.toUpperCase(),
        address,
        email: email || undefined,
      });
      onCreated(customer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "बनाने में त्रुटि / Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.md }}>
      <AadhaarQRCapture endpoint="/customers/aadhaar-qr/decode" onFetched={handleAadhaarFetched} />

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
        style={{ ...inputStyle, marginTop: spacing.sm, color: gender ? colors.textPrimary : colors.textSecondary }}
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
        style={{ ...inputStyle, marginTop: spacing.sm }}
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

      <AddressFields
        address={address}
        onAddressChange={setAddress}
        villageCode={villageCode}
        onVillageCodeChange={setVillageCode}
      />

      {error && (
        <p style={{ color: colors.danger, fontSize: "0.9rem" }}>
          {error}
          {error.toLowerCase().includes("already") && " — कृपया खोजें / please search instead."}
        </p>
      )}

      <div style={{ display: "flex", gap: spacing.sm }}>
        <button type="button" onClick={onCancel} style={{ ...secondaryButtonStyle, flex: 1 }}>
          रद्द करें / Cancel
        </button>
        <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, flex: 1 }}>
          {saving ? "..." : "बनाएं / Create"}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  marginTop: spacing.sm,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  color: colors.textPrimary,
  fontWeight: 700,
  cursor: "pointer",
};

const anonymousButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.textSecondary}`,
  background: colors.huskCream,
  color: colors.textPrimary,
  fontWeight: 700,
  cursor: "pointer",
};
