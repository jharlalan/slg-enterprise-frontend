/**
 * ProfileBadge — shows who's logged in. The header bar itself only
 * ever shows the avatar icon (a plain initial-in-a-circle for now,
 * per "default profile picture" — swap only this one element for a
 * real photo later). Clicking it opens a popup with the name, role,
 * role-specific shortcuts (Dashboard/Add Cashier for Owner), and
 * Logout — rather than cramming all of that into the bar itself,
 * which is what caused the alignment problems before.
 *
 * Works for BOTH staff (Owner/Cashier) and customer sessions, since
 * both share the same token/role storage.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { authService } from "@/services/authService";
import { customerAuthService } from "@/services/customerAuthService";
import { tokenStorage } from "@/services/tokenStorage";
import { colors, radii, shadows, spacing } from "@/theme/tokens";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "मालिक / Owner",
  CASHIER: "कैशियर / Cashier",
  CUSTOMER: "ग्राहक / Customer",
};

export function ProfileBadge() {
  const [roles, setRoles] = useState<string[] | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoles(tokenStorage.getRoles());
    setDisplayName(tokenStorage.getDisplayName());
  }, []);

  // Close the popup on any click outside it.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (roles === null) return null; // not yet mounted client-side

  const isLoggedIn = roles.length > 0 && Boolean(tokenStorage.getToken());
  const isCustomer = roles.includes("CUSTOMER");
  const isOwner = roles.includes("OWNER");

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
        <a href="/login" style={pillStyle(colors.white, colors.textPrimary, colors.border)}>
          👤 स्टाफ / Staff Login
        </a>
        <a href="/portal/login" style={pillStyle(colors.sevaTealLight, colors.sevaTeal, colors.sevaTeal)}>
          📱 मेरा खाता / My Account
        </a>
      </div>
    );
  }

  function handleLogout() {
    if (isCustomer) {
      customerAuthService.logout();
      window.location.href = "/portal/login";
    } else {
      authService.logout();
      window.location.href = "/login";
    }
  }

  const primaryRole = roles[0] ?? "";
  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: radii.pill,
          background: colors.leafGreen,
          color: colors.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1.1rem",
          border: "none",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "48px",
            right: 0,
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.button,
            boxShadow: shadows.raised,
            minWidth: "220px",
            padding: spacing.md,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            gap: spacing.sm,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: colors.textPrimary }}>
              {displayName || "—"}
            </div>
            <div style={{ fontSize: "0.8rem", color: colors.textSecondary, marginTop: "2px" }}>
              {ROLE_LABELS[primaryRole] ?? primaryRole}
            </div>
          </div>

          {isOwner && (
            <>
              <div style={{ borderTop: `1px solid ${colors.border}` }} />
              <a href="/dashboard" style={menuLinkStyle}>
                📊 डैशबोर्ड / Dashboard
              </a>
              <a href="/staff/create-cashier" style={menuLinkStyle}>
                ➕ कैशियर जोड़ें / Add Cashier
              </a>
            </>
          )}

          <div style={{ borderTop: `1px solid ${colors.border}` }} />
          <button onClick={handleLogout} style={logoutButtonStyle}>
            लॉगआउट / Logout
          </button>
        </div>
      )}
    </div>
  );
}

function pillStyle(background: string, textColor: string, borderColor: string): React.CSSProperties {
  return {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radii.pill,
    background,
    border: `1px solid ${borderColor}`,
    color: textColor,
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
}

const menuLinkStyle: React.CSSProperties = {
  color: colors.textPrimary,
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: `${spacing.xs} 0`,
};

const logoutButtonStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  color: colors.danger,
  fontSize: "0.9rem",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  padding: `${spacing.xs} 0`,
};
