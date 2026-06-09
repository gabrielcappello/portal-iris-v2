"use client";
import { useState, useEffect, Fragment } from "react";
import { sb, type Clinica } from "@/lib/supabase";

const ESPECIALIDADES = [
  {nome:"🦷 Clínico Geral",procs:[
    {nome:"Consulta / Avaliação",tempo:30},{nome:"Limpeza dental (profilaxia)",tempo:45},
    {nome:"Restauração / Cárie (1 face)",tempo:40},{nome:"Restauração / Cárie (2+ faces)",tempo:55},
    {nome:"Extração simples",tempo:35},{nome:"Fluoretação",tempo:25},{nome:"Radiografia",tempo:20},
  ]},
  {nome:"🔧 Endodontia",procs:[
    {nome:"Canal dente anterior (1 raiz)",tempo:65},{nome:"Canal pré-molar (2 raízes)",tempo:80},
    {nome:"Canal molar (3+ raízes)",tempo:95},{nome:"Retratamento de canal",tempo:90},
  ]},
  {nome:"📐 Ortodontia",procs:[
    {nome:"Consulta ortodontia",tempo:35},{nome:"Colocação de braquetes",tempo:90},
    {nome:"Ajuste mensal braquetes",tempo:30},{nome:"Alinhadores (entrega/ajuste)",tempo:35},
    {nome:"Contenção / Retentores",tempo:40},
  ]},
  {nome:"🔩 Implantodontia",procs:[
    {nome:"Consulta / Planejamento",tempo:40},{nome:"Cirurgia de implante",tempo:90},
    {nome:"Reabertura / 2ª fase",tempo:45},{nome:"Colocação de coroa sobre implante",tempo:55},
    {nome:"Controle pós-operatório",tempo:25},
  ]},
  {nome:"🦴 Prótese",procs:[
    {nome:"Moldagem",tempo:40},{nome:"Prova de estrutura",tempo:30},
    {nome:"Entrega de prótese removível",tempo:45},{nome:"Entrega de coroa fixa",tempo:40},
    {nome:"Ajuste de prótese",tempo:30},
  ]},
  {nome:"🩺 Periodontia",procs:[
    {nome:"Raspagem supra-gengival",tempo:50},{nome:"Raspagem sub-gengival (por quadrante)",tempo:60},
    {nome:"Cirurgia periodontal",tempo:90},{nome:"Controle periodontal",tempo:30},
  ]},
  {nome:"✨ Estética",procs:[
    {nome:"Clareamento em consultório",tempo:75},{nome:"Facetas de porcelana (prep)",tempo:90},
    {nome:"Facetas de resina",tempo:60},{nome:"Harmonização do sorriso",tempo:50},
  ]},
  {nome:"👶 Odontopediatria",procs:[
    {nome:"Consulta pediátrica",tempo:35},{nome:"Selantes",tempo:30},
    {nome:"Extração de dente de leite",tempo:25},{nome:"Fluoretação niños",tempo:20},
  ]},
  {nome:"🔪 Cirurgia",procs:[
    {nome:"Extração complexa / siso",tempo:60},{nome:"Frenectomia",tempo:40},
    {nome:"Biópsia",tempo:35},{nome:"Cirurgia de cisto",tempo:75},
  ]},
  {nome:"🩻 Radiologia",procs:[
    {nome:"Radiografia periapical",tempo:15},{nome:"Panorâmica",tempo:15},
    {nome:"Tomografia",tempo:20},{nome:"Radiografia interproximal",tempo:15},
  ]},
];

const MOEDA: Record<string,string> = {
  BR:"R$", AR:"$", CL:"$", MX:"$", CO:"$", PE:"S/.", UY:"$U", PY:"₲",
};

type Item = {valor:number; tempo:number};
type State = Record<string, Item>;

function buildState(saved?: Clinica["precios"]): State {
  const s: State = {};
  for (const esp of ESPECIALIDADES)
    for (const p of esp.procs)
      s[`${esp.nome}|${p.nome}`] = {valor:0, tempo:p.tempo};
  if (saved)
    for (const r of saved) {
      const k = `${r.esp}|${r.nome}`;
      if (k in s) s[k] = {valor:r.valor, tempo:r.tempo};
    }
  return s;
}

function TempoStepper({value, onChange}: {value:number; onChange:(v:number)=>void}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:2,background:"#f8fafc",
      borderRadius:9,padding:2,border:"1px solid #e2e8f0",width:"fit-content"}}>
      <button onClick={()=>onChange(Math.max(10,value-10))}
        style={{width:32,height:32,borderRadius:7,border:"none",background:"#fff",cursor:"pointer",
          fontSize:18,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 1px 2px rgba(0,0,0,0.06)",flexShrink:0,fontFamily:"monospace",
          lineHeight:1}}>
        −
      </button>
      <span style={{minWidth:60,textAlign:"center",fontSize:12,fontWeight:700,
        color:"#1e293b",fontFamily:"monospace",userSelect:"none",padding:"0 2px"}}>
        {value} min
      </span>
      <button onClick={()=>onChange(Math.min(240,value+10))}
        style={{width:32,height:32,borderRadius:7,border:"none",background:"#fff",cursor:"pointer",
          fontSize:18,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 1px 2px rgba(0,0,0,0.06)",flexShrink:0,fontFamily:"monospace",
          lineHeight:1}}>
        +
      </button>
    </div>
  );
}

export default function ProcedimentosPage() {
  const [clinica, setClinica] = useState<Clinica|null>(null);
  const [state, setState]     = useState<State>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [flash, setFlash]     = useState<"saved"|null>(null);

  useEffect(() => {
    const id = localStorage.getItem("clinica_id");
    if (!id) { setLoading(false); return; }
    sb.query<Clinica>("clinicas", `?id=eq.${id}&select=*`)
      .then(rows => {
        if (!rows.length) return;
        const c = rows[0];
        setClinica(c);
        setState(buildState(c.precios));
      })
      .finally(() => setLoading(false));
  }, []);

  function setField(key:string, field:"valor"|"tempo", val:number) {
    setState(prev => ({...prev, [key]: {...prev[key], [field]: val}}));
  }

  async function save() {
    if (!clinica) return;
    setSaving(true);
    try {
      const toSave = ESPECIALIDADES.flatMap(e =>
        e.procs.map(p => {
          const k = `${e.nome}|${p.nome}`;
          return {esp:e.nome, nome:p.nome, valor:state[k]?.valor??0, tempo:state[k]?.tempo??p.tempo};
        })
      );
      await sb.update("clinicas", clinica.id, {precios: toSave});
      setFlash("saved");
      setTimeout(() => setFlash(null), 2500);
    } catch {}
    finally { setSaving(false); }
  }

  const moeda = MOEDA[clinica?.pais_codigo||""] || "$";
  const totalProcs = ESPECIALIDADES.reduce((a,e)=>a+e.procs.length, 0);

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:16,gap:12,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>
          Procedimentos
          <span style={{fontSize:13,fontWeight:400,color:"#94a3b8",marginLeft:8}}>
            {totalProcs} procedimentos · {ESPECIALIDADES.length} especialidades
          </span>
        </h2>
        <button onClick={save} disabled={saving||loading}
          style={{padding:"9px 20px",borderRadius:10,border:"none",
            background: flash==="saved"
              ? "linear-gradient(135deg,#059669,#10b981)"
              : "linear-gradient(135deg,#2B7A78,#3AAFA9)",
            color:"#fff",fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",
            fontFamily:"'Sora',sans-serif",opacity:saving?0.7:1,
            transition:"all 0.2s",whiteSpace:"nowrap",minWidth:160}}>
          {saving ? "Salvando…" : flash==="saved" ? "✓ Salvo!" : "Salvar configurações"}
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0",color:"#94a3b8",fontSize:13}}>
          Carregando…
        </div>
      ) : (
        <div style={{overflow:"auto",maxHeight:"calc(100vh - 200px)",minHeight:200,
          borderRadius:12,border:"1px solid #e2e8f0",background:"#fff"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
            <thead>
              <tr>
                {["PROCEDIMENTO","VALOR","TEMPO"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,
                    fontWeight:700,color:"#94a3b8",letterSpacing:"0.6px",whiteSpace:"nowrap",
                    position:"sticky",top:0,background:"#f8fafc",zIndex:2,
                    boxShadow:"0 1px 0 #e2e8f0"}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ESPECIALIDADES.map(esp => (
                <Fragment key={esp.nome}>
                  {/* Specialty separator row */}
                  <tr>
                    <td colSpan={3} style={{
                      padding:"10px 14px",
                      background:"linear-gradient(90deg,rgba(43,122,120,0.07),rgba(43,122,120,0.02))",
                      borderTop:"1px solid #e2e8f0",
                      borderBottom:"1px solid rgba(43,122,120,0.15)"}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#2B7A78"}}>{esp.nome}</span>
                      <span style={{fontSize:11,color:"#94a3b8",marginLeft:8,fontWeight:400}}>
                        {esp.procs.length} procedimentos
                      </span>
                    </td>
                  </tr>
                  {/* Procedure rows */}
                  {esp.procs.map((p,pi)=>{
                    const key = `${esp.nome}|${p.nome}`;
                    const item = state[key] || {valor:0, tempo:p.tempo};
                    const isLast = pi === esp.procs.length-1;
                    return (
                      <tr key={key}
                        style={{borderBottom:`1px solid ${isLast?"transparent":"#f8fafc"}`,
                          transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#fafcff"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"9px 14px 9px 26px",fontSize:13,color:"#334155"}}>
                          {p.nome}
                        </td>
                        <td style={{padding:"7px 14px",whiteSpace:"nowrap"}}>
                          <div style={{display:"flex",alignItems:"stretch",
                            border:"1px solid #e2e8f0",borderRadius:9,overflow:"hidden",
                            maxWidth:120,background:"#fff"}}>
                            <span style={{padding:"0 9px",background:"#f8fafc",
                              color:"#94a3b8",fontSize:11,fontWeight:700,
                              borderRight:"1px solid #e2e8f0",display:"flex",
                              alignItems:"center",whiteSpace:"nowrap",flexShrink:0}}>
                              {moeda}
                            </span>
                            <input type="number" min={0} step={1}
                              value={item.valor===0?"":item.valor}
                              onChange={e=>setField(key,"valor",Math.max(0,Number(e.target.value)))}
                              placeholder="0"
                              style={{width:64,padding:"8px 8px",border:"none",outline:"none",
                                fontSize:13,fontFamily:"monospace",fontWeight:600,
                                color:"#334155",background:"#fff"}}/>
                          </div>
                        </td>
                        <td style={{padding:"7px 14px",whiteSpace:"nowrap"}}>
                          <TempoStepper value={item.tempo} onChange={v=>setField(key,"tempo",v)}/>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
