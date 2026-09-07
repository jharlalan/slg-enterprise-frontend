/**
 * ManualAddPanel — two ways to add an item to the cart without a
 * physical barcode scanner (which isn't set up yet): typing the
 * barcode directly, or searching by product name and picking from
 * results. Once a hardware scanner is available, BarcodeScannerListener
 * (already wired globally on this page) continues to work exactly the
 * same alongside these — none of this needs to change then.
 */
import { useEffect, useRef, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { CameraBarcodeScanner } from "@/components/pos/CameraBarcodeScanner";
import { productService } from "@/services/productService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { Product } from "@/types/product";

export type ManualAddPanelProps = {
  /** Returns success/failure so both the manual-entry form and the
   * camera scanner can show real feedback (a wrong barcode shows an
   * error, not a false "added"). */
  onAddByBarcode: (barcode: string) => Promise<{ success: boolean; message: string }>;
  onAddProduct: (product: Product) => void;
};

export function ManualAddPanel({ onAddByBarcode, onAddProduct }: ManualAddPanelProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await productService.list({ search: searchTerm.trim() });
        setSearchResults(results);
      } catch (err) {
        setSearchResults([]);
        setSearchError(err instanceof ApiError ? err.message : "खोज विफल / Search failed");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    void onAddByBarcode(manualBarcode.trim()); // result surfaces via the parent's own error state
    setManualBarcode("");
  }

  function handlePickResult(product: Product) {
    onAddProduct(product);
    setSearchTerm("");
    setSearchResults([]);
  }

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.md, border: `1px solid ${colors.border}` }}>
      <BilingualLabel hi="बारकोड डालें या नाम खोजें" en="Enter barcode or search by name" size="body" />

      <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
        <input
          type="text"
          placeholder="बारकोड / Barcode"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={addButtonStyle}>
          ➕ जोड़ें / Add
        </button>
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          style={cameraButtonStyle}
          aria-label="Scan with camera"
        >
          📷 कैमरा / Camera
        </button>
      </form>

      {showCamera && (
        <CameraBarcodeScanner onDetected={onAddByBarcode} onClose={() => setShowCamera(false)} />
      )}

      <div style={{ position: "relative", marginTop: spacing.sm }}>
        <input
          type="text"
          placeholder="उत्पाद नाम खोजें / Search product name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
        {searching && <p style={{ fontSize: "0.85rem", color: colors.textSecondary, margin: `${spacing.xs} 0 0` }}>खोज रहे हैं / Searching...</p>}
        {searchError && <p style={{ fontSize: "0.85rem", color: colors.danger, margin: `${spacing.xs} 0 0` }}>{searchError}</p>}
        {searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.button,
              marginTop: "4px",
              maxHeight: "240px",
              overflowY: "auto",
              zIndex: 50,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handlePickResult(product)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: spacing.sm,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
                  ₹{product.default_selling_price.toFixed(2)} — स्टॉक/Stock: {product.stock_quantity} {product.unit_of_measure}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const addButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const cameraButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.sevaTeal,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
