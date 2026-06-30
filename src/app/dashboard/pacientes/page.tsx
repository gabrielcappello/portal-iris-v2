"use client";
import { useState, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, MessageCircle } from "lucide-react";
import { sb, calcularIdade, type Paciente, type Agendamento } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";
import type { TranslationKey } from "@/lib/i18n/translations";
import ChatManualModal from "@/components/ChatManualModal";
import AnamneseModal, { type AnamneseData } from "@/components/AnamneseModal";
import OdontogramaModal from "@/components/OdontogramaModal";

function getStatusStyle(t:(key:TranslationKey,vars?:Record<string,string|number>)=>string): Record<string,{bg:string;color:string;label:string}> {
  return {
    confirmado: {bg:"rgba(59,130,246,0.12)",  color:"#2563eb", label:t("status.confirmed")},
    ok:         {bg:"rgba(16,185,129,0.12)",  color:"#059669", label:`✓ ${t("status.completed")}`},
    faltou:     {bg:"rgba(239,68,68,0.12)",   color:"#dc2626", label:`✗ ${t("status.missed")}`},
    cancelado:  {bg:"rgba(100,116,139,0.12)", color:"#64748b", label:t("status.cancelled")},
    remarcado:  {bg:"rgba(245,158,11,0.12)",  color:"#d97706", label:t("status.rescheduled")},
  };
}

function temAlertaSaude(a: AnamneseData | undefined): boolean {
  if (!a) return false;
  // novo formato: verifica se algum campo relevante é "sim"
  const campos = ["fumante","diabetes","hipertensao","anticoagulantes","gravidez"] as const;
  if (campos.some(c => a[c] === "sim")) return true;
  // formato legado (boolean)
  if (a.diabetes === true || a.hipertensao === true || a.gravidez === true || a.fumante === true) return true;
  return false;
}

function contarCampos(a: AnamneseData): number {
  return Object.keys(a).filter(k => k !== "_meta").length;
}

function formatarDataAnamnese(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function AnamneseCard({ anamnese, onEditar }: { anamnese?: AnamneseData; onEditar: () => void }) {
  const meta = anamnese?._meta as { atualizada_em?: string } | undefined;
  const campos = anamnese ? contarCampos(anamnese) : 0;
  const temDados = campos > 0;

  return (
    <div style={{ padding: "12px 14px", background: temDados ? "rgba(43,122,120,0.04)" : "#f8fafc", border: `1px solid ${temDados ? "rgba(43,122,120,0.2)" : "#e2e8f0"}`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
            Anamnese {temDados && <span style={{ color: "#2B7A78" }}>✓</span>}
          </div>
          {temDados ? (
            <>
              <div style={{ fontSize: 12, color: "#64748b" }}>{campos} campo{campos !== 1 ? "s" : ""} preenchido{campos !== 1 ? "s" : ""}</div>
              {meta?.atualizada_em && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Última atualização: {formatarDataAnamnese(meta.atualizada_em)}</div>}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Nenhum dado registrado</div>
          )}
        </div>
        <button onClick={onEditar}
          style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 8,
            cursor: "pointer", background: "#fff", color: "#2B7A78", fontFamily: "'Sora',sans-serif", flexShrink: 0 }}>
          {temDados ? "Ver / Editar" : "Preencher"}
        </button>
      </div>
    </div>
  );
}

export default function PacientesPage() {
  const { t } = useLang();
  const STATUS_STYLE = getStatusStyle(t);
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch]             = useState("");
  const [expanded, setExpanded]         = useState<string|null>(null);
  const [loading, setLoading]           = useState(true);
  const [chatPaciente, setChatPaciente]         = useState<Paciente|null>(null);
  const [anamnesePaciente, setAnamnesePaciente] = useState<Paciente|null>(null);
  const [odontoPaciente, setOdontoPaciente]     = useState<Paciente|null>(null);
  const [anamneseCache, setAnamneseCache]       = useState<Record<string, AnamneseData>>({});
  const [clinicaId, setClinicaId]               = useState("");
  const [operadorNome, setOperadorNome]         = useState("");
  const [usuarioId, setUsuarioId]               = useState("");

  useEffect(() => {
    const id   = localStorage.getItem("clinica_id") || "";
    const nome = localStorage.getItem("clinica_nome") || "Clínica";
    setClinicaId(id);
    setOperadorNome(nome);
    setUsuarioId(localStorage.getItem("user_id") || "");
    if (!id) { setLoading(false); return; }
    Promise.all([
      sb.query<Paciente>("pacientes",     `?clinica_id=eq.${id}`),
      sb.query<Agendamento>("agendamentos",`?clinica_id=eq.${id}&order=data.desc,horario.desc`),
    ]).then(([p,a])=>{ setPacientes(p); setAgendamentos(a); }).finally(()=>setLoading(false));
  }, []);

  function histPaciente(p: Paciente) {
    return agendamentos.filter(a=>a.paciente_id===p.id||a.telefone===p.telefone);
  }

  function stats(p: Paciente) {
    const hist = histPaciente(p);
    const total = hist.filter(a=>["confirmado","ok","remarcado"].includes(a.status)).length;
    const ultima = hist[0]?.data;
    const ultimaProc = hist[0]?.procedimento||"";
    return {total, ultima, ultimaProc};
  }

  const filtered = pacientes.filter(p =>
    !search ||
    (p.nome||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone||"").includes(search) ||
    (p.documento||"").includes(search)
  );

  return (
    <div>
      {/* Título + busca */}
      <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          {t("patients.title")}
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{t("patients.count",{n:pacientes.length})}</span>
        </h2>
        <div style={{position:"relative",flex:1,minWidth:160,maxWidth:320}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("patients.search_placeholder")}
            style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:9,paddingBottom:9,
              fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",
              background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
        </div>
      </div>

      {/* Tabela */}
      <div style={{overflow:"auto",maxHeight:"calc(100vh - 240px)",minHeight:200,borderRadius:12,border:"1px solid #e2e8f0",background:"#fff"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
          <thead>
            <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {[t("patients.col_name"),t("patients.col_phone"),t("patients.col_document"),t("patients.col_last_visit"),t("patients.col_total"),t("patients.col_procedure"),""].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,
                  color:"#94a3b8",letterSpacing:"0.6px",whiteSpace:"nowrap",
                  position:"sticky",top:0,background:"#f8fafc",zIndex:2,
                  boxShadow:"0 1px 0 #e2e8f0"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading&&(
              <tr><td colSpan={7} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>{t("patients.loading")}</td></tr>
            )}
            {!loading&&filtered.length===0&&(
              <tr><td colSpan={7} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>{t("patients.empty")}</td></tr>
            )}
            {filtered.map((p,i)=>{
              const {total, ultima, ultimaProc} = stats(p);
              const isOpen = expanded===p.id;
              const anamnese = anamneseCache[p.id] ?? (p.anamnese as unknown as AnamneseData);
              const alerta = temAlertaSaude(anamnese);
              return (
                <Fragment key={p.id}>
                  <motion.tr initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
                    style={{borderBottom: isOpen?"none":"1px solid #f1f5f9",transition:"background 0.15s",
                      background: isOpen?"rgba(43,122,120,0.03)":"transparent"}}
                    onMouseEnter={e=>{ if(!isOpen) e.currentTarget.style.background="#fafafa"; }}
                    onMouseLeave={e=>{ if(!isOpen) e.currentTarget.style.background="transparent"; }}>

                    <td style={{padding:"12px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:8,background:"#DEF2F1",display:"flex",
                          alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,
                          color:"#2B7A78",flexShrink:0}}>
                          {(p.nome||"?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#1e293b",display:"flex",alignItems:"center",gap:6}}>
                            {p.nome}
                            {alerta&&(
                              <span style={{width:7,height:7,borderRadius:"50%",background:"#dc2626",display:"inline-block",flexShrink:0}}/>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",fontFamily:"monospace",whiteSpace:"nowrap"}}>{p.telefone||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",fontFamily:"monospace",whiteSpace:"nowrap"}}>{p.documento||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",fontFamily:"monospace",whiteSpace:"nowrap"}}>{ultima||"—"}</td>
                    <td style={{padding:"12px 12px"}}>
                      <span style={{fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,
                        background:"#DEF2F1",color:"#2B7A78"}}>{total}</span>
                    </td>
                    <td style={{padding:"12px 12px",fontSize:12,color:"#64748b",maxWidth:140}}>{ultimaProc||"—"}</td>
                    <td style={{padding:"12px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {p.telefone&&(
                          <button onClick={()=>setChatPaciente(p)} title="Chat manual WhatsApp"
                            style={{border:"none",background:"rgba(43,122,120,0.08)",cursor:"pointer",color:"#2B7A78",padding:"4px 6px",borderRadius:7,display:"flex",alignItems:"center"}}>
                            <MessageCircle size={14}/>
                          </button>
                        )}
                        <button onClick={()=>setExpanded(isOpen?null:p.id)}
                          style={{border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",padding:4,display:"flex",alignItems:"center"}}>
                          <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}}>
                            <ChevronDown size={16}/>
                          </motion.div>
                        </button>
                      </div>
                    </td>
                  </motion.tr>

                  {/* Linha de detalhe expandível */}
                  <tr>
                    <td colSpan={7} style={{padding:0,borderBottom:isOpen?"1px solid #e2e8f0":"none"}}>
                      <motion.div initial={false}
                        animate={{height:isOpen?"auto":0,opacity:isOpen?1:0}}
                        transition={{duration:0.25,ease:[0.4,0,0.2,1]}}
                        style={{overflow:"hidden"}}>
                            <div style={{padding:"16px",background:"rgba(43,122,120,0.02)",display:"flex",flexDirection:"column",gap:14}}>

                              {/* Dados básicos */}
                              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12}}>
                                {[
                                  [t("patients.detail_document"),     p.documento||"—"],
                                  [t("patients.detail_birthdate"),    p.data_nascimento||"—"],
                                  [t("patients.detail_age"),         calcularIdade(p.data_nascimento)],
                                  [t("patients.detail_email"),         p.email||"—"],
                                  [t("patients.detail_total"),         String(total)],
                                  [t("patients.detail_last"), ultima||"—"],
                                ].map(([l,v])=>(
                                  <div key={l}>
                                    <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{l}</div>
                                    <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{v}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Anamnese */}
                              <AnamneseCard
                                anamnese={anamneseCache[p.id] ?? (p.anamnese as unknown as AnamneseData)}
                                onEditar={() => setAnamnesePaciente(p)}
                              />

                              {/* Histórico */}
                              {histPaciente(p).length>0&&(
                                <div>
                                  <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{t("patients.history")}</div>
                                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                    {histPaciente(p).slice(0,5).map((a,ai)=>{
                                      const st=STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
                                      return(
                                        <div key={ai} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #f1f5f9"}}>
                                          <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{a.procedimento||t("patients.default_procedure")}</div>
                                            <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{a.data} · {a.horario} · {a.dentista_nome}</div>
                                          </div>
                                          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:st.bg,color:st.color,flexShrink:0}}>{st.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Odontograma */}
                              <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{t("patients.odontogram")}</div>
                                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Mapa dentário · achados, restaurações e estado dos dentes</div>
                                  </div>
                                  <button onClick={() => setOdontoPaciente(p)}
                                    style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 8,
                                      cursor: "pointer", background: "#fff", color: "#2B7A78", fontFamily: "'Sora',sans-serif", flexShrink: 0 }}>
                                    Abrir
                                  </button>
                                </div>
                              </div>

                              {/* Fechar */}
                              <button onClick={()=>setExpanded(null)}
                                style={{alignSelf:"flex-start",padding:"8px 16px",border:"1px solid #cbd5e1",borderRadius:8,background:"#f1f5f9",cursor:"pointer",fontSize:12,fontWeight:700,color:"#475569",fontFamily:"'Sora',sans-serif"}}>
                                ✕ {t("patients.btn_close")}
                              </button>
                            </div>
                      </motion.div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {chatPaciente && (
        <ChatManualModal
          paciente={chatPaciente}
          clinicaId={clinicaId}
          operadorNome={operadorNome}
          onClose={() => setChatPaciente(null)}
        />
      )}

      {anamnesePaciente && (
        <AnamneseModal
          paciente={anamnesePaciente}
          clinicaId={clinicaId}
          operadorNome={operadorNome}
          onClose={(atualizada) => {
            if (atualizada && anamnesePaciente) {
              setAnamneseCache(prev => ({ ...prev, [anamnesePaciente.id]: atualizada }));
            }
            setAnamnesePaciente(null);
          }}
        />
      )}

      {odontoPaciente && (
        <OdontogramaModal
          paciente={odontoPaciente}
          clinicaId={clinicaId}
          usuarioId={usuarioId}
          onClose={() => setOdontoPaciente(null)}
        />
      )}
    </div>
  );
}
