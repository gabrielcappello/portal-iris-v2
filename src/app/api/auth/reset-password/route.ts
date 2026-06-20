// src/app/api/auth/reset-password/route.ts
//
// Recebe { token, senha }. Valida o token (existe, não expirou, não foi usado),
// grava a nova senha com hash SHA-256, marca o token como usado e zera
// primeiro_acesso. Roda SOMENTE no servidor.

import { NextResponse } from "next/server";
import { createHash } from "crypto";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const SB_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { token, senha } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, message: "Link inválido." }, { status: 400 });
    }
    if (!senha || typeof senha !== "string" || senha.length < 6) {
      return NextResponse.json(
        { ok: false, message: "A senha precisa ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = sha256(token);
    const agora = new Date().toISOString();

    // 1. Busca um token válido: hash bate, não usado e ainda não expirou
    const resTok = await fetch(
      `${SUPABASE_URL}/rest/v1/password_resets?token_hash=eq.${tokenHash}&usado=eq.false&expira_em=gt.${agora}&select=id,usuario_id`,
      { headers: SB_HEADERS }
    );
    if (!resTok.ok) {
      return NextResponse.json({ ok: false, message: "Erro ao validar o link." }, { status: 500 });
    }
    const tokens = await resTok.json();
    if (!tokens.length) {
      return NextResponse.json(
        { ok: false, message: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 }
      );
    }

    const { id: resetId, usuario_id: usuarioId } = tokens[0];
    const senhaHash = sha256(senha);

    // 2. Atualiza a senha do usuário (e libera primeiro_acesso)
    const resUpd = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuarioId}`, {
      method: "PATCH",
      headers: SB_HEADERS,
      body: JSON.stringify({ senha_hash: senhaHash, primeiro_acesso: false }),
    });
    if (!resUpd.ok) {
      return NextResponse.json({ ok: false, message: "Erro ao salvar a senha." }, { status: 500 });
    }

    // 3. Marca o token como usado
    await fetch(`${SUPABASE_URL}/rest/v1/password_resets?id=eq.${resetId}`, {
      method: "PATCH",
      headers: SB_HEADERS,
      body: JSON.stringify({ usado: true }),
    });

    return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso." });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro inesperado." }, { status: 500 });
  }
}
