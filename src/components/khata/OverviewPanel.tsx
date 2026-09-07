/**
 * OverviewPanel — village-wise debt distribution and aging buckets,
 * per the spec's dashboard requirements. Note: "aging" here is an
 * approximation (days since the account last fully cleared, not true
 * per-invoice AR aging) — see khata_service.py's docstring for why.
 */
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";
import type { AgingEntry, VillageDebtSummary } from "@/types/khata";

const BUCKET_LABELS: Record<string, string> = {
  UNDER_15: "< 15 दिन / days",
  "15_TO_30": "15–30 दिन / days",
  "31_TO_60": "31–60 दिन / days",
  OVER_60: "60+ दिन / days",
};

const BUCKET_COLORS: Record<string, string> = {
  UNDER_15: colors.success,
  "15_TO_30": colors.warning,
  "31_TO_60": "#D2691E",
  OVER_60: colors.danger,
};

export function OverviewPanel({
  villageSummary,
  aging,
  onSelectCustomer,
}: {
  villageSummary: VillageDebtSummary[];
  aging: AgingEntry[];
  onSelectCustomer: (customerId: string) => void;
}) {
  const groupedAging = aging.reduce<Record<string, AgingEntry[]>>((acc, entry) => {
    (acc[entry.bucket] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
        <BilingualLabel hi="गाँव अनुसार बकाया" en="Village-wise Debt" weight="bold" size="heading" />
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, marginTop: spacing.sm }}>
          {villageSummary.map((v) => (
            <div key={v.village_code} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{v.village_name} ({v.village_code}) — {v.customer_count} ग्राहक</span>
              <strong style={{ color: colors.danger }}>₹{v.total_debt.toFixed(2)}</strong>
            </div>
          ))}
          {villageSummary.length === 0 && <p style={{ color: colors.textSecondary }}>कोई बकाया नहीं / No outstanding debt</p>}
        </div>
      </div>

      <div style={{ background: colors.white, borderRadius: radii.tile, padding: spacing.lg }}>
        <BilingualLabel hi="बकाया की अवधि" en="Aging Buckets" weight="bold" size="heading" />
        <p style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>
          (कब से खाता शून्य नहीं हुआ / days since account last fully cleared)
        </p>
        {(["UNDER_15", "15_TO_30", "31_TO_60", "OVER_60"] as const).map((bucket) => (
          <div key={bucket} style={{ marginTop: spacing.sm }}>
            <div style={{ color: BUCKET_COLORS[bucket], fontWeight: 700 }}>{BUCKET_LABELS[bucket]}</div>
            {(groupedAging[bucket] ?? []).map((entry) => (
              <button
                key={entry.customer_id}
                onClick={() => onSelectCustomer(entry.customer_id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: spacing.sm,
                  border: "none",
                  borderBottom: `1px solid ${colors.border}`,
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{entry.full_name} ({entry.village_code})</span>
                <span>₹{entry.current_debt.toFixed(2)}</span>
              </button>
            ))}
            {(groupedAging[bucket] ?? []).length === 0 && (
              <p style={{ color: colors.textSecondary, fontSize: "0.85rem" }}>—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
