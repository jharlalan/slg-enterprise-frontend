/**
 * Inventory screen — goods intake, barcode scan-to-find, and a
 * low-stock alert strip. Product tiles reuse the same icon-first
 * ServiceTile pattern as the home screen for visual consistency.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { ServiceTile } from "@/components/ui/ServiceTile";
import { BarcodeScannerListener } from "@/components/pos/BarcodeScannerListener";
import { productService } from "@/services/productService";
import { ApiError } from "@/services/apiClient";
import { categoryAccents, colors, spacing } from "@/theme/tokens";
import type { Product } from "@/types/product";

const CATEGORY_ICON: Record<string, string> = {
  KHAD: "🌱",
  BEEJ: "🌾",
  ANAJ: "🌽",
  OTHER: "📦",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [all, low] = await Promise.all([
        productService.list(),
        productService.lowStock(),
      ]);
      setProducts(all);
      setLowStock(low);
    } catch (err) {
      // ApiError already carries a friendly message from the backend envelope
      setScanMessage(err instanceof ApiError ? err.message : "कुछ गलत हुआ / Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleScan(barcode: string) {
    try {
      const product = await productService.getByBarcode(barcode);
      setScanMessage(`मिला / Found: ${product.name} — स्टॉक/Stock: ${product.stock_quantity} ${product.unit_of_measure}`);
    } catch (err) {
      setScanMessage(
        err instanceof ApiError
          ? `${err.message} (barcode: ${barcode})`
          : "उत्पाद नहीं मिला / Product not found"
      );
    }
  }

  return (
    <BarcodeScannerListener onScan={handleScan} global>
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <BilingualLabel
          hi="खाद, बीज और अनाज सूची"
          en="Goods Inventory"
          size="displayHeading"
          weight="bold"
          layout="stacked"
        />

        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            background: colors.white,
            borderRadius: "12px",
            border: `1px solid ${colors.border}`,
          }}
        >
          <BilingualLabel hi="बारकोड स्कैन करें" en="Scan a barcode to look up stock" size="body" />
          {scanMessage && (
            <p style={{ marginTop: spacing.sm, color: colors.textSecondary }}>{scanMessage}</p>
          )}
        </div>

        {lowStock.length > 0 && (
          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              background: "#FFF4E5",
              border: `1px solid ${colors.warning}`,
              borderRadius: "12px",
            }}
          >
            <BilingualLabel hi="कम स्टॉक चेतावनी" en="Low Stock Alert" weight="bold" color={colors.warning} />
            <ul style={{ marginTop: spacing.sm }}>
              {lowStock.map((p) => (
                <li key={p.id}>
                  {p.name} — {p.stock_quantity} {p.unit_of_measure} बचा है / left
                </li>
              ))}
            </ul>
          </div>
        )}

        <section
          style={{
            marginTop: spacing.lg,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: spacing.md,
          }}
        >
          {loading && <p>लोड हो रहा है / Loading...</p>}
          {!loading &&
            products.map((product) => (
              <ServiceTile
                key={product.id}
                hiLabel={product.name}
                enLabel={`${product.stock_quantity} ${product.unit_of_measure}`}
                icon={CATEGORY_ICON[product.category] ?? "📦"}
                accentColor={
                  categoryAccents[product.category.toLowerCase() as keyof typeof categoryAccents] ??
                  categoryAccents.other
                }
                price={`₹${product.default_selling_price.toFixed(2)}`}
                disabled={product.is_low_stock}
              />
            ))}
        </section>
      </main>
    </BarcodeScannerListener>
  );
}
