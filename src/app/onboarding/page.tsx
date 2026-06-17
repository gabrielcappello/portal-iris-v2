"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const CRIAR_CLINICA_URL = "https://udizowyfjnhuhgxkeayk.supabase.co/functions/v1/criar-clinica";
const CRIAR_CLINICA_KEY = "Cappia@2026";

const LANGUAGES = [
  { code: "pt-br", label: "Português", sub: "Brasil",           flag: "🇧🇷" },
  { code: "es",    label: "Español",   sub: "España / LATAM",   flag: "🇪🇸" },
  { code: "en",    label: "English",   sub: "US / UK",          flag: "🇺🇸" },
  { code: "fr",    label: "Français",  sub: "France",           flag: "🇫🇷" },
  { code: "de",    label: "Deutsch",   sub: "Deutschland",      flag: "🇩🇪" },
  { code: "it",    label: "Italiano",  sub: "Italia",           flag: "🇮🇹" },
  { code: "ru",    label: "Русский",   sub: "Россия",           flag: "🇷🇺" },
  { code: "ar",    label: "العربية",   sub: "عربي",             flag: "🇸🇦" },
];

const COUNTRIES = [
  { code: "BR", name: "Brasil",               ddi: "+55" },
  { code: "PT", name: "Portugal",             ddi: "+351" },
  { code: "MX", name: "México",               ddi: "+52" },
  { code: "AR", name: "Argentina",            ddi: "+54" },
  { code: "CO", name: "Colombia",             ddi: "+57" },
  { code: "CL", name: "Chile",               ddi: "+56" },
  { code: "PE", name: "Perú",                ddi: "+51" },
  { code: "UY", name: "Uruguay",             ddi: "+598" },
  { code: "PY", name: "Paraguay",            ddi: "+595" },
  { code: "BO", name: "Bolivia",             ddi: "+591" },
  { code: "VE", name: "Venezuela",           ddi: "+58" },
  { code: "EC", name: "Ecuador",             ddi: "+593" },
  { code: "ES", name: "España",              ddi: "+34" },
  { code: "US", name: "United States",       ddi: "+1" },
  { code: "FR", name: "France",              ddi: "+33" },
  { code: "DE", name: "Deutschland",         ddi: "+49" },
  { code: "IT", name: "Italia",              ddi: "+39" },
  { code: "RU", name: "Россия",              ddi: "+7" },
  { code: "SA", name: "السعودية",            ddi: "+966" },
];

const STEPS = ["Idioma", "País", "Clínica", "Iris"];

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all";
const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#2B7A78");
const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#e2e8f0");

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [idioma, setIdioma] = useState("pt-br");
  const [pais, setPais]     = useState("BR");
  const [nome, setNome]     = useState("");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const selectedCountry = COUNTRIES.find(c => c.code === pais) || COUNTRIES[0];

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const senhaHash = await sha256(senha);
      const res = await fetch(CRIAR_CLINICA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": CRIAR_CLINICA_KEY },
        body: JSON.stringify({ nome, email, senha_hash: senhaHash, idioma, pais_codigo: pais, telefone_agente: telefone }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Erro ao criar clínica");
      const data = await res.json();
      localStorage.setItem("auth_token",   data.auth_token  || data.token || senhaHash);
      localStorage.setItem("clinica_id",   data.clinica_id  || data.id    || "");
      localStorage.setItem("user_id",      data.user_id     || "");
      localStorage.setItem("clinica_nome", nome);
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar clínica");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setError("");
    if (step === 0) { setStep(1); return; }
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!nome.trim())      { setError("Informe o nome da clínica"); return; }
      if (!email.trim())     { setError("Informe o e-mail de acesso"); return; }
      if (senha.length < 6)  { setError("A senha deve ter pelo menos 6 caracteres"); return; }
      setStep(3); return;
    }
    if (step === 3) {
      if (!telefone.trim()) { setError("Informe o número do WhatsApp da Iris"); return; }
      submit();
    }
  }

  function back() { if (step > 0) { setStep(s => s - 1); setError(""); } }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{background:"linear-gradient(135deg,#DEF2F1 0%,#f0fafa 50%,#ffffff 100%)"}}>

      <motion.div initial={{opacity:0,y:24,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
        transition={{duration:0.5,ease:[0.16,1,0.3,1]}}
        className="w-full bg-white rounded-2xl shadow-xl border border-gray-100"
        style={{maxWidth: step === 1 ? 440 : 480, padding: 32}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:12,flexShrink:0,
            background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 8px 24px rgba(43,122,120,0.3)"}}>
            <svg viewBox="0 0 24 24" style={{width:20,height:20}} fill="white">
              <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
              <circle cx="12" cy="12" r="6" fillOpacity="0.35"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#1e293b",fontFamily:"'Sora',sans-serif"}}>IRIS</div>
            <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>Configuração inicial</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1}}>
              <div style={{height:3,borderRadius:4,background: i <= step ? "#2B7A78" : "#e2e8f0",transition:"background 0.3s",marginBottom:4}}/>
              <span style={{fontSize:10,color: i === step ? "#2B7A78" : "#94a3b8",fontWeight: i === step ? 700 : 400,fontFamily:"'Sora',sans-serif"}}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 0 — Idioma */}
          {step === 0 && (
            <motion.div key="idioma" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>Escolha o idioma</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>O painel e a Iris vão usar este idioma.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setIdioma(l.code)}
                    style={{padding:"12px 10px",borderRadius:12,border: idioma === l.code ? "2px solid #2B7A78" : "2px solid #e2e8f0",
                      background: idioma === l.code ? "rgba(43,122,120,0.07)" : "#f8fafc",
                      cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"'Sora',sans-serif"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{l.flag}</div>
                    <div style={{fontSize:13,fontWeight:600,color: idioma === l.code ? "#2B7A78" : "#1e293b"}}>{l.label}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{l.sub}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — País */}
          {step === 1 && (
            <motion.div key="pais" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>País</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>Onde fica sua clínica?</p>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto",marginBottom:24,paddingRight:2}}>
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => setPais(c.code)}
                    style={{padding:"10px 14px",borderRadius:10,border: pais === c.code ? "2px solid #2B7A78" : "2px solid #e2e8f0",
                      background: pais === c.code ? "rgba(43,122,120,0.07)" : "#fff",
                      cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s",fontFamily:"'Sora',sans-serif"}}>
                    <span style={{fontFamily:"monospace",fontSize:12,color:"#94a3b8",width:36,flexShrink:0}}>{c.ddi}</span>
                    <span style={{fontSize:13,fontWeight:500,color:"#1e293b",flex:1,textAlign:"left"}}>{c.name}</span>
                    {pais === c.code && <span style={{color:"#2B7A78",fontSize:14,fontWeight:700}}>✓</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Dados da clínica */}
          {step === 2 && (
            <motion.div key="dados" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>Dados da clínica</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>Informações para criar sua conta.</p>
              <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>
                    Nome da clínica
                  </label>
                  <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Clínica Odonto Prime"
                    className={inputCls} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>
                    E-mail de acesso
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@exemplo.com"
                    className={inputCls} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>
                    Senha
                  </label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres"
                    className={inputCls} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Telefone da Iris */}
          {step === 3 && (
            <motion.div key="telefone" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>Telefone da Iris</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>
                O número do WhatsApp que a Iris vai usar para atender seus pacientes.
              </p>
              <div style={{marginBottom:24}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>
                  Número WhatsApp
                </label>
                <div style={{display:"flex",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",transition:"border-color 0.2s"}}
                  onFocus={()=>{}} onBlur={()=>{}}>
                  <span style={{padding:"12px 14px",background:"#f1f5f9",borderRight:"1px solid #e2e8f0",fontFamily:"monospace",fontSize:13,color:"#2B7A78",whiteSpace:"nowrap",flexShrink:0}}>
                    {selectedCountry.ddi}
                  </span>
                  <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="999999999"
                    style={{flex:1,padding:"12px 14px",fontSize:13,border:"none",outline:"none",fontFamily:"'Sora',sans-serif"}}/>
                </div>
                <p style={{fontSize:11,color:"#94a3b8",marginTop:8}}>
                  Este número precisa estar disponível no Evolution API para conectar o WhatsApp.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:13,borderRadius:10,padding:"10px 14px",marginBottom:16}}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões */}
        <div style={{display:"flex",gap:10}}>
          {step > 0 && (
            <button onClick={back}
              style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",fontSize:13,fontWeight:600,color:"#64748b",cursor:"pointer",fontFamily:"'Sora',sans-serif",transition:"border-color 0.15s"}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#94a3b8")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#e2e8f0")}>
              Voltar
            </button>
          )}
          <button onClick={next} disabled={loading}
            style={{flex:2,padding:"13px 0",borderRadius:12,border:"none",
              background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",color:"#fff",
              fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",
              opacity:loading?0.7:1,fontFamily:"'Sora',sans-serif",transition:"opacity 0.15s"}}>
            {loading ? "Criando conta..." : step === 3 ? "Concluir e entrar" : "Continuar →"}
          </button>
        </div>

        {/* Link login */}
        <p style={{textAlign:"center",fontSize:12,color:"#94a3b8",marginTop:20}}>
          Já tem conta?{" "}
          <a href="/login" style={{color:"#2B7A78",fontWeight:600,textDecoration:"none"}}>Entrar</a>
        </p>

      </motion.div>
    </div>
  );
}
