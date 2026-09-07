/**
 * Khata screen — customer search on the left, either the village/aging
 * overview (default) or a selected customer's full statement on the
 * right. Owner-primary screen (village summary/aging are Owner-only on
 * the backend), but Cashiers can still record payments and send
 * reminders for whichever customer they pull up.
 */
"use client";

import { useEffect, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { OverviewPanel } from "@/components/khata/OverviewPanel";
import { StatementPanel } from "@/components/khata/StatementPanel";
import { khataService } from "@/services/khataService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { AgingEntry, CustomerDetail, CustomerStatement, VillageDebtSummary } from "@/types/khata";

export default function KhataPage() {
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatement, setSelectedStatement] = useState<CustomerStatement | null>(null);
  const [villageSummary, setVillageSummary] = useState<VillageDebtSummary[]>([]);
  const [aging, setAging] = useState<AgingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    try {
      const [customerList, villages, agingData] = await Promise.all([
        khataService.listCustomers(),
        khataService.villageSummary(),
        khataService.agingBuckets(),
      ]);
      setCustomers(customerList);
      setVillageSummary(villages);
      setAging(agingData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "लोड करने में त्रुटि / Failed to load");
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function handleSearch(term: string) {
    setSearch(term);
    try {
      const results = await khataService.listCustomers(term || undefined);
      setCustomers(results);
    } catch {
      /* keep previous list on transient search error */
    }
  }

  async function selectCustomer(customerId: string) {
    try {
      const statement = await khataService.getStatement(customerId);
      setSelectedStatement(statement);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "त्रुटि / Error");
    }
  }

  async function refreshSelected() {
    if (selectedStatement) {
      await selectCustomer(selectedStatement.customer.id);
      await loadOverview();
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.huskCream, padding: spacing.lg }}>
      <BilingualLabel hi="खाता / उधार" en="Customer Khata" size="displayHeading" weight="bold" layout="stacked" />

      {error && <p style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: spacing.lg, marginTop: spacing.lg }}>
        <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.md, height: "fit-content" }}>
          <input
            type="text"
            placeholder="नाम/फ़ोन/ID खोजें / Search name, phone, ID"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              padding: spacing.sm,
              borderRadius: radii.button,
              border: `1px solid ${colors.border}`,
              marginBottom: spacing.sm,
            }}
          />
          <button
            onClick={() => setSelectedStatement(null)}
            style={{
              width: "100%",
              padding: spacing.sm,
              marginBottom: spacing.sm,
              borderRadius: radii.button,
              border: `1px solid ${colors.border}`,
              background: !selectedStatement ? `${colors.leafGreen}18` : colors.white,
              cursor: "pointer",
            }}
          >
            📊 अवलोकन / Overview
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "60vh", overflowY: "auto" }}>
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c.id)}
                style={{
                  textAlign: "left",
                  padding: spacing.sm,
                  border: "none",
                  borderRadius: radii.button,
                  background: selectedStatement?.customer.id === c.id ? `${colors.leafGreen}18` : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
                  {c.customer_id} · ₹{c.current_debt.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedStatement ? (
          <StatementPanel statement={selectedStatement} onRefresh={refreshSelected} />
        ) : (
          <OverviewPanel villageSummary={villageSummary} aging={aging} onSelectCustomer={selectCustomer} />
        )}
      </div>
    </main>
  );
}
