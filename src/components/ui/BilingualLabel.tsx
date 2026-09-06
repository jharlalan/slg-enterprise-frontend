/**
 * BilingualLabel
 *
 * Every label, button, and heading in this app shows Hindi and English
 * together, at the same visual weight — this is a hard product
 * requirement (villager-first audience, no single-language toggle).
 *
 * Rather than every screen hand-rolling "Hindi / English" text, this
 * component is the single place that owns that layout rule. Changing
 * how bilingual text is displayed app-wide (e.g., stacked vs inline
 * on small screens) means editing this one file.
 */
import { colors, typography } from "@/theme/tokens";

export type BilingualLabelProps = {
  hi: string;
  en: string;
  /** "inline" = "हिंदी / English" on one line (default, used in most tiles).
   *  "stacked" = Hindi on top, English below — used when space is tight
   *  or the label needs to wrap independently in each script. */
  layout?: "inline" | "stacked";
  size?: keyof typeof typography.scale;
  weight?: keyof typeof typography.weight;
  color?: string;
  as?: "span" | "div" | "h1" | "h2" | "h3";
};

export function BilingualLabel({
  hi,
  en,
  layout = "inline",
  size = "tileLabel",
  weight = "medium",
  color = colors.textPrimary,
  as: Tag = "span",
}: BilingualLabelProps) {
  const sharedStyle: React.CSSProperties = {
    fontFamily: typography.fontFamilyCombined,
    fontSize: typography.scale[size],
    fontWeight: typography.weight[weight],
    color,
    lineHeight: 1.3,
  };

  if (layout === "stacked") {
    return (
      <Tag style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={sharedStyle}>{hi}</span>
        <span style={{ ...sharedStyle, color: colors.textSecondary, fontSize: "0.85em" }}>
          {en}
        </span>
      </Tag>
    );
  }

  return (
    <Tag style={{ ...sharedStyle, display: "inline-flex", gap: 6, alignItems: "baseline" }}>
      <span>{hi}</span>
      <span style={{ color: colors.textSecondary }}>/</span>
      <span>{en}</span>
    </Tag>
  );
}
