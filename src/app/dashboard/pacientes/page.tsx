"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { sb, type Paciente, type Agendamento, type AnamnesePaciente } from "@/lib/supabase";

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
  if (a.alergias?.trim())                   al.push(`Alergias: ${a.alergias.trim()}`);
  if (a.medicamentos_uso_continuo?.trim())  al.push(`Medicamentos: ${a.medicamentos_uso_continuo.trim()}`);
  if (a.observacoes_saude?.trim())          al.push(`Obs.: ${a.observacoes_saude.trim()}`);
  return al;
}

function AnamneseCard({anamnese}: {anamnese?: AnamnesePaciente}) {
  const alertas = anamneseAlertas(anamnese);
  const temAlerta = alertas.length > 0;
  const bg    = temAlerta ? "rgba(239,68,68,0.06)"   : "rgba(16,185,129,0.06)";
  const border= temAlerta ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(16,185,129,0.25)";
  const color = temAlerta ? "#dc2626" : "#059669";
  const icon  = temAlerta ? "⚠️" : "✓";
  const titulo= temAlerta ? "Alertas de saúde" : "Anamnese";
  const sub   = !anamnese ? "Não coletada" : temAlerta ? "" : "Sem alertas registrados";
  return (
    <div style={{padding:"12px 14px",background:bg,border,borderRadius:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:temAlerta?8:0}}>
        <span style={{fontSize:15}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.5px"}}>{titulo}</div>
          {sub&&<div style={{fontSize:12,color,opacity:0.8,marginTop:1}}>{sub}</div>}
        </div>
        {anamnese?.data_ultima_atualizacao&&(
          <div style={{fontSize:10,color:"#94a3b8"}}>{anamnese.data_ultima_atualizacao.slice(0,10)}</div>
        )}
      </div>
      {temAlerta&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {alertas.map(al=>(
            <span key={al} style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,
              background:"rgba(239,68,68,0.1)",color:"#dc2626",border:"1px solid rgba(239,68,68,0.2)"}}>
              {al}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PacientesPage() {
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch]             = useState("");
  const [expanded, setExpanded]         = useState<string|null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
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
          Pacientes
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{pacientes.length} registrados</span>
        </h2>
        <div style={{position:"relative",flex:1,minWidth:160,maxWidth:320}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou documento..."
            style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:9,paddingBottom:9,
              fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",
              background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
        </div>
      </div>

      {/* Tabela */}
      <div style={{overflowX:"auto",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
          <thead>
            <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["NOME","TELEFONE","DOCUMENTO","ÚLTIMA CONSULTA","TOTAL","PROCEDIMENTO",""].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,
                  color:"#94a3b8",letterSpacing:"0.6px",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading&&(
              <tr><td colSpan={7} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</td></tr>
            )}
            {!loading&&filtered.length===0&&(
              <tr><td colSpan={7} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum paciente encontrado</td></tr>
            )}
            {filtered.map((p,i)=>{
              const {total, ultima, ultimaProc} = stats(p);
              const isOpen = expanded===p.id;
              const alertas = anamneseAlertas(p.anamnese);
              return (
                <>
                  <motion.tr key={p.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
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
                            {alertas.length>0&&(
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
                      <button onClick={()=>setExpanded(isOpen?null:p.id)}
                        style={{border:"none",background:"transparent",cursor:"pointer",color:"#94a3b8",padding:4,display:"flex",alignItems:"center"}}>
                        <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}}>
                          <ChevronDown size={16}/>
                        </motion.div>
                      </button>
                    </td>
                  </motion.tr>

                  {/* Linha de detalhe expandível */}
                  <AnimatePresence initial={false}>
                    {isOpen&&(
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={7} style={{padding:0,borderBottom:"1px solid #e2e8f0"}}>
                          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                            exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}}
                            style={{overflow:"hidden"}}>
                            <div style={{padding:"16px",background:"rgba(43,122,120,0.02)",display:"flex",flexDirection:"column",gap:14}}>

                              {/* Dados básicos */}
                              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                                {[
                                  ["Documento",     p.documento||"—"],
                                  ["Nascimento",    p.data_nascimento||"—"],
                                  ["Total",         String(total)],
                                  ["Última consulta", ultima||"—"],
                                ].map(([l,v])=>(
                                  <div key={l}>
                                    <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{l}</div>
                                    <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{v}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Anamnese */}
                              <AnamneseCard anamnese={p.anamnese}/>

                              {/* Histórico */}
                              {histPaciente(p).length>0&&(
                                <div>
                                  <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Histórico</div>
                                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                    {histPaciente(p).slice(0,5).map((a,ai)=>{
                                      const st=STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
                                      return(
                                        <div key={ai} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #f1f5f9"}}>
                                          <div style={{flex:1,minWidth:0}}>
                                            <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{a.procedimento||"Consulta"}</div>
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
                              <div>
                                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Odontograma</div>
                                <div style={{height:64,borderRadius:10,border:"2px dashed #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1"}}>Em desenvolvimento</div>
                              </div>

                              {/* Fechar */}
                              <button onClick={()=>setExpanded(null)}
                                style={{alignSelf:"flex-start",padding:"8px 16px",border:"1px solid #cbd5e1",borderRadius:8,background:"#f1f5f9",cursor:"pointer",fontSize:12,fontWeight:700,color:"#475569",fontFamily:"'Sora',sans-serif"}}>
                                ✕ Fechar
                              </button>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
