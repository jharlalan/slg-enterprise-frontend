/**
 * BarcodeLabel — a single printable label (product name in Hindi+English,
 * price, and the scannable barcode image). Designed to be rendered in a
 * grid for a full label sheet (e.g., printing 20 labels for a batch of
 * repacked rice bags) — the parent screen controls the grid layout;
 * this component is just one label's content.
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, spacing } from "@/theme/tokens";

export type BarcodeLabelProps = {
  hiName: string;
  enName: string;
  price: number;
  barcodeImageDataUri: string;
};

export function BarcodeLabel({ hiName, enName, price, barcodeImageDataUri }: BarcodeLabelProps) {
  return (
    <div
      style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: "6px",
        padding: spacing.sm,
        width: "220px",
        textAlign: "center",
        background: colors.white,
        breakInside: "avoid",
      }}
    >
      <BilingualLabel hi={hiName} en={enName} layout="stacked" size="tileLabel" />
      <div style={{ fontWeight: 700, fontSize: "1.2rem", color: colors.harvestGold, margin: "4px 0" }}>
        ₹{price.toFixed(2)}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={barcodeImageDataUri} alt="barcode" style={{ width: "100%" }} />
    </div>
  );
}
