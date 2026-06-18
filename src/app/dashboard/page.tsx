"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Globe, Stethoscope, Building2, Users, Zap, ClipboardList, Eye, EyeOff, DollarSign } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { sb, type Clinica, type Dentista } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";
import type { TranslationKey } from "@/lib/i18n/translations";
import { translateEspecialidade, translateProcedimento } from "@/lib/i18n/procedimentos-i18n";
import VideoModal from "@/components/VideoModal";

// ── Config ─────────────────────────────────────────────────────────────────────
// Preencher após criar o workflow no n8n:
const N8N_VALIDATE_CALENDAR_URL = "https://singingdugong-n8n.cloudfy.live/webhook/validate-calendar";

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

// Nome do país em português (minúsculas), para a coluna texto "pais" da tabela clinicas.
// Mesmo conjunto de códigos de PAIS_OPTIONS acima.
const PAIS_NOME_PT: Record<string,string> = {
  br:'brasil',pt:'portugal',ao:'angola',mz:'moçambique',cv:'cabo verde',gw:'guiné-bissau',
  st:'são tomé e príncipe',tl:'timor-leste',
  mx:'méxico',co:'colômbia',ar:'argentina',es:'espanha',pe:'peru',ve:'venezuela',cl:'chile',
  ec:'equador',gt:'guatemala',cu:'cuba',bo:'bolívia',do:'república dominicana',hn:'honduras',
  py:'paraguai',sv:'el salvador',ni:'nicarágua',cr:'costa rica',pa:'panamá',uy:'uruguai',
  us:'estados unidos',uk:'reino unido',au:'austrália',ca:'canadá',ng:'nigéria',za:'áfrica do sul',
  gh:'gana',ke:'quênia',in:'índia',ph:'filipinas',sg:'singapura',nz:'nova zelândia',ie:'irlanda',
  fr:'frança',be:'bélgica',ch:'suíça',sn:'senegal',ci:'costa do marfim',cm:'camarões',mg:'madagascar',
  de:'alemanha',at:'áustria',it:'itália',
  ru:'rússia',by:'bielorrússia',kz:'cazaquistão',ua:'ucrânia',
  sa:'arábia saudita',eg:'egito',ae:'emirados árabes unidos',ma:'marrocos',dz:'argélia',
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

const UF_TO_ESTADO_BR: Record<string,string> = {
  AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',
  ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',
  MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',
  RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',
  RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins',
};

type HorarioFunc = {
  seg_sex:{inicio:string;fim:string};
  almoco:{ativo:boolean;inicio:string;fim:string};
  sabado:{ativo:boolean;inicio:string;fim:string};
  domingo:{ativo:boolean;inicio:string;fim:string};
};
const HORARIO_DEFAULT: HorarioFunc = {
  seg_sex:{inicio:'08:00',fim:'18:00'},
  almoco:{ativo:true,inicio:'12:00',fim:'13:00'},
  sabado:{ativo:false,inicio:'08:00',fim:'12:00'},
  domingo:{ativo:false,inicio:'08:00',fim:'12:00'},
};

const FUSO_MAP: Record<string,string> = {
  br:'America/Sao_Paulo',pt:'Europe/Lisbon',ao:'Africa/Luanda',mz:'Africa/Maputo',
  cv:'Atlantic/Cape_Verde',gw:'Africa/Bissau',st:'Africa/Sao_Tome',tl:'Asia/Dili',
  mx:'America/Mexico_City',co:'America/Bogota',ar:'America/Argentina/Buenos_Aires',
  es:'Europe/Madrid',pe:'America/Lima',ve:'America/Caracas',cl:'America/Santiago',
  ec:'America/Guayaquil',gt:'America/Guatemala',cu:'America/Havana',bo:'America/La_Paz',
  do:'America/Santo_Domingo',hn:'America/Tegucigalpa',py:'America/Asuncion',
  sv:'America/El_Salvador',ni:'America/Managua',cr:'America/Costa_Rica',
  pa:'America/Panama',uy:'America/Montevideo',us:'America/New_York',
  uk:'Europe/London',au:'Australia/Sydney',ca:'America/Toronto',ng:'Africa/Lagos',
  za:'Africa/Johannesburg',gh:'Africa/Accra',ke:'Africa/Nairobi',in:'Asia/Kolkata',
  ph:'Asia/Manila',sg:'Asia/Singapore',nz:'Pacific/Auckland',ie:'Europe/Dublin',
  fr:'Europe/Paris',be:'Europe/Brussels',ch:'Europe/Zurich',de:'Europe/Berlin',
  at:'Europe/Vienna',it:'Europe/Rome',sn:'Africa/Dakar',ci:'Africa/Abidjan',
  cm:'Africa/Douala',mg:'Indian/Antananarivo',ru:'Europe/Moscow',by:'Europe/Minsk',
  kz:'Asia/Almaty',ua:'Europe/Kiev',sa:'Asia/Riyadh',eg:'Africa/Cairo',
  ae:'Asia/Dubai',ma:'Africa/Casablanca',dz:'Africa/Algiers',
};


const FUSO_ESTADO_MAP: Record<string,Record<string,string>> = {
  us:{
    'Alabama':'America/Chicago','Alaska':'America/Anchorage','Arizona':'America/Phoenix',
    'Arkansas':'America/Chicago','California':'America/Los_Angeles','Colorado':'America/Denver',
    'Connecticut':'America/New_York','Delaware':'America/New_York','Florida':'America/New_York',
    'Georgia':'America/New_York','Hawaii':'Pacific/Honolulu','Idaho':'America/Denver',
    'Illinois':'America/Chicago','Indiana':'America/Indiana/Indianapolis','Iowa':'America/Chicago',
    'Kansas':'America/Chicago','Kentucky':'America/New_York','Louisiana':'America/Chicago',
    'Maine':'America/New_York','Maryland':'America/New_York','Massachusetts':'America/New_York',
    'Michigan':'America/Detroit','Minnesota':'America/Chicago','Mississippi':'America/Chicago',
    'Missouri':'America/Chicago','Montana':'America/Denver','Nebraska':'America/Chicago',
    'Nevada':'America/Los_Angeles','New Hampshire':'America/New_York','New Jersey':'America/New_York',
    'New Mexico':'America/Denver','New York':'America/New_York','North Carolina':'America/New_York',
    'North Dakota':'America/Chicago','Ohio':'America/New_York','Oklahoma':'America/Chicago',
    'Oregon':'America/Los_Angeles','Pennsylvania':'America/New_York','Rhode Island':'America/New_York',
    'South Carolina':'America/New_York','South Dakota':'America/Chicago','Tennessee':'America/Chicago',
    'Texas':'America/Chicago','Utah':'America/Denver','Vermont':'America/New_York',
    'Virginia':'America/New_York','Washington':'America/Los_Angeles','Washington D.C.':'America/New_York',
    'West Virginia':'America/New_York','Wisconsin':'America/Chicago','Wyoming':'America/Denver',
  },
  ca:{
    'Alberta':'America/Edmonton','British Columbia':'America/Vancouver',
    'Manitoba':'America/Winnipeg','New Brunswick':'America/Moncton',
    'Newfoundland and Labrador':'America/St_Johns','Northwest Territories':'America/Yellowknife',
    'Nova Scotia':'America/Halifax','Nunavut':'America/Iqaluit','Ontario':'America/Toronto',
    'Prince Edward Island':'America/Halifax','Quebec':'America/Montreal',
    'Saskatchewan':'America/Regina','Yukon':'America/Whitehorse',
  },
  br:{
    'Acre':'America/Rio_Branco','Alagoas':'America/Recife','Amapá':'America/Belem',
    'Amazonas':'America/Manaus','Bahia':'America/Bahia','Ceará':'America/Fortaleza',
    'Distrito Federal':'America/Sao_Paulo','Espírito Santo':'America/Sao_Paulo',
    'Goiás':'America/Sao_Paulo','Maranhão':'America/Fortaleza','Mato Grosso':'America/Cuiaba',
    'Mato Grosso do Sul':'America/Campo_Grande','Minas Gerais':'America/Sao_Paulo',
    'Pará':'America/Belem','Paraíba':'America/Recife','Paraná':'America/Sao_Paulo',
    'Pernambuco':'America/Recife','Piauí':'America/Fortaleza','Rio de Janeiro':'America/Sao_Paulo',
    'Rio Grande do Norte':'America/Fortaleza','Rio Grande do Sul':'America/Sao_Paulo',
    'Rondônia':'America/Porto_Velho','Roraima':'America/Boa_Vista',
    'Santa Catarina':'America/Sao_Paulo','São Paulo':'America/Sao_Paulo',
    'Sergipe':'America/Recife','Tocantins':'America/Araguaina',
  },
  au:{
    'Australian Capital Territory':'Australia/Sydney','New South Wales':'Australia/Sydney',
    'Northern Territory':'Australia/Darwin','Queensland':'Australia/Brisbane',
    'South Australia':'Australia/Adelaide','Tasmania':'Australia/Hobart',
    'Victoria':'Australia/Melbourne','Western Australia':'Australia/Perth',
  },
  mx:{
    'Baja California':'America/Tijuana','Baja California Sur':'America/Mazatlan',
    'Chihuahua':'America/Chihuahua','Ciudad de México':'America/Mexico_City',
    'Nayarit':'America/Bahia_Banderas','Sinaloa':'America/Mazatlan',
    'Sonora':'America/Hermosillo',
  },
  ru:{
    'Москва':'Europe/Moscow','Калининград':'Europe/Kaliningrad',
    'Самара':'Europe/Samara','Екатеринбург':'Asia/Yekaterinburg',
    'Омск':'Asia/Omsk','Красноярск':'Asia/Krasnoyarsk',
    'Иркутск':'Asia/Irkutsk','Якутск':'Asia/Yakutsk',
    'Владивосток':'Asia/Vladivostok','Магадан':'Asia/Magadan',
    'Камчатка':'Asia/Kamchatka',
  },
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
const inputSt:React.CSSProperties={width:'100%',padding:'10px 12px',fontSize:13,border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,outline:'none',background:'#fff',fontFamily:"'Sora',sans-serif",boxSizing:'border-box'};
const labelSt:React.CSSProperties={display:'block',fontSize:11,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6};
const saveBtnSt:React.CSSProperties={padding:'10px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#2B7A78,#3AAFA9)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif"};

function Toggle({on,onChange,partial,inactiveBg='#94a3b8'}:{on:boolean;onChange:(v:boolean)=>void;partial?:boolean;inactiveBg?:string}){
  const bg=on?(partial?'#f59e0b':'#2B7A78'):inactiveBg;
  return(
    <button onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:99,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',background:bg,flexShrink:0}}>
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
    <div style={{background:'#fff',borderRadius:12,border:`1px solid ${open?'#2B7A78':'rgba(43,122,120,0.35)'}`,boxShadow:'0 6px 16px rgba(0,0,0,0.28)',overflow:'hidden',marginBottom:12}}>
      <motion.div whileTap={{y:3}} onClick={onToggle} style={{width:'100%',padding:'14px 16px',background:open?'rgba(43,122,120,0.04)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:12,textAlign:'left'}}>
        <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#DEF2F1,rgba(58,175,169,0.1))',color:'#2B7A78',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{title}</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{subtitle}</div>
        </div>
        {badge&&<span style={{fontSize:11,fontFamily:'monospace',background:'#DEF2F1',color:'#2B7A78',padding:'2px 8px',borderRadius:99}}>{badge}</span>}
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8',flexShrink:0}}>
          <ChevronDown size={16}/>
        </motion.div>
      </motion.div>
      <AnimatePresence initial={false}>
        {open&&(
          <motion.div key="body" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.3,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{padding:'16px',borderTop:'1px solid #f1f5f9'}}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page principal ─────────────────────────────────────────────────────────────
export default function ConfigPage(){
  const { t, refreshLang } = useLang();
  const [open,setOpen]=useState<string|null>(null);
  const [clinica,setClinica]=useState<Clinica|null>(null);
  const [saving,setSaving]=useState<string|null>(null);
  const [toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);
  const [paisCode,setPaisCode]=useState('br');
  const [idioma,setIdioma]=useState('português');
  const [estados,setEstados]=useState<string[]>([]);
  const [ddd,setDdd]=useState('');

  const showToast=useCallback((msg:string,ok=true)=>{
    setToast({msg,ok});setTimeout(()=>setToast(null),3000);
  },[]);

  async function loadDdd(pais:string, estado:string){
    try{
      const rows=await sb.query<Record<string,unknown>>('paises_config',`?codigo=eq.${pais}&select=ddd_por_estado`);
      if(rows[0]){
        const mapa=rows[0].ddd_por_estado as Record<string,string>||{};
        setDdd(mapa[estado]||'');
      }
    }catch{ setDdd(''); }
  }

  useEffect(()=>{
    const id=localStorage.getItem('clinica_id');
    if(!id)return;
    sb.query<Clinica>('clinicas',`?id=eq.${id}&select=*`).then(r=>{
      if(r[0]){
        const c=r[0];
        setClinica(c);
        localStorage.setItem('clinica_nome',c.nome||'Clínica');
        const idiomaVal=c.idioma||'português-br';
        const dash=idiomaVal.lastIndexOf('-');
        const lang=dash>0?idiomaVal.substring(0,dash):'português';
        const pais=dash>0?idiomaVal.substring(dash+1):'br';
        const estadoSalvo=(c as unknown as Record<string,string>).estado||'';
        setIdioma(lang);
        setPaisCode(pais);
        setEstados(ESTADOS_MAP[pais]||[]);
        if(pais&&estadoSalvo)loadDdd(pais,estadoSalvo);
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
      // Atualiza DDD se mudou idioma/estado
      if(data.pais_codigo&&data.estado){
        loadDdd(String(data.pais_codigo),String(data.estado));
      }
      if(data.idioma)refreshLang();
      showToast('Salvo com sucesso ✓');
      if(section!=='dentistas_save') setOpen(null);
    }catch{showToast('Erro ao salvar',false);}
    finally{setSaving(null);}
  }

  function onIdiomaPaisEstadoChange(pais:string,estado:string){
    setPaisCode(pais);
    setEstados(ESTADOS_MAP[pais]||[]);
    if(estado)loadDdd(pais,estado);
    else setDdd('');
  }

  async function onCepData(data:Record<string,unknown>){
    if(!clinica)return;
    try{
      await sb.update('clinicas',clinica.id,data);
      setClinica(prev=>prev?{...prev,...data}:prev);
    }catch{}
  }

  if(!clinica)return<div style={{textAlign:'center',padding:'60px 0',color:'#94a3b8',fontSize:13}}>Carregando configurações...</div>;

  const ddi=DDI_MAP[paisCode]||'+55';
  const prefixo=ddd?`${ddi} (${ddd})`:`${ddi}`;
  const paisOpts=PAIS_OPTIONS[idioma]||[];
  const ativos=(Array.isArray(clinica.dentistas)?clinica.dentistas:[] as Dentista[]).filter((d:Dentista)=>d?.ativo).length;

  const idiomaConfigurado=!!(clinica.idioma&&clinica.pais_codigo&&(clinica as unknown as Record<string,string>).estado||(clinica.idioma&&clinica.pais_codigo&&!(ESTADOS_MAP[clinica.pais_codigo]?.length>0)));

  return(
    <div>
      <h2 style={{fontSize:18,fontWeight:700,color:'#1e293b',marginBottom:16}}>{t("nav.tab_config")}</h2>

      {/* IDIOMA — fecha ao salvar mas sempre pode reabrir */}
      <CardSection id="idioma" icon={<Globe size={18}/>} title={t("config.card_locale")} subtitle={t("config.card_locale_sub")}
        open={open==='idioma'} onToggle={()=>toggle('idioma')}>
        <IdiomaSection clinica={clinica} saving={saving==='idioma'} onSave={(d)=>save('idioma',d)} onClose={()=>toggle('idioma')} onPaisEstadoChange={onIdiomaPaisEstadoChange} onCepData={onCepData} showToast={showToast} t={t}/>
      </CardSection>

      {/* CLINICA */}
      <CardSection id="clinica" icon={<Building2 size={18}/>} title={`${t("config.card_clinic")}${clinica.nome?` ${clinica.nome}`:''}`} subtitle={t("config.card_clinic_sub")} open={open==='clinica'} onToggle={()=>toggle('clinica')}>
        <ClinicaSection clinica={clinica} prefixo={prefixo} estados={estados} saving={saving==='clinica'} onSave={(d)=>save('clinica',d)} onClose={()=>toggle('clinica')} t={t}/>
      </CardSection>

      {/* DENTISTAS */}
      <CardSection id="dentistas" icon={<Users size={18}/>} title={t("config.card_dentists")} subtitle={t("config.card_dentists_sub")} open={open==='dentistas'} onToggle={()=>toggle('dentistas')} badge={`${ativos}/10`}>
        <DentistasSection clinica={clinica} ddi={prefixo} onSaveOne={async(i,dents)=>{await save('dentistas_save',{dentistas:dents});}} onSaveAll={async(dents)=>{await save('dentistas',{dentistas:dents});}} saving={saving==='dentistas'||saving==='dentistas_save'} onClose={()=>toggle('dentistas')} t={t}/>
      </CardSection>

      {/* PROCEDIMENTOS */}
      <CardSection id="procedimentos" icon={<DollarSign size={18}/>} title={t("config.card_procedures")} subtitle={t("config.card_procedures_sub")} open={open==='procedimentos'} onToggle={()=>toggle('procedimentos')}>
        <ProcedimentosSection clinica={clinica} saving={saving==='procedimentos'} onSave={(d)=>save('procedimentos',d)} t={t}/>
      </CardSection>

      {/* DADOS DO AGENTE */}
      <CardSection id="dados" icon={<ClipboardList size={18}/>} title={t("config.card_dados_title",{agente:clinica.nome_agente||'o agente'})} subtitle={t("config.card_anamnesis_sub")} open={open==='dados'} onToggle={()=>toggle('dados')}>
        <DadosAgenteSection clinica={clinica} saving={saving==='dados'} onSave={(d)=>save('dados',d)} t={t}/>
      </CardSection>

      {/* AUTOMACOES */}
      <CardSection id="automacoes" icon={<Zap size={18}/>} title={t("config.card_automations")} subtitle={t("config.card_automations_sub")} open={open==='automacoes'} onToggle={()=>toggle('automacoes')}>
        <AutomacoesSection clinica={clinica} saving={saving==='automacoes'} onSave={(d)=>save('automacoes',d)} t={t}/>
      </CardSection>

      {/* SECRETARIA */}
      <CardSection id="secretaria" icon={<Stethoscope size={18}/>} title={`${t("config.card_agent")}${clinica.nome_agente?` ${clinica.nome_agente}`:''}`} subtitle={t("config.card_agent_sub")} open={open==='secretaria'} onToggle={()=>toggle('secretaria')}>
        <SecretariaSection clinica={clinica} prefixo={prefixo} saving={saving==='secretaria'} onSave={(d)=>save('secretaria',d)} t={t}/>
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

function IdiomaSection({clinica,saving,onSave,onClose,onPaisEstadoChange,onCepData,showToast,t}:{
  clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;onClose:()=>void;onPaisEstadoChange:(pais:string,estado:string)=>void;onCepData:(d:Record<string,unknown>)=>void;showToast:(msg:string,ok?:boolean)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;
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
  const [estadoOpen,setEstadoOpen]=useState(false);
  const [fuso,setFuso]=useState(clinica.fuso_horario||'');
  const [paisInfo,setPaisInfo]=useState<{tipo_documento:string;digitos_documento:number;digitos_telefone:number;moeda:string;moeda_codigo:string}|null>(null);

  const [cep,setCep]=useState((clinica as unknown as Record<string,string>).cep||'');
  const [cepLoading,setCepLoading]=useState(false);
  const [cepErro,setCepErro]=useState('');

  async function buscarCep(cepRaw:string){
    const cepLimpo=cepRaw.replace(/\D/g,'');
    setCepErro('');

    // Brasil: mínimo 8 dígitos
    if(pais==='br'){
      if(cepLimpo.length<8) return;
      setCepLoading(true);
      try{
        const res=await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data=await res.json();
        if(data.erro){setCepErro('CEP não encontrado.');showToast('CEP não encontrado',false);return;}
        const payload:Record<string,unknown>={cep:cepRaw};
        if(data.logradouro)payload.endereco=data.logradouro;
        if(data.bairro)payload.bairro=data.bairro;
        if(data.localidade)payload.cidade=data.localidade;
        const estadoNome=UF_TO_ESTADO_BR[data.uf]||'';
        if(estadoNome&&estadoOpts.includes(estadoNome)&&estadoNome!==estado){
          selectEstado(estadoNome);
          payload.estado=estadoNome;
        }
        await onCepData(payload);
        showToast('Endereço preenchido a partir do CEP ✓');
      }catch{setCepErro('Erro ao buscar CEP.');showToast('Erro ao buscar CEP',false);}
      finally{setCepLoading(false);}
      return;
    }

    // Internacional: Zippopotam.us — mínimo 3 caracteres
    if(cepLimpo.length<3) return;
    setCepLoading(true);
    try{
      const res=await fetch(`https://api.zippopotam.us/${pais}/${cepLimpo}`);
      if(!res.ok){setCepErro('Código postal não encontrado.');showToast('Código postal não encontrado',false);return;}
      const data=await res.json();
      const place=data.places?.[0];
      if(!place){setCepErro('Código postal não encontrado.');showToast('Código postal não encontrado',false);return;}
      const payload:Record<string,unknown>={cep:cepRaw};
      if(place['place name'])payload.cidade=place['place name'];
      const estadoNome=place['state']||'';
      if(estadoNome&&estadoOpts.includes(estadoNome)&&estadoNome!==estado){
        selectEstado(estadoNome);
        payload.estado=estadoNome;
      }
      await onCepData(payload);
      showToast('Cidade preenchida a partir do código postal ✓');
    }catch{setCepErro('Erro ao buscar código postal.');showToast('Erro ao buscar código postal',false);}
    finally{setCepLoading(false);}
  }

  useEffect(()=>{ loadPaisInfo(initPais); },[]);// eslint-disable-line

  async function loadPaisInfo(p:string){
    // Aplica fuso imediatamente do mapa local
    const fusoLocal=FUSO_MAP[p]||'';
    if(fusoLocal)setFuso(fusoLocal);
    try{
      const rows=await sb.query<Record<string,unknown>>('paises_config',`?codigo=eq.${p}&select=*`);
      if(rows[0]){
        const r=rows[0];
        setPaisInfo({tipo_documento:String(r.tipo_documento||t("field.document")),digitos_documento:Number(r.digitos_documento||0),digitos_telefone:Number(r.digitos_telefone||0),moeda:String(r.moeda||'$'),moeda_codigo:String(r.moeda_codigo||'')});
        const f=String(r.fuso_horario||r.timezone||'');
        if(f)setFuso(f); // Supabase tem prioridade sobre o mapa local
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
    setEstadoOpen(false);
    setEstadoOpts(ESTADOS_MAP[first]||[]);
    if(first)loadPaisInfo(first);
    onPaisEstadoChange(first,'');
  }

  function selectPais(p:string){
    setPais(p);
    setPaisOpen(false);
    setPaisInfo(null);
    setEstado('');
    setEstadoOpen(false);
    setEstadoOpts(ESTADOS_MAP[p]||[]);
    loadPaisInfo(p);
    onPaisEstadoChange(p,'');
  }

  function selectEstado(s:string){
    setEstado(s);
    setEstadoOpen(false);
    // Atualiza fuso se o país tiver fusos por estado
    const fusoEstado=FUSO_ESTADO_MAP[pais]?.[s];
    if(fusoEstado)setFuso(fusoEstado);
    onPaisEstadoChange(pais,s);
  }

  const currentIdioma=IDIOMAS.find(i=>i.v===lang);
  const currentPais=paisOpts.find(o=>o.v===pais);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Idioma accordion */}
      <div>
        <label style={labelSt}>{t("field.language")}</label>
        <button onClick={()=>setIdiomaOpen(p=>!p)}
          style={{width:'100%',padding:'10px 14px',border:`1px solid ${idiomaOpen?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:10,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:"'Sora',sans-serif",transition:'all 0.2s'}}>
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
                    style={{padding:'10px 4px',border:`1px solid ${lang===id.v?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:10,background:lang===id.v?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,fontFamily:"'Sora',sans-serif",transition:'all 0.15s',minHeight:52,boxSizing:'border-box'}}>
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
        <label style={labelSt}>{t("field.country")}</label>
        <button onClick={()=>setPaisOpen(p=>!p)}
          style={{width:'100%',padding:'10px 14px',border:`1px solid ${paisOpen?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:10,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:"'Sora',sans-serif",transition:'all 0.2s'}}>
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
                    style={{padding:'9px 12px',border:`1px solid ${pais===o.v?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:8,background:pais===o.v?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>
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
            style={{display:'flex',gap:16,padding:'8px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid rgba(43,122,120,0.35)',fontSize:12,color:'#475569',flexWrap:'wrap'}}>
            <span>📄 {t("field.document")}: <strong>{paisInfo.tipo_documento}</strong> ({paisInfo.digitos_documento} {t("field.digits")})</span>
            <span>📱 {t("field.phone_short")}: <strong>{paisInfo.digitos_telefone} {t("field.digits")}</strong></span>
            <span>💰 {t("field.currency")}: <strong>{paisInfo.moeda}{paisInfo.moeda_codigo?` (${paisInfo.moeda_codigo})`:''}</strong></span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CEP + Estado / Província */}
      <div style={estadoOpts.length>0?{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}:undefined}>
        <div>
          <label style={labelSt}>
            {t("field.postal_code")}
            {cepLoading&&<span style={{marginLeft:8,fontSize:11,color:'#2B7A78'}}>🔍 Buscando...</span>}
          </label>
          <input
            value={cep}
            onChange={e=>setCep(e.target.value)}
            onBlur={e=>buscarCep(e.target.value)}
            placeholder={pais==='br'?'Ex: 01310-100':'Código postal'}
            style={inputSt}
          />
          {cepErro&&<span style={{fontSize:11,color:'#ef4444',marginTop:4,display:'block'}}>{cepErro}</span>}
          {!cepErro&&<span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>
            {pais==='br'?t("field.postal_auto_br"):t("field.postal_auto_intl")}
          </span>}
        </div>
        {estadoOpts.length>0&&(
          <EstadoAccordion estado={estado} estadoOpts={estadoOpts} onSelect={selectEstado}
            estadoOpen={estadoOpen} setEstadoOpen={setEstadoOpen} t={t}/>
        )}
      </div>

      {/* Fuso horário */}
      <div>
        <label style={labelSt}>{t("field.timezone")}</label>
        <input value={fuso} readOnly placeholder="Preenchido automaticamente ao selecionar o país"
          style={{...inputSt,background:'#f8fafc',color:'#64748b',cursor:'default'}}/>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
        {(()=>{
          const precisaEstado=(ESTADOS_MAP[pais]||[]).length>0;
          const estadoValido=!precisaEstado||((ESTADOS_MAP[pais]||[]).includes(estado)&&!!estado);
          const falta=!lang?'Escolha um idioma':!pais?'Escolha um país':(!estadoValido)?'Escolha um estado / província':!fuso?'Fuso horário não identificado':null;
          return falta?(
            <div style={{fontSize:12,color:'#f59e0b',display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'rgba(245,158,11,0.08)',borderRadius:8,border:'1px solid rgba(245,158,11,0.2)'}}>
              <span>⚠️</span> {falta}
            </div>
          ):null;
        })()}
        <button onClick={()=>{
          if(!lang||!pais)return;
          const precisaEstado=(ESTADOS_MAP[pais]||[]).length>0;
          if(precisaEstado&&(!estado||(ESTADOS_MAP[pais]||[]).includes(estado)===false))return;
          onSave({idioma:`${lang}-${pais}`,pais_codigo:pais,pais:PAIS_NOME_PT[pais]||'',fuso_horario:fuso,estado});
          onClose();
        }} disabled={saving} style={saveBtnSt}>{saving?t("procs.saving"):'Salvar Idioma'}</button>
      </div>
    </div>
  );
}

function EstadoAccordion({estado,estadoOpts,onSelect,estadoOpen,setEstadoOpen,t}:{
  estado:string;estadoOpts:string[];onSelect:(s:string)=>void;
  estadoOpen:boolean;setEstadoOpen:(v:boolean)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;
}){
  return(
    <div>
      <label style={labelSt}>{t("field.state_province")}</label>
      <button onClick={()=>setEstadoOpen(!estadoOpen)}
        style={{width:'100%',padding:'10px 14px',border:`1px solid ${estadoOpen?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:10,background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:10,fontFamily:"'Sora',sans-serif",transition:'all 0.2s'}}>
        <span style={{flex:1,fontSize:14,fontWeight:600,color:estado?'#1e293b':'#94a3b8',textAlign:'left'}}>{estado||'Selecione...'}</span>
        <motion.div animate={{rotate:estadoOpen?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8'}}>
          <ChevronDown size={16}/>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {estadoOpen&&(
          <motion.div key="estados" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6,padding:'10px 0 4px',maxHeight:280,overflowY:'auto'}}>
              {estadoOpts.map(s=>(
                <button key={s} onClick={()=>onSelect(s)}
                  style={{padding:'8px 10px',border:`1px solid ${estado===s?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:8,background:estado===s?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',fontSize:12,fontWeight:estado===s?600:400,color:estado===s?'#2B7A78':'#475569',fontFamily:"'Sora',sans-serif",transition:'all 0.15s',textAlign:'left'}}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SECRETARIA SECTION ──────────────────────────────────────────────────────────
function getPersonalidadesList(t:(key:TranslationKey,vars?:Record<string,string|number>)=>string) {
  return [
    {v:'acolhedora', icon:'🤗', label:t("personality.warm"),       sub:t("personality.warm_desc")},
    {v:'executiva',  icon:'💼', label:t("personality.executive"),  sub:t("personality.executive_desc")},
    {v:'moderna',    icon:'✨', label:t("personality.modern"),     sub:t("personality.modern_desc")},
    {v:'objetiva',   icon:'🎯', label:t("personality.objective"),  sub:t("personality.objective_desc")},
  ];
}

const EVOLUTION_CONNECT_URL='https://singingdugong-n8n.cloudfy.live/webhook/iris-connect-evolution';

function SecretariaSection({clinica,prefixo,saving,onSave,t}:{clinica:Clinica;prefixo:string;saving:boolean;onSave:(d:Record<string,unknown>)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const [nome,setNome]=useState(clinica.nome_agente||'');
  const [pers,setPers]=useState(clinica.personalidade||'');
  const [tel,setTel]=useState(clinica.telefone_agente||'');
  const PERSONALIDADES_LIST = getPersonalidadesList(t);
  // Instância: só dígitos sem DDI e DDD
  const telDigits=tel.replace(/\D/g,'');
  const telSemDDI=telDigits.length>9?telDigits.slice(-9):telDigits;
  const instancia=telSemDDI?`CAPPIA-IRIS-${telSemDDI}`:'';

  type WStep='idle'|'loading'|'qr'|'conectado'|'erro';
  const [wStep,setWStep]=useState<WStep>('idle');
  const [qrData,setQrData]=useState('');
  const [wErr,setWErr]=useState('');

  async function conectarWhatsApp(){
    setWStep('loading');setWErr('');setQrData('');
    try{
      const res=await fetch(EVOLUTION_CONNECT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clinica_id:clinica.id})});
      const data=await res.json();
      if(data.step==='qr'){setQrData(data.qr||'');setWStep('qr');}
      else if(data.step==='conectado'){setWStep('conectado');}
      else if(data.step==='erro'){setWErr(data.mensagem||data.error||'Erro ao conectar');setWStep('erro');}
      else{setWErr('Resposta inesperada do servidor');setWStep('erro');}
    }catch{setWErr('Não foi possível conectar ao servidor');setWStep('erro');}
  }

  const labelTel=nome?t("field.agent_phone",{nome}):t("field.agent_phone_default");

  const falta=!nome?t("secretaria.validation_name"):!pers?t("secretaria.validation_personality"):!tel?t("secretaria.validation_phone"):null;

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Linha 1: Nome + Personalidade cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <label style={labelSt}>{t("field.agent_name")}</label>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Iris, Sofia, Ana..." style={inputSt}/>
          <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.agent_name_hint")}</span>
        </div>
        <div>
          <label style={labelSt}>{t("field.personality")}</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
            {PERSONALIDADES_LIST.map(p=>(
              <button key={p.v} onClick={()=>setPers(p.v)}
                style={{padding:'10px 8px',border:`1px solid ${pers===p.v?'#2B7A78':'rgba(43,122,120,0.35)'}`,borderRadius:9,background:pers===p.v?'rgba(43,122,120,0.08)':'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <span style={{fontSize:11,fontWeight:600,color:pers===p.v?'#2B7A78':'#475569',textAlign:'center'}}>{p.label}</span>
                <span style={{fontSize:10,color:'#94a3b8',textAlign:'center',lineHeight:1.2}}>{p.sub}</span>
                {pers===p.v&&<Check size={10} color="#2B7A78"/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Linha 2: Telefone + Instância (empilhados em coluna) */}
      <div>
        <label style={labelSt}>{labelTel}</label>
        <div style={{display:'flex',border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,overflow:'hidden',background:'#fff',width:'100%'}}>
          <span style={{padding:'10px 10px',background:'#f1f5f9',borderRight:'1px solid rgba(43,122,120,0.35)',fontFamily:'monospace',fontSize:13,color:'#2B7A78',whiteSpace:'nowrap',flexShrink:0}}>{prefixo}</span>
          <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="999999999"
            style={{flex:1,minWidth:0,padding:'10px',fontSize:13,border:'none',outline:'none',fontFamily:"'Sora',sans-serif",width:'100%',textAlign:'left',direction:'ltr'}}/>
        </div>
        {/* Instância sempre visível logo abaixo */}
        <div style={{marginTop:8}}>
          <label style={{...labelSt,marginBottom:6,display:'block'}}>{t("field.whatsapp_instance")}</label>
        <div style={{display:'flex',border:'1px solid #DEF2F1',borderRadius:8,background:'#f0fdf9',width:'100%',boxSizing:'border-box'}}>
            <span style={{padding:'10px 10px',background:'#DEF2F1',borderRight:'1px solid #c8ebe9',fontFamily:'monospace',fontSize:12,color:'#2B7A78',whiteSpace:'nowrap',flexShrink:0}}>CAPPIA-IRIS-</span>
            <input value={telSemDDI||''} readOnly
              style={{flex:1,minWidth:0,padding:'10px',fontSize:13,border:'none',outline:'none',fontFamily:'monospace',background:'#f0fdf9',color:'#2B7A78',fontWeight:700,width:'100%',boxSizing:'border-box'}}/>
          </div>
          <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.whatsapp_instance_format")}</span>
        </div>
      </div>

      {/* Validação + Salvar */}
      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
        {falta&&(
          <div style={{fontSize:12,color:'#f59e0b',display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'rgba(245,158,11,0.08)',borderRadius:8,border:'1px solid rgba(245,158,11,0.2)'}}>
            <span>⚠️</span> {falta}
          </div>
        )}
        <button onClick={()=>{
          if(falta)return;
          onSave({nome_agente:nome,personalidade:pers,telefone_agente:tel,whatsapp_instancia:instancia});
        }} disabled={saving||!!falta}
          style={{...saveBtnSt,opacity:falta?0.5:1,cursor:falta?'not-allowed':'pointer'}}>
          {saving?t("procs.saving"):t("secretaria.btn_save")}
        </button>
      </div>

      {/* WhatsApp QR */}
      <div style={{borderTop:'1px solid #f1f5f9',paddingTop:16,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>WhatsApp</div>
            <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>Conecte o número da Iris ao WhatsApp</div>
          </div>
          {wStep==='conectado'?(
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8}}>
              <span style={{fontSize:13}}>✅</span>
              <span style={{fontSize:12,fontWeight:600,color:'#15803d'}}>Conectado</span>
            </div>
          ):(
            <button onClick={conectarWhatsApp} disabled={wStep==='loading'}
              style={{padding:'8px 16px',background:'#25D366',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:wStep==='loading'?'not-allowed':'pointer',fontFamily:"'Sora',sans-serif",opacity:wStep==='loading'?0.7:1,display:'flex',alignItems:'center',gap:6,transition:'opacity 0.15s'}}>
              <span style={{fontSize:15}}>📱</span>
              {wStep==='loading'?'Aguardando...':'Conectar WhatsApp'}
            </button>
          )}
        </div>

        {wStep==='qr'&&qrData&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'16px 12px',background:'#f8fafc',borderRadius:10,border:'1px solid rgba(43,122,120,0.2)'}}>
            <div style={{fontSize:12,color:'#64748b',textAlign:'center'}}>Escaneie o QR Code com o WhatsApp do número da Iris</div>
            <img src={qrData} alt="QR Code WhatsApp" style={{width:200,height:200,borderRadius:8,border:'2px solid #e2e8f0'}}/>
            <button onClick={conectarWhatsApp}
              style={{padding:'7px 16px',background:'rgba(43,122,120,0.1)',color:'#2B7A78',border:'1px solid rgba(43,122,120,0.3)',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif"}}>
              Verificar se conectou
            </button>
          </div>
        )}

        {wStep==='erro'&&(
          <div style={{padding:'10px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>❌</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:'#dc2626'}}>Erro ao conectar</div>
              <div style={{fontSize:11,color:'#ef4444',marginTop:2}}>{wErr}</div>
            </div>
            <button onClick={conectarWhatsApp}
              style={{padding:'6px 12px',background:'#dc2626',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif",flexShrink:0}}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CLINICA SECTION ────────────────────────────────────────────────────────────
function ClinicaSection({clinica,prefixo,estados,saving,onSave,onClose,t}:{clinica:Clinica;prefixo:string;estados:string[];saving:boolean;onSave:(d:Record<string,unknown>)=>void;onClose:()=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const c=clinica as unknown as Record<string,string>;
  const estadoSalvo=c.estado||'';

  // Cidade: lista de cidades do estado ou campo livre
  const cidadesSP=['São Paulo','Campinas','Santos','Ribeirão Preto','Sorocaba','Osasco','São Bernardo do Campo','Santo André','Guarulhos','Mauá','São Caetano do Sul','Diadema','Mogi das Cruzes','Piracicaba','Bauru'];
  const cidadesRJ=['Rio de Janeiro','Niterói','Duque de Caxias','Nova Iguaçu','São Gonçalo','Petrópolis','Volta Redonda','Campos dos Goytacazes','Macaé','Cabo Frio'];
  const cidadesBsB=['Brasília','Ceilândia','Taguatinga','Samambaia','Gama','Sobradinho','Planaltina','Núcleo Bandeirante'];
  const cidadesPorEstado: Record<string,string[]> = {
    'São Paulo':cidadesSP,'Rio de Janeiro':cidadesRJ,'Distrito Federal':cidadesBsB,
  };
  const cidadesOpts=cidadesPorEstado[estadoSalvo]||[];

  const [vals,setVals]=useState({
    nome:clinica.nome||'',
    endereco:c.endereco||'',
    sala:c.sala||'',
    bairro:c.bairro||'',
    cidade:c.cidade||'',
    cep:c.cep||'',
    referencia:c.referencia||'',
    email_clinica:c.email_clinica||c.email||'',
    whatsapp_admin:c.whatsapp_admin||'',
    maps_link:c.maps_link||c.google_maps||'',
  });
  const set=(k:string,v:string)=>setVals(p=>({...p,[k]:v}));

  const hfRaw=(clinica as unknown as Record<string,unknown>).horario_funcionamento;
  const [horario,setHorario]=useState<HorarioFunc>(
    hfRaw&&typeof hfRaw==='object' ? {...HORARIO_DEFAULT,...(hfRaw as Partial<HorarioFunc>)} : HORARIO_DEFAULT
  );
  function setHorarioField(dia:keyof HorarioFunc, field:string, value:string|boolean){
    setHorario(p=>({...p,[dia]:{...(p[dia] as object),[field]:value}} as HorarioFunc));
  }

  const [cidadeSel,setCidadeSel]=useState(()=>{
    if(!c.cidade) return '';
    if(cidadesOpts.includes(c.cidade)) return c.cidade;
    return cidadesOpts.length>0 ? '__outra__' : c.cidade;
  });

  // Reflete dados preenchidos pela busca de CEP em Idioma & Localização
  useEffect(()=>{
    setVals(p=>({...p, cep:c.cep||p.cep, endereco:c.endereco||p.endereco, bairro:c.bairro||p.bairro, cidade:c.cidade||p.cidade}));
    if(c.cidade){
      setCidadeSel(cidadesOpts.includes(c.cidade) ? c.cidade : (cidadesOpts.length>0 ? '__outra__' : c.cidade));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[c.cep,c.endereco,c.bairro,c.cidade]);

  function useGeo(){
    if(!navigator.geolocation){alert('Geolocalização não suportada');return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      set('maps_link',`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
    },()=>alert('Não foi possível obter localização'));
  }

  const obrigatorios:[string,string][]=[
    ['nome',t("field.clinic_name")],['endereco',t("field.address")],['bairro',t("field.neighborhood")],
    ['cidade',t("field.city")],['cep',t("field.postal_code")],
    ['email_clinica',t("field.email")],['whatsapp_admin',t("field.admin_whatsapp")],
    ['maps_link',t("field.maps_link")],
  ];
  const falta=obrigatorios.find(([k])=>!(vals as Record<string,string>)[k]?.trim());

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* L1: Nome da Clínica */}
      <div>
        <label style={labelSt}>{t("field.clinic_name")}</label>
        <input value={vals.nome} onChange={e=>set('nome',e.target.value)} placeholder="Ex: Cleandent" style={inputSt}/>
      </div>

      {/* L2: Endereço */}
      <div>
        <label style={labelSt}>{t("field.address")}</label>
        <input value={vals.endereco} onChange={e=>set('endereco',e.target.value)} placeholder="Ex: Av. Paulista, 1234" style={inputSt}/>
      </div>

      {/* L3: Sala + Bairro */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div>
          <label style={labelSt}>{t("field.room")} <span style={{color:'#94a3b8',fontWeight:400}}>({t("field.optional")})</span></label>
          <input value={vals.sala} onChange={e=>set('sala',e.target.value)} placeholder="Ex: 3º andar, Sala 302" style={inputSt}/>
        </div>
        <div>
          <label style={labelSt}>{t("field.neighborhood")}</label>
          <input value={vals.bairro} onChange={e=>set('bairro',e.target.value)} placeholder="Ex: Centro" style={inputSt}/>
        </div>
      </div>

      {/* L4: Cidade */}
      <div>
        <label style={labelSt}>{t("field.city")}</label>
        {cidadesOpts.length>0?(
          <select value={cidadeSel} onChange={e=>{
            const v=e.target.value;
            setCidadeSel(v);
            set('cidade', v==='__outra__'?'':v);
          }} style={inputSt}>
            <option value="">{t("field.select_city")}</option>
            {cidadesOpts.map(ci=><option key={ci} value={ci}>{ci}</option>)}
            <option value="__outra__">{t("field.other_city")}</option>
          </select>
        ):(
          <input value={vals.cidade} onChange={e=>set('cidade',e.target.value)} placeholder="Ex: São Paulo" style={inputSt}/>
        )}
        {cidadeSel==='__outra__'&&(
          <input value={vals.cidade} onChange={e=>set('cidade',e.target.value)}
            placeholder={t("field.city_name")} style={{...inputSt,marginTop:8}} autoFocus/>
        )}
      </div>

      {/* L5: Referência */}
      <div>
        <label style={labelSt}>{t("field.reference")} <span style={{color:'#94a3b8',fontWeight:400}}>({t("field.optional")})</span></label>
        <input value={vals.referencia} onChange={e=>set('referencia',e.target.value)} placeholder="Ex: Em frente ao Banco do Brasil" style={inputSt}/>
      </div>

      {/* L6: Email */}
      <div>
        <label style={labelSt}>{t("field.email")}</label>
        <input type="email" value={vals.email_clinica} onChange={e=>set('email_clinica',e.target.value)} placeholder="clinica@exemplo.com" style={inputSt}/>
      </div>

      {/* L7: Estado (somente leitura — vem do Idioma) */}
      <div>
        <label style={labelSt}>{t("field.state_province")}</label>
        <input value={estadoSalvo} readOnly
          style={{...inputSt,background:'#f8fafc',color:'#64748b',cursor:'default'}}/>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.state_defined_in_locale")}</span>
      </div>

      {/* L7.5: Horário de Funcionamento */}
      <div>
        <label style={labelSt}>{t("field.working_hours")}</label>
        <div style={{display:'flex',flexDirection:'column',gap:12,padding:12,border:'1px solid rgba(43,122,120,0.35)',borderRadius:10,background:'#f8fafc'}}>

          {/* Segunda a sexta */}
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'#475569',marginBottom:6}}>{t("dentist.sub_weekdays")}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <input type="time" value={horario.seg_sex.inicio} onChange={e=>setHorarioField('seg_sex','inicio',e.target.value)} style={inputSt}/>
              <input type="time" value={horario.seg_sex.fim} onChange={e=>setHorarioField('seg_sex','fim',e.target.value)} style={inputSt}/>
            </div>
          </div>

          {/* Intervalo de almoço */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:horario.almoco.ativo?6:0}}>
              <span style={{fontSize:12,fontWeight:600,color:'#475569'}}>{t("field.lunch_break")}</span>
              <Toggle on={horario.almoco.ativo} onChange={v=>setHorarioField('almoco','ativo',v)}/>
            </div>
            {horario.almoco.ativo&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <input type="time" value={horario.almoco.inicio} onChange={e=>setHorarioField('almoco','inicio',e.target.value)} style={inputSt}/>
                <input type="time" value={horario.almoco.fim} onChange={e=>setHorarioField('almoco','fim',e.target.value)} style={inputSt}/>
              </div>
            )}
          </div>

          {/* Sábado */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:horario.sabado.ativo?6:0}}>
              <span style={{fontSize:12,fontWeight:600,color:'#475569'}}>{t("field.saturday")}</span>
              <Toggle on={horario.sabado.ativo} onChange={v=>setHorarioField('sabado','ativo',v)}/>
            </div>
            {horario.sabado.ativo&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <input type="time" value={horario.sabado.inicio} onChange={e=>setHorarioField('sabado','inicio',e.target.value)} style={inputSt}/>
                <input type="time" value={horario.sabado.fim} onChange={e=>setHorarioField('sabado','fim',e.target.value)} style={inputSt}/>
              </div>
            )}
          </div>

          {/* Domingo */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:horario.domingo.ativo?6:0}}>
              <span style={{fontSize:12,fontWeight:600,color:'#475569'}}>{t("field.sunday")}</span>
              <Toggle on={horario.domingo.ativo} onChange={v=>setHorarioField('domingo','ativo',v)}/>
            </div>
            {horario.domingo.ativo&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <input type="time" value={horario.domingo.inicio} onChange={e=>setHorarioField('domingo','inicio',e.target.value)} style={inputSt}/>
                <input type="time" value={horario.domingo.fim} onChange={e=>setHorarioField('domingo','fim',e.target.value)} style={inputSt}/>
              </div>
            )}
          </div>

        </div>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.working_hours_hint")}</span>
      </div>

      {/* L8: WhatsApp do administrador */}
      <div>
        <label style={labelSt}>{t("field.admin_whatsapp")}</label>
        <div style={{display:'flex',border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,overflow:'hidden'}}>
          <span style={{padding:'10px 10px',background:'#f1f5f9',borderRight:'1px solid rgba(43,122,120,0.35)',fontFamily:'monospace',fontSize:13,color:'#2B7A78',whiteSpace:'nowrap'}}>{prefixo}</span>
          <input value={vals.whatsapp_admin} onChange={e=>set('whatsapp_admin',e.target.value)} placeholder="21999990000"
            style={{flex:1,padding:'10px',fontSize:13,border:'none',outline:'none',fontFamily:"'Sora',sans-serif"}}/>
        </div>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.admin_whatsapp_hint")}</span>
      </div>

      {/* L9: Link Maps + botão geo */}
      <div>
        <label style={labelSt}>{t("field.maps_link")}</label>
        <input value={vals.maps_link} onChange={e=>set('maps_link',e.target.value)}
          placeholder="https://maps.google.com/?q=..." style={inputSt}/>
        <button onClick={useGeo}
          style={{marginTop:8,width:'100%',padding:'10px',borderRadius:8,border:'1px solid rgba(43,122,120,0.35)',background:'#f8fafc',fontSize:13,color:'#2B7A78',cursor:'pointer',fontFamily:"'Sora',sans-serif",fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          📍 {t("field.use_my_location")}
        </button>
        <span style={{fontSize:11,color:'#94a3b8',marginTop:4,display:'block'}}>{t("field.maps_link_hint")}</span>
      </div>

      {/* Validação + Salvar */}
      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
        {falta&&(
          <div style={{fontSize:12,color:'#f59e0b',display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'rgba(245,158,11,0.08)',borderRadius:8,border:'1px solid rgba(245,158,11,0.2)'}}>
            <span>⚠️</span> {t("clinica.validation_complete_field",{campo:falta[1]})}
          </div>
        )}
        <button onClick={()=>{if(!falta){onSave({...vals,horario_funcionamento:horario});onClose();}}} disabled={saving||!!falta}
          style={{...saveBtnSt,opacity:falta?0.5:1,cursor:falta?'not-allowed':'pointer'}}>
          {saving?t("procs.saving"):t("clinica.btn_save")}
        </button>
      </div>
    </div>
  );
}

// ── DENTISTAS SECTION ──────────────────────────────────────────────────────────
function DentistasSection({clinica,ddi,onSaveOne,onSaveAll,saving,onClose,t}:{
  clinica:Clinica;ddi:string;
  onSaveOne:(i:number,dents:Dentista[])=>Promise<void>;
  onSaveAll:(dents:Dentista[])=>Promise<void>;
  saving:boolean;onClose:()=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;
}){
  const base=Array.isArray(clinica.dentistas)?clinica.dentistas:[];
  const [dents,setDents]=useState<Dentista[]>(()=>
    Array.from({length:10},(_,i)=>base[i]||{nome:'',titulo:'Dr.',calendar_id:'',senha:'',ativo:false,inicio:'08:00',fim:'18:00',dur:60,alm_ini:'12:00',alm_fim:'13:00',sabado:false,sab_ini:'08:00',sab_fim:'13:00',horarios:'',modo:'auto',whatsapp:'',procedimentos:[]})
  );
  const [open,setOpen]=useState<number|null>(null);
  const [savingIdx,setSavingIdx]=useState<number|null>(null);

  function upd(i:number,data:Partial<Dentista>){setDents(prev=>prev.map((d,j)=>j===i?{...d,...data}:d));}

  async function saveOne(i:number,patch?:Partial<Dentista>){
    setSavingIdx(i);
    const toSave=patch?dents.map((d,j)=>j===i?{...d,...patch}:d):dents;
    await onSaveOne(i,toSave);
    setSavingIdx(null);
  }

  const ativos=dents.filter(d=>d?.ativo).length;

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:12,color:'#94a3b8'}}>{t("dentist.active_count",{n:ativos})}</span>
      </div>
      {dents.map((d,i)=>(
        <DentistaCard key={i} d={d} i={i} open={open===i} onToggle={()=>setOpen(p=>p===i?null:i)}
          onUpdate={(data)=>upd(i,data)} ddi={ddi} onSave={(patch)=>saveOne(i,patch)} saving={savingIdx===i} clinicaId={clinica.id} nomeAgente={clinica.nome_agente||'Iris'} t={t}/>
      ))}
      <button onClick={onClose} onMouseDown={e=>e.preventDefault()}
        style={{marginTop:16,width:'100%',padding:'11px',border:'1px solid #cbd5e1',borderRadius:10,background:'#f1f5f9',cursor:'pointer',fontSize:13,fontWeight:700,color:'#475569',fontFamily:"'Sora',sans-serif",letterSpacing:'0.2px'}}>
        {t("dentist.btn_close_all")}
      </button>
    </div>
  );
}

function DentistaCard({d,i,open,onToggle,onUpdate,ddi,onSave,saving,clinicaId,nomeAgente,t}:{
  d:Dentista;i:number;open:boolean;onToggle:()=>void;
  onUpdate:(data:Partial<Dentista>)=>void;ddi:string;onSave:(patch?:Partial<Dentista>)=>Promise<void>;saving:boolean;clinicaId:string;nomeAgente:string;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;
}){
  const semAlmoco = d.alm_ini === d.alm_fim;
  const slots=d.modo==='auto'?calcSlots(d.inicio||'08:00',d.fim||'18:00',d.dur||60,semAlmoco?'00:00':(d.alm_ini||'12:00'),semAlmoco?'00:00':(d.alm_fim||'13:00')):[];
  const nomeLabel=d.nome?`${d.titulo||'Dr.'} ${d.nome}`:t("dentist.label_n",{n:i+1});
  const allComplete=!!d.nome?.trim()&&!!d.whatsapp?.trim()&&!!d.senha?.trim()&&
    !!d.calendar_id?.trim()&&
    !!d.inicio&&!!d.fim&&(d.procedimentos||[]).some((p:{ativo:boolean})=>p.ativo);
  const dotColor=!d.ativo?'#e2e8f0':allComplete?'#10b981':'#f59e0b';
  const [openSub,setOpenSub]=useState<'dados'|'horarios'|'calendario'|'especialidades'|null>(null);
  const [showQR,setShowQR]=useState(false);
  const qrUrl=typeof window!=='undefined'?`${window.location.origin}/dentista/${clinicaId}/${i}?t=${encodeURIComponent(d.senha||'')}`:`/dentista/${clinicaId}/${i}`;

  const [showSenha,setShowSenha]=useState(false);
  const [calToggleErrMsg,setCalToggleErrMsg]=useState('');
  const [calValidating,setCalValidating]=useState(false);
  const [calValResult,setCalValResult]=useState<{valido:boolean;tipo?:string;calendar_name:string;timezone:string;motivo:string}|null>(null);
  const [btnErrMsg,setBtnErrMsg]=useState('');
  const [calValidated,setCalValidated]=useState(d.ativo);
  const [showProcWarn,setShowProcWarn]=useState(false);
  const [showCalVideo,setShowCalVideo]=useState(false);
  const calInputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(d.calendar_id?.trim()){setCalToggleErrMsg('');setCalValResult(null);setCalValidated(false);}},[d.calendar_id]);

  async function handleSave(){
    const faltam:string[]=[];
    if(!d.nome?.trim()) faltam.push('Nome');
    if(!d.whatsapp?.trim()) faltam.push('WhatsApp');
    if(!d.senha?.trim()) faltam.push('Senha');
    if(!d.calendar_id?.trim()) faltam.push('Calendar ID');
    if(!d.inicio) faltam.push('Horário início');
    if(!d.fim) faltam.push('Horário fim');
    if(!(d.procedimentos||[]).some((p:{ativo:boolean})=>p.ativo))
      faltam.push('Especialidade');
    if(faltam.length>0){
      setBtnErrMsg('Falta: '+faltam.join(' · '));
      setTimeout(()=>setBtnErrMsg(''),3500);
      return;
    }
    setBtnErrMsg('');
    setCalValidating(true);
    setCalValResult(null);
    console.log('[IRIS] Validando calendar_id:', d.calendar_id, '→', N8N_VALIDATE_CALENDAR_URL);
    let calOk = false;
    try{
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),10000);
      const res=await fetch(N8N_VALIDATE_CALENDAR_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({calendar_id:d.calendar_id}),
        signal:ctrl.signal,
      });
      clearTimeout(timer);
      const data=await res.json();
      console.log('[IRIS] Resposta n8n:', data);
      setCalValResult(data);
      setCalValidating(false);
      calOk = data.valido === true;
      if(!calOk){
        const msg=(data.motivo||'Calendar inválido').slice(0,60);
        setBtnErrMsg('Erro: '+msg);
        setTimeout(()=>setBtnErrMsg(''),4000);
      }
    }catch(err){
      console.error('[IRIS] Erro ao validar calendar:', err);
      setCalValidating(false);
      setCalValResult({valido:false,calendar_name:'',timezone:'',motivo:'Não foi possível verificar a agenda agora. Tente novamente em alguns segundos.'});
      setBtnErrMsg('Erro: Não foi possível verificar a agenda');
      setTimeout(()=>setBtnErrMsg(''),4000);
    }
    if(!calOk){
      onUpdate({ativo:false});
      setCalValidated(false);
      if(!open)onToggle();
      setTimeout(()=>calInputRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),350);
      return;
    }
    setCalValidated(true);
    setCalToggleErrMsg('');
    onUpdate({ativo:true});
    await onSave({ativo:true});
    setOpenSub(null);
  }

  return(
    <div style={{borderRadius:10,overflow:'hidden',marginBottom:8,border:`1px solid ${d.ativo?'rgba(43,122,120,0.5)':'rgba(43,122,120,0.25)'}`,borderLeft:d.ativo?'4px solid #2B7A78':'4px solid rgba(43,122,120,0.2)',boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
      <motion.div whileTap={{y:3}} onClick={onToggle} style={{width:'100%',padding:'12px 14px',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:10,textAlign:'left'}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:dotColor,flexShrink:0,transition:'background 0.3s'}}/>
        {d.nome?(
          <div style={{display:'flex',flexDirection:'column',lineHeight:1.25}}>
            <span style={{fontSize:9,fontWeight:600,color:'#64748b',opacity:0.5,letterSpacing:'2px',textTransform:'uppercase'}}>{t("dentist.label")}</span>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{`${d.titulo||'Dr.'} ${d.nome}`}</span>
              {allComplete&&<span style={{fontSize:13,color:'#10b981',fontWeight:700,lineHeight:1}}>✓</span>}
            </div>
          </div>
        ):(
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{t("dentist.label_n",{n:i+1})}</span>
            {allComplete&&<span style={{fontSize:13,color:'#10b981',fontWeight:700,lineHeight:1}}>✓</span>}
          </div>
        )}
        <div style={{flex:1}}/>
        <div onClick={e=>e.stopPropagation()}><Toggle on={d.ativo} onChange={v=>{
          if(v&&!d.calendar_id?.trim()){setCalToggleErrMsg('Preencha o Google Calendar ID antes de ativar este dentista.');return;}
          if(v&&!calValidated){setCalToggleErrMsg('Salve o dentista com sucesso antes de ativar.');return;}
          setCalToggleErrMsg('');onUpdate({ativo:v});
        }}/></div>
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8',flexShrink:0,marginLeft:4}}>
          <ChevronDown size={14}/>
        </motion.div>
      </motion.div>

      {calToggleErrMsg&&(
        <div style={{margin:'0 14px 8px',padding:'8px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:6,fontSize:11,color:'#dc2626',fontWeight:500}}>
          {calToggleErrMsg}
        </div>
      )}
      <AnimatePresence initial={false}>
        {open&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{padding:'14px',borderTop:'1px solid #f1f5f9',display:'flex',flexDirection:'column',gap:12}}>
              <SubBloco titulo={t("dentist.subbloco_dados")} nomeDentista={nomeLabel} open={openSub==='dados'} onToggle={()=>setOpenSub(p=>p==='dados'?null:'dados')}>
              {/* Nome */}
              <div style={{display:'grid',gridTemplateColumns:'56px 1fr',gap:8}}>
                <div>
                  <label style={labelSt}>{t("field.dentist_title")}</label>
                  <select value={d.titulo||'Dr.'} onChange={e=>onUpdate({titulo:e.target.value})} style={inputSt}>
                    <option>Dr.</option><option>Dra.</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}>{t("field.dentist_name")}</label>
                  <input value={d.nome||''} onChange={e=>onUpdate({nome:e.target.value})} placeholder="Nome completo" style={inputSt}/>
                </div>
              </div>
              <div>
                <label style={labelSt}>{t("field.phone")}</label>
                <div style={{display:'flex',border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,overflow:'hidden',background:'#fff',width:'100%'}}>
                  <span style={{padding:'10px 8px',background:'#f1f5f9',borderRight:'1px solid rgba(43,122,120,0.35)',fontFamily:'monospace',fontSize:12,color:'#2B7A78',whiteSpace:'nowrap',flexShrink:0}}>{ddi}</span>
                  <input value={d.whatsapp||''} onChange={e=>onUpdate({whatsapp:e.target.value})} placeholder="999999999"
                    style={{flex:1,minWidth:0,padding:'10px',fontSize:13,border:'none',outline:'none',width:'100%',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div>
                <label style={labelSt}>{t("dentist.password_for",{nome:nomeLabel})}</label>
                <div style={{display:'flex',border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,overflow:'hidden',background:'#fff',width:'100%'}}>
                  <input type={showSenha?'text':'password'} value={d.senha||''} onChange={e=>onUpdate({senha:e.target.value})} placeholder="••••••"
                    style={{flex:1,minWidth:0,padding:'10px 12px',fontSize:13,border:'none',outline:'none',background:'transparent',fontFamily:"'Sora',sans-serif",boxSizing:'border-box'}}/>
                  <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>setShowSenha(p=>!p)}
                    style={{padding:'0 12px',border:'none',background:'transparent',cursor:'pointer',color:'#94a3b8',flexShrink:0,display:'flex',alignItems:'center'}}>
                    {showSenha?<EyeOff size={16}/>:<Eye size={16}/>}
                  </button>
                </div>
              </div>
              </SubBloco>
              <SubBloco titulo={t("dentist.subbloco_horarios")} nomeDentista={nomeLabel} open={openSub==='horarios'} onToggle={()=>setOpenSub(p=>p==='horarios'?null:'horarios')}>
              {/* Linha 1: Abertura + Encerramento */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={labelSt}>{t("field.open_time")}</label>
                  <input type="time" value={d.inicio||'08:00'} onChange={e=>onUpdate({inicio:e.target.value})} style={inputSt}/>
                </div>
                <div>
                  <label style={labelSt}>{t("field.close_time")}</label>
                  <input type="time" value={d.fim||'18:00'} onChange={e=>onUpdate({fim:e.target.value})} style={inputSt}/>
                </div>
              </div>
              {/* Linha 2: Almoço */}
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <label style={{...labelSt,marginBottom:0}}>{t("dentist.lunch_label")}</label>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <span style={{fontSize:11,color:semAlmoco?'#94a3b8':'#2B7A78',fontWeight:600,transition:'color 0.2s'}}>
                      {semAlmoco?t("dentist.no_lunch"):t("dentist.has_lunch")}
                    </span>
                    <Toggle
                      on={!semAlmoco}
                      onChange={v=>onUpdate(v
                        ?{alm_ini:'12:00',alm_fim:'13:00'}
                        :{alm_ini:'00:00',alm_fim:'00:00'})}/>
                  </div>
                </div>
                {semAlmoco?(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {[t("dentist.start"),t("dentist.end")].map(l=>(
                      <div key={l} style={{...inputSt,display:'flex',alignItems:'center',justifyContent:'center',
                        color:'#cbd5e1',background:'#f8fafc',userSelect:'none',cursor:'default',
                        fontWeight:700,fontSize:16,letterSpacing:2}}>—</div>
                    ))}
                  </div>
                ):(
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={labelSt}>{t("dentist.start")}</label>
                      <input type="time" value={d.alm_ini||'12:00'} onChange={e=>onUpdate({alm_ini:e.target.value})} style={inputSt}/>
                    </div>
                    <div>
                      <label style={labelSt}>{t("dentist.end")}</label>
                      <input type="time" value={d.alm_fim||'13:00'} onChange={e=>onUpdate({alm_fim:e.target.value})} style={inputSt}/>
                    </div>
                  </div>
                )}
              </div>
              {/* Linha 3: Atende Sábado toggle */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0'}}>
                <label style={{...labelSt,marginBottom:0}}>{t("dentist.works_saturday")}</label>
                <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
                  <span style={{fontSize:12,fontWeight:600,color:!d.sabado?'#2B7A78':'#94a3b8',transition:'color 0.2s'}}>{t("dentist.no")}</span>
                  <Toggle on={!!d.sabado} onChange={v=>onUpdate({sabado:v})}/>
                  <span style={{fontSize:12,fontWeight:600,color:d.sabado?'#2B7A78':'#94a3b8',transition:'color 0.2s'}}>{t("dentist.yes")}</span>
                </div>
              </div>
              {/* Linha 4: Horários de sábado (condicional) */}
              {d.sabado&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:12,background:'#f8fafc',borderRadius:8}}>
                  <div>
                    <label style={labelSt}>{t("field.saturday_open")}</label>
                    <input type="time" value={d.sab_ini||'08:00'} onChange={e=>onUpdate({sab_ini:e.target.value})} style={inputSt}/>
                  </div>
                  <div>
                    <label style={labelSt}>{t("field.saturday_close")}</label>
                    <input type="time" value={d.sab_fim||'13:00'} onChange={e=>onUpdate({sab_fim:e.target.value})} style={inputSt}/>
                  </div>
                </div>
              )}
              {/* Modo horários */}
              <div>
                <label style={{...labelSt,textAlign:'center',display:'block'}}>{t("field.schedule_mode")}</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,padding:4,background:'#f1f5f9',borderRadius:8,width:'100%',boxSizing:'border-box'}}>
                  {(['auto','manual'] as const).map(m=>(
                    <button key={m} onClick={()=>onUpdate({modo:m})}
                      style={{padding:'7px 6px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif",textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                        background:d.modo===m?'#2B7A78':'transparent',color:d.modo===m?'#fff':'#64748b',transition:'all 0.2s'}}>
                      {m==='auto'?`⚡ ${t("dentist.mode_auto")}`:`✏️ ${t("dentist.mode_manual")}`}
                    </button>
                  ))}
                  <button
                    onClick={()=>{setShowProcWarn(true);setTimeout(()=>setShowProcWarn(false),3500);}}
                    style={{padding:'7px 6px',borderRadius:6,border:'1px dashed #cbd5e1',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'Sora',sans-serif",textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                      background:'transparent',color:'#94a3b8',transition:'all 0.2s',opacity:0.7}}>
                    {`📋 ${t("dentist.mode_procedure")}`}
                  </button>
                </div>
                {d.modo==='auto'&&(
                  <div style={{marginTop:8,padding:'8px 10px',background:'rgba(43,122,120,0.06)',borderRadius:6,fontSize:11,color:'#2B7A78',lineHeight:1.5}}>
                    {t("dentist.mode_auto_desc")}
                  </div>
                )}
                {d.modo==='manual'&&(
                  <div style={{marginTop:8,padding:'8px 10px',background:'rgba(43,122,120,0.06)',borderRadius:6,fontSize:11,color:'#2B7A78',lineHeight:1.5}}>
                    {t("dentist.mode_manual_desc")}
                  </div>
                )}
                {showProcWarn&&(
                  <div style={{marginTop:6,padding:'7px 10px',background:'#fef9c3',border:'1px solid #fde047',borderRadius:6,fontSize:11,color:'#854d0e',display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:13}}>🚧</span>
                    <span><strong>Modo por procedimentos</strong> — Em desenvolvimento, disponível em breve.</span>
                  </div>
                )}
              </div>
              {d.modo==='auto'&&(
                <div>
                  <label style={labelSt}>{t("field.duration_min")}</label>
                  <input type="number" value={d.dur||60} onChange={e=>onUpdate({dur:parseInt(e.target.value)||60})} min={5} step={5}
                    style={{...inputSt,width:100}}/>
                  <div style={{marginTop:8,fontSize:11,color:'#64748b',marginBottom:6}}>{t("field.generated_slots")}:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {slots.map(s=><span key={s} style={{padding:'4px 10px',background:'#DEF2F1',color:'#2B7A78',borderRadius:99,fontSize:12,fontWeight:600,fontFamily:'monospace'}}>{s}</span>)}
                  </div>
                </div>
              )}
              {d.modo==='manual'&&(
                <div>
                  <label style={labelSt}>{t("field.manual_times")}</label>
                  <input value={d.horarios||''} onChange={e=>onUpdate({horarios:e.target.value})} placeholder="08:00,09:00,10:00,14:00,15:00"
                    style={{...inputSt,fontFamily:'monospace'}}/>
                </div>
              )}
              </SubBloco>
              <SubBloco titulo={t("dentist.subbloco_calendario")} nomeDentista={nomeLabel} open={openSub==='calendario'} onToggle={()=>setOpenSub(p=>p==='calendario'?null:'calendario')}>
              {/* Campo ID */}
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <label style={{...labelSt,marginBottom:0}}>{t("field.calendar_id")}</label>
                  <button onClick={()=>setShowCalVideo(true)}
                    style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:"'Sora',sans-serif",fontSize:11,fontWeight:600,color:'#2B7A78',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:2}}>
                    <span style={{fontSize:13}}>📹</span> Como obter este dado?
                  </button>
                </div>
                <input ref={calInputRef} value={d.calendar_id||''} onChange={e=>onUpdate({calendar_id:e.target.value})} placeholder="xxx@group.calendar.google.com" style={inputSt}/>
                {showCalVideo&&<VideoModal src="/videos/google-calendar.mp4" title="Como obter o Google Calendar ID" onClose={()=>setShowCalVideo(false)}/>}
              </div>
              {/* Bloco fixo — sempre visível */}
              <div style={{padding:'10px 12px',background:'#f0fdf9',border:'1px solid #99f6e4',borderRadius:8}}>
                <div style={{fontSize:11,color:'#0f766e',fontWeight:600,marginBottom:6}}>Para funcionar, a agenda precisa ser compartilhada com a conta da {nomeAgente}:</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <code style={{fontSize:10,color:'#134e4a',flex:1,wordBreak:'break-all',lineHeight:1.5,background:'#ccfbf1',padding:'4px 7px',borderRadius:4}}>cappia-calendar-service@trans-sunset-494302-j8.iam.gserviceaccount.com</code>
                  <button onClick={()=>navigator.clipboard.writeText('cappia-calendar-service@trans-sunset-494302-j8.iam.gserviceaccount.com')}
                    style={{flexShrink:0,padding:'5px 10px',background:'#2B7A78',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:"'Sora',sans-serif"}}>
                    Copiar
                  </button>
                </div>
                <div style={{fontSize:10,color:'#0f766e'}}>Permissão necessária: <strong>Fazer alterações nos eventos</strong></div>
              </div>
              {/* Resultado da validação */}
              {calValidating&&(
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#64748b',padding:'6px 0'}}>
                  <span>🔄</span> Verificando a agenda no Google...
                </div>
              )}
              {!calValidating&&calValResult&&(()=>{
                const permBad=calValResult.tipo==='sem_permissao';
                const allOk=calValResult.valido===true;
                const calFound=allOk||permBad;
                return(
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {calFound?(
                      <>
                        {/* Linha 1 — agenda encontrada */}
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:7}}>
                          <span style={{fontSize:15}}>✅</span>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:'#16a34a'}}>Agenda encontrada: &quot;{calValResult.calendar_name}&quot;</div>
                            {calValResult.timezone&&<div style={{fontSize:10,color:'#64748b',marginTop:1}}>{calValResult.timezone}</div>}
                          </div>
                        </div>
                        {/* Linha 2 — compartilhamento */}
                        {allOk?(
                          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:7}}>
                            <span style={{fontSize:15}}>✅</span>
                            <div style={{fontSize:12,fontWeight:600,color:'#16a34a'}}>Compartilhamento: tudo certo!</div>
                          </div>
                        ):(
                          <div style={{padding:'8px 10px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:7}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:15}}>❌</span>
                              <div style={{fontSize:12,fontWeight:600,color:'#dc2626'}}>A permissão está errada</div>
                            </div>
                            <div style={{fontSize:11,color:'#b91c1c',marginTop:4,lineHeight:1.5}}>
                              A {nomeAgente} encontrou a agenda, mas não consegue criar eventos nela. Mude a permissão da conta da {nomeAgente} para: <strong>Fazer alterações nos eventos</strong>
                            </div>
                          </div>
                        )}
                      </>
                    ):(
                      /* 404 ou nao_compartilhado — dois possíveis motivos */
                      <div style={{padding:'10px 12px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:7}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:15}}>❌</span>
                          <div style={{fontSize:12,fontWeight:600,color:'#dc2626'}}>Não conseguimos encontrar esta agenda</div>
                        </div>
                        <div style={{fontSize:11,color:'#b91c1c',lineHeight:1.6}}>
                          Isso pode ter dois motivos:<br/>
                          <span style={{paddingLeft:8}}>• O ID foi digitado errado — confira se copiou certinho</span><br/>
                          <span style={{paddingLeft:8}}>• A agenda ainda não foi compartilhada com a conta da {nomeAgente}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              </SubBloco>
              <SubBloco titulo={t("dentist.subbloco_especialidades")} nomeDentista={nomeLabel} open={openSub==='especialidades'} onToggle={()=>setOpenSub(p=>p==='especialidades'?null:'especialidades')}>
              <div>
                <label style={labelSt}>{t("field.dentist_specialties")}</label>
                <EspecialidadesGrid procs={d.procedimentos||[]} onChange={procs=>onUpdate({procedimentos:procs})} t={t}/>
              </div>
              </SubBloco>
              {/* 4º bloco: Salvar */}
              <div style={{border:'1px solid rgba(43,122,120,0.25)',borderRadius:8,padding:'12px 14px',background:'#f8fafc',boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
                <div style={{display:'flex',gap:8}}>
                  <motion.button whileTap={{y:3,boxShadow:'0 2px 4px rgba(0,0,0,0.10)'}} onClick={()=>setShowQR(p=>!p)} onMouseDown={e=>e.preventDefault()}
                    style={{flex:1,padding:'10px',border:'1px solid #cbd5e1',borderRadius:8,background:showQR?'#f1f5f9':'transparent',cursor:'pointer',fontSize:12,fontWeight:700,color:'#475569',fontFamily:"'Sora',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/></svg>
                    {t("dentist.qr_code")}
                  </motion.button>
                  <motion.button whileTap={{y:3,boxShadow:'0 2px 4px rgba(0,0,0,0.10)'}} onClick={handleSave} disabled={saving||calValidating}
                    style={{...saveBtnSt,flex:1,justifyContent:'center',display:'flex',alignItems:'center',gap:6,
                      background:btnErrMsg?'#dc2626':saveBtnSt.background,
                      opacity:(saving||calValidating)?0.6:1,transition:'background 0.3s',boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
                    {calValidating?'Verificando agenda...':btnErrMsg||( saving?t("procs.saving"):t("dentist.btn_save_name",{nome:nomeLabel}))}
                  </motion.button>
                </div>
                <AnimatePresence initial={false}>
                  {showQR&&(
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22}} style={{overflow:'hidden'}}>
                      <div style={{marginTop:12,display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'16px',background:'#fff',borderRadius:10,border:'1px solid rgba(43,122,120,0.35)'}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#1e293b',textAlign:'center'}}>{t("dentist.app_of",{nome:nomeLabel})}</div>
                        {d.senha?(
                          <>
                            <div style={{padding:16,background:'#fff',borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,0.08)'}}>
                              <QRCodeSVG value={qrUrl} size={180} fgColor="#000000" bgColor="#ffffff" level="M" marginSize={1}/>
                            </div>
                            <div style={{fontSize:11,color:'#94a3b8',textAlign:'center',maxWidth:200,lineHeight:1.4}}>
                              {t("dentist.qr_instruction")}
                            </div>
                          </>
                        ):(
                          <div style={{fontSize:12,color:'#f59e0b',textAlign:'center',padding:'12px 16px',background:'rgba(245,158,11,0.08)',borderRadius:8,border:'1px solid rgba(245,158,11,0.2)'}}>
                            {t("dentist.qr_password_warning")}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button whileTap={{y:3,boxShadow:'0 2px 4px rgba(0,0,0,0.10)'}} onClick={onToggle} onMouseDown={e=>e.preventDefault()}
                  style={{marginTop:8,width:'100%',padding:'9px',border:'1px solid rgba(43,122,120,0.35)',borderRadius:8,background:'transparent',cursor:'pointer',fontSize:12,fontWeight:600,color:'#94a3b8',fontFamily:"'Sora',sans-serif",boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
                  {t("dentist.btn_close")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubBloco({titulo,nomeDentista,open,onToggle,children}:{
  titulo:string;nomeDentista:string;open:boolean;
  onToggle:()=>void;children:React.ReactNode;
}){
  return(
    <div style={{border:'1px solid rgba(43,122,120,0.25)',borderRadius:8,overflow:'hidden',boxShadow:'0 6px 16px rgba(0,0,0,0.28)'}}>
      <motion.button
        onClick={onToggle}
        onMouseDown={e=>e.preventDefault()}
        whileTap={{y:3}}
        style={{width:'100%',padding:'10px 12px',border:'none',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',gap:8,textAlign:'left'}}>
        <span style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{titulo} <span style={{color:'#64748b',fontWeight:500}}>— {nomeDentista}</span></span>
        <div style={{flex:1}}/>
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8',flexShrink:0}}>
          <ChevronDown size={14}/>
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
            <div style={{padding:12,borderTop:'1px solid #f1f5f9',display:'flex',flexDirection:'column',gap:12}}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EspecialidadesGrid({procs,onChange,t}:{procs:{nome:string;ativo:boolean;tempo:number}[];onChange:(p:{nome:string;ativo:boolean;tempo:number}[])=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const [openEsp,setOpenEsp]=useState<number|null>(null);
  const procsMap:Record<string,{ativo:boolean;tempo:number}>={};
  procs.forEach(p=>{if(p.nome)procsMap[p.nome]={ativo:p.ativo!==false,tempo:p.tempo||30};});

  function toggle(procNome:string){
    const cur=procsMap[procNome]||{ativo:false,tempo:30};
    const updated={...procsMap,[procNome]:{...cur,ativo:!cur.ativo}};
    onChange(Object.entries(updated).map(([nome,v])=>({nome,...v})));
  }

  function toggleAll(ei:number){
    const esp=ESPECIALIDADES[ei];
    const activeCount=esp.procs.filter(p=>procsMap[p.nome]?.ativo).length;
    const newState=activeCount<esp.procs.length;
    const updated={...procsMap};
    esp.procs.forEach(p=>{updated[p.nome]={ativo:newState,tempo:procsMap[p.nome]?.tempo||p.tempo||30};});
    onChange(Object.entries(updated).map(([nome,v])=>({nome,...v})));
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {ESPECIALIDADES.map((esp,ei)=>{
        const activeCount=esp.procs.filter(p=>procsMap[p.nome]?.ativo).length;
        const total=esp.procs.length;
        const isOpen=openEsp===ei;
        const allSelected=total>0&&activeCount===total;
        const partial=activeCount>0&&activeCount<total;
        return(
          <div key={ei} style={{border:`1px solid ${activeCount>0?'rgba(43,122,120,0.35)':'rgba(43,122,120,0.2)'}`,borderRadius:8,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',padding:'10px 12px',gap:8,background:activeCount>0?'rgba(43,122,120,0.04)':'#f8fafc'}}>
              {/* Name + count — click to expand */}
              <button onClick={()=>setOpenEsp(isOpen?null:ei)} onMouseDown={e=>e.preventDefault()}
                style={{flex:1,border:'none',background:'transparent',cursor:'pointer',textAlign:'left',padding:0,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#1e293b',lineHeight:1.2}}>{translateEspecialidade(esp.nome,t)}</div>
                <div style={{fontSize:11,color:activeCount>0?'#2B7A78':'#94a3b8',marginTop:3}}>
                  {activeCount>0?t("especialidades.selected_count",{ativos:activeCount,total,plural:total!==1?'s':'',plural2:activeCount!==1?'s':''}):t("especialidades.no_selection")}
                </div>
              </button>
              {/* Select-all button: ○ none / ✓ all / − partial */}
              <button
                onClick={e=>{e.stopPropagation();toggleAll(ei);}}
                onMouseDown={e=>e.preventDefault()}
                title={allSelected?t("especialidades.toggle_all_off"):t("especialidades.toggle_all_on")}
                style={{width:26,height:26,borderRadius:'50%',flexShrink:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s',
                  border:`2px solid ${allSelected?'#10b981':partial?'#f59e0b':'#cbd5e1'}`,
                  background:allSelected?'#10b981':partial?'#fffbeb':'transparent'}}>
                {allSelected&&<Check size={13} color="#fff" strokeWidth={3}/>}
                {partial&&<span style={{width:10,height:2,background:'#f59e0b',borderRadius:2,display:'block'}}/>}
              </button>
              {/* Expand chevron */}
              <button onClick={()=>setOpenEsp(isOpen?null:ei)} onMouseDown={e=>e.preventDefault()}
                style={{border:'none',background:'transparent',cursor:'pointer',padding:'4px 2px',color:'#94a3b8',display:'flex',alignItems:'center',flexShrink:0}}>
                <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}}>
                  <ChevronDown size={14}/>
                </motion.div>
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isOpen&&(
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
                  <div style={{padding:'10px 12px 12px',borderTop:'1px solid #f1f5f9',display:'flex',flexWrap:'wrap',gap:6}}>
                    {esp.procs.map(p=>{
                      const on=procsMap[p.nome]?.ativo||false;
                      return(
                        <button key={p.nome} onClick={()=>toggle(p.nome)} onMouseDown={e=>e.preventDefault()}
                          style={{padding:'5px 11px',borderRadius:99,fontSize:11,fontWeight:600,cursor:'pointer',border:`1px solid ${on?'#2B7A78':'rgba(43,122,120,0.35)'}`,background:on?'#DEF2F1':'transparent',color:on?'#2B7A78':'#64748b',fontFamily:"'Sora',sans-serif",transition:'all 0.15s'}}>
                          {translateProcedimento(p.nome,t)}
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
function getAnamneseCampos(t:(key:TranslationKey,vars?:Record<string,string|number>)=>string) {
  return [
    {k:'alergias',     label:t("health.allergies"),    sub:t("health.allergies_sub")},
    {k:'medicamentos', label:t("health.medications"),  sub:t("health.medications_sub")},
    {k:'diabetes',     label:t("health.diabetes"),     sub:t("health.diabetes_sub")},
    {k:'hipertensao',  label:t("health.hypertension"), sub:t("health.hypertension_sub")},
    {k:'gravidez',     label:t("health.pregnancy"),    sub:t("health.pregnancy_sub")},
    {k:'fumante',      label:t("health.smoker"),       sub:t("health.smoker_sub")},
    {k:'observacoes',  label:t("health.notes"),        sub:t("health.notes_sub")},
  ];
}

function DadosAgenteSection({clinica,saving,onSave,t}:{clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const a=(clinica as unknown as Record<string,Record<string,unknown>>).automatizacoes||{};
  const [email,setEmail]=useState((a.solicitar_email as boolean)||false);
  const anam=(a.anamnese as Record<string,boolean>)||{};
  const ANAMNESE_CAMPOS = getAnamneseCampos(t);
  const [anamCampos,setAnamCampos]=useState<Record<string,boolean>>(
    Object.fromEntries(ANAMNESE_CAMPOS.map(c=>[c.k,anam[c.k]||false]))
  );
  const [anamOpen,setAnamOpen]=useState(false);

  const [nascimento,setNascimento]=useState((a.solicitar_nascimento as boolean)!==false);
  const [tipoDocumento,setTipoDocumento]=useState('');
  useEffect(()=>{
    const p=clinica.pais_codigo;
    if(!p){setTipoDocumento('');return;}
    sb.query<Record<string,unknown>>('paises_config',`?codigo=eq.${p}&select=tipo_documento`)
      .then(rows=>setTipoDocumento(String(rows[0]?.tipo_documento||'')))
      .catch(()=>setTipoDocumento(''));
  },[clinica.pais_codigo]);
  const docLabel=tipoDocumento||t("field.document");
  const anamAtivo=Object.values(anamCampos).some(Boolean);

  function toggleAnam(k:string){setAnamCampos(p=>({...p,[k]:!p[k]}));}

  return(
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:10}}>{t("dados.required_fields")}</div>
        {[t("patients.col_name"),t("field.phone_short"),docLabel].map(l=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
            <span style={{fontSize:16}}>🔒</span>
            <span style={{flex:1,fontSize:14,fontWeight:500,color:'#1e293b'}}>{l}</span>
            <span style={{fontSize:11,color:'#94a3b8',background:'#f1f5f9',padding:'2px 8px',borderRadius:99}}>{t("dados.required_badge")}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:4}}>{t("dados.optional_fields")}</div>
        {/* Data de nascimento — opcional */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{t("dados.birthdate")}</div>
            <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{t("dados.birthdate_hint")}</div>
          </div>
          <Toggle on={nascimento} onChange={setNascimento}/>
        </div>

        {/* Anamnese — primeiro, com toggle pai + sub-campos inline */}
        <div style={{borderBottom:'1px solid #f1f5f9'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0'}}>
            <div style={{flex:1}}>
              <button onClick={()=>setAnamOpen(p=>!p)} onMouseDown={e=>e.preventDefault()}
                style={{display:'flex',alignItems:'center',gap:6,background:'transparent',border:'none',cursor:'pointer',padding:0,fontFamily:"'Sora',sans-serif",textAlign:'left'}}>
                <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{t("dados.anamnesis_title")}</div>
                <motion.div animate={{rotate:anamOpen?180:0}} transition={{duration:0.2}} style={{color:'#94a3b8'}}>
                  <ChevronDown size={13}/>
                </motion.div>
              </button>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{t("dados.anamnesis_hint")}</div>
              <div style={{marginTop:6,padding:'6px 10px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:8,fontSize:11,color:'#b45309',display:'inline-block'}}>
                {t("dados.anamnesis_wip")}
              </div>
            </div>
            <Toggle
              on={anamAtivo}
              partial={anamAtivo && !Object.values(anamCampos).every(Boolean)}
              onChange={v=>setAnamCampos(Object.fromEntries(ANAMNESE_CAMPOS.map(c=>[c.k,v])))}/>
          </div>
          <AnimatePresence initial={false}>
            {anamOpen&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
                <div style={{paddingBottom:10,display:'flex',flexDirection:'column',gap:0}}>
                  {ANAMNESE_CAMPOS.map(c=>(
                    <div key={c.k} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0 9px 14px',borderTop:'1px solid #f8fafc'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#1e293b'}}>{c.label}</div>
                        <div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>{c.sub}</div>
                      </div>
                      <Toggle on={anamCampos[c.k]} onChange={()=>toggleAnam(c.k)}/>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {[
          {k:'email',v:email,set:setEmail,label:t("health.email_collect"), sub:t("health.email_sub")},
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
        <button onClick={()=>onSave({automatizacoes:{...a,solicitar_nascimento:nascimento,solicitar_email:email,anamnese:anamCampos}})} disabled={saving} style={saveBtnSt}>
          {saving?t("procs.saving"):t("dados.btn_save")}
        </button>
      </div>
    </div>
  );
}

// ── AUTOMAÇÕES ─────────────────────────────────────────────────────────────────
function AutomacoesSection({clinica,saving,onSave,t}:{clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const a=(clinica as unknown as Record<string,Record<string,unknown>>).automatizacoes||{};
  const [lem2h,setLem2h]=useState((a.lembrete_2h as boolean)!==false);
  const [lem24h,setLem24h]=useState((a.lembrete_24h as boolean)||false);
  const [posAtivo,setPosAtivo]=useState((a.pos_consulta_tipo as string||'nenhum')!=='nenhum');
  const [posTipo,setPosTipo]=useState((a.pos_consulta_tipo as string)==='nenhum'||!(a.pos_consulta_tipo)?'satisfacao':(a.pos_consulta_tipo as string));
  const [posLink,setPosLink]=useState((a.pos_consulta_google_link as string)||'');
  const [posTempo,setPosTempo]=useState((a.pos_consulta_tempo as string)||'2h');
  const [retorno,setRetorno]=useState((a.retorno as boolean)||false);
  const [retMeses,setRetMeses]=useState((a.retorno_meses as number)||6);
  const [espera,setEspera]=useState((a.lista_espera as boolean)||false);
  const [aniv,setAniv]=useState((a.aniversario as boolean)||false);

  function handleSave(){
    onSave({automatizacoes:{...a,lembrete_2h:lem2h,lembrete_24h:lem24h,pos_consulta_tipo:posAtivo?posTipo:'nenhum',pos_consulta_google_link:posLink,pos_consulta_tempo:posTempo,retorno,retorno_meses:retMeses,lista_espera:espera,aniversario:aniv}});
  }

  return(
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {/* Lembretes */}
      {[
        {v:lem2h,set:setLem2h,label:t("auto.reminder_2h"),sub:t("auto.reminder_2h_sub")},
        {v:lem24h,set:setLem24h,label:t("auto.reminder_24h"),sub:t("auto.reminder_24h_sub")},
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
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:'#1e293b',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span>{t("auto.post_consult")}</span>
              <select value={posTempo} onChange={e=>setPosTempo(e.target.value)}
                style={{fontSize:13,fontWeight:600,color:'#2B7A78',border:'1px solid rgba(43,122,120,0.3)',borderRadius:6,padding:'2px 6px',background:'rgba(43,122,120,0.05)',cursor:'pointer',fontFamily:"'Sora',sans-serif",outline:'none'}}>
                <option value="2h">{t("auto.time_2h")}</option>
                <option value="4h">{t("auto.time_4h")}</option>
                <option value="24h">{t("auto.time_24h")}</option>
              </select>
            </div>
            <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{t("auto.post_consult_sub")}</div>
          </div>
          <Toggle on={posAtivo} onChange={v=>{setPosAtivo(v);}}/>
        </div>
        <AnimatePresence initial={false}>
          {posAtivo&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.4,0,0.2,1]}} style={{overflow:'hidden'}}>
              <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:0}}>
                {[
                  {v:'satisfacao',icon:'⭐',label:t("auto.satisfaction"),desc:t("auto.satisfaction_desc")},
                  {v:'google',icon:'📊',label:t("auto.google_review"),desc:t("auto.google_review_desc")},
                  {v:'ambos',icon:'✨',label:t("auto.satisfaction_google"),desc:t("auto.satisfaction_google_desc")},
                ].map((opt,oi,arr)=>(
                  <button key={opt.v} onClick={()=>setPosTipo(opt.v)}
                    style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 0',borderBottom:oi<arr.length-1?'1px solid #f8fafc':'none',background:'transparent',border:'none',cursor:'pointer',width:'100%',textAlign:'left',fontFamily:"'Sora',sans-serif"}}>
                    <div style={{width:17,height:17,borderRadius:'50%',border:`2px solid ${posTipo===opt.v?'#2B7A78':'#cbd5e1'}`,background:posTipo===opt.v?'#2B7A78':'transparent',flexShrink:0,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                      {posTipo===opt.v&&<div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:posTipo===opt.v?'#2B7A78':'#1e293b'}}>{opt.icon} {opt.label}</div>
                      <div style={{fontSize:12,color:'#94a3b8',marginTop:2,lineHeight:1.4}}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
                {['google','ambos'].includes(posTipo)&&(
                  <div style={{marginTop:8}}>
                    <label style={labelSt}>{t("auto.google_review_link")}</label>
                    <input value={posLink} onChange={e=>setPosLink(e.target.value)} placeholder="https://g.page/r/..." style={inputSt}/>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Retorno automático */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{t("auto.return_reminder")}</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{t("auto.return_reminder_sub")}</div>
          {retorno&&<div style={{marginTop:8,display:'flex',alignItems:'center',gap:8}}>
            <input type="number" value={retMeses} onChange={e=>setRetMeses(parseInt(e.target.value)||6)} min={1} max={24}
              style={{...inputSt,width:70}}/>
            <span style={{fontSize:13,color:'#64748b'}}>{t("auto.months")}</span>
          </div>}
        </div>
        <Toggle on={retorno} onChange={setRetorno}/>
      </div>

      {/* Lista de espera */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>{t("auto.waitlist")}</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{t("auto.waitlist_sub")}</div>
        </div>
        <Toggle on={espera} onChange={setEspera}/>
      </div>

      {/* Aniversário */}
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'14px',marginTop:8,background:'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.05))',border:'1px solid rgba(245,158,11,0.25)',borderRadius:10}}>
        <div style={{fontSize:32,flexShrink:0}}>🎂</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600,color:'#d97706'}}>{t("auto.birthday")}</div>
          <div style={{fontSize:12,color:'#92400e',marginTop:2}}>{t("auto.birthday_sub")}</div>
          <div style={{marginTop:6,padding:'8px 12px',background:'rgba(245,158,11,0.08)',borderLeft:'2px solid rgba(245,158,11,0.4)',borderRadius:'0 6px 6px 0',fontSize:12,color:'#78350f',fontStyle:'italic'}}>
            &quot;{t("auto.birthday_message")}&quot;
          </div>
        </div>
        <Toggle on={aniv} onChange={setAniv}/>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
        <button onClick={handleSave} disabled={saving} style={saveBtnSt}>{saving?t("procs.saving"):t("auto.btn_save")}</button>
      </div>
    </div>
  );
}

// ── PROCEDIMENTOS SECTION ───────────────────────────────────────────────────────
type Preco = {
  nome: string;
  esp: string;
  ativo: boolean;
  valor: number;
  mostrar_valor: boolean;
  tempo: number;
};

function ProcedimentosSection({clinica,saving,onSave,t}:{clinica:Clinica;saving:boolean;onSave:(d:Record<string,unknown>)=>void;t:(key:TranslationKey,vars?:Record<string,string|number>)=>string;}){
  const [moeda, setMoeda] = useState('R$');

  useEffect(() => {
    const pais = (clinica as unknown as Record<string,string>).pais_codigo;
    if (!pais) return;
    sb.query<Record<string,unknown>>('paises_config', `?codigo=eq.${pais}&select=moeda,moeda_codigo`)
      .then(r => { if (r[0]) setMoeda((r[0].moeda_codigo || r[0].moeda || 'R$') as string); })
      .catch(() => {});
  }, [clinica]);

  const initPrecos = (): Preco[] => {
    const raw = (clinica as unknown as Record<string,unknown>).precios;
    const arr: Preco[] = Array.isArray(raw) ? raw as Preco[] : [];
    return ESPECIALIDADES.flatMap(esp =>
      esp.procs.map(p => {
        const salvo = arr.find(a => a.nome === p.nome);
        return {
          nome: p.nome,
          esp: esp.nome,
          ativo: salvo ? salvo.ativo !== false : true,
          valor: salvo?.valor ?? 0,
          mostrar_valor: salvo?.mostrar_valor ?? false,
          tempo: salvo?.tempo ?? p.tempo,
        };
      })
    );
  };

  const [precos, setPrecos] = useState<Preco[]>(initPrecos);

  function update(nome: string, field: keyof Preco, value: boolean | number) {
    setPrecos(prev => prev.map(p => p.nome === nome ? {...p, [field]: value} : p));
  }

  // Toggle em massa por especialidade
  function toggleEspAtivo(espNome: string, value: boolean) {
    setPrecos(prev => prev.map(p =>
      p.esp === espNome ? {...p, ativo: value, mostrar_valor: value ? p.mostrar_valor : false} : p
    ));
  }

  function toggleEspMostrarValor(espNome: string, value: boolean) {
    setPrecos(prev => prev.map(p =>
      p.esp === espNome && p.ativo ? {...p, mostrar_valor: value} : p
    ));
  }

  function handleSave() {
    onSave({precios: precos});
  }

  const grupos = ESPECIALIDADES.map(esp => ({
    nome: esp.nome,
    procs: precos.filter(p => p.esp === esp.nome),
  }));

  const totalAtivos = precos.filter(p => p?.ativo).length;

  const colStyle: React.CSSProperties = {display:'grid',gridTemplateColumns:'1fr 80px 110px 90px',gap:8};

  return (
    <div>
      <div style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>
        {t("procs.active_count",{ativos:totalAtivos,total:precos.length})}
      </div>

      {grupos.map(g => {
        const ativos = g.procs.filter(p => p?.ativo).length;
        const todosAtivos = ativos === g.procs.length;
        const algumAtivo = ativos > 0;
        const todosComValor = g.procs.filter(p=>p?.ativo).every(p=>p.mostrar_valor);
        const algumComValor = g.procs.filter(p=>p?.ativo).some(p=>p.mostrar_valor);

        // Estado indeterminado para o toggle de especialidade
        const espAtivoVal = todosAtivos ? true : false;
        const espValorVal = algumAtivo && todosComValor ? true : false;

        return (
          <div key={g.nome} style={{marginBottom:28,background:'#fafbfc',borderRadius:10,border:'1px solid #f1f5f9',overflow:'hidden'}}>

            {/* Header especialidade com toggles */}
            <div style={{...colStyle, alignItems:'center', padding:'10px 14px', background:'rgba(43,122,120,0.06)', border:'1px solid rgba(43,122,120,0.2)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#2B7A78',display:'flex',alignItems:'center',gap:8}}>
                {translateEspecialidade(g.nome,t)}
                <span style={{fontSize:11,color:'#94a3b8',fontWeight:400}}>
                  {t("procs.specialty_count",{ativos,total:g.procs.length})}
                  {!todosAtivos && ativos>0 && ` • ${t("procs.partial")}`}
                </span>
              </div>
              {/* Toggle Faz? especialidade */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <Toggle on={espAtivoVal} onChange={v => toggleEspAtivo(g.nome, v)}/>
                <span style={{fontSize:9,color:'#94a3b8'}}>{t("procs.toggle_all")}</span>
              </div>
              {/* Toggle Informa valor? especialidade */}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <Toggle on={espValorVal} onChange={v => algumAtivo && toggleEspMostrarValor(g.nome, v)}/>
                <span style={{fontSize:9,color:'#94a3b8'}}>{t("procs.toggle_all")}</span>
              </div>
              {/* Aviso tempo */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:9,color:'#94a3b8',textAlign:'center',lineHeight:1.3}}>{t("procs.mode_proc_label")}</span>
              </div>
            </div>

            {/* Header colunas */}
            <div style={{...colStyle, padding:'8px 14px 4px', marginBottom:4}}>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>{t("procs.col_procedure_header")}</div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,textAlign:'center'}}>{t("procs.col_do_header")}</div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,textAlign:'center'}}>{t("procs.col_show_value_header")}</div>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:600,textAlign:'center',lineHeight:1.2}}>
                {t("procs.col_time_header")}
              </div>
            </div>

            {g.procs.map(p => (
              <div key={p.nome} style={{
                ...colStyle,
                padding:'9px 14px',borderBottom:'1px solid #f1f5f9',
                opacity: p.ativo ? 1 : 0.4,
                transition:'opacity 0.15s',
                alignItems:'center',
              }}>
                {/* Nome */}
                <div style={{fontSize:13,color:'#1e293b'}}>{translateProcedimento(p.nome,t)}</div>

                {/* Faz? */}
                <div style={{display:'flex',justifyContent:'center'}}>
                  <Toggle on={p.ativo} onChange={v => {
                    update(p.nome,'ativo',v);
                    if(!v) update(p.nome,'mostrar_valor',false);
                  }}/>
                </div>

                {/* Informa valor? */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <div style={{opacity: p.ativo ? 1 : 0.3, pointerEvents: p.ativo ? 'auto' : 'none'}}>
                    <Toggle on={p.mostrar_valor} onChange={v => update(p.nome,'mostrar_valor',v)}/>
                  </div>
                  {p.ativo && p.mostrar_valor && (
                    <input
                      type="number" min={0} value={p.valor}
                      onChange={e => update(p.nome,'valor',parseFloat(e.target.value)||0)}
                      style={{width:72,fontSize:12,padding:'3px 6px',border:'1px solid rgba(43,122,120,0.35)',borderRadius:6,textAlign:'right',fontFamily:"'Sora',sans-serif",color:'#1e293b'}}
                      placeholder={moeda+' 0'}
                    />
                  )}
                </div>

                {/* Tempo */}
                <div style={{display:'flex',justifyContent:'center'}}>
                  <input
                    type="number" min={5} max={480} step={5} value={p.tempo}
                    onChange={e => update(p.nome,'tempo',parseInt(e.target.value)||30)}
                    disabled={!p.ativo}
                    style={{
                      width:64,fontSize:12,padding:'4px 6px',
                      border:'1px solid rgba(43,122,120,0.35)',borderRadius:6,textAlign:'center',
                      fontFamily:"'Sora',sans-serif",color:'#1e293b',
                      background: p.ativo ? '#fff' : '#f8fafc',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Legenda tempo */}
      <div style={{fontSize:11,color:'#94a3b8',marginBottom:16,padding:'8px 12px',background:'#f8fafc',borderRadius:8,borderLeft:'3px solid rgba(43,122,120,0.35)'}}>
        ⏱️ {t("procs.time_legend")}
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
        <button onClick={handleSave} disabled={saving} style={{
          padding:'10px 24px',background:'#2B7A78',color:'#fff',border:'none',
          borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
          fontFamily:"'Sora',sans-serif",opacity:saving?0.7:1,
        }}>
          {saving ? t("procs.saving") : t("procs.btn_save_procedures")}
        </button>
      </div>
    </div>
  );
}
