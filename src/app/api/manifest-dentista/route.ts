import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Manifest PWA por dentista: o ícone instalado abre direto na agenda dele
// (start_url com o token), em tela cheia (standalone).
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const clinica = sp.get("clinica") || "";
  const idx = sp.get("idx") || "";
  const t = sp.get("t") || "";
  const nome = sp.get("nome") || "";

  const base = `/dentista/${clinica}/${idx}`;
  const start = t ? `${base}?t=${encodeURIComponent(t)}` : base;

  const manifest = {
    name: nome ? `${nome} — Iris` : "Iris — Agenda",
    short_name: "Iris",
    description: "Agenda do dentista",
    start_url: start,
    scope: base,
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2B7A78",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
