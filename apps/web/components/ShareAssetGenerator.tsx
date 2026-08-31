"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Download, ImageDown, X } from "lucide-react";

interface ShareAssetGeneratorProps {
  url: string;
  recipientName: string;
  eventDate?: string;
  photos: string[];
  occasionLabel: string;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected photo."));
    image.src = source;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function countdownLabel(eventDate?: string): string {
  if (!eventDate) return "A SURPRISE IS WAITING";
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  if (days > 1) return `${days} DAYS TO GO`;
  if (days === 1) return "TOMORROW";
  if (days === 0) return "TODAY IS THE DAY";
  return "THE CELEBRATION IS HERE";
}

function fitCenteredText(context: CanvasRenderingContext2D, value: string, y: number, maxWidth: number, startSize: number) {
  let size = startSize;
  do {
    context.font = `700 ${size}px Georgia, serif`;
    size -= 2;
  } while (size > 38 && context.measureText(value).width > maxWidth);
  context.fillText(value, 540, y);
}

export default function ShareAssetGenerator({ url, recipientName, eventDate, photos, occasionLabel }: ShareAssetGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [generating, setGenerating] = useState<"story" | "status" | "">("");
  const [error, setError] = useState("");

  const generate = async (format: "story" | "status") => {
    setGenerating(format);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image generation is unavailable in this browser.");

      const background = context.createLinearGradient(0, 0, 1080, 1920);
      background.addColorStop(0, "#281126");
      background.addColorStop(0.5, "#160d1e");
      background.addColorStop(1, "#0c0812");
      context.fillStyle = background;
      context.fillRect(0, 0, 1080, 1920);

      const photoUrl = photos[selectedPhoto];
      if (photoUrl) {
        const photo = await loadImage(photoUrl);
        context.save();
        context.beginPath();
        context.roundRect(72, 220, 936, 940, 32);
        context.clip();
        context.translate(72, 220);
        drawCover(context, photo, 936, 940);
        context.restore();
      }

      const overlay = context.createLinearGradient(0, 600, 0, 1450);
      overlay.addColorStop(0, "rgba(12,8,18,0)");
      overlay.addColorStop(1, "rgba(12,8,18,0.98)");
      context.fillStyle = overlay;
      context.fillRect(0, 580, 1080, 950);

      context.textAlign = "center";
      context.fillStyle = "#ffcf7a";
      context.font = "700 31px sans-serif";
      context.fillText(occasionLabel.toUpperCase(), 540, 125);
      context.fillStyle = "#fff5ec";
      fitCenteredText(context, recipientName.slice(0, 40), 1310, 900, 78);
      context.fillStyle = "#ff9e4f";
      context.font = "800 34px sans-serif";
      context.fillText(countdownLabel(eventDate), 540, 1380);
      context.fillStyle = "#efe1d6";
      context.font = "600 41px sans-serif";
      context.fillText("Something special is waiting for you", 540, 1465);

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 360,
        margin: 2,
        color: { dark: "#12091f", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      const qr = await loadImage(qrDataUrl);
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(408, 1530, 264, 264, 22);
      context.fill();
      context.drawImage(qr, 424, 1546, 232, 232);
      context.fillStyle = "#b9a6be";
      context.font = "600 24px sans-serif";
      context.fillText("SCAN TO OPEN", 540, 1840);
      context.fillStyle = "#ffcf7a";
      context.font = "700 23px sans-serif";
      context.fillText("Just4You.buzz", 540, 1885);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1);
      link.download = `just4you-${recipientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${format}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to generate the share image.");
    } finally {
      setGenerating("");
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.08] py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/[0.14]">
        <ImageDown size={13} /> Story
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl rounded-lg border border-white/10 bg-[#17101e] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Ready-made share asset</p><h2 className="mt-1 font-playfair text-2xl font-bold text-white">Choose the cover photo</h2></div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/55 hover:text-white" aria-label="Close share asset generator"><X size={17} /></button>
            </div>

            {photos.length > 0 ? (
              <div className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" onClick={() => setSelectedPhoto(index)} className={`aspect-[3/4] overflow-hidden rounded-md border-2 ${selectedPhoto === index ? "border-[#ff9e4f]" : "border-transparent"}`}><img src={photo} alt={`Select photo ${index + 1}`} className="h-full w-full object-cover" /></button>)}
              </div>
            ) : <p className="mb-6 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">This design will use a branded background because no photos were uploaded.</p>}

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
              <strong className="block text-white">Included automatically</strong>
              <span className="mt-1 block leading-6">{recipientName}, {countdownLabel(eventDate).toLowerCase()}, QR code, and “Something special is waiting for you”.</span>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => generate("story")} disabled={!!generating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-4 font-bold text-white disabled:opacity-50"><Download size={16} /> {generating === "story" ? "Creating..." : "Instagram Story"}</button>
              <button type="button" onClick={() => generate("status")} disabled={!!generating} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 font-bold text-[#071b0e] disabled:opacity-50"><Download size={16} /> {generating === "status" ? "Creating..." : "WhatsApp Status"}</button>
            </div>
            <p className="mt-3 text-center text-xs text-white/30">Both downloads are optimized at 1080 × 1920.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}