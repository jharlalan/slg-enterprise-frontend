/**
 * ShopBillReceipt — matches the shop's actual reference bill design
 * (a polished Word template provided directly, not just the earlier
 * hand-fill paper pad). Colors were sampled from the real reference
 * image and the shop's own logo file, not guessed:
 *   - Green (#2E7D32) — sampled from the reference bill's table
 *     header AND independently confirmed as the exact color of the
 *     basket handle in the shop's own logo. Same color in both
 *     places, which is a strong signal this is the real brand green.
 *   - Orange (#E8982D) — the shop logo's ring/background color.
 *   - Cream (#FBF4E4) — the reference bill's header band background.
 *
 * Unlike the paper reference (a blank template meant to be hand-filled),
 * this renders REAL data directly — actual customer name/bill number/
 * date/village instead of blank underlined fields, and exactly as many
 * item rows as the order actually has (not a fixed 10 blank rows).
 *
 * Kept from the earlier version: payment status (Paid/Balance Due) and
 * the payment QR when there's a balance due — the reference template
 * has no place for this since it's a generic hand-fill form that
 * doesn't handle credit sales, but it's core to how khata actually
 * gets collected here. Still easy to remove if you'd rather match the
 * reference exactly with no payment info printed.
 *
 * Logo file: frontend/public/shop-logo.png (extracted directly from
 * the reference document) — swap this file to update the printed logo
 * without touching any code.
 */
import { useEffect, useState } from "react";
import { shopProfileService, type ShopProfile } from "@/services/shopProfileService";
import { formatDateTime } from "@/utils/dateFormat";
import type { Order } from "@/types/order";
import type { CustomerSummary } from "@/types/customer";

const BRAND_GREEN = "#2E7D32";
const BRAND_ORANGE = "#E8982D";
const CREAM_BG = "#FBF4E4";
const ROW_STRIPE = "#F7F4EB";

export type ShopBillReceiptProps = {
  order: Order;
  /** The customer selected on the POS page before billing (or null for
   * anonymous) — passed directly rather than re-fetched, since the
   * order response itself only carries customer_code, not phone/village. */
  customer: CustomerSummary | null;
};

export function ShopBillReceipt({ order, customer }: ShopBillReceiptProps) {
  const [shop, setShop] = useState<ShopProfile | null>(null);

  useEffect(() => {
    shopProfileService.get().then(setShop).catch(() => setShop(null));
  }, []);

  const customerName = customer?.full_name ?? "Walk-in Customer / अनाम ग्राहक";
  const customerAddress = customer?.address || customer?.village_code || "—";
  const addressLabel = customer?.address ? "Address" : "Village";
  const customerContact = customer?.phone ?? "—";

  return (
    <div
      className="shop-bill-receipt"
      style={{
        width: "100%",
        maxWidth: "620px",
        fontFamily: "'Noto Sans Devanagari', 'Poppins', sans-serif",
        color: "#2b2118",
        background: "#fff",
        border: "1px solid #e5ddc8",
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .shop-bill-receipt, .shop-bill-receipt * {
            visibility: visible;
            /* Browsers strip background colors by default when actually
               printing (not just previewing) — to save ink — unless told
               otherwise. Without this, the green table header, orange
               dividers, cream bands, and row stripes all print as plain
               white, even though they render fine on screen. */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .shop-bill-receipt { position: absolute; top: 0; left: 0; max-width: 100%; border: none; }
        }
        .bill-table { width: 100%; border-collapse: collapse; }
        .bill-table th { background: ${BRAND_GREEN}; color: #fff; padding: 8px 10px; font-size: 0.85rem; text-align: left; }
        .bill-table th.num, .bill-table td.num { text-align: right; }
        .bill-table th.center, .bill-table td.center { text-align: center; }
        .bill-table td { padding: 7px 10px; font-size: 0.88rem; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", background: CREAM_BG, padding: "16px 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/shop-logo.png" alt="Shop logo" style={{ width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: BRAND_GREEN, lineHeight: 1.2 }}>
            {shop?.name_line1 ?? "..."}
          </div>
          {shop?.name_line2 && (
            <div style={{ fontSize: "1rem", fontWeight: 700, color: BRAND_ORANGE, lineHeight: 1.3 }}>{shop.name_line2}</div>
          )}
          {shop?.address && <div style={{ fontSize: "0.8rem", marginTop: "2px" }}>{shop.address}</div>}
          {shop?.phone_numbers && <div style={{ fontSize: "0.8rem" }}>☎ {shop.phone_numbers}</div>}
        </div>
      </div>
      <div style={{ height: "3px", background: BRAND_ORANGE }} />

      {/* Title */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: "1.15rem", color: BRAND_GREEN, letterSpacing: "1px", margin: "14px 0" }}>
        BILL / RECEIPT
      </div>

      {/* Customer info */}
      <div style={{ padding: "0 20px", fontSize: "0.88rem" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <InfoField label="Name" value={customerName} flex={2} />
          <InfoField label="Bill No" value={order.invoice_number} flex={1} />
          <InfoField label="Date" value={formatDateTime(order.created_at)} flex={1} />
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
          <InfoField label={addressLabel} value={customerAddress} flex={2} />
          <InfoField label="Contact" value={customerContact} flex={1} />
        </div>
      </div>

      {/* Item table */}
      <div style={{ padding: "14px 20px 0" }}>
        <table className="bill-table">
          <thead>
            <tr>
              <th className="center" style={{ width: "40px" }}>Sl.No.</th>
              <th>Description</th>
              <th className="center" style={{ width: "70px" }}>Qty</th>
              <th className="num" style={{ width: "90px" }}>Rate</th>
              <th className="num" style={{ width: "100px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.product_id} style={{ background: index % 2 === 1 ? ROW_STRIPE : "#fff" }}>
                <td className="center">{index + 1}</td>
                <td>{item.name}</td>
                <td className="center">{item.quantity}</td>
                <td className="num">₹{item.unit_price.toFixed(2)}</td>
                <td className="num">₹{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ minWidth: "240px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
          <TotalRow label="Subtotal" value={order.gross_total} />
          {order.discount_amount > 0 && (
            <TotalRow label={`Discount (${order.discount_percent.toFixed(1)}%)`} value={-order.discount_amount} />
          )}
          <div style={{ background: CREAM_BG, borderTop: `2px solid ${BRAND_ORANGE}`, borderBottom: `2px solid ${BRAND_ORANGE}`, padding: "6px 8px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", color: BRAND_GREEN }}>
            <span>Total</span>
            <span>₹{order.net_total.toFixed(2)}</span>
          </div>
          <TotalRow label="Paid" value={order.amount_paid} />
          {order.debt_added > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#B3372C", fontWeight: 700 }}>
              <span>Balance Due</span>
              <span>₹{order.debt_added.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment QR — only when there's a balance due */}
      {order.upi_qr_image && (
        <div style={{ textAlign: "center", padding: "0 20px 14px" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: "4px" }}>Scan to Pay Balance</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.upi_qr_image} alt="UPI QR" style={{ width: "110px", height: "110px" }} />
        </div>
      )}

      {/* Signatures */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "28px 20px 14px", fontSize: "0.85rem" }}>
        <div style={{ borderTop: "1px solid #999", paddingTop: "4px", width: "42%", textAlign: "center" }}>
          Seller Signature
        </div>
        <div style={{ borderTop: "1px solid #999", paddingTop: "4px", width: "42%", textAlign: "center" }}>
          Customer Signature
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: "2px", background: BRAND_ORANGE }} />
      <div style={{ textAlign: "center", padding: "10px 20px" }}>
        <div style={{ fontStyle: "italic", fontWeight: 700, color: BRAND_GREEN, fontSize: "0.9rem" }}>
          Thank you for shopping with us!
        </div>
        {shop && (
          <div style={{ fontSize: "0.7rem", color: "#777", marginTop: "2px" }}>
            {shop.name_line1} · {shop.name_line2} · {shop.address}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, flex }: { label: string; value: string; flex: number }) {
  return (
    <div style={{ flex, borderBottom: "1px dotted #ccc", paddingBottom: "2px" }}>
      <span style={{ fontWeight: 700, color: BRAND_GREEN }}>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span>₹{value.toFixed(2)}</span>
    </div>
  );
}
