"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXpvd3lmam5odWhneGtlYXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ1NDgsImV4cCI6MjA5NTQyMDU0OH0.EGX17VhE0IBlX5K-aqvJeAQ3GDIiDD-w-hXgTyQiaws";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const hash = await sha256(senha);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}&senha_hash=eq.${hash}&select=*`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const users = await res.json();
      if (!users.length) throw new Error("Email ou senha incorretos");
      const user = users[0];
      localStorage.setItem("auth_token", hash);
      localStorage.setItem("clinica_id", user.clinica_id);
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#DEF2F1] via-white to-[#f0fafa] p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2B7A78] to-[#3AAFA9] flex items-center justify-center shadow-lg shadow-[#2B7A78]/30">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <circle cx="12" cy="12" r="10" fillOpacity="0.15"/>
              <circle cx="12" cy="12" r="6" fillOpacity="0.3"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Iris Portal</h1>
            <p className="text-xs text-gray-400 font-mono">Gestão de Clínica</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
        <p className="text-sm text-gray-400 mb-8">Entre com suas credenciais para continuar</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="clinica@exemplo.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A78] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A78] focus:border-transparent transition-all"
            />
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2B7A78] to-[#3AAFA9] text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#2B7A78]/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
