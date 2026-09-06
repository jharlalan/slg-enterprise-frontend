/**
 * SLG Enterprise design tokens.
 *
 * Palette intent: earthy/agricultural base (khad, beej, dhan, makka)
 * blended with a modern-digital accent reserved for the CSC/Digital
 * Seva tile and interactive elements — so the accent reads as a
 * deliberate "this is also a digital service point" signal, not a
 * competing theme.
 *
 * Swap real brand colors in here once the shop logo is available;
 * every component reads from these tokens rather than hardcoding hex
 * values, so a palette change is a one-file edit.
 */

export const colors = {
  // Earthy / agricultural base
  harvestGold: "#C9982F", // primary brand warmth — wheat, grain
  leafGreen: "#4C7A3D", // growth, fertilizer, freshness
  soilBrown: "#6B4A32", // grounding neutral, used for text/borders
  huskCream: "#F6EFE1", // warm off-white background, not stark white

  // Modern-digital accent — reserved for CSC tile & interactive elements
  sevaTeal: "#1B7A8C",
  sevaTealLight: "#E4F3F5",

  // Functional
  success: "#3F8752",
  warning: "#D97706",
  danger: "#B3372C",
  textPrimary: "#2B2118",
  textSecondary: "#5C5148",
  border: "#E3D9C6",
  white: "#FFFFFF",
} as const;

export const typography = {
  // Devanagari + Latin pairing chosen to sit at equal visual weight,
  // since Hindi and English are always shown together, same size.
  fontFamilyDevanagari: "'Noto Sans Devanagari', sans-serif",
  fontFamilyLatin: "'Poppins', sans-serif",
  // Combined stack: browser picks the right glyphs from either family
  // per-character, so mixed Hindi/English strings render consistently.
  fontFamilyCombined:
    "'Poppins', 'Noto Sans Devanagari', sans-serif",

  // Sizes run larger than a typical dense web app — built for
  // quick recognition on a shop-floor tablet, not paragraph reading.
  scale: {
    tileLabel: "1.05rem",
    body: "1.1rem",
    heading: "1.5rem",
    displayHeading: "2rem",
    priceLarge: "1.75rem",
  },

  weight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  // Tap targets sized generously for shop-floor/tablet use, not
  // desktop-mouse-precision defaults.
  tapTargetMin: "56px",
} as const;

export const radii = {
  tile: "16px",
  button: "12px",
  pill: "999px",
} as const;

export const shadows = {
  tile: "0 2px 8px rgba(107, 74, 50, 0.12)",
  raised: "0 4px 16px rgba(107, 74, 50, 0.18)",
} as const;

/** Category accent colors — lets each product category (Khad/Beej/Anaj)
 * carry a distinct tint on top of the shared palette, for at-a-glance
 * recognition without reading text. */
export const categoryAccents = {
  khad: colors.leafGreen, // fertilizer
  beej: colors.harvestGold, // seeds
  anaj: "#A0632B", // grain (dhan/makka) — warm terracotta-brown
  other: colors.soilBrown,
  digitalSeva: colors.sevaTeal,
} as const;
