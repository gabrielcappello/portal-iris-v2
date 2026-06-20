"use client";
// src/app/redefinir/page.tsx
// Tela aberta pelo link do e-mail (com ?token=...). O cliente define a nova senha.

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function RedefinirForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [semToken, setSemToken] = useState(false);

  useEffect(() => {
    if (!token) setSemToken(true);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (novaSenha.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (novaSenha !== confirma) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Não foi possível redefinir a senha.");
        return;
      }
      setSucesso(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const card = (children: React.ReactNode) => (
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
        {children}
      </motion.div>
    </div>
  );

  if (semToken) {
    return card(
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Link inválido</h2>
        <p className="text-sm text-gray-400 mb-8">Este link não é válido. Solicite uma nova recuperação de senha.</p>
        <Link href="/recuperar" className="text-sm font-semibold" style={{ color: "#2B7A78" }}>← Solicitar novo link</Link>
      </>
    );
  }

  if (sucesso) {
    return card(
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Senha redefinida! ✅</h2>
        <p className="text-sm text-gray-400 mb-8">Sua nova senha foi salva. Redirecionando para o login...</p>
      </motion.div>
    );
  }

  return card(
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Criar nova senha</h2>
      <p className="text-sm text-gray-400 mb-8">Escolha uma senha nova para acessar o painel.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nova senha</label>
          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
            onFocus={(e) => (e.target.style.borderColor = "#2B7A78")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Confirmar senha</label>
          <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder="Repita a senha" required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
            onFocus={(e) => (e.target.style.borderColor = "#2B7A78")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#2B7A78,#3AAFA9)" }}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}

export default function RedefinirPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#f0fafa" }} />}>
      <RedefinirForm />
    </Suspense>
  );
}
