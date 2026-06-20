// src/app/api/auth/forgot-password/route.ts
// VERSÃO COM DEBUG TEMPORÁRIO — remover logs depois de funcionar

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const APP_URL = process.env.APP_URL || "";
const FROM_EMAIL = "iris@cappia.app";

const SB_HEADERS = {
  apikey: SERVICE_KEY,
  "Content-Type": "application/json",
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function POST(req: Request) {
  const respostaGenerica = NextResponse.json({
    ok: true,
    message: "Se o e-mail estiver cadastrado, enviamos um link de recuperação.",
  });

  // DEBUG: verificar se as variáveis chegaram
  console.log("[FORGOT] ENV CHECK:", {
    hasServiceKey: !!SERVICE_KEY,
    serviceKeyStart: SERVICE_KEY.substring(0, 12),
    hasResendKey: !!RESEND_API_KEY,
    resendKeyStart: RESEND_API_KEY.substring(0, 8),
    appUrl: APP_URL,
  });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      console.log("[FORGOT] Email inválido ou vazio");
      return respostaGenerica;
    }

    const emailLimpo = email.trim().toLowerCase();
    console.log("[FORGOT] Email recebido:", emailLimpo);

    // 1. Buscar usuário
    const urlUser = `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(emailLimpo)}&select=id`;
    console.log("[FORGOT] Buscando usuário...");
    const resUser = await fetch(urlUser, { headers: SB_HEADERS });
    console.log("[FORGOT] Supabase usuarios status:", resUser.status);
    if (!resUser.ok) {
      const errText = await resUser.text();
      console.error("[FORGOT] ERRO Supabase usuarios:", errText);
      return respostaGenerica;
    }
    const users = await resUser.json();
    console.log("[FORGOT] Usuários encontrados:", users.length);
    if (!users.length) return respostaGenerica;

    const usuarioId = users[0].id;

    // 2. Invalidar tokens antigos
    console.log("[FORGOT] Invalidando tokens antigos...");
    const resInv = await fetch(
      `${SUPABASE_URL}/rest/v1/password_resets?usuario_id=eq.${usuarioId}&usado=eq.false`,
      { method: "PATCH", headers: SB_HEADERS, body: JSON.stringify({ usado: true }) }
    );
    console.log("[FORGOT] Invalidar status:", resInv.status);

    // 3. Gerar token
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    console.log("[FORGOT] Inserindo token...");
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
    console.log("[FORGOT] Insert token status:", resInsert.status);
    if (!resInsert.ok) {
      const errText = await resInsert.text();
      console.error("[FORGOT] ERRO insert token:", errText);
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

    console.log("[FORGOT] Enviando email via Resend...");
    const resEmail = await fetch("https://api.resend.com/emails", {
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
    const resEmailData = await resEmail.json();
    console.log("[FORGOT] Resend status:", resEmail.status, "resposta:", JSON.stringify(resEmailData));

    return respostaGenerica;
  } catch (err) {
    console.error("[FORGOT] ERRO GERAL:", err);
    return respostaGenerica;
  }
}
