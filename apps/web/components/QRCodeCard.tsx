"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

/**
 * Renders a scannable QR code for a wish link so creators can print it on
 * cards, invites or gifts. Generated fully client-side (no external service).
 */
export default function QRCodeCard({
  url,
  name,
  accent = "#a855f7",
  compact = false,
}: {
  url: string;
  name?: string;
  accent?: string;
  compact?: boolean;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#12091f", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [url]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `just4you-${(name || "surprise").toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    a.click();
  };

  if (!dataUrl) return null;

  if (compact) {
    return (
      <button
        onClick={download}
        title="Download QR code"
        className="flex items-center justify-center p-2 rounded-xl transition-all hover:brightness-110"
        style={{ background: `${accent}15`, border: `1px solid ${accent}44`, color: accent }}
      >
        <QrCode size={14} />
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col items-center text-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)" }}
    >
      <div className="rounded-2xl overflow-hidden bg-white p-2 mb-3" style={{ width: 160, height: 160 }}>
        <img src={dataUrl} alt="Scan to open the surprise" width={144} height={144} />
      </div>
      <p className="text-sm font-semibold mb-1">Scan to open ✨</p>
      <p className="text-xs text-[var(--text-muted)] mb-4">Print it on a card, gift tag or invite.</p>
      <button
        onClick={download}
        className="flex items-center gap-2 py-2 px-5 rounded-full text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
      >
        <Download size={14} /> Download QR
      </button>
    </div>
  );
}
