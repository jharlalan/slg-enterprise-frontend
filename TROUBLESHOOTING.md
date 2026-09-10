# Troubleshooting

Real issues hit while building this, with the actual root cause and fix —
not a generic FAQ.

---

## Print output is missing background colors (green header, orange dividers)

**Symptom:** The bill looks correct on screen, but the actual printed
page shows the table header, dividers, and row stripes as plain white —
only text and borders survive.

**Cause:** Browsers strip background colors by default when actually
printing (not when previewing on screen) — a deliberate ink-saving
default. CSS has to explicitly opt back in.

**Fix:** Already applied — `ShopBillReceipt.tsx`'s `@media print` block
sets `print-color-adjust: exact` (plus the `-webkit-` prefixed version)
on every element inside the receipt. If you add new colored elements to
the receipt and they don't print, check they're covered by this rule.

**How this was actually caught:** an early verification pass rendered
the component through `wkhtmltopdf` and it looked fine — because that
tool doesn't apply the browser's print-time color-stripping. The bug
only showed up on a real print from an actual browser. Worth remembering
generally: a tool-based render matching what you expect doesn't
guarantee an actual browser print job will match too.

---

## Date/time on the receipt shows the wrong format depending on whose computer it is

**Symptom:** The printed date sometimes shows `MM/DD/YYYY`, sometimes
`DD/MM/YYYY`, with no time at all.

**Cause:** `Date.prototype.toLocaleDateString()` is locale-dependent —
it follows the browser/OS's regional settings, which vary machine to
machine. A bill needs one consistent format regardless of who printed it.

**Fix:** `utils/dateFormat.ts`'s `formatDateTime()` builds the string
explicitly from `getDate()`/`getMonth()`/`getHours()` etc. rather than
any locale-aware method, always producing `dd/mm/yyyy hh:mm AM/PM`.
Tested against the classic 12-hour-format traps (midnight -> `12:xx AM`,
noon -> `12:xx PM`) — both are easy to get backwards if you naively do
`hours % 12` without the `=== 0 ? 12` correction.

---

## Camera-based barcode scanning doesn't turn the camera off after closing

**Symptom:** After closing the camera view, the browser's camera
indicator light stays on / the camera still shows as "in use."

**Cause:** An early version relied on a barcode-decoding library's own
`stop()` method to release the camera. That call stopped the library's
internal decode loop but didn't reliably release the underlying
`MediaStream` — decoding and camera-hardware lifecycle are two separate
things, and the library's `stop()` only handled one of them.

**Fix:** This client-side-decoding approach was removed entirely (see
below) in favor of server-side decoding, which sidesteps the problem —
the camera is only ever open briefly to capture one photo, not running a
continuous decode loop. If you're working with any `getUserMedia` stream
directly, the reliable way to release a camera is to grab the actual
`MediaStream` off the video element and call `.stop()` on every track
yourself (`stream.getTracks().forEach(t => t.stop())`) rather than
trusting a wrapping library to do it.

---

## `header.authorization: Field required` shown as a raw error / frontend crash

**Symptom:** An ugly error surfaces mid-app, or the browser's dev-mode
overlay shows an unhandled exception, when a request fails.

**Cause 1 (the underlying trigger):** No valid session — the request
genuinely had no `Authorization` header attached because there's no
token stored. This is a real "not logged in" situation.

**Cause 2 (why it crashed instead of showing a normal message):** Some
API calls were wrapped in `try { ... } finally { ... }` with **no
`catch`** — so any failure, not just this one, became an unhandled
promise rejection instead of a handled error.

**Fix:**
1. Every API call site now has a real `catch`, not just a `finally`.
2. `apiClient.ts`'s response interceptor specifically detects this
   pattern (401s, or a 422 whose message mentions "authorization") and
   automatically clears the stored token and redirects to the correct
   login page — so hitting this now self-resolves into a login prompt.

**If you add a new API call:** always give it a real `catch`, even if
it just shows a generic error message. A `finally` without a `catch`
looks like error handling but isn't.

---

## Why there's no client-side barcode-decoding library in this codebase

Worth explaining since it's a deliberate reversal, not an oversight: an
earlier version used `@zxing/browser` to decode barcodes live from a
running camera video stream, entirely in the browser. This hit two real
problems — the camera-release bug above, and inconsistent decode
reliability from real-world photos (especially laptop webcams, which
often can't focus at the close range barcode-scanning needs).

The current approach captures a single photo (or accepts an uploaded
file) and sends it to the backend, which decodes it with `pyzbar`
(Python bindings for the mature ZBar C library) with several image
preprocessing fallbacks. This moved the hard part — actually reading a
barcode from an imperfect real-world photo — to a proven library instead
of a browser-side port, and shrank the camera code down to "open, show
preview, capture one frame, close" — a much smaller surface for
lifecycle bugs.

---

## General diagnosis approach

1. Check the browser console first — most failures here throw a real JS
   error with a stack trace, not a silent failure
2. If an API call is involved, check the Network tab for the actual
   response body — the backend's error envelope (`error.message`,
   `error.code`) is usually more specific than whatever the frontend
   displays
3. For anything print-related, remember that how something looks on
   screen and how it actually prints can differ (see the color-stripping
   issue above) — verify with an actual print, not just the preview
