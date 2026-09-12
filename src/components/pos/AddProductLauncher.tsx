/**
 * AddProductLauncher — one large, bold "+ Add" button that opens a
 * modal with four ways to add an item to the cart: typing a barcode,
 * capturing a photo with the camera, uploading an image file, or
 * searching by product name. Replaces the previous always-visible
 * ManualAddPanel — consolidating behind one entry point per product
 * decision, rather than four separate always-on inputs cluttering
 * the screen.
 *
 * Camera and Upload both funnel through the same backend endpoint
 * (POST /products/barcode/decode) via productService.decodeBarcodeImage
 * — from the server's point of view a captured photo and an uploaded
 * file are identical, just image bytes.
 *
 * The camera tab captures ONE photo per click rather than continuously
 * scanning — this is a deliberate simplification versus an earlier,
 * removed approach that tried to decode barcodes live from a running
 * video stream in the browser. That approach had real camera-lifecycle
 * bugs (the hardware not reliably releasing on close); starting a
 * stream once when this tab opens and stopping it once when it closes
 * is a much smaller, easier-to-get-right surface.
 */
import { useEffect, useRef, useState } from "react";
import { BilingualLabel } from "@/components/ui/BilingualLabel";
import { productService } from "@/services/productService";
import { ApiError } from "@/services/apiClient";
import { colors, radii, spacing } from "@/theme/tokens";
import type { Product } from "@/types/product";

export type AddProductLauncherProps = {
  /** Returns success/failure so every entry method can show real
   * feedback (a wrong/unrecognized barcode shows an error). */
  onAddByBarcode: (barcode: string) => Promise<{ success: boolean; message: string }>;
  onAddProduct: (product: Product) => void;
};

type Tab = "barcode" | "camera" | "upload" | "search";

export function AddProductLauncher({ onAddByBarcode, onAddProduct }: AddProductLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={bigAddButtonStyle}>
        ➕ जोड़ें / Add
      </button>
      {open && (
        <AddProductModal
          onAddByBarcode={onAddByBarcode}
          onAddProduct={onAddProduct}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AddProductModal({
  onAddByBarcode,
  onAddProduct,
  onClose,
}: AddProductLauncherProps & { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <BilingualLabel hi="उत्पाद जोड़ें" en="Add Product" weight="bold" size="heading" />
          <button onClick={onClose} style={closeIconStyle} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: spacing.xs, marginTop: spacing.md, flexWrap: "wrap" }}>
          <TabButton label="🔍 खोजें / Search" active={activeTab === "search"} onClick={() => setActiveTab("search")} />
          <TabButton label="बारकोड / Barcode" active={activeTab === "barcode"} onClick={() => setActiveTab("barcode")} />
          <TabButton label="📷 कैमरा / Camera" active={activeTab === "camera"} onClick={() => setActiveTab("camera")} />
          <TabButton label="📁 अपलोड / Upload" active={activeTab === "upload"} onClick={() => setActiveTab("upload")} />
        </div>

        <div style={{ marginTop: spacing.md, minHeight: "220px" }}>
          {activeTab === "barcode" && <BarcodeTab onAddByBarcode={onAddByBarcode} onDone={onClose} />}
          {activeTab === "camera" && <CameraTab onAddByBarcode={onAddByBarcode} isActive={activeTab === "camera"} onDone={onClose} />}
          {activeTab === "upload" && <UploadTab onAddByBarcode={onAddByBarcode} onDone={onClose} />}
          {activeTab === "search" && <SearchTab onAddProduct={onAddProduct} onDone={onClose} />}
        </div>
      </div>
    </div>
  );
}

// -- Tab: manual barcode entry -----------------------------------------------

function BarcodeTab({
  onAddByBarcode,
  onDone,
}: {
  onAddByBarcode: AddProductLauncherProps["onAddByBarcode"];
  onDone: () => void;
}) {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    setSubmitting(true);
    const result = await onAddByBarcode(barcode.trim());
    setMessage({ success: result.success, text: result.message });
    if (result.success) setBarcode("");
    setSubmitting(false);
  }

  if (message?.success) {
    return (
      <SuccessPrompt
        productName={message.text}
        onAddMore={() => setMessage(null)}
        onDone={onDone}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <BilingualLabel hi="बारकोड टाइप करें" en="Type the barcode" size="body" />
      <div style={{ display: "flex", gap: spacing.sm }}>
        <input
          type="text"
          autoFocus
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="बारकोड / Barcode"
          style={inputStyle}
        />
        <button type="submit" disabled={submitting} style={primaryButtonStyle}>
          जोड़ें / Add
        </button>
      </div>
      <FeedbackLine message={message} />
    </form>
  );
}

// -- Tab: camera capture (single photo per click, not continuous) -----------

function CameraTab({
  onAddByBarcode,
  isActive,
  onDone,
}: {
  onAddByBarcode: AddProductLauncherProps["onAddByBarcode"];
  isActive: boolean;
  onDone: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("यह ब्राउज़र कैमरा समर्थन नहीं करता / This browser doesn't support camera access.");
        return;
      }
      try {
        // facingMode is an ideal/preference constraint, not a hard
        // requirement — falls back gracefully to whatever camera is
        // available (e.g. a laptop's single front camera) rather than
        // failing when "environment" isn't available.
        // Request a higher resolution than the browser's low default
        // (often 640x480) — a barcode needs real pixel detail to
        // decode reliably. "ideal" constraints degrade gracefully if
        // the camera can't actually provide this, rather than failing.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError(
          "कैमरा एक्सेस नहीं मिला / Could not access camera. कृपया अनुमति दें / Please allow camera permission."
        );
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isActive]);

  async function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        setDecoding(true);
        setMessage(null);
        try {
          const barcode = await productService.decodeBarcodeImage(blob);
          const result = await onAddByBarcode(barcode);
          setMessage({ success: result.success, text: result.message });
        } catch (err) {
          setMessage({
            success: false,
            text: err instanceof ApiError ? err.message : "बारकोड पढ़ने में विफल / Failed to read barcode",
          });
        } finally {
          setDecoding(false);
        }
      },
      // PNG, not JPEG: lossless — JPEG's compression softens the
      // sharp bar edges a barcode decoder depends on.
      "image/png"
    );
  }

  if (cameraError) {
    return <p style={{ color: colors.danger }}>{cameraError}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm, alignItems: "center" }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", maxHeight: "260px", borderRadius: radii.button, background: "#000", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p style={{ fontSize: "0.8rem", color: colors.textSecondary, textAlign: "center", margin: 0 }}>
        लैपटॉप कैमरा पास से फोकस नहीं कर पाता — बारकोड को थोड़ा दूर रखें / Laptop cameras often can't
        focus up close — hold the barcode a little further back
      </p>
      <button onClick={handleCapture} disabled={decoding} style={primaryButtonStyle}>
        {decoding ? "पढ़ रहे हैं / Reading..." : "📸 फोटो लें / Capture"}
      </button>
      {message?.success ? (
        <SuccessPrompt
          productName={message.text}
          onAddMore={() => setMessage(null)}
          onDone={onDone}
        />
      ) : (
        <FeedbackLine message={message} />
      )}
    </div>
  );
}

// -- Tab: upload an image file -----------------------------------------------

function UploadTab({
  onAddByBarcode,
  onDone,
}: {
  onAddByBarcode: AddProductLauncherProps["onAddByBarcode"];
  onDone: () => void;
}) {
  const [decoding, setDecoding] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;

    setDecoding(true);
    setMessage(null);
    try {
      const barcode = await productService.decodeBarcodeImage(file);
      const result = await onAddByBarcode(barcode);
      setMessage({ success: result.success, text: result.message });
    } catch (err) {
      setMessage({
        success: false,
        text: err instanceof ApiError ? err.message : "बारकोड पढ़ने में विफल / Failed to read barcode",
      });
    } finally {
      setDecoding(false);
    }
  }

  if (message?.success) {
    return (
      <SuccessPrompt
        productName={message.text}
        onAddMore={() => setMessage(null)}
        onDone={onDone}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <BilingualLabel hi="बारकोड की फ़ोटो अपलोड करें" en="Upload a photo of the barcode" size="body" />
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelected} disabled={decoding} />
      {decoding && <p style={{ color: colors.textSecondary }}>पढ़ रहे हैं / Reading...</p>}
      <FeedbackLine message={message} />
    </div>
  );
}

// -- Tab: search by product name ---------------------------------------------

function SearchTab({ onAddProduct, onDone }: { onAddProduct: (product: Product) => void; onDone: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedName, setAddedName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchTerm.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const found = await productService.list({ search: searchTerm.trim() });
        setResults(found);
      } catch (err) {
        setResults([]);
        setError(err instanceof ApiError ? err.message : "खोज विफल / Search failed");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  if (addedName) {
    return (
      <SuccessPrompt
        productName={addedName}
        onAddMore={() => {
          setAddedName(null);
          setSearchTerm("");
          setResults([]);
        }}
        onDone={onDone}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
      <BilingualLabel hi="कम से कम 3 अक्षर लिखें" en="Type at least 3 characters" size="body" />
      <input
        type="text"
        autoFocus
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="उत्पाद नाम / Product name"
        style={inputStyle}
      />
      {searching && <p style={{ fontSize: "0.85rem", color: colors.textSecondary }}>खोज रहे हैं / Searching...</p>}
      {error && <p style={{ fontSize: "0.85rem", color: colors.danger }}>{error}</p>}

      <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              onAddProduct(product);
              setAddedName(product.name);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: spacing.sm,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.button,
              background: colors.white,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600 }}>{product.name}</div>
            <div style={{ fontSize: "0.85rem", color: colors.textSecondary }}>
              ₹{product.default_selling_price.toFixed(2)} — स्टॉक/Stock: {product.stock_quantity} {product.unit_of_measure}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// -- shared bits -----------------------------------------------------------

function SuccessPrompt({
  productName,
  onAddMore,
  onDone,
}: {
  productName: string;
  onAddMore: () => void;
  onDone: () => void;
}) {
  return (
    <div style={{ padding: spacing.sm, background: `${colors.success}18`, borderRadius: radii.button }}>
      <p style={{ color: colors.success, fontWeight: 700, margin: 0 }}>✓ जोड़ा गया / Added: {productName}</p>
      <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
        <button onClick={onAddMore} style={primaryButtonStyle}>
          ➕ और जोड़ें / Add More
        </button>
        <button onClick={onDone} style={doneButtonStyle}>
          ✓ हो गया / Done
        </button>
      </div>
    </div>
  );
}

function FeedbackLine({ message }: { message: { success: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p style={{ color: message.success ? colors.success : colors.danger, fontWeight: 600, margin: 0 }}>
      {message.success ? "✓" : "✕"} {message.text}
    </p>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: radii.pill,
        border: `2px solid ${active ? colors.leafGreen : colors.border}`,
        background: active ? `${colors.leafGreen}18` : colors.white,
        fontWeight: 700,
        fontSize: "0.85rem",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

const bigAddButtonStyle: React.CSSProperties = {
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: radii.pill,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  fontSize: "1.15rem",
  cursor: "pointer",
  minHeight: "56px",
  boxShadow: "0 2px 8px rgba(76, 122, 61, 0.35)",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: spacing.lg,
};

const modalStyle: React.CSSProperties = {
  background: colors.huskCream,
  borderRadius: radii.tile,
  padding: spacing.lg,
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const closeIconStyle: React.CSSProperties = {
  border: "none",
  background: "none",
  fontSize: "1.3rem",
  cursor: "pointer",
  color: colors.textSecondary,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: spacing.sm,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: "none",
  background: colors.leafGreen,
  color: colors.white,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const doneButtonStyle: React.CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radii.button,
  border: `1px solid ${colors.border}`,
  background: colors.white,
  color: colors.textPrimary,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
