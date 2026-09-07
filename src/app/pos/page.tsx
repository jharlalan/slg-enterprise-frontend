/**
 * POS screen — the cashier's main working screen. Flow:
 *   1. Scan (or the barcode listener catches hardware scanner input
 *      globally) -> look up product -> add/increment cart line.
 *   2. Adjust quantities via steppers, optionally override a price.
 *   3. Choose payment mode; if SPLIT/CREDIT, identify the customer
 *      (existing customers found by phone auto-fill; new ones need
 *      name + village, matching the backend's auto-onboarding rule).
 *   4. Submit -> receive the created order -> show a printable receipt.
 */
"use client";

import { useState } from "react";
import { BarcodeScannerListener } from "@/components/shared/BarcodeScannerListener";
import { CartTable } from "@/components/pos/CartTable";
import { ManualAddPanel } from "@/components/pos/ManualAddPanel";
import { PriceOverrideModal } from "@/components/pos/PriceOverrideModal";
import { PaymentPanel } from "@/components/pos/PaymentPanel";
import { ThermalReceipt } from "@/components/print/ThermalReceipt";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { productService } from "@/services/productService";
import { customerService } from "@/services/customerService";
import { orderService } from "@/services/orderService";
import { ApiError } from "@/services/apiClient";
import { colors, spacing } from "@/theme/tokens";
import type { CartLine, Order, PaymentMode } from "@/types/order";
import type { Product } from "@/types/product";

export default function POSPage() {
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<CartLine | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFullName, setCustomerFullName] = useState("");
  const [villageCode, setVillageCode] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const grossTotal = cartLines.reduce(
    (sum, line) => sum + (line.overridePrice ?? line.defaultPrice) * line.quantity,
    0
  );
  const netTotal = Math.round((grossTotal * (1 - discountPercent / 100)) * 100) / 100;

  function addProductToCart(product: Product) {
    setCartLines((prev) => {
      const existing = prev.find((l) => l.barcode === product.barcode);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev; // can't exceed stock
        return prev.map((l) =>
          l.barcode === product.barcode ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          barcode: product.barcode,
          productId: product.id,
          name: product.name,
          unit: product.unit_of_measure,
          defaultPrice: product.default_selling_price,
          quantity: 1,
          availableStock: product.stock_quantity,
        },
      ];
    });
  }

  async function handleScan(barcode: string): Promise<{ success: boolean; message: string }> {
    setScanError(null);
    try {
      const product = await productService.getByBarcode(barcode);
      addProductToCart(product);
      return { success: true, message: product.name };
    } catch (err) {
      const message = err instanceof ApiError ? `${err.message} (${barcode})` : "स्कैन विफल / Scan failed";
      setScanError(message);
      return { success: false, message };
    }
  }

  function handleQuantityChange(barcode: string, newQuantity: number) {
    setCartLines((prev) =>
      newQuantity === 0
        ? prev.filter((l) => l.barcode !== barcode)
        : prev.map((l) => (l.barcode === barcode ? { ...l, quantity: newQuantity } : l))
    );
  }

  function handleRemove(barcode: string) {
    setCartLines((prev) => prev.filter((l) => l.barcode !== barcode));
  }

  function handleConfirmOverride(newPrice: number) {
    if (!overrideTarget) return;
    setCartLines((prev) =>
      prev.map((l) =>
        l.barcode === overrideTarget.barcode ? { ...l, overridePrice: newPrice } : l
      )
    );
    setOverrideTarget(null);
  }

  async function handlePaymentModeChange(mode: PaymentMode) {
    setPaymentMode(mode);
    setAmountPaid(mode === "CASH" || mode === "UPI" ? netTotal : 0);
  }

  async function handleCustomerPhoneChange(phone: string) {
    setCustomerPhone(phone);
    if (phone.length >= 10) {
      try {
        const existing = await customerService.findByPhone(phone);
        setIsNewCustomer(!existing);
        if (existing) {
          setCustomerFullName(existing.full_name);
          setVillageCode(existing.village_code);
        }
      } catch (err) {
        // Non-fatal: if lookup fails (e.g. session expired), just treat
        // as a new customer and let the cashier type details manually —
        // don't crash the page over a background lookup.
        setSubmitError(err instanceof ApiError ? err.message : null);
        setIsNewCustomer(true);
      }
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (cartLines.length === 0) {
      setSubmitError("टोकरी खाली है / Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const order = await orderService.create({
        customer_phone: customerPhone || undefined,
        customer_full_name: customerFullName || undefined,
        village_code: villageCode || undefined,
        items: cartLines.map((l) => ({
          barcode: l.barcode,
          quantity: l.quantity,
          unit_price_override: l.overridePrice,
        })),
        amount_paid: paymentMode === "CASH" || paymentMode === "UPI" ? netTotal : amountPaid,
        payment_mode: paymentMode,
        discount_percent: discountPercent,
      });
      setCompletedOrder(order);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "बिल बनाने में त्रुटि / Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewSale() {
    setCartLines([]);
    setCompletedOrder(null);
    setCustomerPhone("");
    setCustomerFullName("");
    setVillageCode("");
    setPaymentMode("CASH");
    setAmountPaid(0);
    setDiscountPercent(0);
  }

  if (completedOrder) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <div style={{ maxWidth: "340px", margin: "0 auto" }}>
          <ThermalReceipt order={completedOrder} />
          <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.md }}>
            <button onClick={() => window.print()} style={actionButtonStyle}>
              प्रिंट करें / Print
            </button>
            <button onClick={startNewSale} style={{ ...actionButtonStyle, background: colors.leafGreen, color: colors.white }}>
              नई बिक्री / New Sale
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <BarcodeScannerListener onScan={handleScan} global>
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <BilingualLabel hi="बिल बनाएं" en="Point of Sale" size="displayHeading" weight="bold" layout="stacked" />

        {scanError && (
          <p style={{ color: colors.danger, marginTop: spacing.sm }}>{scanError}</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: spacing.lg,
            marginTop: spacing.lg,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <ManualAddPanel
              onAddByBarcode={handleScan}
              onAddProduct={addProductToCart}
            />
            <CartTable
              lines={cartLines}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              onRequestPriceOverride={(barcode) =>
                setOverrideTarget(cartLines.find((l) => l.barcode === barcode) ?? null)
              }
            />
          </div>

          <PaymentPanel
            grossTotal={grossTotal}
            discountPercent={discountPercent}
            onDiscountPercentChange={setDiscountPercent}
            netTotal={netTotal}
            paymentMode={paymentMode}
            amountPaid={amountPaid}
            customerPhone={customerPhone}
            customerFullName={customerFullName}
            villageCode={villageCode}
            isNewCustomer={isNewCustomer}
            onPaymentModeChange={handlePaymentModeChange}
            onAmountPaidChange={setAmountPaid}
            onCustomerPhoneChange={handleCustomerPhoneChange}
            onCustomerFullNameChange={setCustomerFullName}
            onVillageCodeChange={setVillageCode}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>

        {submitError && <p style={{ color: colors.danger, marginTop: spacing.md }}>{submitError}</p>}

        {overrideTarget && (
          <PriceOverrideModal
            productName={overrideTarget.name}
            defaultPrice={overrideTarget.defaultPrice}
            currentOverride={overrideTarget.overridePrice}
            onConfirm={handleConfirmOverride}
            onCancel={() => setOverrideTarget(null)}
          />
        )}
      </main>
    </BarcodeScannerListener>
  );
}

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: spacing.md,
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
  background: colors.white,
};
