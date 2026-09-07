/**
 * ThermalReceipt — sized for browser printing to an 80mm thermal
 * printer (configured as a system printer, using the browser's own
 * print dialog — see note below). Shows the QR only when debt was
 * added on this bill, since a fully-paid sale has nothing to collect.
 *
 * NOTE ON PRINTING APPROACH: rather than generating raw ESC/POS
 * command bytes (which requires direct printer driver access), this
 * renders a properly-sized HTML receipt and relies on the browser's
 * print dialog — the common approach for web-based POS systems with
 * thermal printers set up as a standard system/USB printer. This is a
 * deliberate scope simplification; true ESC/POS byte generation can be
 * added later if the printer setup requires it.
 */
import { colors } from "@/theme/tokens";
import type { Order } from "@/types/order";

export type ThermalReceiptProps = {
  order: Order;
  shopName?: string;
};

export function ThermalReceipt({ order, shopName = "SLG Enterprise" }: ThermalReceiptProps) {
  return (
    <div
      className="thermal-receipt"
      style={{
        width: "300px", // ~80mm at typical screen DPI
        padding: "12px",
        fontFamily: "'Courier New', monospace",
        fontSize: "12px",
        color: "#000",
        background: "#fff",
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .thermal-receipt, .thermal-receipt * { visibility: visible; }
          .thermal-receipt { position: absolute; top: 0; left: 0; }
        }
      `}</style>

      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>{shopName}</div>
      <div style={{ textAlign: "center" }}>खाद, बीज, अनाज / Fertilizer, Seeds, Grain</div>
      <hr />
      <div>बिल / Invoice: {order.invoice_number}</div>
      <div>{new Date(order.created_at).toLocaleString()}</div>
      {order.customer_code && <div>ग्राहक / Customer: {order.customer_code}</div>}
      <hr />

      {order.items.map((item) => (
        <div key={item.product_id} style={{ marginBottom: "4px" }}>
          <div>{item.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {item.quantity} x ₹{item.unit_price.toFixed(2)}
            </span>
            <span>₹{item.subtotal.toFixed(2)}</span>
          </div>
        </div>
      ))}

      <hr />
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
        <span>कुल / Total</span>
        <span>₹{order.net_total.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>जमा / Paid</span>
        <span>₹{order.amount_paid.toFixed(2)}</span>
      </div>
      {order.debt_added > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", color: colors.danger }}>
          <span>बकाया / Balance Due</span>
          <span>₹{order.debt_added.toFixed(2)}</span>
        </div>
      )}

      {order.upi_qr_image && (
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <div style={{ marginBottom: "4px" }}>स्कैन करके भुगतान करें / Scan to Pay</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.upi_qr_image} alt="UPI QR" style={{ width: "140px", height: "140px" }} />
        </div>
      )}

      <hr />
      <div style={{ textAlign: "center" }}>धन्यवाद / Thank You</div>
    </div>
  );
}
