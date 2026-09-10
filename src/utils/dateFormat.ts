/**
 * formatDateTime — explicit dd/mm/yyyy hh:mm AM/PM formatting.
 *
 * Deliberately NOT using toLocaleDateString()/toLocaleString() — those
 * are locale-dependent (format varies by the browser/OS's regional
 * settings, so the same code could print MM/DD/YYYY on one machine and
 * DD/MM/YYYY on another) and don't reliably include time at all. A
 * printed bill needs one consistent, predictable format regardless of
 * whose computer generated it.
 *
 * Uses the browser's LOCAL time (via getDate()/getHours()/etc., not
 * the UTC variants) — correct here, since `isoString` is stored in UTC
 * but a customer's printed receipt should show local time, not UTC.
 */
export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours; // 0 -> 12 for 12-hour display
  const hoursStr = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
}
