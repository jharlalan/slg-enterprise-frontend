/**
 * BarcodeScannerListener
 *
 * Physical USB/Bluetooth barcode scanners emulate a keyboard (HID) —
 * they "type" the barcode value very fast, then send Enter. This
 * component distinguishes that from a person typing normally by
 * measuring the gap between keystrokes: if characters arrive faster
 * than a human could plausibly type (< SCAN_INTERVAL_MS apart), they're
 * buffered as a scan; a Enter/Return with a buffer present fires
 * `onScan`. Normal keyboard use elsewhere on the page is unaffected
 * since this only activates when focus is inside its wrapped area
 * (or globally, if `global` is set — used on the POS screen where the
 * cashier may not have any input focused).
 *
 * Lives in components/shared (not components/pos) because it's used
 * by both the Inventory screen (look up a product to add stock) and
 * the POS screen — it's genuinely cross-feature, not POS-specific.
 */
"use client";

import { useEffect, useRef } from "react";

const SCAN_INTERVAL_MS = 50; // max gap between keystrokes to count as "scanned", not typed
const MIN_BARCODE_LENGTH = 4;

export type BarcodeScannerListenerProps = {
  onScan: (barcode: string) => void;
  /** Listen on the whole document rather than requiring a focused input
   * inside this component's children — needed for POS where the cashier
   * scans without clicking into a specific field first. */
  global?: boolean;
  children?: React.ReactNode;
};

export function BarcodeScannerListener({
  onScan,
  global = false,
  children,
}: BarcodeScannerListenerProps) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= MIN_BARCODE_LENGTH) {
          onScan(bufferRef.current);
        }
        bufferRef.current = "";
        return;
      }

      // A single printable character
      if (e.key.length === 1) {
        if (gap > SCAN_INTERVAL_MS) {
          // Too slow to be a scanner — likely a human typing; reset
          // the buffer so we don't misfire on a coincidental fast typist.
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    }

    const target: Document | Window = global ? document : window;
    target.addEventListener("keydown", handleKeyDown as EventListener);
    return () => target.removeEventListener("keydown", handleKeyDown as EventListener);
  }, [onScan, global]);

  return <>{children}</>;
}
