import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { clinica_id, telefone, conteudo } = await req.json();
  const url = process.env.N8N_ENVIAR_MENSAGEM_MANUAL_URL;
  if (!url) return NextResponse.json({ erro: "webhook não configurado" }, { status: 500 });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinica_id, telefone, conteudo }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ erro: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
