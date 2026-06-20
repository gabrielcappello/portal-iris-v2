"use client";
// src/app/recuperar/page.tsx
// Tela onde o cliente informa o e-mail para receber o link de recuperação.

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Mesmo em erro de rede, mostramos a tela de confirmação genérica
    } finally {
      setLoading(false);
      setEnviado(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#DEF2F1 0%,#f0fafa 50%,#ffffff 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#2B7A78,#3AAFA9)", boxShadow: "0 8px 24px rgba(43,122,120,0.3)" }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <circle cx="12" cy="12" r="10" fillOpacity="0.2" />
              <circle cx="12" cy="12" r="6" fillOpacity="0.35" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Iris Portal</h1>
            <p className="text-xs text-gray-400 font-mono">Gestão de Clínica</p>
          </div>
        </div>

        {!enviado ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Recuperar senha</h2>
            <p className="text-sm text-gray-400 mb-8">
              Digite seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="clinica@exemplo.com" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
                  onFocus={(e) => (e.target.style.borderColor = "#2B7A78")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#2B7A78,#3AAFA9)" }}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Verifique seu e-mail</h2>
            <p className="text-sm text-gray-500 mb-2 leading-relaxed">
              Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha.
            </p>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              O link é válido por 1 hora. Não esqueça de checar a caixa de spam.
            </p>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-semibold" style={{ color: "#2B7A78" }}>
            ← Voltar para o login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
