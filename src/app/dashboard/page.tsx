"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Globe, Stethoscope, Building2, Users, Zap, ClipboardList } from "lucide-react";
import { sb, type Clinica, type Dentista } from "@/lib/supabase";

// ── Dados estáticos ────────────────────────────────────────────────────────────
const PAIS_OPTIONS: Record<string,{v:string;l:string}[]> = {
  'português':[{v:'br',l:'Brasil'},{v:'pt',l:'Portugal'},{v:'ao',l:'Angola'},{v:'mz',l:'Moçambique'},{v:'cv',l:'Cabo Verde'},{v:'gw',l:'Guiné-Bissau'},{v:'st',l:'São Tomé e Príncipe'},{v:'tl',l:'Timor-Leste'}],
  'español':[{v:'mx',l:'México'},{v:'co',l:'Colombia'},{v:'ar',l:'Argentina'},{v:'es',l:'España'},{v:'pe',l:'Perú'},{v:'ve',l:'Venezuela'},{v:'cl',l:'Chile'},{v:'ec',l:'Ecuador'},{v:'gt',l:'Guatemala'},{v:'cu',l:'Cuba'},{v:'bo',l:'Bolivia'},{v:'do',l:'República Dominicana'},{v:'hn',l:'Honduras'},{v:'py',l:'Paraguay'},{v:'sv',l:'El Salvador'},{v:'ni',l:'Nicaragua'},{v:'cr',l:'Costa Rica'},{v:'pa',l:'Panamá'},{v:'uy',l:'Uruguay'}],
  'english':[{v:'us',l:'United States'},{v:'uk',l:'United Kingdom'},{v:'au',l:'Australia'},{v:'ca',l:'Canada'},{v:'ng',l:'Nigeria'},{v:'za',l:'South Africa'},{v:'gh',l:'Ghana'},{v:'ke',l:'Kenya'},{v:'in',l:'India'},{v:'ph',l:'Philippines'},{v:'sg',l:'Singapore'},{v:'nz',l:'New Zealand'},{v:'ie',l:'Ireland'}],
  'français':[{v:'fr',l:'France'},{v:'be',l:'Belgique'},{v:'ch',l:'Suisse'},{v:'sn',l:'Sénégal'},{v:'ci',l:"Côte d'Ivoire"},{v:'cm',l:'Cameroun'},{v:'mg',l:'Madagascar'}],
  'deutsch':[{v:'de',l:'Deutschland'},{v:'at',l:'Österreich'},{v:'ch',l:'Schweiz'}],
  'italiano':[{v:'it',l:'Italia'},{v:'ch',l:'Svizzera'}],
  'русский':[{v:'ru',l:'Россия'},{v:'by',l:'Беларусь'},{v:'kz',l:'Казахстан'},{v:'ua',l:'Украина'}],
  'العربية':[{v:'sa',l:'المملكة العربية السعودية'},{v:'eg',l:'مصر'},{v:'ae',l:'الإمارات'},{v:'ma',l:'المغرب'},{v:'dz',l:'الجزائر'}],
};

const DDI_MAP: Record<string,string> = {
  br:'+55',pt:'+351',ao:'+244',mz:'+258',cv:'+238',gw:'+245',st:'+239',tl:'+670',
  mx:'+52',co:'+57',ar:'+54',es:'+34',pe:'+51',ve:'+58',cl:'+56',ec:'+593',
  gt:'+502',cu:'+53',bo:'+591',do:'+1',hn:'+504',py:'+595',sv:'+503',ni:'+505',
  cr:'+506',pa:'+507',uy:'+598',us:'+1',uk:'+44',au:'+61',ca:'+1',ng:'+234',
  za:'+27',gh:'+233',ke:'+254',in:'+91',ph:'+63',sg:'+65',nz:'+64',ie:'+353',
  fr:'+33',be:'+32',de:'+49',at:'+43',it:'+39',ch:'+41',
  sa:'+966',eg:'+20',ae:'+971',ma:'+212',dz:'+213',
  ru:'+7',by:'+375',kz:'+7',ua:'+380',
};

const ESTADOS_MAP: Record<string,string[]> = {
  br:['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'],
  ar:['Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'],
  mx:['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'],
  us:['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  co:['Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','Santander','Sucre','Tolima','Valle del Cauca','Bogotá D.C.'],
  pt:['Aveiro','Beja','Braga','Bragança','Castelo Branco','Coimbra','Évora','Faro','Guarda','Leiria','Lisboa','Portalegre','Porto','Santarém','Setúbal','Viana do Castelo','Vila Real','Viseu','Açores','Madeira'],
  es:['Andalucía','Aragón','Asturias','Cantabria','Castilla-La Mancha','Castilla y León','Cataluña','Comunitat Valenciana','Extremadura','Galicia','Islas Baleares','Islas Canarias','La Rioja','Madrid','Murcia','Navarra','País Vasco'],
  ca:['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
  au:['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'],
};

const ESPECIALIDADES = [
  {nome:'🦷 Clínico Geral',procs:[{nome:'Consulta / Avaliação',tempo:30},{nome:'Limpeza dental (profilaxia)',tempo:45},{nome:'Restauração / Cárie (1 face)',tempo:40},{nome:'Restauração / Cárie (2+ faces)',tempo:55},{nome:'Extração simples',tempo:35},{nome:'Fluoretação',tempo:25},{nome:'Radiografia',tempo:20}]},
  {nome:'🔧 Endodontia',procs:[{nome:'Canal dente anterior (1 raiz)',tempo:65},{nome:'Canal pré-molar (2 raízes)',tempo:80},{nome:'Canal molar (3+ raízes)',tempo:95},{nome:'Retratamento de canal',tempo:90}]},
  {nome:'📐 Ortodontia',procs:[{nome:'Consulta ortodontia',tempo:35},{nome:'Colocação de braquetes',tempo:90},{nome:'Ajuste mensal braquetes',tempo:30},{nome:'Alinhadores (entrega/ajuste)',tempo:35},{nome:'Contenção / Retentores',tempo:40}]},
  {nome:'🔩 Implantodontia',procs:[{nome:'Consulta / Planejamento',tempo:40},{nome:'Cirurgia de implante',tempo:90},{nome:'Reabertura / 2ª fase',tempo:45},{nome:'Colocação de coroa sobre implante',tempo:55},{nome:'Controle pós-operatório',tempo:25}]},
  {nome:'🦴 Prótese',procs:[{nome:'Moldagem',tempo:40},{nome:'Prova de estrutura',tempo:30},{nome:'Entrega de prótese removível',tempo:45},{nome:'Entrega de coroa fixa',tempo:40},{nome:'Ajuste de prótese',tempo:30}]},
  {nome:'🩺 Periodontia',procs:[{nome:'Raspagem supra-gengival',tempo:50},{nome:'Raspagem sub-gengival (por quadrante)',tempo:60},{nome:'Cirurgia periodontal',tempo:90},{nome:'Controle periodontal',tempo:30}]},
  {nome:'✨ Estética',procs:[{nome:'Clareamento em consultório',tempo:75},{nome:'Facetas de porcelana (prep)',tempo:90},{nome:'Facetas de resina',tempo:60},{nome:'Harmonização do sorriso',tempo:50}]},
  {nome:'👶 Odontopediatria',procs:[{nome:'Consulta pediátrica',tempo:35},{nome:'Selantes',tempo:30},{nome:'Extração de dente de leite',tempo:25},{nome:'Fluoretação niños',tempo:20}]},
  {nome:'🔪 Cirurgia',procs:[{nome:'Extração complexa / siso',tempo:60},{nome:'Frenectomia',tempo:40},{nome:'Biópsia',tempo:35},{nome:'Cirurgia de cisto',tempo:75}]},
  {nome:'🩻 Radiologia',procs:[{nome:'Radiografia periapical',tempo:15},{nome:'Panorâmica',tempo:15},{nome:'Tomografia',tempo:20},{nome:'Radiografia interproximal',tempo:15}]},
];

const PERSONALIDADES = [
  {v:'acolhedora',l:'Acolhedora — calorosa e empática'},
  {v:'executiva', l:'Executiva — formal e precisa'},
  {v:'moderna',   l:'Moderna — descontraída e jovial'},
  {v:'premium',   l:'Premium — sofisticada e exclusiva'},
  {v:'objetiva',  l:'Objetiva — direta e eficiente'},
];

function calcSlots(ini:string,fim:string,dur:number,almIni:string,almFim:string):string[]{
  const toMin=(t:string)=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
  const toStr=(m:number)=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const s=toMin(ini),e=toMin(fim),ai=toMin(almIni),af=toMin(almFim);
  const slots:string[]=[];
  for(let t=s;t+dur<=e;t+=dur){if(t>=ai&&t<af)continue;slots.push(toStr(t));}
  return slots;
}

// ── Componentes utilitários ────────────────────────────────────────────────────
const inputSt:React.CSSProperties={width:'100%',padding:'10px 12px',fontSize:13,border:'1px solid #e2e8f0',borderRadius:8,outline:'none',background:'#fff',fontFamily:"'Sora',sans-serif",boxSizing:'border-box'};
const labelSt:React.CSSProperties={display:'block',fontSize:11,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6};
const saveBtnSt:React.CSSProperties={padding:'10px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#2B7A78,#3AAFA9)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif"};

function Toggle({on,onChange}:{on:boolean;onChange:(v:boolean)=>void}){
  return(
    <button onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:99,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',background:on?'#2B7A78':'#e2e8f0',flexShrink:0}}>
      <motion.div animate={{x:on?20:2}} transition={{type:'spring',stiffness:500,damping:30}}
        style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
    </button>
  );
}

function CardSection({id,icon,title,subtitle,open,onToggle,children,badge}:{
  id:string;icon:React.ReactNode;title:string;subtitle:string;
  open:boolean;onToggle:()=>void;children:React.ReactNode;badge?:string;
}){
  return(
    <motion.div layout style={{background:'#fff',borderRadius:12,border:`1px solid ${open?'#2B7A78':'#e2e8f0'}`,boxShadow:'0 1px 3px rgba(0,0,0,0.06)',overflow:'hidden',marginBottom:12}}>
      <button onClick={onToggle} style={{width:'100%',padding:'14px 16px',border:'none',background:open?'rgba(43,122,120,0.04)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left'}}>
        <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#DEF2F1,rgba(58,175,169,0.1))',color:'#2B7A78',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{title}</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{subtitle}</div>
        </div>
        {badge&&<span style={{fontSize:11,fontFamily:'monospace',background:'#DEF2F1',color:'#2B7A78',padding:'2px 8px',borderRadius:99}}>{badge}</span>}
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8',flexShrink:0}}>
          <ChevronDown size={16}/>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open&&(
          <motion.div key="body" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.3,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{padding:'16px',borderTop:'1px solid #f1f5f9'}}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page principal ─────────────────────────────────────────────────────────────
export default function ConfigPage(){
  const [open,setOpen]=useState<string|null>('idioma');
  const [clinica,setClinica]=useState<Clinica|null>(null);
  const [saving,setSaving]=useState<string|null>(null);
  const [toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);
  const [paisCode,setPaisCode]=useState('br');
  const [idioma,setIdioma]=useState('português');
  const [estados,setEstados]=useState<string[]>([]);

  const showToast=useCallback((msg:string,ok=true)=>{
    setToast({msg,ok});setTimeout(()=>setToast(null),3000);
  },[]);

  useEffect(()=>{
    const id=localStorage.getItem('clinica_id');
    if(!id)return;
    sb.query<Clinica>('clinicas',`?id=eq.${id}&select=*`).then(r=>{
      if(r[0]){
        const c=r[0];
        setClinica(c);
        localStorage.setItem('clinica_nome',c.nome_clinica||'Clínica');
        const idiomaVal=c.idioma||'português-br';
        const dash=idiomaVal.lastIndexOf('-');
        const lang=dash>0?idiomaVal.substring(0,dash):'português';
        const pais=dash>0?idiomaVal.substring(dash+1):'br';
        setIdioma(lang);
        setPaisCode(pais);
        setEstados(ESTADOS_MAP[pais]||[]);
      }
    }).catch(()=>showToast('Erro ao carregar dados',false));
  },[showToast]);

  function toggle(id:string){setOpen(p=>p===id?null:id);}

  async function save(section:string,data:Record<string,unknown>){
    if(!clinica)return;
    setSaving(section);
    try{
      await sb.update('clinicas',clinica.id,data);
      setClinica(prev=>prev?{...prev,...data}:prev);
      showToast('Salvo com sucesso ✓');
    }catch{showToast('Erro ao salvar',false);}
    finally{setSaving(null);}
  }

  function onPaisChange(pais:string){
    setPaisCode(pais);
    setEstados(ESTADOS_MAP[pais]||[]);
  }

  if(!clinica)return<div style={{textAlign:'center',padding:'60px 0',color:'#94a3b8',fontSize:13}}>Carregando configurações...</div>;

  const ddi=DDI_MAP[paisCode]||'+55';
  const paisOpts=PAIS_OPTIONS[idioma]||[];
  const ativos=(Array.isArray(clinica.dentistas)?clinica.dentistas:[] as Dentista[]).filter((d:Dentista)=>d.ativo).length;

  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:700,color:'#1e293b',marginBottom:16}}>Configuração</h2>

      {/* IDIOMA */}
      <CardSection id="idioma" icon={<Globe size={18}/>} title="Idioma & Localização" subtitle="Idioma, país e fuso horário da clínica" open={open==='idioma'} onToggle={()=>toggle('idioma')}>
        <IdiomaSection clinica={clinica} saving={saving==='idioma'} onSave={(d)=>save('idioma',d)}/>
      </CardSection>

      {/* SECRETARIA */}
      <CardSection id="secretaria" icon={<Stethoscope size={18}/>} title="Dados da Secretaria" subtitle="Identidade e configurações da Iris" open={open==='secretaria'} onToggle={()=>toggle('secretaria')}>
        <SecretariaSection clinica={clinica} ddi={ddi} saving={saving==='secretaria'} onSave={(d)=>save('secretaria',d)}/>
      </CardSection>

      {/* CLINICA */}
      <CardSection id="clinica" icon={<Building2 size={18}/>} title="Dados da Clínica" subtitle="Informações usadas pelo agente nas conversas" open={open==='clinica'} onToggle={()=>toggle('clinica')}>
        <ClinicaSection clinica={clinica} ddi={ddi} estados={estados} saving={saving==='clinica'} onSave={(d)=>save('clinica',d)}/>
      </CardSection>

      {/* DENTISTAS */}
      <CardSection id="dentistas" icon={<Users size={18}/>} title="Dentistas" subtitle="Até 10 profissionais com agendas independentes" open={open==='dentistas'} onToggle={()=>toggle('dentistas')} badge={`${ativos}/10`}>
        <DentistasSection clinica={clinica} ddi={ddi} onSaveOne={async(i,dents)=>{await save('dentistas_save',{dentistas:dents});}} onSaveAll={async(dents)=>{await save('dentistas',{dentistas:dents});}} saving={saving==='dentistas'||saving==='dentistas_save'}/>
      </CardSection>

      {/* DADOS DO AGENTE */}
      <CardSection id="dados" icon={<ClipboardList size={18}/>} title="Dados que o agente solicita" subtitle="Escolha quais informações o agente irá coletar do paciente" open={open==='dados'} onToggle={()=>toggle('dados')}>
        <DadosAgenteSection clinica={clinica} saving={saving==='dados'} onSave={(d)=>save('dados',d)}/>
      </CardSection>

      {/* AUTOMACOES */}
      <CardSection id="automacoes" icon={<Zap size={18}/>} title="Automações" subtitle="Mensagens automáticas para pacientes" open={open==='automacoes'} onToggle={()=>toggle('automacoes')}>
        <AutomacoesSection clinica={clinica} saving={saving==='automacoes'} onSave={(d)=>save('automacoes',d)}/>
      </CardSection>

      {/* TOAST */}
      <AnimatePresence>
        {toast&&(
          <motion.div initial={{opacity:0,y:20,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10}}
            style={{position:'fixed',bottom:24,right:24,padding:'12px 16px',borderRadius:12,fontSize:13,fontWeight:600,color:'#fff',zIndex:100,boxShadow:'0 4px 12px rgba(0,0,0,0.15)',background:toast.ok?'#2B7A78':'#ef4444'}}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── IDIOMA SECTION ──────────────────────────────────────────────────────────────
const IDIOMAS = [
  {v:'português', label:'Português'},
  {v:'español',   label:'Español'},
  {v:'english',   label:'English'},
  {v:'français',  label:'Français'},
  {v:'deutsch',   label:'Deutsch'},
  {v:'italiano',  label:'Italiano'},
  {v:'русский',   label:'Русский'},
  {v:'العربية',   label:'العربية'},
];

const PAIS_FLAGS: Record<string,string> = {
  br:'🇧🇷',pt:'🇵🇹',ao:'🇦🇴',mz:'🇲🇿',cv:'🇨🇻',gw:'🇬🇼',st:'🇸🇹',tl:'🇹🇱',
  mx:'🇲🇽',co:'🇨🇴',ar:'🇦🇷',es:'🇪🇸',pe:'🇵🇪',ve:'🇻🇪',cl:'🇨🇱',ec:'🇪🇨',
  gt:'🇬🇹',cu:'🇨🇺',bo:'🇧🇴',do:'🇩🇴',hn:'🇭🇳',py:'🇵🇾',sv:'🇸🇻',ni:'🇳🇮',
  cr:'🇨🇷',pa:'🇵🇦',uy:'🇺🇾',us:'🇺🇸',uk:'🇬🇧',au:'🇦🇺',ca:'🇨🇦',ng:'🇳🇬',
  za:'🇿🇦',gh:'🇬🇭',ke:'🇰🇪',in:'🇮🇳',ph:'🇵🇭',sg:'🇸🇬',nz:'🇳🇿',ie:'🇮🇪',
  fr:'🇫🇷',be:'🇧🇪',ch:'🇨🇭',sn:'🇸🇳',ci:'🇨🇮',cm:'🇨🇲',mg:'🇲🇬',
  de:'🇩🇪',at:'🇦🇹',it:'🇮🇹',ru:'🇷🇺',by:'🇧🇾',kz:'🇰🇿',ua:'🇺🇦',
  sa:'🇸🇦',eg:'🇪🇬',ae:'🇦🇪',ma:'🇲🇦',dz:'🇩🇿',
};

function IdiomaSection({clinica,saving,onSave}:{
  clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;
}){
  const idiomaVal=clinica.idioma||'português-br';
  const dash=idiomaVal.lastIndexOf('-');
  const initLang=dash>0?idiomaVal.substring(0,dash):'português';
  const initPais=dash>0?idiomaVal.substring(dash+1):'br';

  const [lang,setLang]=useState(initLang);
  const [idiomaOpen,setIdiomaOpen]=useState(false);
  const [pais,setPais]=useState(initPais);
  const [paisOpen,setPaisOpen]=useState(false);
  const [paisOpts,setPaisOpts]=useState<{v:string;l:string}[]>(PAIS_OPTIONS[initLang]||[]);
  const [estado,setEstado]=useState((clinica as unknown as Record<string,string>).estado||'');
  const [estadoOpts,setEstadoOpts]=useState<string[]>(ESTADOS_MAP[initPais]||[]);
  const [fuso,setFuso]=useState(clinica.fuso_horario||'');
  const [paisInfo,setPaisInfo]=useState<{tipo_documento:string;digitos_documento:number;digitos_telefone:number}|null>(null);

  useEffect(()=>{ loadPaisInfo(initPais); },[]);// eslint-disable-line

  async function loadPaisInfo(p:string){
    try{
      const rows=await sb.query<Record<string,unknown>>('paises_config',`?codigo=eq.${p}&select=*`);
      if(rows[0]){
        const r=rows[0];
        setPaisInfo({tipo_documento:String(r.tipo_documento||'Documento'),digitos_documento:Number(r.digitos_documento||0),digitos_telefone:Number(r.digitos_telefone||0)});
        const f=String(r.fuso_horario||r.timezone||'');
        if(f)setFuso(f);
      }
    }catch{}
  }

  function selectLang(l:string){
    setLang(l);
    setIdiomaOpen(false);
    setPaisInfo(null);
    const opts=PAIS_OPTIONS[l]||[];
    setPaisOpts(opts);
    const first=opts[0]?.v||'';
    setPais(first);
    setEstado('');
    setEstadoOpts(ESTADOS_MAP[first]||[]);
    if(first)loadPaisInfo(first);
  }

  function selectPais(p:string){
    setPais(p);
    setPaisOpen(false);
    setPaisInfo(null);
    setEstado('');
    setEstadoOpts(ESTADOS_MAP[p]||[]);
    loadPaisInfo(p);
  }

  const currentIdioma=IDIOMAS.find(i=>i.v===lang);
  const currentPais=paisOpts.find(o=>o.v===pais);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Idioma accordion */}
      <div>
        <label style={labelSt}>Idioma</label>
        <button onClick={()=>setIdiomaOpen(p=>!p)}
          style={{width:'100%',padding:'10px 14px',border:`1px solid ${idiomaOpen?'#2B7A78':'#e2e8f0'}`,borderRadius:10,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:"'Sora',sans-serif",transition:'all 0.2s'}}>
          <span style={{flex:1,fontSize:14,fontWeight:600,color:'#1e293b',textAlign:'left'}}>{currentIdioma?.label||lang}</span>
          <motion.div animate={{rotate:idiomaOpen?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8'}}>
            <ChevronDown size={16}/>
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {idiomaOpen&&(
            <motion.div key="idiomas" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
              exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,padding:'10px 0 4px'}}>
                {IDIOMAS.map(id=>(
                  <button key={id.v} onClick={()=>selectLang(id.v)}
                    style={{padding:'10px 4px',border:`1px solid ${lang===id.v?'#2B7A78':'#e2e8f0'}`,borderRadius:10,background:lang===id.v?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,fontFamily:"'Sora',sans-serif",transition:'all 0.15s',minHeight:52,boxSizing:'border-box'}}>
                    <span style={{fontSize:12,fontWeight:600,color:lang===id.v?'#2B7A78':'#475569',textAlign:'center',lineHeight:1.2,wordBreak:'break-word'}}>{id.label}</span>
                    {lang===id.v&&<Check size={10} color="#2B7A78"/>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* País accordion */}
      <div>
        <label style={labelSt}>País</label>
        <button onClick={()=>setPaisOpen(p=>!p)}
          style={{width:'100%',padding:'10px 14px',border:`1px solid ${paisOpen?'#2B7A78':'#e2e8f0'}`,borderRadius:10,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:"'Sora',sans-serif",transition:'all 0.2s'}}>
          <span style={{fontSize:18}}>{PAIS_FLAGS[pais]||'🌍'}</span>
          <span style={{flex:1,fontSize:14,fontWeight:600,color:'#1e293b',textAlign:'left'}}>{currentPais?.l||pais}</span>
          <motion.div animate={{rotate:paisOpen?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8'}}>
            <ChevronDown size={16}/>
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {paisOpen&&(
            <motion.div key="paises" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
              exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6,padding:'10px 0 4px'}}>
                {paisOpts.map(o=>(
                  <button key={o.v} onClick={()=>selectPais(o.v)}
                    style={{padding:'9px 12px',border:`1px solid ${pais===o.v?'#2B7A78':'#e2e8f0'}`,borderRadius:8,background:pais===o.v?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>
                    <span style={{fontSize:16}}>{PAIS_FLAGS[o.v]||'🌍'}</span>
                    <span style={{fontSize:12,fontWeight:pais===o.v?600:400,color:pais===o.v?'#2B7A78':'#475569'}}>{o.l}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info do país */}
      <AnimatePresence>
        {paisInfo&&(
          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{display:'flex',gap:16,padding:'8px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12,color:'#475569',flexWrap:'wrap'}}>
            <span>📄 Documento: <strong>{paisInfo.tipo_documento}</strong> ({paisInfo.digitos_documento} dígitos)</span>
            <span>📱 Telefone: <strong>{paisInfo.digitos_telefone} dígitos</strong></span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado / Província */}
      <div style={{display:estadoOpts.length>0?'block':'none'}}>
        <label style={labelSt}>Estado / Província</label>
        <select value={estado} onChange={e=>setEstado(e.target.value)} style={inputSt}>
          <option value="">Selecione...</option>
          {estadoOpts.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Fuso horário */}
      <div>
        <label style={labelSt}>Fuso Horário</label>
        <input value={fuso} readOnly placeholder="Preenchido automaticamente ao selecionar o país"
          style={{...inputSt,background:'#f8fafc',color:'#64748b',cursor:'default'}}/>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button onClick={()=>onSave({idioma:`${lang}-${pais}`,pais_codigo:pais,fuso_horario:fuso,estado})}
          disabled={saving} style={saveBtnSt}>{saving?'Salvando...':'Salvar Idioma'}</button>
      </div>
    </div>
  );
}

// ── SECRETARIA SECTION ──────────────────────────────────────────────────────────
function SecretariaSection({clinica,ddi,saving,onSave}:{clinica:Clinica;ddi:string;saving:boolean;onSave:(d:Record<string,unknown>)=>void;}){
  const [nome,setNome]=useState(clinica.nome_agente||'Iris');
  const [pers,setPers]=useState(clinica.personalidade||'acolhedora');
  const [tel,setTel]=useState(clinica.telefone_agente||'');
  const instancia=tel.replace(/\D/g,'')?`CAPPIA-IRIS-${tel.replace(/\D/g,'')}` :'';

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <div>
          <label style={labelSt}>Nome da Secretária</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Iris, Sofia, Ana..." style={inputSt}/>
          <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>Nome com que a Iris se apresentará.</span>
        </div>
        <div>
          <label style={labelSt}>Personalidade</label>
          <select value={pers} onChange={e=>setPers(e.target.value)} style={inputSt}>
            {PERSONALIDADES.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Telefone WhatsApp</label>
          <div style={{display:'flex',border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden',background:'#fff'}}>
            <span style={{padding:'10px 10px',background:'#f1f5f9',borderRight:'1px solid #e2e8f0',fontFamily:'monospace',fontSize:13,color:'#2B7A78',whiteSpace:'nowrap'}}>{ddi}</span>
            <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="(21) 99999-9999"
              style={{flex:1,padding:'10px',fontSize:13,border:'none',outline:'none',fontFamily:"'Sora',sans-serif"}}/>
          </div>
        </div>
      </div>
      <div>
        <label style={labelSt}>Instância WhatsApp (automático)</label>
        <input value={instancia} readOnly placeholder="Preencha o telefone acima"
          style={{...inputSt,background:'#f8fafc',color:'#2B7A78',fontFamily:'monospace',fontWeight:600}}/>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>Formato: CAPPIA-IRIS-[telefone]</span>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button onClick={()=>onSave({nome_agente:nome,personalidade:pers,telefone_agente:tel,whatsapp_instancia:instancia})} disabled={saving} style={saveBtnSt}>{saving?'Salvando...':'Salvar Secretaria'}</button>
      </div>
    </div>
  );
}

// ── CLINICA SECTION ────────────────────────────────────────────────────────────
function ClinicaSection({clinica,ddi,estados,saving,onSave}:{clinica:Clinica;ddi:string;estados:string[];saving:boolean;onSave:(d:Record<string,unknown>)=>void;}){
  const c=clinica as unknown as Record<string,string>;
  const [vals,setVals]=useState({nome_clinica:clinica.nome_clinica||'',endereco:c.endereco||'',sala:c.sala||'',bairro:c.bairro||'',cidade:c.cidade||'',cep:c.cep||'',referencia:c.referencia||'',email_clinica:c.email_clinica||'',whatsapp_admin:c.whatsapp_admin||'',maps_link:c.maps_link||c.google_maps||''});
  const set=(k:string,v:string)=>setVals(p=>({...p,[k]:v}));

  function useGeo(){
    if(!navigator.geolocation){alert('Geolocalização não suportada');return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      const url=`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      set('maps_link',url);
    });
  }

  const fields:[string,string,string,string?][]=[
    ['nome_clinica','Nome da Clínica','OdontoBR'],
    ['endereco','Endereço (Rua e número)','Av. Paulista, 1234'],
    ['sala','Sala','3º andar, Sala 302'],
    ['bairro','Bairro','Centro'],
    ['cidade','Cidade','São Paulo'],
    ['cep','CEP','01310-100'],
    ['referencia','Referência','Em frente ao banco'],
    ['email_clinica','Email da Clínica','clinica@exemplo.com'],
  ];

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {fields.map(([k,l,ph])=>(
          <div key={k}>
            <label style={labelSt}>{l}</label>
            <input value={(vals as Record<string,string>)[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} style={inputSt}/>
          </div>
        ))}
        {estados.length>0&&(
          <div>
            <label style={labelSt}>Estado</label>
            <select value={c.estado||''} onChange={e=>set('estado',e.target.value)} style={inputSt}>
              <option value="">Selecione...</option>
              {estados.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label style={labelSt}>WhatsApp do Administrador</label>
        <div style={{display:'flex',border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
          <span style={{padding:'10px 10px',background:'#f1f5f9',borderRight:'1px solid #e2e8f0',fontFamily:'monospace',fontSize:13,color:'#2B7A78'}}>{ddi}</span>
          <input value={vals.whatsapp_admin} onChange={e=>set('whatsapp_admin',e.target.value)} placeholder="21999990000"
            style={{flex:1,padding:'10px',fontSize:13,border:'none',outline:'none',fontFamily:"'Sora',sans-serif"}}/>
        </div>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>Número do administrador — usado pela Iris para identificar o gestor.</span>
      </div>
      <div>
        <label style={labelSt}>Link de Localização (Google Maps)</label>
        <div style={{display:'flex',gap:8}}>
          <input value={vals.maps_link} onChange={e=>set('maps_link',e.target.value)} placeholder="https://maps.google.com/?q=..."
            style={{...inputSt,flex:1}}/>
          <button onClick={useGeo} style={{padding:'10px 14px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',fontSize:12,color:'#2B7A78',cursor:'pointer',whiteSpace:'nowrap',fontFamily:"'Sora',sans-serif",fontWeight:600}}>
            📍 Usar minha localização
          </button>
        </div>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>O agente enviará este link ao paciente quando solicitado.</span>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button onClick={()=>onSave(vals)} disabled={saving} style={saveBtnSt}>{saving?'Salvando...':'Salvar'}</button>
      </div>
    </div>
  );
}

// ── DENTISTAS SECTION ──────────────────────────────────────────────────────────
function DentistasSection({clinica,ddi,onSaveOne,onSaveAll,saving}:{
  clinica:Clinica;ddi:string;
  onSaveOne:(i:number,dents:Dentista[])=>Promise<void>;
  onSaveAll:(dents:Dentista[])=>Promise<void>;
  saving:boolean;
}){
  const base=Array.isArray(clinica.dentistas)?clinica.dentistas:[];
  const [dents,setDents]=useState<Dentista[]>(()=>
    Array.from({length:10},(_,i)=>base[i]||{nome:'',titulo:'Dr.',calendar_id:'',senha:'',ativo:false,inicio:'08:00',fim:'18:00',dur:60,alm_ini:'12:00',alm_fim:'13:00',sabado:false,sab_ini:'08:00',sab_fim:'13:00',horarios:'',modo:'auto',whatsapp:'',procedimentos:[]})
  );
  const [open,setOpen]=useState<number|null>(null);
  const [savingIdx,setSavingIdx]=useState<number|null>(null);

  function upd(i:number,data:Partial<Dentista>){setDents(prev=>prev.map((d,j)=>j===i?{...d,...data}:d));}

  async function saveOne(i:number){
    setSavingIdx(i);
    await onSaveOne(i,dents);
    setSavingIdx(null);
  }

  const ativos=dents.filter(d=>d.ativo).length;

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:12,color:'#94a3b8'}}>{ativos} de 10 ativos</span>
      </div>
      {dents.map((d,i)=>(
        <DentistaCard key={i} d={d} i={i} open={open===i} onToggle={()=>setOpen(p=>p===i?null:i)}
          onUpdate={(data)=>upd(i,data)} ddi={ddi} onSave={()=>saveOne(i)} saving={savingIdx===i}/>
      ))}
    </div>
  );
}

function DentistaCard({d,i,open,onToggle,onUpdate,ddi,onSave,saving}:{
  d:Dentista;i:number;open:boolean;onToggle:()=>void;
  onUpdate:(data:Partial<Dentista>)=>void;ddi:string;onSave:()=>void;saving:boolean;
}){
  const slots=d.modo==='auto'?calcSlots(d.inicio||'08:00',d.fim||'18:00',d.dur||60,d.alm_ini||'12:00',d.alm_fim||'13:00'):[];

  return(
    <div style={{border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:8,borderLeft:d.ativo?'3px solid #2B7A78':'3px solid #e2e8f0'}}>
      <button onClick={onToggle} style={{width:'100%',padding:'12px 14px',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left'}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:d.ativo?'#10b981':'#e2e8f0',flexShrink:0}}/>
        <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>Dentista {i+1}</span>
        {d.nome&&<span style={{fontSize:13,color:'#94a3b8'}}>— {d.titulo} {d.nome}</span>}
        <div style={{flex:1}}/>
        <Toggle on={d.ativo} onChange={v=>onUpdate({ativo:v})}/>
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8',flexShrink:0,marginLeft:8}}>
          <ChevronDown size={14}/>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{padding:'14px',borderTop:'1px solid #f1f5f9',display:'flex',flexDirection:'column',gap:12}}>
              {/* Nome */}
              <div style={{display:'grid',gridTemplateColumns:'80px 1fr',gap:8}}>
                <div>
                  <label style={labelSt}>Título</label>
                  <select value={d.titulo||'Dr.'} onChange={e=>onUpdate({titulo:e.target.value})} style={inputSt}>
                    <option>Dr.</option><option>Dra.</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Nome do Dentista *</label>
                  <input value={d.nome||''} onChange={e=>onUpdate({nome:e.target.value})} placeholder="Nome completo" style={inputSt}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={labelSt}>ID Google Calendar</label>
                  <input value={d.calendar_id||''} onChange={e=>onUpdate({calendar_id:e.target.value})} placeholder="xxx@group.calendar.google.com" style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Telefone / WhatsApp</label>
                  <div style={{display:'flex',border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
                    <span style={{padding:'10px 8px',background:'#f1f5f9',borderRight:'1px solid #e2e8f0',fontFamily:'monospace',fontSize:12,color:'#2B7A78'}}>{ddi}</span>
                    <input value={d.whatsapp||''} onChange={e=>onUpdate({whatsapp:e.target.value})} placeholder="(21) 99999-9999"
                      style={{flex:1,padding:'10px',fontSize:13,border:'none',outline:'none'}}/>
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Senha de Acesso</label>
                  <input type="password" value={d.senha||''} onChange={e=>onUpdate({senha:e.target.value})} placeholder="••••••" style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Atende Sábado?</label>
                  <select value={d.sabado?'sim':'nao'} onChange={e=>onUpdate({sabado:e.target.value==='sim'})} style={inputSt}>
                    <option value="nao">Não</option><option value="sim">Sim</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Abertura</label>
                  <input type="time" value={d.inicio||'08:00'} onChange={e=>onUpdate({inicio:e.target.value})} style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Encerramento</label>
                  <input type="time" value={d.fim||'18:00'} onChange={e=>onUpdate({fim:e.target.value})} style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Início Almoço</label>
                  <input type="time" value={d.alm_ini||'12:00'} onChange={e=>onUpdate({alm_ini:e.target.value})} style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>Fim Almoço</label>
                  <input type="time" value={d.alm_fim||'13:00'} onChange={e=>onUpdate({alm_fim:e.target.value})} style={inputSt}/>
                </div>
              </div>
              {d.sabado&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:12,background:'#f8fafc',borderRadius:8}}>
                  <div>
                    <label style={labelSt}>Abertura Sábado</label>
                    <input type="time" value={d.sab_ini||'08:00'} onChange={e=>onUpdate({sab_ini:e.target.value})} style={inputSt}/>
                  </div>
                  <div>
                    <label style={labelSt}>Encerramento Sábado</label>
                    <input type="time" value={d.sab_fim||'13:00'} onChange={e=>onUpdate({sab_fim:e.target.value})} style={inputSt}/>
                  </div>
                </div>
              )}
              {/* Modo horários */}
              <div>
                <label style={labelSt}>Modo de Horários</label>
                <div style={{display:'flex',gap:4,padding:4,background:'#f1f5f9',borderRadius:8,width:'fit-content'}}>
                  {(['auto','manual','proc'] as const).map(m=>(
                    <button key={m} onClick={()=>onUpdate({modo:m})}
                      style={{padding:'7px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif",
                        background:d.modo===m?'#2B7A78':'transparent',color:d.modo===m?'#fff':'#64748b',transition:'all 0.2s'}}>
                      {m==='auto'?'⚡ Automático':m==='manual'?'✏️ Manual':'📋 Por procedimento'}
                    </button>
                  ))}
                </div>
              </div>
              {d.modo==='auto'&&(
                <div>
                  <label style={labelSt}>Duração (min)</label>
                  <input type="number" value={d.dur||60} onChange={e=>onUpdate({dur:parseInt(e.target.value)||60})} min={5} step={5}
                    style={{...inputSt,width:100}}/>
                  <div style={{marginTop:8,fontSize:11,color:'#64748b',marginBottom:6}}>Slots gerados:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {slots.map(s=><span key={s} style={{padding:'4px 10px',background:'#DEF2F1',color:'#2B7A78',borderRadius:99,fontSize:12,fontWeight:600,fontFamily:'monospace'}}>{s}</span>)}
                  </div>
                </div>
              )}
              {d.modo==='manual'&&(
                <div>
                  <label style={labelSt}>Horários (separados por vírgula)</label>
                  <input value={d.horarios||''} onChange={e=>onUpdate({horarios:e.target.value})} placeholder="08:00,09:00,10:00,14:00,15:00"
                    style={{...inputSt,fontFamily:'monospace'}}/>
                </div>
              )}
              {/* Especialidades */}
              <div>
                <label style={labelSt}>Especialidades do Profissional</label>
                <EspecialidadesGrid procs={d.procedimentos||[]} onChange={procs=>onUpdate({procedimentos:procs})}/>
              </div>
              {/* Salvar */}
              <div style={{display:'flex',justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid #f1f5f9'}}>
                <button onClick={onSave} disabled={saving}
                  style={{...saveBtnSt,opacity:saving?0.6:1}}>
                  {saving?'Salvando...`':`💾 Salvar Dentista ${i+1}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EspecialidadesGrid({procs,onChange}:{procs:{nome:string;ativo:boolean;tempo:number}[];onChange:(p:{nome:string;ativo:boolean;tempo:number}[])=>void;}){
  const [openEsp,setOpenEsp]=useState<number|null>(null);
  const procsMap:Record<string,{ativo:boolean;tempo:number}>={};
  procs.forEach(p=>{if(p.nome)procsMap[p.nome]={ativo:p.ativo!==false,tempo:p.tempo||30};});

  function toggle(procNome:string){
    const cur=procsMap[procNome]||{ativo:false,tempo:30};
    const updated={...procsMap,[procNome]:{...cur,ativo:!cur.ativo}};
    onChange(Object.entries(updated).map(([nome,v])=>({nome,...v})));
  }

  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
      {ESPECIALIDADES.map((esp,ei)=>{
        const activeCount=esp.procs.filter(p=>procsMap[p.nome]?.ativo).length;
        const isOpen=openEsp===ei;
        return(
          <div key={ei} style={{border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
            <button onClick={()=>setOpenEsp(isOpen?null:ei)}
              style={{width:'100%',padding:'10px 12px',border:'none',background:activeCount>0?'rgba(43,122,120,0.04)':'transparent',cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{esp.nome}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{activeCount>0?`${activeCount} procedimento${activeCount>1?'s':''} ativo${activeCount>1?'s':''}`:'Não configurada'}</div>
              </div>
              <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:activeCount>0?'#DEF2F1':'#f1f5f9',color:activeCount>0?'#2B7A78':'#94a3b8',fontWeight:600,cursor:'pointer',border:'none',fontFamily:"'Sora',sans-serif"}}>
                {activeCount>0?'Configurar':'Ativar'}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen&&(
                <motion.div initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} style={{overflow:'hidden'}}>
                  <div style={{padding:'8px 12px',borderTop:'1px solid #f1f5f9',display:'flex',flexWrap:'wrap',gap:6,paddingBottom:10}}>
                    {esp.procs.map(p=>{
                      const on=procsMap[p.nome]?.ativo||false;
                      return(
                        <button key={p.nome} onClick={()=>toggle(p.nome)}
                          style={{padding:'4px 10px',borderRadius:99,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${on?'#2B7A78':'#e2e8f0'}`,background:on?'#DEF2F1':'transparent',color:on?'#2B7A78':'#64748b',fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>
                          {p.nome}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── DADOS DO AGENTE ────────────────────────────────────────────────────────────
function DadosAgenteSection({clinica,saving,onSave}:{clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;}){
  const a=(clinica as unknown as Record<string,Record<string,boolean>>).automatizacoes||{};
  const [nasc,setNasc]=useState(a.solicitar_nascimento||false);
  const [email,setEmail]=useState(a.solicitar_email||false);
  const [resp,setResp]=useState(a.solicitar_responsavel||false);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <div style={{padding:'10px 14px',background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:8,fontSize:12,color:'#475569',marginBottom:16}}>
        💡 Solicite apenas o necessário. Quanto menos campos, mais agradável a experiência do paciente.
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>Campos Obrigatórios (Fixos)</div>
        {['Nome','Telefone','CPF / Documento'].map(l=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
            <span style={{fontSize:16}}>🔒</span>
            <span style={{flex:1,fontSize:14,fontWeight:500,color:'#1e293b'}}>{l}</span>
            <span style={{fontSize:11,color:'#94a3b8',background:'#f1f5f9',padding:'2px 8px',borderRadius:99}}>obrigatório</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:4}}>Campos Opcionais</div>
        {[
          {k:'nasc',v:nasc,set:setNasc,label:'Data de nascimento',sub:'Quando ativado, o agente sempre solicitará a data de nascimento do paciente.'},
          {k:'email',v:email,set:setEmail,label:'Email',sub:'Quando ativado, o agente sempre solicitará o email do paciente.'},
          {k:'resp',v:resp,set:setResp,label:'Responsável',sub:'Quando ativado, o agente solicitará o nome do responsável (indicado para pacientes menores de idade).'},
        ].map(f=>(
          <div key={f.k} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{f.label}</div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{f.sub}</div>
            </div>
            <Toggle on={f.v} onChange={f.set}/>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
        <button onClick={()=>onSave({automatizacoes:{...a,solicitar_nascimento:nasc,solicitar_email:email,solicitar_responsavel:resp}})} disabled={saving} style={saveBtnSt}>
          {saving?'Salvando...':'Salvar'}
        </button>
      </div>
    </div>
  );
}

// ── AUTOMAÇÕES ─────────────────────────────────────────────────────────────────
function AutomacoesSection({clinica,saving,onSave}:{clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;}){
  const a=(clinica as unknown as Record<string,Record<string,unknown>>).automatizacoes||{};
  const [lem2h,setLem2h]=useState((a.lembrete_2h as boolean)!==false);
  const [lem24h,setLem24h]=useState((a.lembrete_24h as boolean)||false);
  const [posTipo,setPosTipo]=useState((a.pos_consulta_tipo as string)||'nenhum');
  const [posLink,setPosLink]=useState((a.pos_consulta_google_link as string)||'');
  const [posTempo,setPosTempo]=useState((a.pos_consulta_tempo as string)||'2h');
  const [retorno,setRetorno]=useState((a.retorno as boolean)||false);
  const [retMeses,setRetMeses]=useState((a.retorno_meses as number)||6);
  const [espera,setEspera]=useState((a.lista_espera as boolean)||false);
  const [aniv,setAniv]=useState((a.aniversario as boolean)||false);

  const posCards=[
    {v:'nenhum',icon:'🚫',label:'Nenhum'},
    {v:'satisfacao',icon:'⭐',label:'Apenas satisfação'},
    {v:'google',icon:'📊',label:'Apenas avaliação Google'},
    {v:'ambos',icon:'✨',label:'Satisfação + Google'},
  ];

  function handleSave(){
    onSave({automatizacoes:{...a,lembrete_2h:lem2h,lembrete_24h:lem24h,pos_consulta_tipo:posTipo,pos_consulta_google_link:posLink,pos_consulta_tempo:posTempo,retorno,retorno_meses:retMeses,lista_espera:espera,aniversario:aniv}});
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {/* Lembretes */}
      {[
        {v:lem2h,set:setLem2h,label:'🔔 Lembrete 2 horas antes',sub:'Envia uma mensagem automática 2 horas antes de cada consulta'},
        {v:lem24h,set:setLem24h,label:'🔔 Lembrete 24 horas antes',sub:'Envia uma mensagem automática 1 dia antes da consulta'},
      ].map(f=>(
        <div key={f.label} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{f.label}</div>
            <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{f.sub}</div>
          </div>
          <Toggle on={f.v} onChange={f.set}/>
        </div>
      ))}

      {/* Pós-consulta */}
      <div style={{padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{fontSize:14,fontWeight:600,color:'#1e293b',marginBottom:4}}>⭐ Pós-consulta</div>
        <div style={{fontSize:12,color:'#94a3b8',marginBottom:12}}>Envio automático após a consulta</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          {posCards.map(c=>(
            <button key={c.v} onClick={()=>setPosTipo(c.v)}
              style={{padding:'12px',borderRadius:10,border:`1px solid ${posTipo===c.v?'#2B7A78':'#e2e8f0'}`,background:posTipo===c.v?'rgba(43,122,120,0.06)':'transparent',cursor:'pointer',textAlign:'left',fontFamily:"'Sora',sans-serif"}}>
              <div style={{fontSize:20,marginBottom:4}}>{c.icon}</div>
              <div style={{fontSize:12,fontWeight:600,color:posTipo===c.v?'#2B7A78':'#475569'}}>{c.label}</div>
            </button>
          ))}
        </div>
        {['google','ambos'].includes(posTipo)&&(
          <div style={{marginBottom:10}}>
            <label style={labelSt}>Link Google Review</label>
            <input value={posLink} onChange={e=>setPosLink(e.target.value)} placeholder="https://g.page/r/..." style={inputSt}/>
          </div>
        )}
        {posTipo!=='nenhum'&&(
          <div>
            <label style={labelSt}>Enviar após:</label>
            <select value={posTempo} onChange={e=>setPosTempo(e.target.value)} style={{...inputSt,width:'auto'}}>
              <option value="2h">2 horas</option>
              <option value="4h">4 horas</option>
              <option value="24h">24 horas</option>
            </select>
          </div>
        )}
      </div>

      {/* Retorno automático */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>🔄 Retorno automático</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Lembra o paciente de agendar retorno após X meses</div>
          {retorno&&<div style={{marginTop:8,display:'flex',alignItems:'center',gap:8}}>
            <input type="number" value={retMeses} onChange={e=>setRetMeses(parseInt(e.target.value)||6)} min={1} max={24}
              style={{...inputSt,width:70}}/>
            <span style={{fontSize:13,color:'#64748b'}}>meses</span>
          </div>}
        </div>
        <Toggle on={retorno} onChange={setRetorno}/>
      </div>

      {/* Lista de espera */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>⏳ Lista de espera</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>Avisa o paciente quando um horário cancelado fica disponível</div>
        </div>
        <Toggle on={espera} onChange={setEspera}/>
      </div>

      {/* Aniversário */}
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'14px',marginTop:8,background:'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.05))',border:'1px solid rgba(245,158,11,0.25)',borderRadius:10}}>
        <div style={{fontSize:32,flexShrink:0}}>🎂</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#d97706'}}>Parabéns automático</div>
          <div style={{fontSize:12,color:'#92400e',marginTop:2}}>A Iris envia uma mensagem carinhosa no dia do aniversário do paciente</div>
          <div style={{marginTop:6,padding:'8px 12px',background:'rgba(245,158,11,0.08)',borderLeft:'2px solid rgba(245,158,11,0.4)',borderRadius:'0 6px 6px 0',fontSize:12,color:'#78350f',fontStyle:'italic'}}>
            &quot;Feliz aniversário! 🎉 Que seja um dia especial. Estamos aqui para cuidar do seu sorriso 😊&quot;
          </div>
          <div style={{marginTop:6,fontSize:11,color:'#94a3b8'}}>⚠️ Requer data de nascimento ativada em Dados que o agente solicita</div>
        </div>
        <Toggle on={aniv} onChange={setAniv}/>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
        <button onClick={handleSave} disabled={saving} style={saveBtnSt}>{saving?'Salvando...':'Salvar Automações'}</button>
      </div>
    </div>
  );
}
