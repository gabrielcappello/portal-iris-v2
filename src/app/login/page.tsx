"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXpvd3lmam5odWhneGtlYXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ1NDgsImV4cCI6MjA5NTQyMDU0OH0.EGX17VhE0IBlX5K-aqvJeAQ3GDIiDD-w-hXgTyQiaws";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function sbQuery<T>(table: string, params = ""): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbUpdate(table: string, id: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [userId, setUserId] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const hash = await sha256(senha);
      const users = await sbQuery<{id:string;clinica_id:string;senha_hash:string;primeiro_acesso:boolean}>("usuarios", `?email=eq.${encodeURIComponent(email)}&select=*`);
      if (!users.length) throw new Error("Email ou senha incorretos");
      const u = users[0];
      if (u.senha_hash !== hash) throw new Error("Email ou senha incorretos");
      const clinicas = await sbQuery<{id:string;nome_clinica:string}>("clinicas", `?id=eq.${u.clinica_id}&select=id,nome_clinica`);
      if (!clinicas.length) throw new Error("Clínica não encontrada ou inativa");
      localStorage.setItem("auth_token", hash);
      localStorage.setItem("clinica_id", u.clinica_id);
      localStorage.setItem("user_id", u.id);
      localStorage.setItem("clinica_nome", clinicas[0].nome_clinica || "Clínica");
      if (u.primeiro_acesso) { setUserId(u.id); setPrimeiroAcesso(true); return; }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao fazer login");
    } finally { setLoading(false); }
  }

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) { setError("Senha mínima de 6 caracteres"); return; }
    if (novaSenha !== confirmaSenha) { setError("Senhas não coincidem"); return; }
    setSavingPass(true); setError("");
    try {
      const hash = await sha256(novaSenha);
      await sbUpdate("usuarios", userId, { senha_hash: hash, primeiro_acesso: false });
      localStorage.setItem("auth_token", hash);
      router.replace("/dashboard");
    } catch { setError("Erro ao salvar senha"); }
    finally { setSavingPass(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:"linear-gradient(135deg,#DEF2F1 0%,#f0fafa 50%,#ffffff 100%)"}}>
      <motion.div initial={{opacity:0,y:24,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.5,ease:[0.16,1,0.3,1]}}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",boxShadow:"0 8px 24px rgba(43,122,120,0.3)"}}>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
              <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
              <circle cx="12" cy="12" r="6" fillOpacity="0.35"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Iris Portal</h1>
            <p className="text-xs text-gray-400 font-mono">Gestão de Clínica</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!primeiroAcesso ? (
            <motion.div key="login" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h2>
              <p className="text-sm text-gray-400 mb-8">Entre com suas credenciais para continuar</p>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="clinica@exemplo.com" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
                    style={{}} onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Senha</label>
                  <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
                    onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <AnimatePresence>
                  {error && <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</motion.div>}
                </AnimatePresence>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="primeiro" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Criar senha</h2>
              <p className="text-sm text-gray-400 mb-8">Este é seu primeiro acesso. Defina uma senha segura.</p>
              <form onSubmit={handleNovaSenha} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Nova senha</label>
                  <input type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Confirmar senha</label>
                  <input type="password" value={confirmaSenha} onChange={e=>setConfirmaSenha(e.target.value)} placeholder="Repita a senha" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <AnimatePresence>
                  {error && <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</motion.div>}
                </AnimatePresence>
                <button type="submit" disabled={savingPass}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                  {savingPass ? "Salvando..." : "Salvar e entrar"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
