/**
 * AddressFields — structured address entry shared by the POS quick-create
 * form and the self-portal registration form. Two independent auto-fill
 * paths, both editable afterward:
 *   - village_code (the shop's own internal code, e.g. "RAMP") looked up
 *     against GET /villages/{code} -> fills village/district/state.
 *   - pincode (postal PIN) looked up against GET /address/pincode/{code}
 *     -> fills district/state/post_office/village_town_city.
 * Auto-fill only ever writes into fields that are still empty, so it
 * never clobbers a manual edit or an Aadhaar-QR-fetched value.
 */
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { CustomerAddress } from "@/types/address";

type ApiEnvelope<T> = { success: true; data: T };

type VillageOption = { short_code: string; name: string; district: string | null; state: string | null };

export type AddressFieldsProps = {
  address: CustomerAddress;
  onAddressChange: (address: CustomerAddress) => void;
  villageCode: string;
  onVillageCodeChange: (code: string) => void;
};

export function AddressFields({ address, onAddressChange, villageCode, onVillageCodeChange }: AddressFieldsProps) {
  const [villageLookupError, setVillageLookupError] = useState<string | null>(null);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ApiEnvelope<VillageOption[]>>("/villages")
      .then(({ data }) => {
        if (!cancelled) setVillages(data.data);
      })
      .catch(() => {
        // Best-effort only — typing the code manually still works via
        // handleVillageCodeBlur's direct lookup if suggestions can't load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const villageSuggestions =
    villageCode.trim().length > 0
      ? villages
          .filter(
            (v) =>
              v.short_code.toUpperCase().includes(villageCode.trim().toUpperCase()) ||
              v.name.toLowerCase().includes(villageCode.trim().toLowerCase())
          )
          .slice(0, 6)
      : villages.slice(0, 6);

  function selectVillage(village: VillageOption) {
    onVillageCodeChange(village.short_code);
    setShowSuggestions(false);
    fillIfEmpty({
      village_town_city: village.name,
      district: village.district ?? undefined,
      state: village.state ?? undefined,
    });
  }

  // Mirrors the latest `address` synchronously (updated on every render,
  // not via useEffect) so the async lookups below — which read this
  // ref AFTER an `await` — never act on a stale closure of `address`
  // and clobber a keystroke that happened while the request was in flight.
  const addressRef = useRef(address);
  addressRef.current = address;

  function set<K extends keyof CustomerAddress>(key: K, value: CustomerAddress[K]) {
    const next = { ...addressRef.current, [key]: value };
    addressRef.current = next;
    onAddressChange(next);
  }

  function fillIfEmpty(patch: Partial<CustomerAddress>) {
    const next = { ...addressRef.current };
    for (const [key, value] of Object.entries(patch) as [keyof CustomerAddress, string | undefined][]) {
      if (value && !next[key]) {
        (next[key] as string) = value;
      }
    }
    addressRef.current = next;
    onAddressChange(next);
  }

  async function handleVillageCodeBlur() {
    setVillageLookupError(null);
    const code = villageCode.trim().toUpperCase();
    if (code.length < 3) return;
    try {
      const { data } = await apiClient.get<ApiEnvelope<{ name: string; district: string | null; state: string | null }>>(
        `/villages/${code}`
      );
      fillIfEmpty({
        village_town_city: data.data.name,
        district: data.data.district ?? undefined,
        state: data.data.state ?? undefined,
      });
    } catch {
      setVillageLookupError("गाँव कोड नहीं मिला / Village code not recognized");
    }
  }

  async function handlePincodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    set("pincode", digits);
    if (digits.length !== 6) return;
    try {
      const { data } = await apiClient.get<
        ApiEnvelope<{ district: string; state: string; post_office: string; village_town_city: string } | null>
      >(`/address/pincode/${digits}`);
      if (data.data) {
        fillIfEmpty({
          district: data.data.district,
          state: data.data.state,
          post_office: data.data.post_office,
          village_town_city: data.data.village_town_city,
        });
      }
    } catch {
      // Best-effort only — connectivity issues shouldn't block the form.
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="गाँव कोड / Village code (e.g. RAMP)"
          value={villageCode}
          onChange={(e) => {
            onVillageCodeChange(e.target.value.toUpperCase());
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          // Delayed so a click on a suggestion (below) registers before
          // the list disappears — blur fires before click otherwise.
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 150);
            handleVillageCodeBlur();
          }}
          required
          autoComplete="off"
          style={inputStyle}
        />
        {showSuggestions && villageSuggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 20,
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.button,
              marginTop: "4px",
              maxHeight: "180px",
              overflowY: "auto",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {villageSuggestions.map((v) => (
              <button
                key={v.short_code}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur's setTimeout doesn't beat this click
                onClick={() => selectVillage(v)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: spacing.sm,
                  border: "none",
                  borderBottom: `1px solid ${colors.border}`,
                  background: colors.white,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                <strong>{v.short_code}</strong> — {v.name}
              </button>
            ))}
          </div>
        )}
        {villageLookupError && <p style={errorStyle}>{villageLookupError}</p>}
      </div>

      <input
        type="text"
        placeholder="मकान/गली नंबर / House No. & Street"
        value={address.house_street}
        onChange={(e) => set("house_street", e.target.value)}
        required
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="लैंडमार्क (वैकल्पिक) / Landmark (optional)"
        value={address.landmark ?? ""}
        onChange={(e) => set("landmark", e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: spacing.sm }}>
        <input
          type="text"
          placeholder="गाँव/शहर / Village/Town/City"
          value={address.village_town_city}
          onChange={(e) => set("village_town_city", e.target.value)}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="पिन कोड / Pincode"
          value={address.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          required
          maxLength={6}
          style={{ ...inputStyle, width: "110px" }}
        />
      </div>
      <input
        type="text"
        placeholder="पोस्ट ऑफिस (वैकल्पिक) / Post Office (optional)"
        value={address.post_office ?? ""}
        onChange={(e) => set("post_office", e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: spacing.sm }}>
        <input
          type="text"
          placeholder="ज़िला / District"
          value={address.district}
          onChange={(e) => set("district", e.target.value)}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
        <input
          type="text"
          placeholder="राज्य / State"
          value={address.state}
          onChange={(e) => set("state", e.target.value)}
          required
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: colors.danger,
  fontSize: "0.8rem",
  margin: "4px 0 0",
};
