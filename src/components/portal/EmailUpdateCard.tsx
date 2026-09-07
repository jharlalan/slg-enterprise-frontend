/**
 * EmailUpdateCard — lets a customer add/change their email. Most
 * important for counter-created customers, who have no email on file
 * at all (only self-registered customers are asked for one), and
 * therefore can't use OTP login until they set one here. Unlike phone
 * changes, this is NOT OTP-verified — the customer is already
 * authenticated via their existing session, which is a reasonable
 * trade-off for a lower-risk field (see backend endpoint docstring).
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { portalService } from "@/services/portalService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

export function EmailUpdateCard({ currentEmail, onChanged }: { currentEmail: string | null; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(currentEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await portalService.updateEmail(email);
      setMessage("सहेजा गया / Saved");
      setOpen(false);
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
        <span style={{ color: colors.textSecondary }}>
          {currentEmail ?? "कोई ईमेल नहीं / No email on file — needed for OTP login"}
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{ border: "none", background: "none", color: colors.sevaTeal, fontWeight: 700, cursor: "pointer" }}
        >
          {currentEmail ? "बदलें / Change" : "जोड़ें / Add"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: spacing.sm, display: "flex", gap: spacing.sm }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ flex: 1, padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
      />
      <button
        onClick={handleSave}
        disabled={busy}
        style={{ padding: `${spacing.sm} ${spacing.md}`, borderRadius: radii.button, border: "none", background: colors.leafGreen, color: colors.white, fontWeight: 700, cursor: "pointer" }}
      >
        सहेजें / Save
      </button>
      <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", color: colors.textSecondary, cursor: "pointer" }}>
        रद्द करें / Cancel
      </button>
      {error && <p style={{ color: colors.danger }}>{error}</p>}
      {message && <p style={{ color: colors.success }}>{message}</p>}
    </div>
  );
}
