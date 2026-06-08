"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { sb, type Agendamento } from "@/lib/supabase";

const STATUS_STYLE: Record<string,{bg:string;color:string}> = {
  confirmado: {bg:"rgba(16,185,129,0.1)",  color:"#059669"},
  remarcado:  {bg:"rgba(245,158,11,0.1)",  color:"#d97706"},
  cancelado:  {bg:"rgba(239,68,68,0.1)",   color:"#dc2626"},
};

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch]             = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading]           = useState(true);
  const [expanded, setExpanded]         = useState<string|null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
    sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${id}&order=data.desc,horario.desc`)
      .then(setAgendamentos).finally(() => setLoading(false));
  }, []);

  const filtered = agendamentos.filter(a => {
    const q = search.toLowerCase();
    const ok = !q || (a.nome||"").toLowerCase().includes(q) ||
      (a.data||"").includes(q) || (a.dentista_nome||"").toLowerCase().includes(q) ||
      (a.documento||"").includes(q);
    return ok && (!statusFiltro || a.status === statusFiltro);
  });

  return (
    <div>
      {/* Título + contagem */}
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          Agendamentos
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>{agendamentos.length} total</span>
        </h2>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:120}}>
          <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
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

      {/* Cards mobile */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {loading && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</div>}
        {!loading && filtered.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum agendamento encontrado</div>}

        {filtered.map((a,i)=>{
          const st = STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b"};
          const isOpen = expanded===a.id;
          return (
            <motion.div key={a.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              transition={{delay:i*0.02}}
              style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>

              {/* Linha principal */}
              <button onClick={()=>setExpanded(isOpen?null:a.id)}
                style={{width:"100%",padding:"12px 14px",border:"none",background:"transparent",
                  cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{a.nome}</span>
                    <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,
                      background:st.bg,color:st.color}}>{a.status}</span>
                  </div>
                  <div style={{fontSize:12,color:"#64748b",fontFamily:"monospace"}}>
                    {a.data} · {a.horario}
                  </div>
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
                    <div style={{padding:"0 14px 14px",borderTop:"1px solid #f1f5f9",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[
                        ["Dentista", a.dentista_nome||"—"],
                        ["Documento", a.documento||"—"],
                        ["Procedimento", a.procedimento||"—"],
                        ["Telefone", a.telefone||"—"],
                      ].map(([label,val])=>(
                        <div key={label}>
                          <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{label}</div>
                          <div style={{fontSize:13,color:"#334155"}}>{val}</div>
                        </div>
                      ))}
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
