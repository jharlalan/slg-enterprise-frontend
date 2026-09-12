/**
 * AadhaarQRCapture — takes a photo (live camera capture or uploaded
 * image) of the physical Aadhaar card and sends it straight to the
 * backend for QR detection + decoding (see
 * app/services/aadhaar_qr_service.py). Detection deliberately does NOT
 * happen client-side: an earlier client-side-jsQR-decode approach
 * failed on real card photos that a server-side pyzbar scan (with
 * multi-pass image enhancement) handles fine — same lesson already
 * learned for the product barcode scanner in this codebase.
 *
 * Only ever pre-fills the parent form (via onFetched) — never submits
 * anything itself, so the operator can review/correct before saving.
 */
import { useEffect, useRef, useState } from "react";
import { apiClient, ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { CustomerAddress } from "@/types/address";

type ApiEnvelope<T> = { success: true; data: T };

export type AadhaarQRResult = {
  full_name: string | null;
  gender: "male" | "female" | "other" | null;
  address: CustomerAddress | null;
  aadhaar_last4: string | null;
};

export type AadhaarQRCaptureProps = {
  /** Which decode endpoint to call — the POS form is authenticated
   * (Owner/Cashier token), the self-portal signup form has none yet. */
  endpoint: "/customers/aadhaar-qr/decode" | "/customer-auth/aadhaar-qr/decode";
  onFetched: (result: AadhaarQRResult) => void;
};

export function AadhaarQRCapture({ endpoint, onFetched }: AadhaarQRCaptureProps) {
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMode("idle");
  }

  async function submitImage(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", blob, "aadhaar-qr.png");
      const { data } = await apiClient.post<ApiEnvelope<AadhaarQRResult>>(endpoint, form);
      onFetched(data.data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "इस कार्ड को पढ़ नहीं सका — कृपया मैन्युअल रूप से भरें / Couldn't read this card — please fill manually"
      );
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    setError(null);
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("कैमरा एक्सेस नहीं मिला / Could not access the camera");
      setMode("idle");
    }
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        stopCamera();
        if (blob) void submitImage(blob);
      },
      "image/png" // lossless — avoids JPEG compression artifacts hurting small QR modules
    );
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void submitImage(file);
  }

  return (
    <div
      style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: radii.button,
        padding: spacing.md,
        marginBottom: spacing.md,
        background: colors.huskCream,
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>
        आधार QR से भरें (वैकल्पिक) / Fill from Aadhaar QR (optional)
      </p>

      {mode === "camera" ? (
        <div style={{ marginTop: spacing.sm }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} style={{ width: "100%", maxWidth: "320px", borderRadius: radii.button }} muted playsInline />
          <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
            <button type="button" onClick={captureFromCamera} disabled={busy} style={primaryButtonStyle}>
              📸 फ़ोटो लें / Capture Photo
            </button>
            <button type="button" onClick={stopCamera} style={secondaryButtonStyle}>
              रद्द करें / Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" }}>
          <button type="button" onClick={startCamera} disabled={busy} style={primaryButtonStyle}>
            📷 कैमरा से स्कैन करें / Scan with Camera
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} style={secondaryButtonStyle}>
            🖼️ छवि अपलोड करें / Upload Image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} style={{ display: "none" }} />
        </div>
      )}

      {busy && <p style={{ fontSize: "0.85rem", color: colors.textSecondary, marginTop: spacing.sm }}>पढ़ रहे हैं... / Reading...</p>}
      {error && <p style={{ fontSize: "0.85rem", color: colors.danger, marginTop: spacing.sm }}>{error}</p>}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  color: colors.textPrimary,
  fontWeight: 700,
  cursor: "pointer",
};
