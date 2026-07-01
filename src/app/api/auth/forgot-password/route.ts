// src/app/api/auth/forgot-password/route.ts

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
// Prefere SUPABASE_SECRET (nome novo padrão do projeto); cai pra SUPABASE_SERVICE_KEY por compat.
const SERVICE_KEY = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const APP_URL = process.env.APP_URL || "";
const FROM_EMAIL = "iris@cappia.app";

// Legada (JWT eyJ…) precisa do role via Bearer; sb_secret_… é só apikey (Bearer a rejeita).
const SB_HEADERS: Record<string, string> = {
  apikey: SERVICE_KEY,
  "Content-Type": "application/json",
  ...(SERVICE_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${SERVICE_KEY}` } : {}),
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function POST(req: Request) {
  const respostaGenerica = NextResponse.json({
    ok: true,
    message: "Se o e-mail estiver cadastrado, enviamos um link de recuperação.",
  });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return respostaGenerica;
    }

    const emailLimpo = email.trim().toLowerCase();

    // 1. Buscar usuário
    const urlUser = `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id`;
    const resUser = await fetch(urlUser, { headers: SB_HEADERS });
    if (!resUser.ok) {
      return respostaGenerica;
    }
    const users = await resUser.json();
    if (!users.length) return respostaGenerica;

    const usuarioId = users[0].id;

    // 2. Invalidar tokens antigos
    await fetch(
      `${SUPABASE_URL}/rest/v1/password_resets?usuario_id=eq.${usuarioId}&usado=eq.false`,
      { method: "PATCH", headers: SB_HEADERS, body: JSON.stringify({ usado: true }) }
    );

    // 3. Gerar token
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/password_resets`, {
      method: "POST",
      headers: SB_HEADERS,
      body: JSON.stringify({
        usuario_id: usuarioId,
        token_hash: tokenHash,
        expira_em: expiraEm,
        usado: false,
      }),
    });
    if (!resInsert.ok) {
      return respostaGenerica;
    }

    // 4. Enviar email via Resend
    const link = `${APP_URL}/redefinir?token=${token}`;
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#2B7A78;margin-bottom:8px">Recuperação de senha</h2>
        <p style="font-size:14px;line-height:1.6">
          Recebemos um pedido para redefinir a senha do seu painel.
          Clique no botão abaixo para criar uma nova senha. O link é válido por 1 hora.
        </p>
        <p style="text-align:center;margin:28px 0">
          <a href="${link}" style="background:#2B7A78;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280;line-height:1.6">
          Se você não pediu isso, pode ignorar este e-mail com segurança — sua senha continua a mesma.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">Iris · Cappia</p>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Iris <${FROM_EMAIL}>`,
        to: emailLimpo,
        subject: "Recuperação de senha — Painel Iris",
        html,
      }),
    });

    return respostaGenerica;
  } catch {
    return respostaGenerica;
  }
}
