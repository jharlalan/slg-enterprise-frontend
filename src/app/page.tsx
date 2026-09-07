/**
 * Home screen — tile-based navigation, not a nav-bar/menu, per the
 * icon-first / low-literacy-friendly design direction.
 *
 * "Digital Seva Kendra" (CSC) tile is intentionally informational only —
 * it opens a details panel describing available CSC services, with no
 * backend functionality behind it, per product decision.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { ServiceTile } from "@/components/ui/ServiceTile";
import { tokenStorage } from "@/services/tokenStorage";
import { categoryAccents, colors, spacing } from "@/theme/tokens";

export default function HomePage() {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(tokenStorage.getRoles().includes("OWNER"));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.huskCream,
        padding: spacing.lg,
      }}
    >
      <header style={{ marginBottom: spacing.xl, textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: spacing.sm }}>
          <a
            href="/login"
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: "999px",
              background: colors.white,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            👤 स्टाफ / Staff Login
          </a>
          <a
            href="/portal/login"
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: "999px",
              background: colors.sevaTealLight,
              border: `1px solid ${colors.sevaTeal}`,
              color: colors.sevaTeal,
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            📱 मेरा खाता / My Account
          </a>
          {isOwner && (
            <a
              href="/dashboard"
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: "999px",
                background: colors.leafGreen,
                border: `1px solid ${colors.leafGreen}`,
                color: colors.white,
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              📊 डैशबोर्ड / Dashboard
            </a>
          )}
          {isOwner && (
            <a
              href="/staff/create-cashier"
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: "999px",
                background: colors.harvestGold,
                border: `1px solid ${colors.harvestGold}`,
                color: colors.white,
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              ➕ कैशियर / Add Cashier
            </a>
          )}
        </div>
        <BilingualLabel
          hi="एस.एल.जी. एंटरप्राइज़"
          en="SLG Enterprise"
          size="displayHeading"
          weight="bold"
          layout="stacked"
        />
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: spacing.md,
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        <ServiceTile
          hiLabel="खाद, बीज और अनाज"
          enLabel="Fertilizer, Seeds & Grain"
          icon="🌾"
          accentColor={categoryAccents.khad}
          onClick={() => (window.location.href = "/inventory")}
        />
        <ServiceTile
          hiLabel="बिल बनाएं"
          enLabel="Make a Bill"
          icon="🧾"
          accentColor={categoryAccents.beej}
          onClick={() => (window.location.href = "/pos")}
        />
        <ServiceTile
          hiLabel="खाता / उधार"
          enLabel="Credit Ledger"
          icon="💰"
          accentColor={categoryAccents.anaj}
          onClick={() => (window.location.href = "/khata")}
        />
        <ServiceTile
          hiLabel="डिजिटल सेवा केंद्र"
          enLabel="Digital Seva Kendra"
          icon="📱"
          accentColor={categoryAccents.digitalSeva}
          onClick={() => (window.location.href = "/digital-seva")}
        />
      </section>
    </main>
  );
}
