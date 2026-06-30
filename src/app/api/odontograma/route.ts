// src/app/api/odontograma/route.ts
//
// Proxy server-side para o odontograma. Roda SOMENTE no servidor e usa a
// SERVICE/SECRET key do Supabase (nunca exposta ao browser). O cliente envia
// { rpc, params } e este handler encaminha para /rest/v1/rpc/{rpc}.
//
// Spec: usar sb_secret no header `apikey` (sem Authorization: Bearer) e nunca
// a chave anon antiga. O isolamento por clinica_id é responsabilidade das
// queries — sempre passar p_clinica_id nos params quando a RPC pedir.

import { NextResponse } from "next/server";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SECRET_KEY =
  process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_KEY || "";

// Apenas estas RPCs podem ser chamadas pelo proxy.
const RPCS_PERMITIDAS = new Set([
  "inicializar_odontograma",
  "buscar_odontograma_completo",
  "registrar_achado_odontograma",
  "resolver_achado_odontograma",
  "atualizar_estado_dente",
  "criar_consulta_odontograma",
]);

export async function POST(req: Request) {
  if (!SECRET_KEY) {
    return NextResponse.json(
      { ok: false, message: "Servidor sem chave do Supabase configurada." },
      { status: 500 }
    );
  }

  let body: { rpc?: string; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "JSON inválido." }, { status: 400 });
  }

  const { rpc, params } = body;
  if (!rpc || !RPCS_PERMITIDAS.has(rpc)) {
    return NextResponse.json(
      { ok: false, message: `RPC não permitida: ${rpc ?? "(vazia)"}.` },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
      method: "POST",
      headers: {
        apikey: SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params ?? {}),
    });

    const texto = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: "Erro no Supabase.", detalhe: texto },
        { status: res.status }
      );
    }

    // RPCs retornam JSON (objeto, array ou valor). Repassa cru.
    const data = texto ? JSON.parse(texto) : null;
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "Falha ao chamar o Supabase.", detalhe: String(e) },
      { status: 500 }
    );
  }
}
