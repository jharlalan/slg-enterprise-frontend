/**
 * AppHeader — one persistent top bar, rendered once in the root
 * layout so no individual page needs to import or duplicate it.
 * Replaces what used to be ad-hoc, hardcoded login/profile links
 * living only on the home page.
 *
 * Hides itself on the actual login/register pages — showing a "Staff
 * Login" link at the top of the Staff Login page itself is just
 * visual noise, not useful navigation.
 */
"use client";

import { usePathname } from "next/navigation";
import { ProfileBadge } from "@/components/layout/ProfileBadge";
import { colors, spacing, typography } from "@/theme/tokens";

const HIDDEN_ON = ["/login", "/portal/login", "/portal/register"];

export function AppHeader() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${spacing.sm} ${spacing.lg}`,
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <a
        href="/"
        aria-label="Home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          fontFamily: typography.fontFamilyCombined,
          fontWeight: typography.weight.bold,
          fontSize: "1.1rem",
          color: colors.textPrimary,
          textDecoration: "none",
        }}
      >
        <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>🏠</span>
        SLG Enterprise
      </a>
      <ProfileBadge />
    </header>
  );
}
