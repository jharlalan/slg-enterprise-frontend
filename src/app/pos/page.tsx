/**
 * POS screen — the cashier's main working screen. Flow:
 *   1. Select customer FIRST (search & pick, quick-create, or explicit
 *      anonymous) — the cart/scan UI stays locked until this resolves.
 *      A persistent CustomerInfoCard then stays visible throughout.
 *   2. Scan (or the barcode listener catches hardware scanner input
 *      globally) -> look up product -> add/increment cart line.
 *   3. Adjust quantities via steppers, optionally override a price.
 *   4. Choose payment mode — CREDIT/SPLIT are disabled if the customer
 *      is anonymous (the backend requires a customer for those modes
 *      anyway; disabling upfront avoids a failed submission).
 *   5. Submit -> receive the created order -> show a printable bill
 *      (ShopBillReceipt, matching the shop's real paper bill format).
 */
"use client";

import { useState } from "react";
import { BarcodeScannerListener } from "@/components/shared/BarcodeScannerListener";
import { CartTable } from "@/components/pos/CartTable";
import { AddProductLauncher } from "@/components/pos/AddProductLauncher";
import { PriceOverrideModal } from "@/components/pos/PriceOverrideModal";
import { PaymentPanel } from "@/components/pos/PaymentPanel";
import { CustomerSelectionStep } from "@/components/pos/CustomerSelectionStep";
import { CustomerInfoCard } from "@/components/pos/CustomerInfoCard";
import { ShopBillReceipt } from "@/components/print/ShopBillReceipt";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { productService } from "@/services/productService";
import { orderService } from "@/services/orderService";
import { ApiError } from "@/services/apiClient";
import { colors, spacing } from "@/theme/tokens";
import type { CartLine, Order, PaymentMode } from "@/types/order";
import type { Product } from "@/types/product";
import type { CustomerSummary } from "@/types/customer";

type CustomerChoice = "pending" | "resolved";

export default function POSPage() {
  const [customerChoice, setCustomerChoice] = useState<CustomerChoice>("pending");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null); // null + resolved = anonymous

  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<CartLine | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountMode, setDiscountMode] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const grossTotal = cartLines.reduce(
    (sum, line) => sum + (line.overridePrice ?? line.defaultPrice) * line.quantity,
    0
  );
  const discountAmountValue =
    discountMode === "amount" ? Math.min(discountValue, grossTotal) : grossTotal * (discountValue / 100);
  const netTotal = Math.round((grossTotal - discountAmountValue) * 100) / 100;

  function handleCustomerSelected(customer: CustomerSummary) {
    setSelectedCustomer(customer);
    setCustomerChoice("resolved");
  }

  function handleAnonymous() {
    setSelectedCustomer(null);
    setCustomerChoice("resolved");
  }

  function handleChangeCustomer() {
    setCustomerChoice("pending");
    // Cart contents are deliberately preserved — only the customer
    // choice resets. If the new choice is anonymous and payment mode
    // was CREDIT/SPLIT, that combination gets caught by the disabled
    // state in PaymentPanel before submission.
  }

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

  async function handleSubmit() {
    setSubmitError(null);
    if (cartLines.length === 0) {
      setSubmitError("टोकरी खाली है / Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const order = await orderService.create({
        customer_phone: selectedCustomer?.phone,
        items: cartLines.map((l) => ({
          barcode: l.barcode,
          quantity: l.quantity,
          unit_price_override: l.overridePrice,
        })),
        amount_paid: paymentMode === "CASH" || paymentMode === "UPI" ? netTotal : amountPaid,
        payment_mode: paymentMode,
        discount_percent: discountMode === "percent" ? discountValue : 0,
        discount_amount: discountMode === "amount" ? discountValue : undefined,
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
    setCustomerChoice("pending");
    setSelectedCustomer(null);
    setPaymentMode("CASH");
    setAmountPaid(0);
    setDiscountMode("percent");
    setDiscountValue(0);
  }

  if (completedOrder) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <ShopBillReceipt order={completedOrder} customer={selectedCustomer} />
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

        <div style={{ marginTop: spacing.lg }}>
          {customerChoice === "pending" ? (
            <CustomerSelectionStep onSelect={handleCustomerSelected} onAnonymous={handleAnonymous} />
          ) : (
            <CustomerInfoCard customer={selectedCustomer} onChange={handleChangeCustomer} />
          )}
        </div>

        {scanError && (
          <p style={{ color: colors.danger, marginTop: spacing.sm }}>{scanError}</p>
        )}

        {customerChoice === "resolved" && (
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
              <div>
                <AddProductLauncher
                  onAddByBarcode={handleScan}
                  onAddProduct={addProductToCart}
                />
              </div>
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
              discountMode={discountMode}
              discountValue={discountValue}
              onDiscountModeChange={setDiscountMode}
              onDiscountValueChange={setDiscountValue}
              netTotal={netTotal}
              paymentMode={paymentMode}
              amountPaid={amountPaid}
              customerIsAnonymous={selectedCustomer === null}
              onPaymentModeChange={handlePaymentModeChange}
              onAmountPaidChange={setAmountPaid}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        )}

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
