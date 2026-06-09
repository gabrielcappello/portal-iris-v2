"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { sb, type Agendamento } from "@/lib/supabase";

const STATUS_STYLE: Record<string,{bg:string;color:string;label:string}> = {
  confirmado: {bg:"rgba(59,130,246,0.12)",  color:"#2563eb", label:"Confirmado"},
  ok:         {bg:"rgba(16,185,129,0.12)",  color:"#059669", label:"✓ OK"},
  faltou:     {bg:"rgba(239,68,68,0.12)",   color:"#dc2626", label:"✗ Faltou"},
  cancelado:  {bg:"rgba(100,116,139,0.12)", color:"#64748b", label:"Cancelado"},
  remarcado:  {bg:"rgba(245,158,11,0.12)",  color:"#d97706", label:"Remarcado"},
};

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch]             = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState<string|null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
    sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${id}&order=data.desc,horario.desc`)
      .then(setAgendamentos).finally(() => setLoading(false));
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
      {/* Título */}
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          Agendamentos
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{agendamentos.length} total</span>
        </h2>
      </div>

      {/* Filtros */}
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
          <option value="remarcado">Remarcado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div style={{overflowX:"auto",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
          <thead>
            <tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["DATA","HORA","PACIENTE","DOCUMENTO","PROCEDIMENTO","DENTISTA","STATUS","AÇÃO"].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,
                  color:"#94a3b8",letterSpacing:"0.6px",whiteSpace:"nowrap",
                  position:"sticky",top:0,background:"#f8fafc",zIndex:2,
                  boxShadow:"0 1px 0 #e2e8f0"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</td></tr>
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={8} style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum agendamento encontrado</td></tr>
            )}
            {filtered.map((a,i)=>{
              const st = STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
              const isUpdating = updating===a.id;
              return(
                <motion.tr key={a.id} initial={{opacity:0}} animate={{opacity:1}}
                  transition={{delay:i*0.01}}
                  style={{borderBottom:"1px solid #f1f5f9",transition:"background 0.15s"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="#fafafa")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>

                  <td style={{padding:"12px 12px",fontSize:13,color:"#334155",whiteSpace:"nowrap",fontFamily:"monospace"}}>
                    {a.data||"—"}
                  </td>
                  <td style={{padding:"12px 12px",fontSize:13,color:"#334155",whiteSpace:"nowrap",fontFamily:"monospace"}}>
                    {a.horario||"—"}
                  </td>
                  <td style={{padding:"12px 12px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{a.nome||"—"}</div>
                    {a.telefone&&<div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",marginTop:1}}>{a.telefone}</div>}
                  </td>
                  <td style={{padding:"12px 12px",fontSize:13,color:"#475569",fontFamily:"monospace",whiteSpace:"nowrap"}}>
                    {a.documento||"—"}
                  </td>
                  <td style={{padding:"12px 12px",fontSize:13,color:"#475569",maxWidth:160}}>
                    {a.procedimento||"—"}
                  </td>
                  <td style={{padding:"12px 12px",fontSize:13,color:"#475569",whiteSpace:"nowrap"}}>
                    {a.dentista_nome||"—"}
                  </td>
                  <td style={{padding:"12px 12px"}}>
                    <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,
                      background:st.bg,color:st.color,whiteSpace:"nowrap"}}>{st.label}</span>
                  </td>
                  <td style={{padding:"12px 12px"}}>
                    <AnimatePresence mode="wait">
                      {isUpdating ? (
                        <motion.span key="saving" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                          style={{fontSize:11,color:"#94a3b8"}}>Salvando…</motion.span>
                      ) : (
                        <motion.select key="select" initial={{opacity:0}} animate={{opacity:1}}
                          value={a.status} onChange={e=>changeStatus(a,e.target.value)}
                          style={{fontSize:12,fontWeight:600,padding:"4px 8px",borderRadius:8,
                            border:`1px solid ${st.color}33`,background:st.bg,color:st.color,
                            cursor:"pointer",outline:"none",fontFamily:"'Sora',sans-serif"}}>
                          <option value="confirmado">Confirmado</option>
                          <option value="ok">✓ OK</option>
                          <option value="faltou">✗ Faltou</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="remarcado">Remarcado</option>
                        </motion.select>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
