"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { sb, type Paciente, type Agendamento } from "@/lib/supabase";

const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  confirmado: {bg:"rgba(16,185,129,0.1)",  color:"#059669"},
  remarcado:  {bg:"rgba(245,158,11,0.1)",  color:"#d97706"},
  cancelado:  {bg:"rgba(239,68,68,0.1)",   color:"#dc2626"},
};

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
      sb.query<Paciente>("pacientes",    `?clinica_id=eq.${id}`),
      sb.query<Agendamento>("agendamentos",`?clinica_id=eq.${id}&order=data.desc,horario.desc`),
    ]).then(([p,a])=>{ setPacientes(p); setAgendamentos(a); }).finally(()=>setLoading(false));
  }, []);

  function histPaciente(p: Paciente) {
    return agendamentos.filter(a=>a.paciente_id===p.id||a.telefone===p.telefone);
  }

  function stats(p: Paciente) {
    const hist = histPaciente(p);
    const total = hist.filter(a=>a.status==="confirmado"||a.status==="remarcado").length;
    const ultima = hist[0]?.data;
    return {total, ultima};
  }

  const filtered = pacientes.filter(p =>
    !search ||
    (p.nome||"").toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone||"").includes(search) ||
    (p.documento||"").includes(search)
  );

  return (
    <div>
      <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          Pacientes
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{pacientes.length} registrados</span>
        </h2>
        <div style={{position:"relative",flex:1,minWidth:140,maxWidth:260}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..."
            style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:9,paddingBottom:9,
              fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",
              background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {loading && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</div>}
        {!loading && filtered.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum paciente encontrado</div>}

        {filtered.map((p,i)=>{
          const {total, ultima} = stats(p);
          const isOpen = expanded===p.id;
          const hist = isOpen ? histPaciente(p) : [];
          return (
            <motion.div key={p.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              transition={{delay:i*0.02}}
              style={{background:"#fff",borderRadius:12,border:`1px solid ${isOpen?"rgba(43,122,120,0.3)":"#e2e8f0"}`,overflow:"hidden"}}>

              {/* Linha principal */}
              <button onClick={()=>setExpanded(isOpen?null:p.id)}
                style={{width:"100%",padding:"12px 14px",border:"none",background:"transparent",
                  cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#DEF2F1",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:14,fontWeight:700,color:"#2B7A78",flexShrink:0}}>
                  {(p.nome||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:2}}>{p.nome}</div>
                  <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{p.telefone}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginRight:4}}>
                  <div style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,
                    background:"#DEF2F1",color:"#2B7A78",marginBottom:3}}>{total} consulta{total!==1?"s":""}</div>
                  {ultima && <div style={{fontSize:11,color:"#94a3b8"}}>{ultima}</div>}
                </div>
                <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}} style={{color:"#cbd5e1",flexShrink:0}}>
                  <ChevronDown size={16}/>
                </motion.div>
              </button>

              {/* Detalhes expandíveis */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                    exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}}
                    style={{overflow:"hidden"}}>
                    <div style={{padding:"14px",borderTop:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:16}}>

                      {/* Dados básicos */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        {[
                          ["Documento",          p.documento||"—"],
                          ["Data de Nascimento", p.data_nascimento||"—"],
                          ["Total de Consultas", String(total)],
                          ["Última Consulta",    ultima||"—"],
                        ].map(([label,val])=>(
                          <div key={label}>
                            <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{label}</div>
                            <div style={{fontSize:13,color:"#334155",fontWeight:500}}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Histórico de consultas */}
                      {hist.length>0 && (
                        <div>
                          <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Histórico</div>
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {hist.slice(0,5).map((a,ai)=>{
                              const st=STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b"};
                              return(
                                <div key={ai} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#f8fafc",borderRadius:8}}>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{a.procedimento||"Consulta"}</div>
                                    <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{a.data} · {a.horario} · {a.dentista_nome}</div>
                                  </div>
                                  <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:st.bg,color:st.color,flexShrink:0}}>{a.status}</span>
                                </div>
                              );
                            })}
                            {hist.length>5&&<div style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>+{hist.length-5} consultas anteriores</div>}
                          </div>
                        </div>
                      )}

                      {/* Odontograma placeholder */}
                      <div>
                        <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Odontograma</div>
                        <div style={{height:72,borderRadius:10,border:"2px dashed #e2e8f0",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:12,color:"#cbd5e1"}}>Em desenvolvimento</div>
                      </div>

                      {/* Fechar */}
                      <button onClick={()=>setExpanded(null)}
                        style={{width:"100%",padding:"10px",border:"1px solid #cbd5e1",borderRadius:10,
                          background:"#f1f5f9",cursor:"pointer",fontSize:13,fontWeight:700,
                          color:"#475569",fontFamily:"'Sora',sans-serif"}}>
                        ✕ Fechar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
