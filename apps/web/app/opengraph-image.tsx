import { ImageResponse } from "next/og";

export const alt = "Just4You.buzz personalized birthday websites and online wedding invitations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#18101e", color: "#fff5ec", padding: "72px 82px", fontFamily: "Georgia, serif" }}>
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 520, background: "#672946", filter: "blur(90px)", top: -250, right: -80, opacity: 0.7 }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15, fontFamily: "Arial, sans-serif", fontSize: 28, fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 58, height: 48, borderRadius: 8, background: "#ff8a5c", color: "white", fontSize: 18 }}>J4Y</div>
          Just4You<span style={{ color: "#ffcf7a" }}>.buzz</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 940 }}>
          <div style={{ color: "#ffb877", fontFamily: "Arial, sans-serif", fontSize: 23, fontWeight: 700, textTransform: "uppercase" }}>Personalized digital celebrations</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 68, lineHeight: 1.08, fontWeight: 700 }}>Birthday websites and online wedding invitations</div>
          <div style={{ display: "flex", marginTop: 24, color: "#d8c6d9", fontFamily: "Arial, sans-serif", fontSize: 27 }}>Photos · music · messages · interactive reveals · from ₹199</div>
        </div>
      </div>
    </div>,
    size,
  );
}