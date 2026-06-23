"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Settings } from "lucide-react";
import { sb, calcularIdade, type Clinica, type Dentista, type Agendamento, type Paciente, type AnamnesePaciente } from "@/lib/supabase";
import { useParams, useSearchParams } from "next/navigation";

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

const STATUS_STYLE: Record<string,{bg:string;color:string;label:string}> = {
  confirmado: {bg:"rgba(59,130,246,0.12)",  color:"#2563eb", label:"Confirmado"},
  ok:         {bg:"rgba(16,185,129,0.12)",  color:"#059669", label:"✓ OK"},
  faltou:     {bg:"rgba(239,68,68,0.12)",   color:"#dc2626", label:"✗ Faltou"},
  cancelado:  {bg:"rgba(100,116,139,0.12)", color:"#64748b", label:"Cancelado"},
  remarcado:  {bg:"rgba(245,158,11,0.12)",  color:"#d97706", label:"Remarcado"},
};

export default function DentistaApp() {
  const params      = useParams<{clinicaId:string;idx:string}>();
  const searchParams= useSearchParams();
  const token       = searchParams.get("t")||"";

  const [dentista, setDentista]   = useState<Dentista|null>(null);
  const [clinica,  setClinica]    = useState<Clinica|null>(null);
  const [agendamentos, setAgend]  = useState<Agendamento[]>([]);
  const [pacientes,    setPacs]   = useState<Paciente[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [authed,   setAuthed]     = useState(false);
  const [search,   setSearch]     = useState("");
  const [statusFiltro, setStatus] = useState("");
  const [expanded, setExpanded]   = useState<string|null>(null);
  const [expandedPac, setExpPac]  = useState<string|null>(null);
  const [fichaOpen, setFichaOpen] = useState<string|null>(null);
  const [updating, setUpdating]   = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"agenda"|"pacientes">("agenda");
  const [showSettings, setShowSettings]   = useState(false);
  const [editWhatsapp, setEditWhatsapp]   = useState("");
  const [editCalendar, setEditCalendar]   = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const installedRef = useRef(false);

  // Sync edit states when dentista loads
  useEffect(()=>{
    if(dentista){
      setEditWhatsapp(dentista.whatsapp||"");
      setEditCalendar(dentista.calendar_id||"");
    }
  },[dentista]);

  // PWA install prompt
  useEffect(()=>{
    if(installedRef.current) return;
    const handler=(e:Event)=>{
      e.preventDefault();
      (e as BeforeInstallPromptEvent).prompt();
      installedRef.current=true;
    };
    window.addEventListener("beforeinstallprompt",handler as EventListener);
    return()=>window.removeEventListener("beforeinstallprompt",handler as EventListener);
  },[]);

  useEffect(()=>{
    if(!params.clinicaId||!params.idx) return;
    const idx=parseInt(params.idx);
    sb.query<Clinica>("clinicas",`?id=eq.${params.clinicaId}&select=*`)
      .then(rows=>{
        if(!rows.length){setLoading(false);return;}
        const c=rows[0];
        setClinica(c);
        const dents=Array.isArray(c.dentistas)?c.dentistas:[];
        const d=dents[idx] as Dentista|undefined;
        if(!d||d.senha!==token){setLoading(false);return;}
        setDentista(d);
        setAuthed(true);
        return Promise.all([
          sb.query<Agendamento>("agendamentos",`?clinica_id=eq.${params.clinicaId}&order=data.desc,horario.desc`),
          sb.query<Paciente>("pacientes",`?clinica_id=eq.${params.clinicaId}`),
        ]);
      })
      .then(res=>{
        if(!res) return;
        const [ags,pacs]=res;
        // Filter to this dentist
        setAgend(ags as Agendamento[]);
        setPacs(pacs as Paciente[]);
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[params.clinicaId,params.idx,token]);

  async function saveSettings(){
    if(!clinica||!dentista) return;
    setSavingSettings(true);
    try{
      const idxNum=parseInt(params.idx);
      const dents=Array.isArray(clinica.dentistas)?[...clinica.dentistas]:[];
      dents[idxNum]={...dents[idxNum],whatsapp:editWhatsapp.trim(),calendar_id:editCalendar.trim()};
      await sb.update("clinicas",clinica.id,{dentistas:dents});
      setDentista(prev=>prev?{...prev,whatsapp:editWhatsapp.trim(),calendar_id:editCalendar.trim()}:prev);
      setClinica(prev=>prev?{...prev,dentistas:dents}:prev);
      setShowSettings(false);
    }catch{}
    finally{setSavingSettings(false);}
  }

  async function changeStatus(a:Agendamento, newStatus:string){
    setUpdating(a.id);
    try{
      await sb.update("agendamentos",a.id,{status:newStatus});
      setAgend(prev=>prev.map(x=>x.id===a.id?{...x,status:newStatus as Agendamento["status"]}:x));
    }catch{}
    finally{setUpdating(null);}
  }

  if(loading) return(
    <div style={{minHeight:"100svh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#DEF2F1,#f0fafa)"}}>
      <div style={{fontSize:13,color:"#2B7A78",fontFamily:"'Sora',sans-serif"}}>Carregando…</div>
    </div>
  );

  if(!authed||!dentista) return(
    <div style={{minHeight:"100svh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#DEF2F1,#f0fafa)",padding:24}}>
      <div style={{textAlign:"center",fontFamily:"'Sora',sans-serif"}}>
        <div style={{fontSize:32,marginBottom:12}}>🔒</div>
        <div style={{fontSize:15,fontWeight:700,color:"#1e293b",marginBottom:6}}>Acesso negado</div>
        <div style={{fontSize:13,color:"#94a3b8"}}>Link inválido ou expirado.</div>
      </div>
    </div>
  );

  const nomeLabel=`${dentista.titulo||"Dr."} ${dentista.nome}`;
  const settingsComplete=!!(dentista.whatsapp?.trim())&&!!(dentista.calendar_id?.trim()?.endsWith("@group.calendar.google.com"));
  const gearColor=settingsComplete?"#10b981":"#ef4444";
  const DDI_MAP:Record<string,string>={BR:"+55",AR:"+54",CL:"+56",UY:"+598",MX:"+52",CO:"+57",PE:"+51"};
  const ddiHint=DDI_MAP[clinica?.pais_codigo||""]||"+55";
  const calendarValid=!editCalendar||editCalendar.trim().endsWith("@group.calendar.google.com");
  const myAgends=agendamentos.filter(a=>
    (a.dentista_nome||"").toLowerCase().includes((dentista.nome||"").toLowerCase())
  );
  const myPacIds=new Set(myAgends.map(a=>a.paciente_id||a.telefone));
  const myPacs=pacientes.filter(p=>myPacIds.has(p.id)||myPacIds.has(p.telefone));

  const filteredAgends=myAgends.filter(a=>{
    const q=search.toLowerCase();
    return(!q||(a.nome||"").toLowerCase().includes(q)||(a.data||"").includes(q)||(a.procedimento||"").toLowerCase().includes(q))
      &&(!statusFiltro||a.status===statusFiltro);
  });

  const filteredPacs=myPacs.filter(p=>
    !search||(p.nome||"").toLowerCase().includes(search.toLowerCase())||(p.telefone||"").includes(search)
  );

  return(
    <div style={{minHeight:"100svh",background:"#f8fafc",fontFamily:"'Sora',sans-serif"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 12px rgba(43,122,120,0.25)"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0}}>
          {(dentista.nome||"?")[0].toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.2}}>{nomeLabel}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>{clinica?.nome||""}</div>
        </div>
        <button onClick={()=>setShowSettings(v=>!v)}
          style={{width:36,height:36,borderRadius:10,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            background:showSettings?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.12)",flexShrink:0,transition:"background 0.15s"}}>
          <Settings size={18} color={gearColor}/>
        </button>
      </div>

      <div style={{padding:"16px 16px 80px",maxWidth:640,margin:"0 auto",display:"flex",flexDirection:"column",gap:12}}>

        {/* Settings panel */}
        <AnimatePresence initial={false}>
          {showSettings&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
              transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:"hidden"}}>
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:16,display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.7px"}}>Configurações</div>

                {/* WhatsApp */}
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#25D166"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </div>
                  <input value={editWhatsapp} onChange={e=>setEditWhatsapp(e.target.value)}
                    placeholder={`${ddiHint} DDD + número (ex: ${ddiHint.replace("+","")}11912345678)`}
                    style={{width:"100%",padding:"10px 12px",fontSize:13,border:"1px solid #e2e8f0",borderRadius:9,outline:"none",
                      background:"#f8fafc",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
                </div>

                {/* Google Calendar */}
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:13}}>📅</span> Google Calendar ID
                  </div>
                  <input value={editCalendar} onChange={e=>setEditCalendar(e.target.value)}
                    placeholder="ex: abc123@group.calendar.google.com"
                    style={{width:"100%",padding:"10px 12px",fontSize:13,outline:"none",background:"#f8fafc",fontFamily:"'Sora',sans-serif",boxSizing:"border-box",borderRadius:9,
                      border:`1px solid ${!calendarValid?"#ef4444":"#e2e8f0"}`}}/>
                  {!calendarValid&&(
                    <div style={{fontSize:11,color:"#ef4444",marginTop:4}}>Deve terminar com @group.calendar.google.com</div>
                  )}
                </div>

                <button onClick={saveSettings} disabled={savingSettings||!calendarValid}
                  style={{padding:"10px 0",borderRadius:9,border:"none",cursor:savingSettings?"wait":"pointer",fontSize:13,fontWeight:700,
                    fontFamily:"'Sora',sans-serif",color:"#fff",background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",
                    opacity:savingSettings?0.7:1,transition:"opacity 0.15s"}}>
                  {savingSettings?"Salvando…":"Salvar configurações"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{display:"flex",gap:6,background:"#fff",borderRadius:12,padding:4,border:"1px solid #e2e8f0"}}>
          {([["agenda","📅 Agenda"],["pacientes","👥 Pacientes"]] as const).map(([tab,label])=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Sora',sans-serif",transition:"all 0.15s",
                background:activeTab===tab?"linear-gradient(135deg,#2B7A78,#3AAFA9)":"transparent",
                color:activeTab===tab?"#fff":"#64748b"}}>
              {label}
            </button>
          ))}
        </div>

        {activeTab==="agenda"&&(
          <>
            {/* Filtros */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <div style={{position:"relative",flex:1,minWidth:140}}>
                <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..."
                  style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:10,paddingBottom:10,fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
              </div>
              <select value={statusFiltro} onChange={e=>setStatus(e.target.value)}
                style={{padding:"10px 12px",fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif",color:"#475569"}}>
                <option value="">Todos</option>
                <option value="confirmado">Confirmado</option>
                <option value="ok">✓ OK</option>
                <option value="faltou">✗ Faltou</option>
                <option value="cancelado">Cancelado</option>
                <option value="remarcado">Remarcado</option>
              </select>
            </div>

            {filteredAgends.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontSize:13}}>Nenhum agendamento</div>}
            {filteredAgends.map((a,i)=>{
              const st=STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
              const isOpen=expanded===a.id;
              return(
                <motion.div key={a.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                  style={{background:"#fff",borderRadius:12,border:`1px solid ${isOpen?"rgba(43,122,120,0.3)":"#e2e8f0"}`,overflow:"hidden"}}>
                  <button onClick={()=>setExpanded(isOpen?null:a.id)}
                    style={{width:"100%",padding:"12px 14px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{a.nome}</span>
                        <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:st.bg,color:st.color}}>{st.label}</span>
                      </div>
                      <div style={{fontSize:12,color:"#64748b",fontFamily:"monospace"}}>{a.data} · {a.horario}</div>
                    </div>
                    <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}} style={{color:"#cbd5e1",flexShrink:0}}>
                      <ChevronDown size={16}/>
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen&&(
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:"hidden"}}>
                        <div style={{padding:"0 14px 14px",borderTop:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:10}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,paddingTop:12}}>
                            {[["Procedimento",a.procedimento||"—"],["Documento",a.documento||"—"]].map(([l,v])=>(
                              <div key={l}>
                                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{l}</div>
                                <div style={{fontSize:13,color:"#334155"}}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {/* Telefone clicável */}
                          {a.telefone&&(
                            <a href={`https://wa.me/${a.telefone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.25)",borderRadius:10,textDecoration:"none"}}>
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D166"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              <span style={{fontSize:13,fontWeight:600,color:"#128C7E"}}>{a.telefone}</span>
                            </a>
                          )}
                          {/* Status */}
                          {updating===a.id?(
                            <div style={{fontSize:12,color:"#94a3b8",textAlign:"center"}}>Salvando…</div>
                          ):(
                            <select value={a.status} onChange={e=>changeStatus(a,e.target.value)}
                              style={{width:"100%",padding:"9px 12px",fontSize:13,fontWeight:600,border:`1px solid ${st.color}44`,borderRadius:8,background:st.bg,color:st.color,cursor:"pointer",outline:"none",fontFamily:"'Sora',sans-serif"}}>
                              <option value="confirmado">Confirmado</option>
                              <option value="ok">✓ OK</option>
                              <option value="faltou">✗ Faltou</option>
                              <option value="cancelado">Cancelado</option>
                              <option value="remarcado">Remarcado</option>
                            </select>
                          )}

                          {/* Botão Ficha do Paciente */}
                          {(()=>{
                            const pac=pacientes.find(p=>p.id===a.paciente_id||p.telefone===a.telefone);
                            const fichaIsOpen=fichaOpen===a.id;
                            const hist=pac?myAgends.filter(x=>x.paciente_id===pac.id||x.telefone===pac.telefone):[];
                            return(
                              <>
                                <button onClick={()=>setFichaOpen(fichaIsOpen?null:a.id)}
                                  style={{width:"100%",padding:"10px 14px",border:"1px solid rgba(43,122,120,0.3)",borderRadius:10,background:fichaIsOpen?"rgba(43,122,120,0.08)":"rgba(43,122,120,0.04)",cursor:"pointer",fontSize:13,fontWeight:700,color:"#2B7A78",fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <span>📋 Ficha do Paciente{pac?` — ${pac.nome}`:""}</span>
                                  <motion.div animate={{rotate:fichaIsOpen?180:0}} transition={{duration:0.2}} style={{flexShrink:0}}>
                                    <ChevronDown size={14}/>
                                  </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                  {fichaIsOpen&&(
                                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:"hidden"}}>
                                      <div style={{padding:"14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",display:"flex",flexDirection:"column",gap:12}}>
                                        {!pac?(
                                          <div style={{fontSize:12,color:"#94a3b8",textAlign:"center"}}>Paciente não encontrado no cadastro</div>
                                        ):(
                                          <>
                                            {/* Header paciente */}
                                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                                              <div style={{width:40,height:40,borderRadius:10,background:"#DEF2F1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#2B7A78",flexShrink:0}}>
                                                {(pac.nome||"?")[0].toUpperCase()}
                                              </div>
                                              <div style={{flex:1,minWidth:0}}>
                                                <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{pac.nome}</div>
                                                {pac.telefone&&(
                                                  <a href={`https://wa.me/${pac.telefone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                                                    style={{fontSize:12,color:"#25D166",fontFamily:"monospace",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="#25D166"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    {pac.telefone}
                                                  </a>
                                                )}
                                              </div>
                                            </div>
                                            {/* Dados */}
                                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                                              {[["Documento",pac.documento||"—"],["Nascimento",pac.data_nascimento||"—"],["Idade",calcularIdade(pac.data_nascimento)],["Email",pac.email||"—"]].map(([l,v])=>(
                                                <div key={l} style={{minWidth:0}}>
                                                  <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{l}</div>
                                                  <div style={{fontSize:13,color:"#334155",fontWeight:500,overflowWrap:"break-word",wordBreak:"break-word"}}>{v}</div>
                                                </div>
                                              ))}
                                            </div>
                                            {/* Anamnese */}
                                            {(()=>{
                                              const alertas=anamneseAlertas(pac.anamnese);
                                              const temAlerta=alertas.length>0;
                                              const bg=temAlerta?"rgba(239,68,68,0.06)":"rgba(16,185,129,0.06)";
                                              const border=temAlerta?"1px solid rgba(239,68,68,0.25)":"1px solid rgba(16,185,129,0.25)";
                                              const color=temAlerta?"#dc2626":"#059669";
                                              return(
                                                <div style={{padding:"10px 12px",background:bg,border,borderRadius:8}}>
                                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:temAlerta?6:0}}>
                                                    <span style={{fontSize:13}}>{temAlerta?"⚠️":"✓"}</span>
                                                    <div style={{fontSize:12,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                                                      {temAlerta?"Alertas de saúde":"Anamnese"}
                                                    </div>
                                                  </div>
                                                  {!pac.anamnese&&<div style={{fontSize:11,color,opacity:0.8}}>Não coletada</div>}
                                                  {pac.anamnese&&!temAlerta&&<div style={{fontSize:11,color,opacity:0.8}}>Sem alertas registrados</div>}
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
                                            {hist.length>0&&(
                                              <div>
                                                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Histórico ({hist.length})</div>
                                                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                                  {hist.slice(0,5).map((x,xi)=>{
                                                    const xs=STATUS_STYLE[x.status]||{bg:"#f1f5f9",color:"#64748b",label:x.status};
                                                    return(
                                                      <div key={xi} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#fff",borderRadius:8,border:"1px solid #f1f5f9"}}>
                                                        <div style={{flex:1,minWidth:0}}>
                                                          <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{x.procedimento||"Consulta"}</div>
                                                          <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{x.data} · {x.horario}</div>
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
                                              <div style={{height:64,borderRadius:10,border:"2px dashed #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#cbd5e1",background:"#fff"}}>Em desenvolvimento</div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </>
        )}

        {activeTab==="pacientes"&&(
          <>
            <div style={{position:"relative"}}>
              <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..."
                style={{width:"100%",paddingLeft:30,paddingRight:12,paddingTop:10,paddingBottom:10,fontSize:13,border:"1px solid #e2e8f0",borderRadius:10,outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"}}/>
            </div>
            {filteredPacs.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8",fontSize:13}}>Nenhum paciente</div>}
            {filteredPacs.map((p,i)=>{
              const hist=myAgends.filter(a=>a.paciente_id===p.id||a.telefone===p.telefone);
              const total=hist.filter(a=>a.status==="confirmado"||a.status==="ok").length;
              const ultima=hist[0]?.data;
              const isOpen=expandedPac===p.id;
              return(
                <motion.div key={p.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                  style={{background:"#fff",borderRadius:12,border:`1px solid ${isOpen?"rgba(43,122,120,0.3)":"#e2e8f0"}`,overflow:"hidden"}}>
                  <button onClick={()=>setExpPac(isOpen?null:p.id)}
                    style={{width:"100%",padding:"12px 14px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"#DEF2F1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#2B7A78",flexShrink:0}}>
                      {(p.nome||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:2}}>{p.nome}</div>
                      <a href={`https://wa.me/${(p.telefone||"").replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                        onClick={e=>e.stopPropagation()}
                        style={{fontSize:12,color:"#25D166",fontFamily:"monospace",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="#25D166"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {p.telefone}
                      </a>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginRight:4}}>
                      <div style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:99,background:"#DEF2F1",color:"#2B7A78",marginBottom:3}}>{total} consulta{total!==1?"s":""}</div>
                      {ultima&&<div style={{fontSize:11,color:"#94a3b8"}}>{ultima}</div>}
                    </div>
                    <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}} style={{color:"#cbd5e1",flexShrink:0}}>
                      <ChevronDown size={16}/>
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen&&(
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:"hidden"}}>
                        <div style={{padding:"12px 14px 14px",borderTop:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:10}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            {[["Documento",p.documento||"—"],["Nascimento",p.data_nascimento||"—"],["Idade",calcularIdade(p.data_nascimento)],["Email",p.email||"—"]].map(([l,v])=>(
                              <div key={l} style={{minWidth:0}}>
                                <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>{l}</div>
                                <div style={{fontSize:13,color:"#334155",overflowWrap:"break-word",wordBreak:"break-word"}}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {hist.length>0&&(
                            <div>
                              <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Histórico</div>
                              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                {hist.slice(0,4).map((a,ai)=>{
                                  const st=STATUS_STYLE[a.status]||{bg:"#f1f5f9",color:"#64748b",label:a.status};
                                  return(
                                    <div key={ai} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8fafc",borderRadius:8}}>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:600,color:"#334155"}}>{a.procedimento||"Consulta"}</div>
                                        <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{a.data} · {a.horario}</div>
                                      </div>
                                      <span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:99,background:st.bg,color:st.color}}>{st.label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// Type for PWA install prompt
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
  }
}
