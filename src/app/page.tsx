/**
 * Home screen — tile-based navigation, not a nav-bar/menu, per the
 * icon-first / low-literacy-friendly design direction.
 *
 * "Digital Seva Kendra" (CSC) tile is intentionally informational only —
 * it opens a details panel describing available CSC services, with no
 * backend functionality behind it, per product decision.
 *
 * Login state, profile, and role-based shortcuts (Dashboard, Add
 * Cashier) live in the global AppHeader (rendered in the root layout)
 * rather than here — this page used to hardcode all of that itself,
 * which meant those shortcuts only existed on this one screen.
 */
"use client";

import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { ServiceTile } from "@/components/ui/ServiceTile";
import { categoryAccents, colors, spacing } from "@/theme/tokens";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.huskCream,
        padding: spacing.lg,
      }}
    >
      <header style={{ marginBottom: spacing.xl, textAlign: "center" }}>
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
