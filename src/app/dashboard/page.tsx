"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Stethoscope, Building2, Users, Zap, Check } from "lucide-react";
import { sb, type Clinica } from "@/lib/supabase";

type SectionId = "idioma"|"secretaria"|"clinica"|"dentistas"|"automacoes";

const PERSONALIDADES = [
  {v:"acolhedora", l:"Acolhedora — calorosa e empática"},
  {v:"executiva",  l:"Executiva — formal e precisa"},
  {v:"moderna",    l:"Moderna — descontraída e jovial"},
  {v:"premium",    l:"Premium — sofisticada e exclusiva"},
  {v:"objetiva",   l:"Objetiva — direta e eficiente"},
];

function Field({label, children}: {label:string; children:React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none transition-all bg-white";

export default function ConfigPage() {
  const [open, setOpen] = useState<SectionId|null>("idioma");
  const [clinica, setClinica] = useState<Clinica|null>(null);
  const [saving, setSaving] = useState<string|null>(null);
  const [saved, setSaved] = useState<string|null>(null);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = useCallback((msg:string, ok=true) => {
    setToast({msg,ok});
    setTimeout(()=>setToast(null),3000);
  },[]);

  useEffect(()=>{
    const id = localStorage.getItem("clinica_id");
    if (!id) return;
    sb.query<Clinica>("clinicas",`?id=eq.${id}&select=*`)
      .then(r=>{ if(r[0]){ setClinica(r[0]); localStorage.setItem("clinica_nome",r[0].nome_clinica||"Clínica"); } })
      .catch(()=>showToast("Erro ao carregar dados",false));
  },[showToast]);

  async function save(section: SectionId, data: Partial<Clinica>) {
    if (!clinica) return;
    setSaving(section);
    try {
      await sb.update("clinicas", clinica.id, data as Record<string,unknown>);
      setClinica(prev=>prev?{...prev,...data}:prev);
      setSaved(section);
      setTimeout(()=>setSaved(null),2000);
      showToast("Salvo com sucesso ✓");
    } catch { showToast("Erro ao salvar",false); }
    finally { setSaving(null); }
  }

  function toggle(id:SectionId){ setOpen(p=>p===id?null:id); }

  const sections: {id:SectionId; icon:React.ReactNode; title:string; subtitle:string}[] = [
    {id:"idioma",     icon:<Globe size={18}/>,       title:"Idioma & Localização",   subtitle:"Idioma, país e fuso horário da clínica"},
    {id:"secretaria", icon:<Stethoscope size={18}/>, title:"Dados da Secretaria",    subtitle:"Identidade e configurações da Iris"},
    {id:"clinica",    icon:<Building2 size={18}/>,   title:"Dados da Clínica",       subtitle:"Informações usadas pelo agente nas conversas"},
    {id:"dentistas",  icon:<Users size={18}/>,       title:"Dentistas",              subtitle:"Até 10 profissionais com agendas independentes"},
    {id:"automacoes", icon:<Zap size={18}/>,         title:"Automações",             subtitle:"Mensagens automáticas para pacientes"},
  ];

  if (!clinica) return <div className="py-20 text-center text-gray-400 text-sm">Carregando configurações...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Configuração</h2>
      <div className="space-y-3">
        {sections.map(s=>(
          <motion.div key={s.id} layout className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            style={{borderColor: open===s.id?"#2B7A78":""}}>
            <button onClick={()=>toggle(s.id)} className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors"
              style={{background: open===s.id?"rgba(43,122,120,0.04)":""}}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{background:"linear-gradient(135deg,#DEF2F1,rgba(58,175,169,0.1))",color:"#2B7A78"}}>
                {s.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {s.title}
                  {saved===s.id && <Check size={13} className="text-green-500"/>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{s.subtitle}</div>
              </div>
              <motion.div animate={{rotate:open===s.id?180:0}} transition={{duration:0.2}} className="text-gray-400">
                <ChevronDown size={16}/>
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {open===s.id && (
                <motion.div key="body" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                  exit={{height:0,opacity:0}} transition={{duration:0.3,ease:[0.4,0,0.2,1]}} className="overflow-hidden">
                  <div className="px-5 py-5 border-t border-gray-50">

                    {/* IDIOMA */}
                    {s.id==="idioma" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Idioma">
                            <select defaultValue={clinica.idioma?.split("-")[0]||"português"}
                              className={inputCls} id="c_idioma">
                              <option value="português">Português</option>
                              <option value="español">Español</option>
                              <option value="english">English</option>
                            </select>
                          </Field>
                          <Field label="País">
                            <select defaultValue={clinica.pais_codigo||"br"} className={inputCls} id="c_pais">
                              <option value="br">Brasil</option>
                              <option value="ar">Argentina</option>
                              <option value="us">Estados Unidos</option>
                            </select>
                          </Field>
                        </div>
                        <Field label="Fuso Horário">
                          <input defaultValue={clinica.fuso_horario||""} className={inputCls} id="c_fuso" placeholder="Ex: America/Sao_Paulo"/>
                        </Field>
                        <div className="flex justify-end">
                          <button onClick={()=>save("idioma",{
                            idioma:(document.getElementById("c_idioma") as HTMLSelectElement)?.value,
                            pais_codigo:(document.getElementById("c_pais") as HTMLSelectElement)?.value,
                            fuso_horario:(document.getElementById("c_fuso") as HTMLInputElement)?.value,
                          })} disabled={saving==="idioma"}
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                            style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                            {saving==="idioma"?"Salvando...":"Salvar"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SECRETARIA */}
                    {s.id==="secretaria" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Nome da Secretária">
                            <input defaultValue={clinica.nome_agente||"Iris"} className={inputCls} id="c_nome_agente" placeholder="Ex: Iris, Sofia, Ana..."/>
                          </Field>
                          <Field label="Personalidade">
                            <select defaultValue={clinica.personalidade||"acolhedora"} className={inputCls} id="c_personalidade">
                              {PERSONALIDADES.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
                            </select>
                          </Field>
                          <Field label="Telefone WhatsApp">
                            <input defaultValue={clinica.telefone_agente||""} className={inputCls} id="c_tel" placeholder="Ex: 21999990000"/>
                          </Field>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={()=>save("secretaria",{
                            nome_agente:(document.getElementById("c_nome_agente") as HTMLInputElement)?.value,
                            personalidade:(document.getElementById("c_personalidade") as HTMLSelectElement)?.value,
                            telefone_agente:(document.getElementById("c_tel") as HTMLInputElement)?.value,
                          })} disabled={saving==="secretaria"}
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                            style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                            {saving==="secretaria"?"Salvando...":"Salvar"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CLINICA */}
                    {s.id==="clinica" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {([
                            ["c_nome","Nome da Clínica",clinica.nome_clinica,"OdontoBR"],
                            ["c_end","Endereço",clinica.endereco,"Av. Paulista, 1234"],
                            ["c_sala","Sala",((clinica as unknown) as Record<string,string>).sala,"3º andar, Sala 302"],
                            ["c_bairro","Bairro",((clinica as unknown) as Record<string,string>).bairro,"Centro"],
                            ["c_cidade","Cidade",((clinica as unknown) as Record<string,string>).cidade,"São Paulo"],
                            ["c_cep","CEP",((clinica as unknown) as Record<string,string>).cep,"01310-100"],
                            ["c_referencia","Referência",((clinica as unknown) as Record<string,string>).referencia,"Em frente ao banco"],
                            ["c_email_clinica","Email da Clínica",((clinica as unknown) as Record<string,string>).email_clinica,"clinica@exemplo.com"],
                          ] as [string,string,string,string][]).map(([id,label,val,ph])=>(
                            <Field key={id} label={label}>
                              <input id={id} defaultValue={val||""} placeholder={ph} className={inputCls}/>
                            </Field>
                          ))}
                          <Field label="Link Google Maps">
                            <input id="c_maps" defaultValue={((clinica as unknown) as Record<string,string>).google_maps||""} placeholder="https://maps.google.com/..." className={inputCls}/>
                          </Field>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={()=>save("clinica",{
                            nome_clinica:(document.getElementById("c_nome") as HTMLInputElement)?.value,
                            endereco:(document.getElementById("c_end") as HTMLInputElement)?.value,
                            sala:(document.getElementById("c_sala") as HTMLInputElement)?.value,
                            bairro:(document.getElementById("c_bairro") as HTMLInputElement)?.value,
                            cidade:(document.getElementById("c_cidade") as HTMLInputElement)?.value,
                            cep:(document.getElementById("c_cep") as HTMLInputElement)?.value,
                            referencia:(document.getElementById("c_referencia") as HTMLInputElement)?.value,
                            email_clinica:(document.getElementById("c_email_clinica") as HTMLInputElement)?.value,
                            google_maps:(document.getElementById("c_maps") as HTMLInputElement)?.value,
                          })} disabled={saving==="clinica"}
                            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                            style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
                            {saving==="clinica"?"Salvando...":"Salvar"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DENTISTAS */}
                    {s.id==="dentistas" && (
                      <DentistasSection clinica={clinica} onSave={(dents)=>save("dentistas",{dentistas:dents})} saving={saving==="dentistas"}/>
                    )}

                    {/* AUTOMACOES */}
                    {s.id==="automacoes" && (
                      <p className="text-sm text-gray-400 py-4 text-center">Automações em desenvolvimento...</p>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:20,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10}}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg z-50"
            style={{background:toast.ok?"#2B7A78":"#ef4444"}}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import type { Dentista } from "@/lib/supabase";

function DentistasSection({clinica,onSave,saving}:{clinica:Clinica;onSave:(d:Dentista[])=>void;saving:boolean}) {
  const [dents, setDents] = useState<Dentista[]>(()=>{
    const base = Array.isArray(clinica.dentistas)?clinica.dentistas:[];
    return Array.from({length:10},(_,i)=>base[i]||{nome:"",titulo:"Dr.",calendar_id:"",senha:"",ativo:false,inicio:"08:00",fim:"18:00",dur:60,alm_ini:"12:00",alm_fim:"13:00",sabado:false,sab_ini:"08:00",sab_fim:"13:00",horarios:"",modo:"auto",whatsapp:"",procedimentos:[]});
  });
  const [open, setOpen] = useState<number|null>(null);

  function update(i:number, data:Partial<Dentista>) {
    setDents(prev=>prev.map((d,j)=>j===i?{...d,...data}:d));
  }

  const ativos = dents.filter(d=>d.ativo).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{ativos} de {dents.length} ativos</span>
        <button onClick={()=>onSave(dents)} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{background:"linear-gradient(135deg,#2B7A78,#3AAFA9)"}}>
          {saving?"Salvando...":"Salvar todos"}
        </button>
      </div>
      <div className="space-y-2">
        {dents.map((d,i)=>(
          <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button onClick={()=>setOpen(p=>p===i?null:i)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-gray-50">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.ativo?"bg-emerald-400":"bg-gray-200"}`}/>
              <span className="text-sm font-semibold text-gray-700">Dentista {i+1}</span>
              {d.nome && <span className="text-sm text-gray-400">— {d.titulo} {d.nome}</span>}
              <div className="flex-1"/>
              <motion.div animate={{rotate:open===i?180:0}} transition={{duration:0.2}} className="text-gray-400">
                <ChevronDown size={14}/>
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {open===i && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                  exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</span>
                      <button onClick={()=>update(i,{ativo:!d.ativo})}
                        className={`w-10 h-5 rounded-full transition-colors relative ${d.ativo?"":"bg-gray-200"}`}
                        style={{background:d.ativo?"#2B7A78":""}}>
                        <motion.div animate={{x:d.ativo?20:2}} transition={{type:"spring",stiffness:500,damping:30}}
                          className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 flex gap-2">
                        <select value={d.titulo||"Dr."} onChange={e=>update(i,{titulo:e.target.value})}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-20 focus:outline-none">
                          <option>Dr.</option><option>Dra.</option>
                        </select>
                        <input value={d.nome||""} onChange={e=>update(i,{nome:e.target.value})}
                          placeholder="Nome do dentista" className={`${inputCls} flex-1`}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">ID Google Calendar</label>
                        <input value={d.calendar_id||""} onChange={e=>update(i,{calendar_id:e.target.value})}
                          placeholder="xxxx@group.calendar.google.com" className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">WhatsApp</label>
                        <input value={d.whatsapp||""} onChange={e=>update(i,{whatsapp:e.target.value})}
                          placeholder="21999990000" className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Abertura</label>
                        <input type="time" value={d.inicio||"08:00"} onChange={e=>update(i,{inicio:e.target.value})} className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Encerramento</label>
                        <input type="time" value={d.fim||"18:00"} onChange={e=>update(i,{fim:e.target.value})} className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Início almoço</label>
                        <input type="time" value={d.alm_ini||"12:00"} onChange={e=>update(i,{alm_ini:e.target.value})} className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fim almoço</label>
                        <input type="time" value={d.alm_fim||"13:00"} onChange={e=>update(i,{alm_fim:e.target.value})} className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Duração consulta (min)</label>
                        <input type="number" value={d.dur||60} onChange={e=>update(i,{dur:parseInt(e.target.value)||60})}
                          min={5} step={5} className={inputCls}/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Atende sábado?</label>
                        <select value={d.sabado?"sim":"nao"} onChange={e=>update(i,{sabado:e.target.value==="sim"})} className={inputCls}>
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      {d.sabado && <>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Abertura sábado</label>
                          <input type="time" value={d.sab_ini||"08:00"} onChange={e=>update(i,{sab_ini:e.target.value})} className={inputCls}/>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Encerramento sábado</label>
                          <input type="time" value={d.sab_fim||"13:00"} onChange={e=>update(i,{sab_fim:e.target.value})} className={inputCls}/>
                        </div>
                      </>}
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Modo de horários</label>
                        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                          {(["auto","manual","proc"] as const).map(m=>(
                            <button key={m} onClick={()=>update(i,{modo:m})}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${d.modo===m?"text-white shadow-sm":"text-gray-500"}`}
                              style={{background:d.modo===m?"#2B7A78":""}}>
                              {m==="auto"?"⚡ Automático":m==="manual"?"✏️ Manual":"📋 Por procedimento"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {d.modo==="manual" && (
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Horários (separados por vírgula)</label>
                          <input value={d.horarios||""} onChange={e=>update(i,{horarios:e.target.value})}
                            placeholder="08:00,09:00,10:00,14:00,15:00" className={`${inputCls} font-mono`}/>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
