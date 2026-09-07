/**
 * Staff login (Owner/Cashier). Customers never use this screen — they
 * authenticate via OTP in the portal (Batch 5). This is intentionally
 * plain (no icon-tile treatment) since it's a one-time-per-shift action
 * for shop staff, not a villager-facing screen.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.login(username, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "लॉगिन विफल / Login failed");
    } finally {
      setLoading(false);
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
      }}
    >
      <form
        onSubmit={handleSubmit}
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
        <h1
          style={{
            fontFamily: typography.fontFamilyCombined,
            fontSize: typography.scale.heading,
            color: colors.textPrimary,
            margin: 0,
          }}
        >
          SLG Enterprise — Staff Login
        </h1>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && <p style={{ color: colors.danger, fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "..." : "Log In"}
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
