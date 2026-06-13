"use client";
import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { sb, calcularIdade, type Agendamento, type Paciente, type AnamnesePaciente } from "@/lib/supabase";

const STATUS_STYLE: Record<string,{bg:string;color:string;label:string}> = {
  confirmado: {bg:"rgba(59,130,246,0.12)",  color:"#2563eb", label:"Confirmado"},
  ok:         {bg:"rgba(16,185,129,0.12)",  color:"#059669", label:"✓ OK"},
  faltou:     {bg:"rgba(239,68,68,0.12)",   color:"#dc2626", label:"✗ Faltou"},
  cancelado:  {bg:"rgba(100,116,139,0.12)", color:"#64748b", label:"Cancelado"},
  remarcado:  {bg:"rgba(245,158,11,0.12)",  color:"#d97706", label:"Remarcado"},
};

function anamneseAlertas(a?: AnamnesePaciente): string[] {
  if (!a) return [];
  const al: string[] = [];
  if (a.diabetes)    al.push("Diabetes");
  if (a.hipertensao) al.push("Hipertensão");
  if (a.gravidez)    al.push("Gravidez");
  if (a.fumante)     al.push("Fumante");
  if (a.alergias?.trim())                  al.push(`Alergias: ${a.alergias.trim()}`);
  if (a.medicamentos_uso_continuo?.trim()) al.push(`Medicamentos: ${a.medicamentos_uso_continuo.trim()}`);
  if (a.observacoes_saude?.trim())         al.push(`Obs.: ${a.observacoes_saude.trim()}`);
  return al;
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes,    setPacientes]    = useState<Paciente[]>([]);
  const [search, setSearch]             = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState<string|null>(null);
  const [expanded, setExpanded]         = useState<string|null>(null);
  const [fichaOpen, setFichaOpen]       = useState<string|null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
    Promise.all([
      sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${id}&order=data.desc,horario.desc`),
      sb.query<Paciente>("pacientes", `?clinica_id=eq.${id}`),
    ]).then(([ag,pac])=>{ setAgendamentos(ag); setPacientes(pac); }).finally(()=>setLoading(false));
  }, []);

  async function changeStatus(a: Agendamento, newStatus: string) {
    setUpdating(a.id);
    try {
      await sb.update("agendamentos", a.id, { status: newStatus });
      setAgendamentos(prev => prev.map(x => x.id===a.id ? {...x, status: newStatus as Agendamento["status"]} : x));
    } catch { /* ignore */ }
    finally { setUpdating(null); }
  }

  const filtered = agendamentos.filter(a => {
    const q = search.toLowerCase();
    const ok = !q ||
      (a.nome||"").toLowerCase().includes(q) ||
      (a.data||"").includes(q) ||
      (a.dentista_nome||"").toLowerCase().includes(q) ||
      (a.documento||"").includes(q) ||
      (a.procedimento||"").toLowerCase().includes(q);
    return ok && (!statusFiltro || a.status === statusFiltro);
  });

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          Agendamentos
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{agendamentos.length} total</span>
        </h2>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:160}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, data ou dentista..."
            style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:9,paddingBottom:9,
              fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",
              background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
        </div>
        <select value={statusFiltro} onChange={e=>setStatusFiltro(e.target.value)}
          style={{padding:"9px 12px",fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,
            outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif",color:"#475569"}}>
          <option value="">Todos</option>
          <option value="confirmado">Confirmado</option>
          <option value="ok">✓ OK</option>
          <option value="faltou">✗ Faltou</option>
          <option value="cancelado">Cancelado</option>
          <option value="remarcado">Remarcado</option>
        </select>
      </div>

      <div style={{overflow:"auto",maxHeight:"calc(100vh - 240px)",minHeight:200,borderRadius:12,border:"1px solid #e2e8f0",background:"#fff"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
          <thead>
            <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["DATA","HORA","PACIENTE","DOCUMENTO","PROCEDIMENTO","DENTISTA","STATUS","AÇÃO",""].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,
                  color:"#94a3b8",letterSpacing:"0.6px",whiteSpace:"nowrap",
                  position:"sticky",top:0,background:"#f8fafc",zIndex:2,
                  boxShadow:"0 1px 0 #e2e8f0"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading&&(
              <tr><td colSpan={9} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</td></tr>
            )}
            {!loading&&filtered.length===0&&(
              <tr><td colSpan={9} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum agendamento encontrado</td></tr>
            )}

            {filtered.map((a,i)=>{
              const st = STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
              const isUpdating = updating===a.id;
              const isOpen = expanded===a.id;
              const pac = pacientes.find(p=>p.id===a.paciente_id||p.telefone===a.telefone);
              const alertas = anamneseAlertas(pac?.anamnese);
              const fichaIsOpen = fichaOpen===a.id;
              const histPac = pac ? agendamentos.filter(x=>x.paciente_id===pac.id||x.telefone===pac.telefone) : [];

              return (
                <Fragment key={a.id}>
                  <motion.tr initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
                    style={{borderBottom: isOpen?"none":"1px solid #f1f5f9",transition:"background 0.15s",
                      background: isOpen?"rgba(43,122,120,0.03)":"transparent"}}
                    onMouseEnter={e=>{ if(!isOpen) e.currentTarget.style.background="#fafafa"; }}
                    onMouseLeave={e=>{ if(!isOpen) e.currentTarget.style.background=isOpen?"rgba(43,122,120,0.03)":"transparent"; }}>

                    <td style={{padding:"12px 12px",fontSize:13,color:"#334155",whiteSpace:"nowrap",fontFamily:"monospace"}}>{a.data||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#334155",whiteSpace:"nowrap",fontFamily:"monospace"}}>{a.horario||"—"}</td>
                    <td style={{padding:"12px 12px"}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#1e293b",display:"flex",alignItems:"center",gap:6}}>
                        {a.nome||"—"}
                        {alertas.length>0&&<span style={{width:6,height:6,borderRadius:"50%",background:"#dc2626",display:"inline-block",flexShrink:0}}/>}
                      </div>
                      {a.telefone&&<div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",marginTop:1}}>{a.telefone}</div>}
                    </td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",fontFamily:"monospace",whiteSpace:"nowrap"}}>{a.documento||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",maxWidth:160}}>{a.procedimento||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:13,color:"#475569",whiteSpace:"nowrap"}}>{a.dentista_nome||"—"}</td>
                    <td style={{padding:"12px 12px"}}>
                      <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,background:st.bg,color:st.color,whiteSpace:"nowrap"}}>{st.label}</span>
                    </td>
                    <td style={{padding:"12px 12px"}}>
                      {isUpdating?(
                        <span style={{fontSize:11,color:"#94a3b8"}}>Salvando…</span>
                      ):(
                        <select value={a.status} onChange={e=>{e.stopPropagation();changeStatus(a,e.target.value);}}
                          style={{fontSize:12,fontWeight:600,padding:"4px 8px",borderRadius:8,
                            border:`1px solid ${st.color}33`,background:st.bg,color:st.color,
                            cursor:"pointer",outline:"none",fontFamily:"'Sora',sans-serif"}}>
                          <option value="confirmado">Confirmado</option>
                          <option value="ok">✓ OK</option>
                          <option value="faltou">✗ Faltou</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="remarcado">Remarcado</option>
                        </select>
                      )}
                    </td>
                    <td style={{padding:"12px 8px"}}>
                      <button onClick={()=>{ setExpanded(isOpen?null:a.id); setFichaOpen(null); }}
                        style={{border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",padding:4,display:"flex",alignItems:"center"}}>
                        <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}}>
                          <ChevronDown size={16}/>
                        </motion.div>
                      </button>
                    </td>
                  </motion.tr>

                  {/* Linha expandida */}
                  <tr>
                    <td colSpan={9} style={{padding:0,borderBottom:isOpen?"1px solid #e2e8f0":"none"}}>
                      <motion.div initial={false}
                        animate={{height:isOpen?"auto":0,opacity:isOpen?1:0}}
                        transition={{duration:0.25,ease:[0.4,0,0.2,1]}}
                        style={{overflow:"hidden"}}>
                            <div style={{padding:"16px",background:"rgba(43,122,120,0.02)",display:"flex",flexDirection:"column",gap:12}}>

                              {/* Dados do agendamento */}
                              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                                {[
                                  ["Data",         a.data||"—"],
                                  ["Hora",         a.horario||"—"],
                                  ["Procedimento", a.procedimento||"—"],
                                  ["Dentista",     a.dentista_nome||"—"],
                                  ["Documento",    a.documento||"—"],
                                  ["Telefone",     a.telefone||"—"],
                                ].map(([l,v])=>(
                                  <div key={l}>
                                    <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{l}</div>
                                    <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{v}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Botão Ficha do Paciente */}
                              <button onClick={()=>setFichaOpen(fichaIsOpen?null:a.id)}
                                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",
                                  border:"1px solid rgba(43,122,120,0.3)",borderRadius:10,
                                  background:fichaIsOpen?"rgba(43,122,120,0.08)":"rgba(43,122,120,0.04)",
                                  cursor:"pointer",fontFamily:"'Sora',sans-serif",width:"100%",textAlign:"left"}}>
                                <span style={{fontSize:13,fontWeight:700,color:"#2B7A78"}}>
                                  📋 Ficha do Paciente{pac?` — ${pac.nome}`:""}
                                  {alertas.length>0&&<span style={{marginLeft:8,fontSize:11,padding:"2px 8px",borderRadius:99,background:"rgba(239,68,68,0.1)",color:"#dc2626",fontWeight:600}}>⚠️ {alertas.length} alerta{alertas.length>1?"s":""}</span>}
                                </span>
                                <motion.div animate={{rotate:fichaIsOpen?180:0}} transition={{duration:0.2}} style={{color:"#2B7A78",flexShrink:0}}>
                                  <ChevronDown size={14}/>
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {fichaIsOpen&&(
                                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                                    exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}}
                                    style={{overflow:"hidden"}}>
                                    <div style={{padding:"14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:12}}>
                                      {!pac?(
                                        <div style={{fontSize:12,color:"#94a3b8",textAlign:"center"}}>Paciente não encontrado no cadastro</div>
                                      ):(
                                        <>
                                          {/* Header paciente */}
                                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                                            <div style={{width:38,height:38,borderRadius:10,background:"#DEF2F1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#2B7A78",flexShrink:0}}>
                                              {(pac.nome||"?")[0].toUpperCase()}
                                            </div>
                                            <div>
                                              <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{pac.nome}</div>
                                              <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{pac.telefone}</div>
                                            </div>
                                          </div>
                                          {/* Dados */}
                                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:10}}>
                                            {[["Documento",pac.documento||"—"],["Nascimento",pac.data_nascimento||"—"],["Idade",calcularIdade(pac.data_nascimento)],["Email",pac.email||"—"],["Total consultas",String(agendamentos.filter(x=>x.paciente_id===pac.id||x.telefone===pac.telefone).filter(x=>["confirmado","ok"].includes(x.status)).length)]].map(([l,v])=>(
                                              <div key={l}>
                                                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{l}</div>
                                                <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{v}</div>
                                              </div>
                                            ))}
                                          </div>
                                          {/* Anamnese */}
                                          {(()=>{
                                            const temAlerta=alertas.length>0;
                                            return(
                                              <div style={{padding:"10px 12px",background:temAlerta?"rgba(239,68,68,0.06)":"rgba(16,185,129,0.06)",border:temAlerta?"1px solid rgba(239,68,68,0.25)":"1px solid rgba(16,185,129,0.25)",borderRadius:8}}>
                                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:temAlerta?6:0}}>
                                                  <span>{temAlerta?"⚠️":"✓"}</span>
                                                  <div style={{fontSize:12,fontWeight:700,color:temAlerta?"#dc2626":"#059669",textTransform:"uppercase",letterSpacing:"0.5px"}}>
                                                    {temAlerta?"Alertas de saúde":"Anamnese"}
                                                  </div>
                                                </div>
                                                {!pac.anamnese&&<div style={{fontSize:11,color:"#059669",opacity:0.8}}>Não coletada</div>}
                                                {pac.anamnese&&!temAlerta&&<div style={{fontSize:11,color:"#059669",opacity:0.8}}>Sem alertas registrados</div>}
                                                {temAlerta&&(
                                                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                                    {alertas.map(al=>(
                                                      <span key={al} style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"rgba(239,68,68,0.1)",color:"#dc2626",border:"1px solid rgba(239,68,68,0.2)"}}>{al}</span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                          {/* Histórico */}
                                          {histPac.length>0&&(
                                            <div>
                                              <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Histórico</div>
                                              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                                {histPac.slice(0,4).map((x,xi)=>{
                                                  const xs=STATUS_STYLE[x.status]||{bg:"#f1f5f9",color:"#64748b",label:x.status};
                                                  return(
                                                    <div key={xi} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#fff",borderRadius:8,border:"1px solid #f1f5f9"}}>
                                                      <div style={{flex:1,minWidth:0}}>
                                                        <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{x.procedimento||"Consulta"}</div>
                                                        <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{x.data} · {x.horario} · {x.dentista_nome}</div>
                                                      </div>
                                                      <span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:99,background:xs.bg,color:xs.color,flexShrink:0}}>{xs.label}</span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                          {/* Odontograma */}
                                          <div>
                                            <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Odontograma</div>
                                            <div style={{height:56,borderRadius:8,border:"2px dashed #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1",background:"#fff"}}>Em desenvolvimento</div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
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
    </div>
  );
}
