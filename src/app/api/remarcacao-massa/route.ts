// src/app/api/remarcacao-massa/route.ts
//
// Ponte server-side para o webhook de remarcação em massa do n8n.
// O navegador chama esta rota (mesma origem, sem CORS); esta rota,
// rodando no servidor da Vercel, repassa o payload IDÊNTICO ao n8n
// (servidor -> servidor) e devolve status + body do n8n ao front.
//
// A URL do n8n NÃO fica no código nem no navegador: vem da env var
// N8N_REMARCACAO_MASSA_URL, configurada em Vercel > Environment Variables.
// (Não usar prefixo NEXT_PUBLIC_, senão a URL vazaria para o browser.)

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_URL = process.env.N8N_REMARCACAO_MASSA_URL;
const TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  // Guarda: se a env var não estiver configurada, falha de forma clara.
  if (!N8N_URL) {
    console.error(
      "[remarcacao-massa] N8N_REMARCACAO_MASSA_URL não configurada no ambiente."
    );
    return NextResponse.json(
      {
        erro: "configuracao_ausente",
        detalhe:
          "O webhook de remarcação não está configurado no servidor.",
      },
      { status: 500 }
    );
  }

  // Lê o corpo cru e repassa EXATAMENTE como veio do front,
  // preservando o contrato do payload sem reserializar.
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

    // Repassa status e corpo do n8n de volta ao front,
    // preservando o content-type da resposta original.
    const responseBody = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error("[remarcacao-massa] Falha ao contatar o n8n:", err);

    return NextResponse.json(
      {
        erro: isAbort ? "timeout" : "falha_upstream",
        detalhe: isAbort
          ? "O servidor de remarcação demorou demais para responder."
          : "Não foi possível contatar o servidor de remarcação.",
      },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
