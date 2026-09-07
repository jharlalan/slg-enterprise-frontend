/**
 * Inventory screen — goods intake, barcode scan-to-find, a low-stock
 * alert strip, and now (previously missing entirely) an actual
 * Add/Edit Product form. Available to both Owner and Cashier — see
 * ProductFormModal's docstring for the exact permission decisions.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { ServiceTile } from "@/components/ui/ServiceTile";
import { BarcodeScannerListener } from "@/components/shared/BarcodeScannerListener";
import { ProductFormModal, type ProductFormValues } from "@/components/inventory/ProductFormModal";
import { productService } from "@/services/productService";
import { ApiError } from "@/services/apiClient";
import { categoryAccents, colors, radii, spacing } from "@/theme/tokens";
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

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  function openAddForm() {
    setEditingProduct(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSaveProduct(values: ProductFormValues) {
    setSaving(true);
    setFormError(null);
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, {
          name: values.name,
          category: values.category,
          cost_price: parseFloat(values.cost_price),
          default_selling_price: parseFloat(values.default_selling_price),
          low_stock_threshold: parseFloat(values.low_stock_threshold),
        });
      } else {
        await productService.create({
          name: values.name,
          category: values.category,
          unit_of_measure: values.unit_of_measure,
          cost_price: parseFloat(values.cost_price),
          default_selling_price: parseFloat(values.default_selling_price),
          stock_quantity: parseFloat(values.stock_quantity) || 0,
          low_stock_threshold: parseFloat(values.low_stock_threshold) || 0,
          barcode: values.barcode || undefined,
        });
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "सहेजने में त्रुटि / Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BarcodeScannerListener onScan={handleScan} global>
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
          <BilingualLabel
            hi="खाद, बीज और अनाज सूची"
            en="Goods Inventory"
            size="displayHeading"
            weight="bold"
            layout="stacked"
          />
          <button
            onClick={openAddForm}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: radii.pill,
              border: "none",
              background: colors.leafGreen,
              color: colors.white,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: spacing.tapTargetMin,
            }}
          >
            ➕ नया उत्पाद / Add Product
          </button>
        </div>

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
                onClick={() => openEditForm(product)}
              />
            ))}
        </section>

        {showForm && (
          <ProductFormModal
            editingProduct={editingProduct}
            onSave={handleSaveProduct}
            onClose={() => setShowForm(false)}
            saving={saving}
            error={formError}
          />
        )}
      </main>
    </BarcodeScannerListener>
  );
}
