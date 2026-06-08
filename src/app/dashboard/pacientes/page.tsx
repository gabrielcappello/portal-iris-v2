"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { sb, type Paciente, type Agendamento } from "@/lib/supabase";

export default function PacientesPage() {
  const [pacientes, setPacientes]       = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<Paciente|null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
    Promise.all([
      sb.query<Paciente>("pacientes",    `?clinica_id=eq.${id}`),
      sb.query<Agendamento>("agendamentos",`?clinica_id=eq.${id}`),
    ]).then(([p,a])=>{ setPacientes(p); setAgendamentos(a); }).finally(()=>setLoading(false));
  }, []);

  function stats(p: Paciente) {
    const hist = agendamentos.filter(a=>a.paciente_id===p.id||a.telefone===p.telefone);
    const confirmados = hist.filter(a=>a.status==="confirmado"||a.status==="remarcado");
    const total = confirmados.length;
    const ultima = [...hist].sort((a,b)=>(b.data||"").localeCompare(a.data||""))[0]?.data;
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

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {loading && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Carregando...</div>}
        {!loading && filtered.length===0 && <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:13}}>Nenhum paciente encontrado</div>}
        {filtered.map((p,i)=>{
          const {total, ultima} = stats(p);
          return (
            <motion.div key={p.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              transition={{delay:i*0.02}}
              onClick={()=>setSelected(p)}
              style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",
                padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#DEF2F1",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,fontWeight:700,color:"#2B7A78",flexShrink:0}}>
                {(p.nome||"?")[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:2}}>{p.nome}</div>
                <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{p.telefone}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,
                  background:"#DEF2F1",color:"#2B7A78",marginBottom:3}}>{total} consulta{total!==1?"s":""}</div>
                {ultima && <div style={{fontSize:11,color:"#94a3b8"}}>{ultima}</div>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setSelected(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,
              display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",stiffness:400,damping:35}}
              onClick={e=>e.stopPropagation()}
              style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",
                maxWidth:560,maxHeight:"85vh",overflow:"auto",padding:"20px 20px 32px"}}>

              {/* Handle */}
              <div style={{width:36,height:4,borderRadius:2,background:"#e2e8f0",margin:"0 auto 16px"}}/>

              {/* Header modal */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"#DEF2F1",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:18,fontWeight:700,color:"#2B7A78"}}>
                    {(selected.nome||"?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{selected.nome}</div>
                    <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>{selected.telefone}</div>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:4}}>
                  <X size={18}/>
                </button>
              </div>

              {/* Campos */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[
                  ["Documento",        selected.documento||"—"],
                  ["Data de Nascimento", selected.data_nascimento||"—"],
                  ["Total de Consultas", String(stats(selected).total)],
                  ["Última Consulta",  stats(selected).ultima||"—"],
                ].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",
                      letterSpacing:"0.5px",marginBottom:4}}>{label}</div>
                    <div style={{fontSize:14,color:"#1e293b",fontWeight:500}}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Odontograma placeholder */}
              <div style={{marginTop:20}}>
                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",
                  letterSpacing:"0.5px",marginBottom:8}}>Odontograma</div>
                <div style={{height:80,borderRadius:12,border:"2px dashed #e2e8f0",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:"#cbd5e1"}}>Em desenvolvimento</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
