"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, detectBrowserLang, Lang } from "@/lib/i18n/useTranslation";

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

  // Idioma detectado do navegador (antes do login não sabemos a clínica)
  const [lang, setLang] = useState<Lang>("pt");
  useEffect(() => {
    setLang(detectBrowserLang());
  }, []);
  const { t, dir } = useTranslation(lang);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const hash = await sha256(senha);
      const users = await sbQuery<{id:string;clinica_id:string;senha_hash:string;primeiro_acesso:boolean}>("usuarios", `?email=eq.${encodeURIComponent(email)}&select=*`);
      if (!users.length) throw new Error(t("login.error_credentials"));
      const u = users[0];
      if (u.senha_hash !== hash) throw new Error(t("login.error_credentials"));
      const clinicas = await sbQuery<{id:string;nome:string}>("clinicas", `?id=eq.${u.clinica_id}&ativo=eq.true&select=id,nome`);
      if (!clinicas.length) throw new Error(t("login.error_clinic"));
      localStorage.setItem("auth_token", hash);
      localStorage.setItem("clinica_id", u.clinica_id);
      localStorage.setItem("user_id", u.id);
      localStorage.setItem("clinica_nome", clinicas[0].nome || "Clínica");
      if (u.primeiro_acesso) { setUserId(u.id); setPrimeiroAcesso(true); return; }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("login.error_login"));
    } finally { setLoading(false); }
  }

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) { setError(t("login.error_min_chars")); return; }
    if (novaSenha !== confirmaSenha) { setError(t("login.error_no_match")); return; }
    setSavingPass(true); setError("");
    try {
      const hash = await sha256(novaSenha);
      await sbUpdate("usuarios", userId, { senha_hash: hash, primeiro_acesso: false });
      localStorage.setItem("auth_token", hash);
      router.replace("/dashboard");
    } catch { setError(t("login.error_save")); }
    finally { setSavingPass(false); }
  }

  return (
    <div dir={dir} className="min-h-screen flex items-center justify-center p-6" style={{background:"linear-gradient(135deg,#DEF2F1 0%,#f0fafa 50%,#ffffff 100%)"}}>
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
            <h1 className="text-lg font-bold text-gray-900">{t("nav.app_name")}</h1>
            <p className="text-xs text-gray-400 font-mono">{t("nav.clinic_management")}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!primeiroAcesso ? (
            <motion.div key="login" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("login.welcome")}</h2>
              <p className="text-sm text-gray-400 mb-8">{t("login.subtitle")}</p>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t("login.email")}</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="clinica@exemplo.com" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all"
                    style={{}} onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t("login.password")}</label>
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
                  {loading ? t("login.btn_loading") : t("login.btn_enter")}
                </button>
                <div className="text-center pt-1">
                  <Link href="/recuperar" className="text-sm font-medium" style={{color:"#2B7A78"}}>
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div key="primeiro" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("login.first_access_title")}</h2>
              <p className="text-sm text-gray-400 mb-8">{t("login.first_access_sub")}</p>
              <form onSubmit={handleNovaSenha} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t("login.new_password")}</label>
                  <input type="password" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)} placeholder={t("login.password_placeholder")} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t("login.confirm_password")}</label>
                  <input type="password" value={confirmaSenha} onChange={e=>setConfirmaSenha(e.target.value)} placeholder={t("login.confirm_placeholder")} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none"
                    onFocus={e=>e.target.style.borderColor="#2B7A78"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <AnimatePresence>
                  {error && <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</motion.div>}
                </AnimatePresence>
                <button type="submit" disabled={savingPass}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                  {savingPass ? t("login.btn_saving") : t("login.btn_save")}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
