/**
 * Owner Dashboard — the one-stop summary view. Village-wise debt and
 * aging buckets already have a full, interactive view on the Khata
 * page (Batch 4) — rather than duplicate that UI, this shows a
 * condensed top-N version with a link out to the full page.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { dashboardService } from "@/services/dashboardService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { DashboardSummary } from "@/types/dashboard";

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "नकद / Cash",
  UPI: "यूपीआई / UPI",
  SPLIT: "आंशिक / Split",
  CREDIT: "उधार / Credit",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService
      .getSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "लोड करने में त्रुटि / Failed to load"));
  }, []);

  if (error) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <p style={{ color: colors.danger }}>{error}</p>
      </main>
    );
  }

  if (!summary) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <p>लोड हो रहा है / Loading...</p>
      </main>
    );
  }

  const { inventory_valuation, receivables, daily_reconciliation, cashier_shift_summary, notification_health, pending_verification_count, village_debt_summary, aging_buckets } = summary;

  return (
    <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
      <BilingualLabel hi="मालिक डैशबोर्ड" en="Owner Dashboard" size="displayHeading" weight="bold" layout="stacked" />

      {/* Top summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing.md, marginTop: spacing.lg }}>
        <SummaryCard
          hi="स्टॉक लागत मूल्य" en="Inventory Cost Value"
          value={`₹${inventory_valuation.total_cost_value.toFixed(2)}`}
          color={colors.harvestGold}
        />
        <SummaryCard
          hi="स्टॉक बिक्री मूल्य" en="Inventory Selling Value"
          value={`₹${inventory_valuation.total_selling_value.toFixed(2)}`}
          color={colors.leafGreen}
        />
        <SummaryCard
          hi="कुल बकाया" en="Total Receivables"
          value={`₹${receivables.total_outstanding.toFixed(2)}`}
          subtitle={`${receivables.customer_count} ग्राहक / customers`}
          color={colors.danger}
        />
        <SummaryCard
          hi="सत्यापन लंबित" en="Pending Verification"
          value={String(pending_verification_count)}
          color={colors.sevaTeal}
          href="/khata"
        />
      </div>

      {inventory_valuation.low_stock_count > 0 && (
        <div style={{ marginTop: spacing.md, padding: spacing.md, background: "#FFF4E5", border: `1px solid ${colors.warning}`, borderRadius: radii.button }}>
          <a href="/inventory" style={{ color: colors.warning, fontWeight: 700, textDecoration: "none" }}>
            ⚠️ {inventory_valuation.low_stock_count} उत्पाद कम स्टॉक में / products low on stock — देखें / View →
          </a>
        </div>
      )}

      {/* Daily reconciliation */}
      <section style={{ marginTop: spacing.xl, background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
        <BilingualLabel hi="आज का हिसाब" en={`Today's Reconciliation (${daily_reconciliation.date})`} weight="bold" size="heading" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: spacing.md, marginTop: spacing.md }}>
          {Object.entries(daily_reconciliation.by_payment_mode).map(([mode, data]) => (
            <div key={mode} style={{ padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radii.button }}>
              <div style={{ fontWeight: 700 }}>{PAYMENT_MODE_LABELS[mode] ?? mode}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: colors.leafGreen }}>₹{data.amount_collected.toFixed(2)}</div>
              <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>{data.order_count} बिल / bills</div>
              {data.debt_added > 0 && (
                <div style={{ fontSize: "0.85rem", color: colors.danger }}>+₹{data.debt_added.toFixed(2)} उधार / credit</div>
              )}
            </div>
          ))}
          {Object.keys(daily_reconciliation.by_payment_mode).length === 0 && (
            <p style={{ color: colors.textSecondary }}>आज कोई बिक्री नहीं / No sales yet today</p>
          )}
        </div>
        <div style={{ marginTop: spacing.md, display: "flex", gap: spacing.lg, flexWrap: "wrap" }}>
          <div>कुल बिल / Total Bills: <strong>{daily_reconciliation.totals.total_orders}</strong></div>
          <div>कुल संग्रह / Total Collected: <strong>₹{daily_reconciliation.totals.total_cash_and_upi_collected.toFixed(2)}</strong></div>
          <div>नया उधार / New Credit: <strong>₹{daily_reconciliation.totals.total_debt_added.toFixed(2)}</strong></div>
        </div>
      </section>

      {/* Cashier shift summary */}
      <section style={{ marginTop: spacing.lg, background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
        <BilingualLabel hi="कैशियर सारांश" en="Cashier Shift Summary (Today)" weight="bold" size="heading" />
        {cashier_shift_summary.length === 0 ? (
          <p style={{ color: colors.textSecondary, marginTop: spacing.sm }}>आज कोई बिलिंग नहीं / No billing yet today</p>
        ) : (
          <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "6px" }}>
            {cashier_shift_summary.map((entry) => (
              <div key={entry.user_id ?? entry.username} style={{ display: "flex", justifyContent: "space-between", padding: spacing.sm, borderBottom: `1px solid ${colors.border}` }}>
                <span>{entry.username}</span>
                <span>{entry.order_count} बिल / bills — ₹{entry.amount_collected.toFixed(2)} जमा / collected</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Village debt + aging (condensed, links to full Khata view) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginTop: spacing.lg }}>
        <section style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
          <BilingualLabel hi="गाँव अनुसार बकाया (शीर्ष 5)" en="Top Villages by Debt" weight="bold" />
          <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "4px" }}>
            {village_debt_summary.slice(0, 5).map((v) => (
              <div key={v.village_code} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{v.village_name}</span>
                <strong style={{ color: colors.danger }}>₹{v.total_debt.toFixed(2)}</strong>
              </div>
            ))}
            {village_debt_summary.length === 0 && <p style={{ color: colors.textSecondary }}>कोई बकाया नहीं / No debt</p>}
          </div>
          <a href="/khata" style={{ color: colors.sevaTeal, fontWeight: 700, fontSize: "0.9rem" }}>पूरा विवरण / Full details →</a>
        </section>

        <section style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
          <BilingualLabel hi="सबसे पुराना बकाया (शीर्ष 5)" en="Longest Outstanding (Top 5)" weight="bold" />
          <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "4px" }}>
            {aging_buckets.slice(0, 5).map((a) => (
              <div key={a.customer_id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{a.full_name} ({a.days_outstanding}d)</span>
                <strong style={{ color: colors.danger }}>₹{a.current_debt.toFixed(2)}</strong>
              </div>
            ))}
            {aging_buckets.length === 0 && <p style={{ color: colors.textSecondary }}>कोई बकाया नहीं / No debt</p>}
          </div>
          <a href="/khata" style={{ color: colors.sevaTeal, fontWeight: 700, fontSize: "0.9rem" }}>पूरा विवरण / Full details →</a>
        </section>
      </div>

      {/* Notification health */}
      <section style={{ marginTop: spacing.lg, background: colors.white, borderRadius: radii.tile, padding: spacing.lg, marginBottom: spacing.xl }}>
        <BilingualLabel hi="सूचना स्थिति (7 दिन)" en="Notification Delivery (Last 7 Days)" weight="bold" size="heading" />
        {notification_health.length === 0 ? (
          <p style={{ color: colors.textSecondary, marginTop: spacing.sm }}>कोई सूचना नहीं / No notifications sent yet</p>
        ) : (
          <div style={{ marginTop: spacing.sm, display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
            {notification_health.map((entry) => (
              <div
                key={`${entry.channel}-${entry.status}`}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: radii.button,
                  background: entry.status === "SENT" ? `${colors.success}18` : `${colors.danger}18`,
                  color: entry.status === "SENT" ? colors.success : colors.danger,
                  fontWeight: 700,
                }}
              >
                {entry.channel}: {entry.count} {entry.status === "SENT" ? "भेजा गया / sent" : "विफल / failed"}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  hi, en, value, subtitle, color, href,
}: { hi: string; en: string; value: string; subtitle?: string; color: string; href?: string }) {
  const content = (
    <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, borderTop: `4px solid ${color}` }}>
      <BilingualLabel hi={hi} en={en} size="tileLabel" layout="stacked" color={colors.textSecondary} />
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color, marginTop: spacing.sm }}>{value}</div>
      {subtitle && <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>{subtitle}</div>}
    </div>
  );
  return href ? <a href={href} style={{ textDecoration: "none" }}>{content}</a> : content;
}
