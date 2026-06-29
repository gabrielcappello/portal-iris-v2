import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Ícone PWA 512x512 — logo Iris (círculos concêntricos sobre teal)
export function GET() {
  const S = 512;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#2B7A78,#3AAFA9)" }}>
        <div style={{ width: "58%", height: "58%", borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "64%", height: "64%", borderRadius: "50%", background: "rgba(255,255,255,0.42)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "52%", height: "52%", borderRadius: "50%", background: "#ffffff" }} />
          </div>
        </div>
      </div>
    ),
    { width: S, height: S }
  );
}
