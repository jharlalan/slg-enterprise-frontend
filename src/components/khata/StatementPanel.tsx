/**
 * StatementPanel — shows one customer's full ledger (DEBIT/CREDIT
 * entries with running balance), a form to record an in-person
 * payment, and a one-click reminder button, per the spec's "on-demand
 * (one-click) reminders" requirement.
 */
import { useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { khataService } from "@/services/khataService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import { formatPhoneForDisplay } from "@/utils/phone";
import type { CustomerStatement } from "@/types/khata";

export type StatementPanelProps = {
  statement: CustomerStatement;
  onRefresh: () => void;
};

export function StatementPanel({ statement, onRefresh }: StatementPanelProps) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"CASH" | "UPI">("CASH");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { customer, entries } = statement;

  async function handleRecordPayment() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    setMessage(null);
    try {
      await khataService.recordPayment(customer.id, value, mode);
      setAmount("");
      setMessage("भुगतान दर्ज हुआ / Payment recorded");
      onRefresh();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReminder() {
    setBusy(true);
    setMessage(null);
    try {
      const sent = await khataService.sendReminder(customer.id);
      setMessage(sent ? "याद दिलाया गया / Reminder sent" : "भेजने में विफल / Failed to send");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "त्रुटि / Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <BilingualLabel hi={customer.full_name} en={customer.customer_id} size="heading" weight="bold" layout="stacked" />
        {customer.verified && (
          <span title="Verified customer" style={{ color: colors.success, fontSize: "1rem", fontWeight: 700 }}>
            ✓
          </span>
        )}
      </span>
      <p style={{ color: colors.textSecondary }}>गाँव / Village: {customer.village_code} · {formatPhoneForDisplay(customer.phone)}</p>

      <div style={{ display: "flex", gap: spacing.lg, margin: `${spacing.md} 0` }}>
        <div>
          <div style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>बकाया / Current Debt</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: colors.danger }}>
            ₹{customer.current_debt.toFixed(2)}
          </div>
        </div>
        {customer.credit_limit !== null && (
          <div>
            <div style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>सलाहकार सीमा / Advisory Limit</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>₹{customer.credit_limit.toFixed(2)}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: spacing.sm, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <BilingualLabel hi="राशि" en="Amount" size="tileLabel" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}`, width: "120px" }}
          />
        </div>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "CASH" | "UPI")}
          style={{ padding: spacing.sm, borderRadius: radii.button, border: `1px solid ${colors.border}` }}
        >
          <option value="CASH">नकद / Cash</option>
          <option value="UPI">यूपीआई / UPI</option>
        </select>
        <button onClick={handleRecordPayment} disabled={busy} style={primaryButtonStyle}>
          भुगतान दर्ज करें / Record Payment
        </button>
        <button onClick={handleReminder} disabled={busy} style={secondaryButtonStyle}>
          🔔 याद दिलाएं / Send Reminder
        </button>
      </div>

      {message && <p style={{ marginTop: spacing.sm, color: colors.textSecondary }}>{message}</p>}

      <div style={{ marginTop: spacing.lg }}>
        <BilingualLabel hi="लेन-देन इतिहास" en="Transaction History" weight="bold" />
        <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "6px" }}>
          {entries.length === 0 && (
            <p style={{ color: colors.textSecondary }}>कोई लेन-देन नहीं / No transactions yet</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: spacing.sm,
                borderBottom: `1px solid ${colors.border}`,
                fontSize: "0.9rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {entry.transaction_type === "DEBIT" ? "बिल / Charge" : "भुगतान / Payment"}
                  {entry.invoice_number && ` — ${entry.invoice_number}`}
                </div>
                <div style={{ color: colors.textSecondary }}>
                  {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: entry.transaction_type === "DEBIT" ? colors.danger : colors.success, fontWeight: 700 }}>
                  {entry.transaction_type === "DEBIT" ? "+" : "−"}₹{entry.amount.toFixed(2)}
                </div>
                <div style={{ color: colors.textSecondary }}>शेष / Balance: ₹{entry.running_balance.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: "44px",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.sevaTeal}`,
  background: colors.sevaTealLight,
  color: colors.sevaTeal,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: "44px",
};
