/**
 * ServiceTile
 *
 * The core icon-first, large-tap-target building block used on the home
 * screen (service categories) and POS (product tiles). Icon defaults to
 * a flat SVG/emoji-style icon per product decision, but accepts an
 * `imageUrl` override so real photography can replace any tile later
 * without a component rewrite — swapping the icon is a data change,
 * not a redesign.
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, shadows, spacing } from "@/theme/tokens";

export type ServiceTileProps = {
  hiLabel: string;
  enLabel: string;
  /** Flat icon (emoji or inline SVG string) shown by default. */
  icon?: React.ReactNode;
  /** Real photo — overrides `icon` when provided. */
  imageUrl?: string;
  accentColor?: string;
  price?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function ServiceTile({
  hiLabel,
  enLabel,
  icon,
  imageUrl,
  accentColor = colors.leafGreen,
  price,
  onClick,
  disabled = false,
}: ServiceTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        minHeight: "140px",
        minWidth: "120px",
        padding: spacing.md,
        borderRadius: radii.tile,
        border: `2px solid ${accentColor}22`,
        borderTop: `4px solid ${accentColor}`,
        background: colors.white,
        boxShadow: shadows.tile,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          borderRadius: radii.pill,
          background: `${accentColor}18`,
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={enLabel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          icon
        )}
      </div>

      <BilingualLabel hi={hiLabel} en={enLabel} layout="stacked" size="tileLabel" />

      {price && (
        <span style={{ fontWeight: 700, color: accentColor, fontSize: typographyPriceSize }}>
          {price}
        </span>
      )}
    </button>
  );
}

const typographyPriceSize = "1.1rem";
