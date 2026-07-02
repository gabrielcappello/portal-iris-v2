// src/app/api/odontograma/route.ts
//
// Proxy server-side para o odontograma. Roda SOMENTE no servidor e usa a chave
// secreta do Supabase (nunca exposta ao browser). O cliente envia { rpc, params }
// e este handler encaminha para /rest/v1/rpc/{rpc}.
//
// AUTENTICAÇÃO — dois formatos de chave, headers diferentes:
//   • Legada (JWT service_role, "eyJ…"): vai em `apikey` E `Authorization: Bearer`.
//     O PostgREST resolve o role pelo Bearer.
//   • Nova (`sb_secret_…`): NÃO é JWT. Vai SÓ no `apikey`. Enviá-la no
//     `Authorization: Bearer` faz o gateway rejeitar como "Invalid JWT" (doc
//     oficial Supabase); o gateway sintetiza o Authorization interno a partir
//     do apikey.
// Por isso o header é montado condicionalmente pelo prefixo da chave (só a
// legada leva Bearer) — o mesmo código funciona antes e depois da troca da
// chave, sem downtime.
// Isolamento por clinica_id é do backend — sempre passar p_clinica_id nos
// params quando a RPC pedir.

import { NextResponse } from "next/server";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SECRET_KEY = process.env.SUPABASE_SECRET || "";

// Legada (JWT eyJ…) precisa do role via Bearer; sb_secret_… é só apikey (Bearer a rejeita).
function sbHeaders(key: string): Record<string, string> {
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

// Apenas estas RPCs podem ser chamadas pelo proxy.
const RPCS_PERMITIDAS = new Set([
  "inicializar_odontograma",
  "buscar_odontograma_completo",
  "registrar_achado_odontograma",
  "resolver_achado_odontograma",
  "atualizar_estado_dente",
  "criar_consulta_odontograma",
  "registrar_sondagem_periodontal",
  "buscar_sondagem_periodontal",
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
      headers: sbHeaders(SECRET_KEY),
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
