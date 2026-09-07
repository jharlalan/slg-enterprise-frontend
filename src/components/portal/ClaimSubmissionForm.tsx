/**
 * ClaimSubmissionForm — after paying via the QR on their own UPI app,
 * the customer comes back here to submit proof. This does NOT reduce
 * their debt immediately — it sits as PENDING until the owner verifies
 * it (see verificationService / the owner's queue), which is the
 * deliberate design to prevent a customer unilaterally marking their
 * own debt paid.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { portalService } from "@/services/portalService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ClaimSubmissionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (selected) {
      if (!ALLOWED_TYPES.includes(selected.type)) {
        setError("केवल JPG/PNG/WEBP फ़ोटो / Only JPG/PNG/WEBP images allowed");
        setFile(null);
        return;
      }
      if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`फ़ाइल ${MAX_FILE_SIZE_MB}MB से बड़ी है / File exceeds ${MAX_FILE_SIZE_MB}MB`);
        setFile(null);
        return;
      }
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0 || !reference || !file) {
      setError("कृपया सभी जानकारी भरें / Please fill all fields");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await portalService.submitClaim(value, reference, file);
      setMessage("दावा भेज दिया गया / Claim submitted — waiting for owner approval");
      setAmount("");
      setReference("");
      setFile(null);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, marginTop: spacing.lg }}
    >
      <BilingualLabel hi="भुगतान का प्रमाण जमा करें" en="Submit Payment Proof" weight="bold" size="heading" />

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.md }}>
        <input
          type="number"
          placeholder="भुगतान राशि / Amount paid"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="UPI लेन-देन संदर्भ / UPI transaction reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          style={inputStyle}
        />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        {file && <p style={{ fontSize: "0.85rem", color: colors.textSecondary }}>{file.name}</p>}
      </div>

      {error && <p style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</p>}
      {message && <p style={{ color: colors.success, marginTop: spacing.sm }}>{message}</p>}

      <button type="submit" disabled={busy} style={submitButtonStyle}>
        {busy ? "..." : "जमा करें / Submit"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
};

const submitButtonStyle: React.CSSProperties = {
  marginTop: spacing.md,
  width: "100%",
  padding: spacing.md,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
};
