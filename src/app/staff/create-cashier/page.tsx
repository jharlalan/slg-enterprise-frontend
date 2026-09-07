/**
 * Create Cashier — Owner-only. This is the deliberate, sole way a
 * Cashier account comes into existence: an already-logged-in Owner
 * creates it explicitly. There is no public staff registration, by
 * design (see conversation notes) — an Owner account with write
 * access to inventory, pricing, and khata should never be reachable
 * from an anonymous signup form.
 */
"use client";

import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { staffService } from "@/services/staffService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";

export default function CreateCashierPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [maxOverridePct, setMaxOverridePct] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await staffService.createCashier({
        username,
        password,
        roles: ["CASHIER"],
        max_price_override_pct: maxOverridePct ? parseFloat(maxOverridePct) : undefined,
      });
      setMessage(`Cashier account '${username}' created.`);
      setUsername("");
      setPassword("");
      setMaxOverridePct("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
      <BilingualLabel hi="कैशियर जोड़ें" en="Add Cashier" size="displayHeading" weight="bold" layout="stacked" />

      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.white,
          borderRadius: radii.tile,
          padding: spacing.xl,
          maxWidth: "360px",
          marginTop: spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacing.sm,
        }}
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          style={inputStyle}
        />
        <div>
          <label style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
            Max price override % (leave blank = no override allowed)
          </label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={maxOverridePct}
            onChange={(e) => setMaxOverridePct(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && <p style={{ color: colors.danger }}>{error}</p>}
        {message && <p style={{ color: colors.success }}>{message}</p>}

        <button type="submit" disabled={busy} style={buttonStyle}>
          {busy ? "..." : "Create Cashier Account"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: spacing.md,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "1rem",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: spacing.md,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
};
