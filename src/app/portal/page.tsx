/**
 * Customer portal home — read-only statement (no payment-recording UI
 * here, unlike the staff-facing StatementPanel, since a customer isn't
 * allowed to directly edit their own ledger), the QR generator, claim
 * submission, and claim history.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { PaymentQRGenerator } from "@/components/portal/PaymentQRGenerator";
import { ClaimSubmissionForm } from "@/components/portal/ClaimSubmissionForm";
import { ClaimHistoryList } from "@/components/portal/ClaimHistoryList";
import { PhoneChangeCard } from "@/components/portal/PhoneChangeCard";
import { EmailUpdateCard } from "@/components/portal/EmailUpdateCard";
import { portalService } from "@/services/portalService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { CustomerStatement } from "@/types/khata";
import type { PaymentClaim } from "@/types/portal";

export default function PortalPage() {
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    try {
      const [statementResult, claimsResult] = await Promise.all([
        portalService.getMyStatement(),
        portalService.getMyClaims(),
      ]);
      setStatement(statementResult);
      setClaims(claimsResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "लोड करने में त्रुटि / Failed to load");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (error) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <p style={{ color: colors.danger }}>{error}</p>
        <a href="/portal/login">लॉगिन करें / Log in</a>
      </main>
    );
  }

  if (!statement) {
    return (
      <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
        <p>लोड हो रहा है / Loading...</p>
      </main>
    );
  }

  const { customer, entries } = statement;

  return (
    <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
      <BilingualLabel hi={customer.full_name} en="My Account" size="displayHeading" weight="bold" layout="stacked" />
      <PhoneChangeCard currentPhone={customer.phone} onChanged={loadAll} />
      <EmailUpdateCard currentEmail={customer.email ?? null} onChanged={loadAll} />

      <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, marginTop: spacing.lg }}>
        <div style={{ color: colors.textSecondary }}>बकाया / Outstanding Balance</div>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: colors.danger }}>
          ₹{customer.current_debt.toFixed(2)}
        </div>
      </div>

      <div style={{ marginTop: spacing.lg }}>
        <PaymentQRGenerator suggestedAmount={customer.current_debt} />
      </div>

      <ClaimSubmissionForm onSubmitted={loadAll} />
      <ClaimHistoryList claims={claims} />

      <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg, marginTop: spacing.lg }}>
        <BilingualLabel hi="लेन-देन इतिहास" en="Transaction History" weight="bold" size="heading" />
        <div style={{ marginTop: spacing.sm, display: "flex", flexDirection: "column", gap: "6px" }}>
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
                <div>{entry.transaction_type === "DEBIT" ? "बिल / Charge" : "भुगतान / Payment"}</div>
                <div style={{ color: colors.textSecondary }}>{new Date(entry.created_at).toLocaleString()}</div>
              </div>
              <div style={{ color: entry.transaction_type === "DEBIT" ? colors.danger : colors.success, fontWeight: 700 }}>
                {entry.transaction_type === "DEBIT" ? "+" : "−"}₹{entry.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
