/**
 * PhoneInput — fixed "+91" prefix + a 10-digit-only field. `value` and
 * `onChange` deal in the bare 10 digits; call toE164() from utils/phone
 * at submit time to get the "+91XXXXXXXXXX" string the API expects.
 */
import { colors, radii, spacing, typography } from "@/theme/tokens";
import { sanitizePhoneDigits } from "@/utils/phone";

export type PhoneInputProps = {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
};

export function PhoneInput({ value, onChange, placeholder = "9876543210", required, style }: PhoneInputProps) {
  return (
    <div style={{ display: "flex", ...style }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          padding: `0 ${spacing.sm}`,
          borderRadius: `${radii.button} 0 0 ${radii.button}`,
          border: `1px solid ${colors.border}`,
          borderRight: "none",
          background: colors.huskCream,
          color: colors.textSecondary,
          fontWeight: 700,
          fontFamily: typography.fontFamilyCombined,
        }}
      >
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={value}
        onChange={(e) => onChange(sanitizePhoneDigits(e.target.value))}
        placeholder={placeholder}
        required={required}
        maxLength={10}
        style={{
          flex: 1,
          minWidth: 0,
          padding: spacing.md,
          borderRadius: `0 ${radii.button} ${radii.button} 0`,
          border: `1px solid ${colors.border}`,
          fontSize: typography.scale.body,
          fontFamily: typography.fontFamilyCombined,
        }}
      />
    </div>
  );
}
