/**
 * CameraBarcodeScanner — opens the device camera and continuously
 * decodes barcodes from the live video feed, calling onDetected for
 * each new one found. Stays open across multiple scans (a cashier
 * scanning several items shouldn't need to reopen the camera between
 * each one) — only closes when the user taps Close.
 *
 * Uses @zxing/browser rather than the native BarcodeDetector API:
 * BarcodeDetector doesn't exist in Firefox or Safari at all, while
 * ZXing works consistently across any modern browser. It also
 * decodes Code128 — the exact format our own barcode_service.py
 * generates — so scanning a product's own printed label round-trips
 * correctly.
 *
 * HONEST LIMITATION: this couldn't be executed/tested in the
 * environment this was built in (no ability to install npm packages
 * or access a real camera there) — the API usage below matches
 * @zxing/browser's documented interface, but this genuinely needs a
 * real-browser, real-camera test on your end more than most of this
 * codebase.
 *
 * Also note: camera access requires HTTPS in production (or
 * localhost during development) — browsers block getUserMedia over
 * plain HTTP for any other host.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { colors, radii, spacing } from "@/theme/tokens";

// Minimal structural type for the controls object decodeFromVideoDevice
// returns — avoids depending on the library's exact exported type name,
// which this environment couldn't verify by installing the package.
interface ScannerControls {
  stop: () => void;
}

const SAME_CODE_COOLDOWN_MS = 2000; // ignore re-detecting the identical code within this window

/**
 * Directly stops every track on the video element's own MediaStream.
 * This is deliberately NOT relying on @zxing/browser's controls.stop()
 * alone — that call stops ZXing's internal decode loop, but in some
 * versions doesn't reliably release the underlying camera hardware
 * (the browser's camera-in-use indicator can stay lit even after
 * calling it). Stopping the tracks ourselves, directly on the actual
 * MediaStream, is the one thing guaranteed to release the camera
 * regardless of what the library's own cleanup does or doesn't do.
 */
function stopVideoTracks(video: HTMLVideoElement | null) {
  if (!video) return;
  const stream = video.srcObject as MediaStream | null;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  video.srcObject = null;
}

export type CameraBarcodeScannerProps = {
  /** Called for each newly-detected barcode; resolves to whether the
   * lookup actually succeeded, so the modal can show real feedback
   * (a wrong/unknown barcode shows an error here, not a false "Added"). */
  onDetected: (barcode: string) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
};

export function CameraBarcodeScanner({ onDetected, onClose }: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [lastSuccessMessage, setLastSuccessMessage] = useState<string | null>(null);
  const [lastFailureMessage, setLastFailureMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const codeReader = new BrowserMultiFormatReader();

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "यह ब्राउज़र कैमरा समर्थन नहीं करता / This browser doesn't support camera access."
        );
        return;
      }
      try {
        const controls = await codeReader.decodeFromVideoDevice(
          undefined, // default camera — laptops typically only have one
          videoRef.current!,
          (result) => {
            if (cancelled || !result) return;

            const code = result.getText();
            const now = Date.now();
            const last = lastCodeRef.current;
            if (last && last.code === code && now - last.at < SAME_CODE_COOLDOWN_MS) {
              return; // same barcode still in frame — don't re-process it yet
            }
            lastCodeRef.current = { code, at: now };

            // Fire-and-forget: don't block new frame decoding on this
            // lookup resolving — scanning continues in parallel.
            onDetected(code).then((result) => {
              if (cancelled) return;
              if (result.success) {
                setLastSuccessMessage(result.message);
                setLastFailureMessage(null);
              } else {
                setLastFailureMessage(result.message);
                setLastSuccessMessage(null);
              }
            });
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        setError(
          "कैमरा एक्सेस नहीं मिला / Could not access camera. कृपया अनुमति दें / Please allow camera permission and try again."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore — stopVideoTracks below is the real guarantee regardless
      }
      stopVideoTracks(videoRef.current);
    };
  }, [onDetected]);

  function handleClose() {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore — stopVideoTracks below is the real guarantee regardless
    }
    stopVideoTracks(videoRef.current);
    onClose();
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <BilingualLabel hi="बारकोड स्कैन करें" en="Scan Barcode" weight="bold" size="heading" />

        {error ? (
          <p style={{ color: colors.danger, marginTop: spacing.md }}>{error}</p>
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                borderRadius: radii.button,
                marginTop: spacing.md,
                background: "#000",
                maxHeight: "50vh",
                objectFit: "cover",
              }}
            />
            <p style={{ color: colors.textSecondary, fontSize: "0.85rem", marginTop: spacing.sm, textAlign: "center" }}>
              बारकोड को कैमरे के सामने स्थिर रखें / Hold the barcode steady in front of the camera
            </p>
            {lastSuccessMessage && (
              <p style={{ color: colors.success, fontWeight: 700, textAlign: "center", marginTop: spacing.sm }}>
                ✓ जोड़ा गया / Added: {lastSuccessMessage}
              </p>
            )}
            {lastFailureMessage && (
              <p style={{ color: colors.danger, fontWeight: 700, textAlign: "center", marginTop: spacing.sm }}>
                ✕ {lastFailureMessage}
              </p>
            )}
          </>
        )}

        <button onClick={handleClose} style={closeButtonStyle}>
          बंद करें / Close
        </button>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: spacing.lg,
};

const modalStyle: React.CSSProperties = {
  background: colors.white,
  borderRadius: radii.tile,
  padding: spacing.lg,
  width: "100%",
  maxWidth: "440px",
};

const closeButtonStyle: React.CSSProperties = {
  marginTop: spacing.md,
  width: "100%",
  padding: spacing.md,
  borderRadius: radii.button,
  border: "none",
  background: colors.danger,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  minHeight: spacing.tapTargetMin,
};
