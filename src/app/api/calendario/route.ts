import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_URL = process.env.N8N_BUSCAR_CALENDARIO_URL;
const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  if (!N8N_URL) {
    console.error("[calendario] N8N_BUSCAR_CALENDARIO_URL não configurada.");
    return NextResponse.json(
      { sucesso: false, erro: "configuracao_ausente" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(N8N_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
      signal: controller.signal,
    });

    const responseBody = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[calendario] Falha ao contatar o n8n:", err);
    return NextResponse.json(
      { sucesso: false, erro: isAbort ? "timeout" : "falha_upstream" },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
