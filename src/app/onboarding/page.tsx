"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

const CRIAR_CLINICA_URL = "https://udizowyfjnhuhgxkeayk.supabase.co/functions/v1/criar-clinica";
const CRIAR_CLINICA_KEY = "Cappia@2026";
const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
const SUPABASE_KEY = "sb_publishable_0mN6LUu3G2r9dE5YUzgaIQ_vrB8NE2C";

// ── Dados idênticos ao dashboard/page.tsx ─────────────────────────────────────
const PAIS_POR_IDIOMA: Record<string, {v:string;l:string}[]> = {
  'pt-br': [{v:'br',l:'Brasil'},{v:'pt',l:'Portugal'},{v:'ao',l:'Angola'},{v:'mz',l:'Moçambique'},{v:'cv',l:'Cabo Verde'},{v:'gw',l:'Guiné-Bissau'},{v:'st',l:'São Tomé e Príncipe'},{v:'tl',l:'Timor-Leste'}],
  'es':    [{v:'mx',l:'México'},{v:'co',l:'Colombia'},{v:'ar',l:'Argentina'},{v:'es',l:'España'},{v:'pe',l:'Perú'},{v:'ve',l:'Venezuela'},{v:'cl',l:'Chile'},{v:'ec',l:'Ecuador'},{v:'gt',l:'Guatemala'},{v:'cu',l:'Cuba'},{v:'bo',l:'Bolivia'},{v:'do',l:'República Dominicana'},{v:'hn',l:'Honduras'},{v:'py',l:'Paraguay'},{v:'sv',l:'El Salvador'},{v:'ni',l:'Nicaragua'},{v:'cr',l:'Costa Rica'},{v:'pa',l:'Panamá'},{v:'uy',l:'Uruguay'}],
  'en':    [{v:'us',l:'United States'},{v:'uk',l:'United Kingdom'},{v:'au',l:'Australia'},{v:'ca',l:'Canada'},{v:'ng',l:'Nigeria'},{v:'za',l:'South Africa'},{v:'gh',l:'Ghana'},{v:'ke',l:'Kenya'},{v:'in',l:'India'},{v:'ph',l:'Philippines'},{v:'sg',l:'Singapore'},{v:'nz',l:'New Zealand'},{v:'ie',l:'Ireland'}],
  'fr':    [{v:'fr',l:'France'},{v:'be',l:'Belgique'},{v:'ch',l:'Suisse'},{v:'sn',l:'Sénégal'},{v:'ci',l:"Côte d'Ivoire"},{v:'cm',l:'Cameroun'},{v:'mg',l:'Madagascar'}],
  'de':    [{v:'de',l:'Deutschland'},{v:'at',l:'Österreich'},{v:'ch',l:'Schweiz'}],
  'it':    [{v:'it',l:'Italia'},{v:'ch',l:'Svizzera'}],
  'ru':    [{v:'ru',l:'Россия'},{v:'by',l:'Беларусь'},{v:'kz',l:'Казахстан'},{v:'ua',l:'Украина'}],
  'ar':    [{v:'sa',l:'المملكة العربية السعودية'},{v:'eg',l:'مصر'},{v:'ae',l:'الإمارات'},{v:'ma',l:'المغرب'},{v:'dz',l:'الجزائر'}],
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
  br:{'Acre':'America/Rio_Branco','Alagoas':'America/Recife','Amapá':'America/Belem','Amazonas':'America/Manaus','Bahia':'America/Bahia','Ceará':'America/Fortaleza','Distrito Federal':'America/Sao_Paulo','Espírito Santo':'America/Sao_Paulo','Goiás':'America/Sao_Paulo','Maranhão':'America/Fortaleza','Mato Grosso':'America/Cuiaba','Mato Grosso do Sul':'America/Campo_Grande','Minas Gerais':'America/Sao_Paulo','Pará':'America/Belem','Paraíba':'America/Recife','Paraná':'America/Sao_Paulo','Pernambuco':'America/Recife','Piauí':'America/Fortaleza','Rio de Janeiro':'America/Sao_Paulo','Rio Grande do Norte':'America/Fortaleza','Rio Grande do Sul':'America/Sao_Paulo','Rondônia':'America/Porto_Velho','Roraima':'America/Boa_Vista','Santa Catarina':'America/Sao_Paulo','São Paulo':'America/Sao_Paulo','Sergipe':'America/Recife','Tocantins':'America/Araguaina'},
  us:{'Alabama':'America/Chicago','Alaska':'America/Anchorage','Arizona':'America/Phoenix','Arkansas':'America/Chicago','California':'America/Los_Angeles','Colorado':'America/Denver','Connecticut':'America/New_York','Delaware':'America/New_York','Florida':'America/New_York','Georgia':'America/New_York','Hawaii':'Pacific/Honolulu','Idaho':'America/Denver','Illinois':'America/Chicago','Indiana':'America/Indiana/Indianapolis','Iowa':'America/Chicago','Kansas':'America/Chicago','Kentucky':'America/New_York','Louisiana':'America/Chicago','Maine':'America/New_York','Maryland':'America/New_York','Massachusetts':'America/New_York','Michigan':'America/Detroit','Minnesota':'America/Chicago','Mississippi':'America/Chicago','Missouri':'America/Chicago','Montana':'America/Denver','Nebraska':'America/Chicago','Nevada':'America/Los_Angeles','New Hampshire':'America/New_York','New Jersey':'America/New_York','New Mexico':'America/Denver','New York':'America/New_York','North Carolina':'America/New_York','North Dakota':'America/Chicago','Ohio':'America/New_York','Oklahoma':'America/Chicago','Oregon':'America/Los_Angeles','Pennsylvania':'America/New_York','Rhode Island':'America/New_York','South Carolina':'America/New_York','South Dakota':'America/Chicago','Tennessee':'America/Chicago','Texas':'America/Chicago','Utah':'America/Denver','Vermont':'America/New_York','Virginia':'America/New_York','Washington':'America/Los_Angeles','West Virginia':'America/New_York','Wisconsin':'America/Chicago','Wyoming':'America/Denver'},
  ca:{'Alberta':'America/Edmonton','British Columbia':'America/Vancouver','Manitoba':'America/Winnipeg','New Brunswick':'America/Moncton','Newfoundland and Labrador':'America/St_Johns','Northwest Territories':'America/Yellowknife','Nova Scotia':'America/Halifax','Nunavut':'America/Iqaluit','Ontario':'America/Toronto','Prince Edward Island':'America/Halifax','Quebec':'America/Montreal','Saskatchewan':'America/Regina','Yukon':'America/Whitehorse'},
  au:{'Australian Capital Territory':'Australia/Sydney','New South Wales':'Australia/Sydney','Northern Territory':'Australia/Darwin','Queensland':'Australia/Brisbane','South Australia':'Australia/Adelaide','Tasmania':'Australia/Hobart','Victoria':'Australia/Melbourne','Western Australia':'Australia/Perth'},
  mx:{'Baja California':'America/Tijuana','Baja California Sur':'America/Mazatlan','Chihuahua':'America/Chihuahua','Ciudad de México':'America/Mexico_City','Nayarit':'America/Bahia_Banderas','Sinaloa':'America/Mazatlan','Sonora':'America/Hermosillo'},
};

const LANGUAGES = [
  { code: "pt-br", label: "Português", sub: "Brasil / Portugal", flag: "🇧🇷" },
  { code: "es",    label: "Español",   sub: "España / LATAM",    flag: "🇪🇸" },
  { code: "en",    label: "English",   sub: "US / UK",           flag: "🇺🇸" },
  { code: "fr",    label: "Français",  sub: "France / Afrique",  flag: "🇫🇷" },
  { code: "de",    label: "Deutsch",   sub: "Deutschland",       flag: "🇩🇪" },
  { code: "it",    label: "Italiano",  sub: "Italia",            flag: "🇮🇹" },
  { code: "ru",    label: "Русский",   sub: "Россия",            flag: "🇷🇺" },
  { code: "ar",    label: "العربية",   sub: "عربي",              flag: "🇸🇦" },
];

const STEPS = ["Idioma", "País", "Clínica", "Iris"];

const OB_T = {
  "pt-br": {
    dir:"ltr", setup:"Configuração inicial",
    steps:["Idioma","País","Clínica","Iris"],
    s0_title:"Escolha o idioma", s0_sub:"O painel e a Iris vão usar este idioma.",
    s1_title:"País & Localização", s1_sub:"Onde fica sua clínica?",
    s1_country:"País", s1_postal_br:"CEP", s1_postal:"Código Postal",
    s1_postal_hint_br:"Identifica o estado automaticamente.",
    s1_postal_hint:"Identifica a cidade automaticamente.",
    s1_state:"Estado / Província", s1_select:"Selecione...", s1_timezone:"Fuso Horário",
    s1_searching:"🔍 Buscando...", s1_cep_err:"CEP não encontrado.", s1_cep_err2:"Erro ao buscar CEP.",
    s1_postal_err:"Código postal não encontrado.", s1_postal_err2:"Erro ao buscar código postal.",
    s2_title:"Dados da clínica", s2_sub:"Informações para criar sua conta.",
    s2_name:"Nome da clínica", s2_name_ph:"Ex: Clínica Odonto Prime",
    s2_email:"E-mail de acesso", s2_email_ph:"clinica@exemplo.com",
    s2_pass:"Senha", s2_pass_ph:"Mínimo 6 caracteres",
    s3_title:"Telefone da Iris", s3_sub:"O número do WhatsApp que a Iris vai usar para atender seus pacientes.",
    s3_label:"Número WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"DDI e DDD preenchidos automaticamente — digite só os dígitos finais.",
    s3_hint:"Este número vai aparecer pré-preenchido na seção Secretária Virtual do painel.",
    btn_back:"Voltar", btn_next:"Continuar →", btn_finish:"Concluir e entrar", btn_loading:"Criando conta...",
    footer:"Já tem conta?", footer_link:"Entrar",
    err_state:"Escolha um estado / província", err_name:"Informe o nome da clínica",
    err_email:"Informe o e-mail de acesso", err_pass:"A senha deve ter pelo menos 6 caracteres",
    err_phone:"Informe o número do WhatsApp da Iris", err_create:"Erro ao criar clínica",
  },
  "es": {
    dir:"ltr", setup:"Configuración inicial",
    steps:["Idioma","País","Clínica","Iris"],
    s0_title:"Elige el idioma", s0_sub:"El panel y la Iris usarán este idioma.",
    s1_title:"País & Localización", s1_sub:"¿Dónde está tu clínica?",
    s1_country:"País", s1_postal_br:"Código Postal", s1_postal:"Código Postal",
    s1_postal_hint_br:"Identifica el estado automáticamente.",
    s1_postal_hint:"Identifica la ciudad automáticamente.",
    s1_state:"Estado / Provincia", s1_select:"Seleccionar...", s1_timezone:"Zona Horaria",
    s1_searching:"🔍 Buscando...", s1_cep_err:"Código postal no encontrado.", s1_cep_err2:"Error al buscar.",
    s1_postal_err:"Código postal no encontrado.", s1_postal_err2:"Error al buscar código postal.",
    s2_title:"Datos de la clínica", s2_sub:"Información para crear tu cuenta.",
    s2_name:"Nombre de la clínica", s2_name_ph:"Ej: Clínica Dental Prime",
    s2_email:"Correo electrónico", s2_email_ph:"clinica@ejemplo.com",
    s2_pass:"Contraseña", s2_pass_ph:"Mínimo 6 caracteres",
    s3_title:"Teléfono de Iris", s3_sub:"El número de WhatsApp que Iris usará para atender a tus pacientes.",
    s3_label:"Número WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"DDI y código de área completados automáticamente — ingresa solo los dígitos finales.",
    s3_hint:"Este número aparecerá precargado en la sección Secretaria Virtual del panel.",
    btn_back:"Volver", btn_next:"Continuar →", btn_finish:"Finalizar y entrar", btn_loading:"Creando cuenta...",
    footer:"¿Ya tienes cuenta?", footer_link:"Entrar",
    err_state:"Elige un estado / provincia", err_name:"Ingresa el nombre de la clínica",
    err_email:"Ingresa el correo electrónico", err_pass:"La contraseña debe tener al menos 6 caracteres",
    err_phone:"Ingresa el número de WhatsApp de Iris", err_create:"Error al crear la clínica",
  },
  "en": {
    dir:"ltr", setup:"Initial setup",
    steps:["Language","Country","Clinic","Iris"],
    s0_title:"Choose language", s0_sub:"The panel and Iris will use this language.",
    s1_title:"Country & Location", s1_sub:"Where is your clinic?",
    s1_country:"Country", s1_postal_br:"ZIP Code", s1_postal:"Postal Code",
    s1_postal_hint_br:"Auto-fills state.", s1_postal_hint:"Auto-fills city.",
    s1_state:"State / Province", s1_select:"Select...", s1_timezone:"Timezone",
    s1_searching:"🔍 Searching...", s1_cep_err:"ZIP code not found.", s1_cep_err2:"Error fetching ZIP.",
    s1_postal_err:"Postal code not found.", s1_postal_err2:"Error fetching postal code.",
    s2_title:"Clinic details", s2_sub:"Information to create your account.",
    s2_name:"Clinic name", s2_name_ph:"Ex: Prime Dental Clinic",
    s2_email:"Email address", s2_email_ph:"clinic@example.com",
    s2_pass:"Password", s2_pass_ph:"Minimum 6 characters",
    s3_title:"Iris phone number", s3_sub:"The WhatsApp number Iris will use to serve your patients.",
    s3_label:"WhatsApp number", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"Country code and area code filled automatically — enter only the final digits.",
    s3_hint:"This number will appear pre-filled in the Virtual Secretary section.",
    btn_back:"Back", btn_next:"Continue →", btn_finish:"Finish & sign in", btn_loading:"Creating account...",
    footer:"Already have an account?", footer_link:"Sign in",
    err_state:"Choose a state / province", err_name:"Enter the clinic name",
    err_email:"Enter the email address", err_pass:"Password must be at least 6 characters",
    err_phone:"Enter Iris' WhatsApp number", err_create:"Error creating clinic",
  },
  "fr": {
    dir:"ltr", setup:"Configuration initiale",
    steps:["Langue","Pays","Clinique","Iris"],
    s0_title:"Choisissez la langue", s0_sub:"Le panneau et Iris utiliseront cette langue.",
    s1_title:"Pays & Localisation", s1_sub:"Où se trouve votre clinique?",
    s1_country:"Pays", s1_postal_br:"Code Postal", s1_postal:"Code Postal",
    s1_postal_hint_br:"Identifie l'état automatiquement.", s1_postal_hint:"Identifie la ville automatiquement.",
    s1_state:"État / Province", s1_select:"Sélectionner...", s1_timezone:"Fuseau Horaire",
    s1_searching:"🔍 Recherche...", s1_cep_err:"Code postal introuvable.", s1_cep_err2:"Erreur de recherche.",
    s1_postal_err:"Code postal introuvable.", s1_postal_err2:"Erreur de recherche du code postal.",
    s2_title:"Données de la clinique", s2_sub:"Informations pour créer votre compte.",
    s2_name:"Nom de la clinique", s2_name_ph:"Ex: Clinique Dentaire Prime",
    s2_email:"Adresse e-mail", s2_email_ph:"clinique@exemple.com",
    s2_pass:"Mot de passe", s2_pass_ph:"Minimum 6 caractères",
    s3_title:"Téléphone d'Iris", s3_sub:"Le numéro WhatsApp qu'Iris utilisera pour servir vos patients.",
    s3_label:"Numéro WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"Indicatif et préfixe complétés automatiquement — entrez seulement les chiffres finaux.",
    s3_hint:"Ce numéro apparaîtra pré-rempli dans la section Secrétaire Virtuelle.",
    btn_back:"Retour", btn_next:"Continuer →", btn_finish:"Terminer & se connecter", btn_loading:"Création du compte...",
    footer:"Déjà un compte?", footer_link:"Se connecter",
    err_state:"Choisissez un état / province", err_name:"Entrez le nom de la clinique",
    err_email:"Entrez l'adresse e-mail", err_pass:"Le mot de passe doit comporter au moins 6 caractères",
    err_phone:"Entrez le numéro WhatsApp d'Iris", err_create:"Erreur lors de la création",
  },
  "de": {
    dir:"ltr", setup:"Ersteinrichtung",
    steps:["Sprache","Land","Klinik","Iris"],
    s0_title:"Sprache wählen", s0_sub:"Das Panel und Iris werden diese Sprache verwenden.",
    s1_title:"Land & Standort", s1_sub:"Wo befindet sich Ihre Klinik?",
    s1_country:"Land", s1_postal_br:"Postleitzahl", s1_postal:"Postleitzahl",
    s1_postal_hint_br:"Ermittelt das Bundesland automatisch.", s1_postal_hint:"Ermittelt die Stadt automatisch.",
    s1_state:"Bundesland / Provinz", s1_select:"Auswählen...", s1_timezone:"Zeitzone",
    s1_searching:"🔍 Suche...", s1_cep_err:"Postleitzahl nicht gefunden.", s1_cep_err2:"Fehler bei der Suche.",
    s1_postal_err:"Postleitzahl nicht gefunden.", s1_postal_err2:"Fehler bei der Suche.",
    s2_title:"Klinikdaten", s2_sub:"Informationen zur Erstellung Ihres Kontos.",
    s2_name:"Klinikname", s2_name_ph:"z.B. Zahnarztpraxis Prime",
    s2_email:"E-Mail-Adresse", s2_email_ph:"klinik@beispiel.de",
    s2_pass:"Passwort", s2_pass_ph:"Mindestens 6 Zeichen",
    s3_title:"Iris-Telefonnummer", s3_sub:"Die WhatsApp-Nummer, die Iris verwendet, um Ihre Patienten zu betreuen.",
    s3_label:"WhatsApp-Nummer", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"Ländervorwahl und Vorwahl automatisch ausgefüllt — geben Sie nur die letzten Ziffern ein.",
    s3_hint:"Diese Nummer wird im Bereich Virtuelle Sekretärin vorausgefüllt.",
    btn_back:"Zurück", btn_next:"Weiter →", btn_finish:"Abschließen & anmelden", btn_loading:"Konto wird erstellt...",
    footer:"Bereits ein Konto?", footer_link:"Anmelden",
    err_state:"Wählen Sie ein Bundesland / eine Provinz", err_name:"Geben Sie den Kliniknamen ein",
    err_email:"Geben Sie die E-Mail-Adresse ein", err_pass:"Das Passwort muss mindestens 6 Zeichen lang sein",
    err_phone:"Geben Sie Iris' WhatsApp-Nummer ein", err_create:"Fehler beim Erstellen der Klinik",
  },
  "it": {
    dir:"ltr", setup:"Configurazione iniziale",
    steps:["Lingua","Paese","Clinica","Iris"],
    s0_title:"Scegli la lingua", s0_sub:"Il pannello e Iris useranno questa lingua.",
    s1_title:"Paese & Localizzazione", s1_sub:"Dove si trova la tua clinica?",
    s1_country:"Paese", s1_postal_br:"CAP", s1_postal:"Codice Postale",
    s1_postal_hint_br:"Identifica lo stato automaticamente.", s1_postal_hint:"Identifica la città automaticamente.",
    s1_state:"Stato / Provincia", s1_select:"Seleziona...", s1_timezone:"Fuso Orario",
    s1_searching:"🔍 Ricerca...", s1_cep_err:"Codice postale non trovato.", s1_cep_err2:"Errore nella ricerca.",
    s1_postal_err:"Codice postale non trovato.", s1_postal_err2:"Errore nella ricerca.",
    s2_title:"Dati della clinica", s2_sub:"Informazioni per creare il tuo account.",
    s2_name:"Nome della clinica", s2_name_ph:"Es: Clinica Dentale Prime",
    s2_email:"Indirizzo e-mail", s2_email_ph:"clinica@esempio.it",
    s2_pass:"Password", s2_pass_ph:"Minimo 6 caratteri",
    s3_title:"Telefono di Iris", s3_sub:"Il numero WhatsApp che Iris utilizzerà per assistere i tuoi pazienti.",
    s3_label:"Numero WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"Prefisso internazionale e locale compilati automaticamente — inserisci solo le ultime cifre.",
    s3_hint:"Questo numero apparirà precompilato nella sezione Segretaria Virtuale.",
    btn_back:"Indietro", btn_next:"Continua →", btn_finish:"Completa e accedi", btn_loading:"Creazione account...",
    footer:"Hai già un account?", footer_link:"Accedi",
    err_state:"Scegli uno stato / provincia", err_name:"Inserisci il nome della clinica",
    err_email:"Inserisci l'indirizzo e-mail", err_pass:"La password deve contenere almeno 6 caratteri",
    err_phone:"Inserisci il numero WhatsApp di Iris", err_create:"Errore nella creazione della clinica",
  },
  "ru": {
    dir:"ltr", setup:"Начальная настройка",
    steps:["Язык","Страна","Клиника","Iris"],
    s0_title:"Выберите язык", s0_sub:"Панель и Iris будут использовать этот язык.",
    s1_title:"Страна и местоположение", s1_sub:"Где находится ваша клиника?",
    s1_country:"Страна", s1_postal_br:"Почтовый индекс", s1_postal:"Почтовый индекс",
    s1_postal_hint_br:"Определяет регион автоматически.", s1_postal_hint:"Определяет город автоматически.",
    s1_state:"Регион / Область", s1_select:"Выбрать...", s1_timezone:"Часовой пояс",
    s1_searching:"🔍 Поиск...", s1_cep_err:"Индекс не найден.", s1_cep_err2:"Ошибка поиска.",
    s1_postal_err:"Индекс не найден.", s1_postal_err2:"Ошибка поиска индекса.",
    s2_title:"Данные клиники", s2_sub:"Информация для создания вашего аккаунта.",
    s2_name:"Название клиники", s2_name_ph:"Напр: Стоматологическая клиника",
    s2_email:"Адрес электронной почты", s2_email_ph:"clinica@example.com",
    s2_pass:"Пароль", s2_pass_ph:"Минимум 6 символов",
    s3_title:"Телефон Iris", s3_sub:"Номер WhatsApp, который Iris будет использовать для обслуживания ваших пациентов.",
    s3_label:"Номер WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"Код страны и региона заполнены автоматически — введите только последние цифры.",
    s3_hint:"Этот номер будет предзаполнен в разделе Виртуальная Секретарь.",
    btn_back:"Назад", btn_next:"Продолжить →", btn_finish:"Завершить и войти", btn_loading:"Создание аккаунта...",
    footer:"Уже есть аккаунт?", footer_link:"Войти",
    err_state:"Выберите регион / область", err_name:"Введите название клиники",
    err_email:"Введите адрес электронной почты", err_pass:"Пароль должен содержать не менее 6 символов",
    err_phone:"Введите номер WhatsApp Iris", err_create:"Ошибка при создании клиники",
  },
  "ar": {
    dir:"rtl", setup:"الإعداد الأولي",
    steps:["اللغة","البلد","العيادة","Iris"],
    s0_title:"اختر اللغة", s0_sub:"سيستخدم اللوحة وIris هذه اللغة.",
    s1_title:"البلد والموقع", s1_sub:"أين تقع عيادتك؟",
    s1_country:"البلد", s1_postal_br:"الرمز البريدي", s1_postal:"الرمز البريدي",
    s1_postal_hint_br:"يحدد الولاية تلقائياً.", s1_postal_hint:"يحدد المدينة تلقائياً.",
    s1_state:"الولاية / المقاطعة", s1_select:"اختر...", s1_timezone:"المنطقة الزمنية",
    s1_searching:"🔍 جارٍ البحث...", s1_cep_err:"الرمز البريدي غير موجود.", s1_cep_err2:"خطأ في البحث.",
    s1_postal_err:"الرمز البريدي غير موجود.", s1_postal_err2:"خطأ في البحث.",
    s2_title:"بيانات العيادة", s2_sub:"معلومات لإنشاء حسابك.",
    s2_name:"اسم العيادة", s2_name_ph:"مثال: عيادة طب الأسنان",
    s2_email:"البريد الإلكتروني", s2_email_ph:"clinic@example.com",
    s2_pass:"كلمة المرور", s2_pass_ph:"6 أحرف على الأقل",
    s3_title:"هاتف Iris", s3_sub:"رقم WhatsApp الذي ستستخدمه Iris لخدمة مرضاك.",
    s3_label:"رقم WhatsApp", s3_ph_ddd:"9 9999-9999", s3_ph:"99 9 9999-9999",
    s3_auto:"تم ملء رمز البلد والمنطقة تلقائياً — أدخل الأرقام الأخيرة فقط.",
    s3_hint:"سيظهر هذا الرقم محدداً مسبقاً في قسم السكرتيرة الافتراضية.",
    btn_back:"رجوع", btn_next:"متابعة →", btn_finish:"إنهاء وتسجيل الدخول", btn_loading:"جارٍ إنشاء الحساب...",
    footer:"لديك حساب بالفعل؟", footer_link:"تسجيل الدخول",
    err_state:"اختر ولاية / مقاطعة", err_name:"أدخل اسم العيادة",
    err_email:"أدخل البريد الإلكتروني", err_pass:"يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل",
    err_phone:"أدخل رقم WhatsApp الخاص بـ Iris", err_create:"حدث خطأ أثناء إنشاء العيادة",
  },
} as const;
type OBLang = keyof typeof OB_T;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const labelSt: React.CSSProperties = {display:"block",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6};
const inputSt: React.CSSProperties = {width:"100%",padding:"11px 14px",borderRadius:10,border:"1px solid rgba(43,122,120,0.35)",fontSize:13,outline:"none",transition:"border-color 0.2s",fontFamily:"'Sora',sans-serif",boxSizing:"border-box"};
const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "#2B7A78");
const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(43,122,120,0.35)");

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]     = useState(0);

  // Step 0
  const [idioma, setIdioma] = useState("pt-br");

  // Step 1
  const [pais, setPais]     = useState("br");
  const [paisOpen, setPaisOpen] = useState(false);
  const [estado, setEstado] = useState("");
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [cep, setCep]       = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState("");
  const [fuso, setFuso]     = useState("America/Sao_Paulo");

  // Step 2
  const [nome, setNome]     = useState("");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");

  // Step 3
  const [telefone, setTelefone] = useState("");
  const [ddd, setDdd] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const tx = OB_T[idioma as OBLang] ?? OB_T["pt-br"];
  const paisesFiltrados = PAIS_POR_IDIOMA[idioma] || [];
  const estadoOpts = ESTADOS_MAP[pais] || [];
  const currentPais = paisesFiltrados.find(c => c.v === pais);
  const ddi = DDI_MAP[pais] || "";
  const prefixo = ddd ? `${ddi} (${ddd})` : ddi;

  // Aplica fuso quando país muda
  useEffect(() => {
    const f = FUSO_MAP[pais] || "";
    if (f) setFuso(f);
  }, [pais]);

  async function loadDdd(p: string, s: string) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/paises_config?codigo=eq.${p}&select=ddd_por_estado`, {
        headers: { apikey: SUPABASE_KEY }
      });
      const rows = await res.json();
      const mapa: Record<string,string> = rows[0]?.ddd_por_estado || {};
      setDdd(mapa[s] || "");
    } catch { setDdd(""); }
  }

  function selectIdioma(code: string) {
    setIdioma(code);
    const primeiro = PAIS_POR_IDIOMA[code]?.[0]?.v || "br";
    selectPais(primeiro);
  }

  function selectPais(p: string) {
    setPais(p);
    setPaisOpen(false);
    setEstado("");
    setDdd("");
    setCep("");
    setCepErro("");
    const f = FUSO_MAP[p] || "";
    if (f) setFuso(f);
  }

  function selectEstado(s: string) {
    setEstado(s);
    setEstadoOpen(false);
    const fusoEstado = FUSO_ESTADO_MAP[pais]?.[s];
    if (fusoEstado) setFuso(fusoEstado);
    loadDdd(pais, s);
  }

  async function buscarCep(raw: string) {
    const limpo = raw.replace(/\D/g, "");
    setCepErro("");
    if (pais === "br") {
      if (limpo.length < 8) return;
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const data = await res.json();
        if (data.erro) { setCepErro(tx.s1_cep_err); return; }
        const estadoNome = UF_TO_ESTADO_BR[data.uf] || "";
        if (estadoNome && estadoOpts.includes(estadoNome)) { selectEstado(estadoNome); loadDdd(pais, estadoNome); }
      } catch { setCepErro(tx.s1_cep_err2); }
      finally { setCepLoading(false); }
      return;
    }
    if (limpo.length < 3) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/${pais}/${limpo}`);
      if (!res.ok) { setCepErro(tx.s1_postal_err); return; }
      const data = await res.json();
      const estadoNome = data.places?.[0]?.state || "";
      if (estadoNome && estadoOpts.includes(estadoNome)) selectEstado(estadoNome);
    } catch { setCepErro(tx.s1_postal_err2); }
    finally { setCepLoading(false); }
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const senhaHash = await sha256(senha);
      const res = await fetch(CRIAR_CLINICA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": CRIAR_CLINICA_KEY },
        body: JSON.stringify({ nome, email, senha_hash: senhaHash, idioma, pais, estado, cep, fuso_horario: fuso, telefone_agente: ddd ? `${ddd}${telefone}` : telefone }),
      });
      const data = await res.json();
      if (!res.ok || data.sucesso === false || data.success === false)
        throw new Error(data.erro || data.error || data.message || tx.err_create);
      const clinicaId = data.clinica_id || data.id || "";
      localStorage.setItem("auth_token",   data.auth_token  || data.token || senhaHash);
      localStorage.setItem("clinica_id",   clinicaId);
      localStorage.setItem("user_id",      data.user_id     || "");
      localStorage.setItem("clinica_nome", nome);
      // Garante que estado e cep ficam salvos (Edge Function pode não persistir)
      if (clinicaId && (estado || cep)) {
        await fetch(`${SUPABASE_URL}/rest/v1/clinicas?id=eq.${clinicaId}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ ...(estado && { estado }), ...(cep && { cep }) }),
        });
      }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tx.err_create);
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setError("");
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      const precisaEstado = estadoOpts.length > 0;
      if (precisaEstado && !estado) { setError(tx.err_state); return; }
      setStep(2); return;
    }
    if (step === 2) {
      if (!nome.trim())     { setError(tx.err_name); return; }
      if (!email.trim())    { setError(tx.err_email); return; }
      if (senha.length < 6) { setError(tx.err_pass); return; }
      setStep(3); return;
    }
    if (step === 3) {
      if (!telefone.trim()) { setError(tx.err_phone); return; }
      submit();
    }
  }

  function back() { if (step > 0) { setStep(s => s - 1); setError(""); } }

  return (
    <div dir={tx.dir} style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(135deg,#DEF2F1 0%,#f0fafa 50%,#ffffff 100%)"}}>

      <motion.div initial={{opacity:0,y:24,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
        transition={{duration:0.5,ease:[0.16,1,0.3,1]}}
        style={{width:"100%",maxWidth: step === 0 ? 480 : 460,background:"#fff",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.10)",border:"1px solid #f1f5f9",padding:32}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(43,122,120,0.3)"}}>
            <svg viewBox="0 0 24 24" style={{width:20,height:20}} fill="white">
              <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
              <circle cx="12" cy="12" r="6" fillOpacity="0.35"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"#1e293b",fontFamily:"'Sora',sans-serif"}}>IRIS</div>
            <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{tx.setup}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {tx.steps.map((s, i) => (
            <div key={i} style={{flex:1}}>
              <div style={{height:3,borderRadius:4,background: i <= step ? "#2B7A78" : "#e2e8f0",transition:"background 0.3s",marginBottom:4}}/>
              <span style={{fontSize:10,color: i === step ? "#2B7A78" : "#94a3b8",fontWeight: i === step ? 700 : 400,fontFamily:"'Sora',sans-serif"}}>{s}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 0 — Idioma */}
          {step === 0 && (
            <motion.div key="idioma" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>{tx.s0_title}</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>{tx.s0_sub}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => selectIdioma(l.code)}
                    style={{padding:"12px 10px",borderRadius:12,border: idioma === l.code ? "2px solid #2B7A78" : "2px solid #e2e8f0",background: idioma === l.code ? "rgba(43,122,120,0.07)" : "#f8fafc",cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"'Sora',sans-serif"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{l.flag}</div>
                    <div style={{fontSize:13,fontWeight:600,color: idioma === l.code ? "#2B7A78" : "#1e293b"}}>{l.label}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{l.sub}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — País + CEP + Estado + Fuso */}
          {step === 1 && (
            <motion.div key="pais" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>{tx.s1_title}</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>{tx.s1_sub}</p>

              <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:24}}>

                {/* País accordion */}
                <div>
                  <label style={labelSt}>{tx.s1_country}</label>
                  <button onClick={() => setPaisOpen(p => !p)}
                    style={{width:"100%",padding:"11px 14px",border:`1px solid ${paisOpen?"#2B7A78":"rgba(43,122,120,0.35)"}`,borderRadius:10,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"'Sora',sans-serif",transition:"all 0.2s",boxSizing:"border-box"}}>
                    <span style={{fontSize:18}}>{PAIS_FLAGS[pais] || "🌍"}</span>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:"#1e293b",textAlign:"left"}}>{currentPais?.l || pais}</span>
                    <motion.div animate={{rotate: paisOpen ? 180 : 0}} transition={{duration:0.2}} style={{color:"#94a3b8",flexShrink:0}}>
                      <ChevronDown size={16}/>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {paisOpen && (
                      <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22}} style={{overflow:"hidden"}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6,padding:"10px 0 4px"}}>
                          {paisesFiltrados.map(o => (
                            <button key={o.v} onClick={() => selectPais(o.v)}
                              style={{padding:"9px 12px",border:`1px solid ${pais===o.v?"#2B7A78":"rgba(43,122,120,0.35)"}`,borderRadius:8,background:pais===o.v?"rgba(43,122,120,0.08)":"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'Sora',sans-serif",transition:"all 0.15s"}}>
                              <span style={{fontSize:16}}>{PAIS_FLAGS[o.v]||"🌍"}</span>
                              <span style={{fontSize:12,fontWeight:pais===o.v?600:400,color:pais===o.v?"#2B7A78":"#475569"}}>{o.l}</span>
                              {pais===o.v&&<Check size={10} color="#2B7A78" style={{marginLeft:"auto"}}/>}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CEP + Estado */}
                <div style={estadoOpts.length > 0 ? {display:"grid",gridTemplateColumns:"1fr 1fr",gap:12} : undefined}>
                  <div>
                    <label style={labelSt}>
                      {pais === "br" ? tx.s1_postal_br : tx.s1_postal}
                      {cepLoading && <span style={{marginLeft:8,fontSize:11,color:"#2B7A78"}}>{tx.s1_searching}</span>}
                    </label>
                    <input value={cep} onChange={e => setCep(e.target.value)}
                      onBlur={e => { inputBlur(e); buscarCep(e.target.value); }}
                      placeholder={pais === "br" ? "Ex: 01310-100" : tx.s1_postal}
                      style={inputSt} onFocus={inputFocus}/>
                    {cepErro && <span style={{fontSize:11,color:"#ef4444",marginTop:4,display:"block"}}>{cepErro}</span>}
                    {!cepErro && <span style={{fontSize:11,color:"#94a3b8",marginTop:4,display:"block"}}>
                      {pais === "br" ? tx.s1_postal_hint_br : tx.s1_postal_hint}
                    </span>}
                  </div>

                  {estadoOpts.length > 0 && (
                    <div>
                      <label style={labelSt}>{tx.s1_state}</label>
                      <button onClick={() => setEstadoOpen(p => !p)}
                        style={{width:"100%",padding:"11px 14px",border:`1px solid ${estadoOpen?"#2B7A78":estado?"#2B7A78":"rgba(43,122,120,0.35)"}`,borderRadius:10,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'Sora',sans-serif",transition:"all 0.2s",boxSizing:"border-box"}}>
                        <span style={{flex:1,fontSize:13,color:estado?"#1e293b":"#94a3b8",textAlign:"left"}}>{estado||tx.s1_select}</span>
                        <motion.div animate={{rotate:estadoOpen?180:0}} transition={{duration:0.2}} style={{color:"#94a3b8",flexShrink:0}}>
                          <ChevronDown size={16}/>
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {estadoOpen && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22}} style={{overflow:"hidden"}}>
                            <div style={{maxHeight:200,overflowY:"auto",border:"1px solid rgba(43,122,120,0.2)",borderRadius:8,marginTop:4,background:"#fff"}}>
                              {estadoOpts.map(s => (
                                <button key={s} onClick={() => selectEstado(s)}
                                  style={{width:"100%",padding:"9px 12px",border:"none",borderBottom:"1px solid #f1f5f9",background:estado===s?"rgba(43,122,120,0.07)":"#fff",cursor:"pointer",textAlign:"left",fontSize:12,color:estado===s?"#2B7A78":"#475569",fontWeight:estado===s?600:400,fontFamily:"'Sora',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  {s}
                                  {estado===s&&<Check size={10} color="#2B7A78"/>}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Fuso */}
                <div>
                  <label style={labelSt}>{tx.s1_timezone}</label>
                  <input value={fuso} readOnly style={{...inputSt,background:"#f8fafc",color:"#64748b",cursor:"default"}}/>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2 — Dados da clínica */}
          {step === 2 && (
            <motion.div key="dados" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>{tx.s2_title}</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>{tx.s2_sub}</p>
              <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
                <div>
                  <label style={labelSt}>{tx.s2_name}</label>
                  <input value={nome} onChange={e => setNome(e.target.value)} placeholder={tx.s2_name_ph} style={inputSt} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
                <div>
                  <label style={labelSt}>{tx.s2_email}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={tx.s2_email_ph} style={inputSt} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
                <div>
                  <label style={labelSt}>{tx.s2_pass}</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder={tx.s2_pass_ph} style={inputSt} onFocus={inputFocus} onBlur={inputBlur}/>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Telefone da Iris */}
          {step === 3 && (
            <motion.div key="telefone" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.22}}>
              <h2 style={{fontSize:20,fontWeight:700,color:"#1e293b",marginBottom:4,fontFamily:"'Sora',sans-serif"}}>{tx.s3_title}</h2>
              <p style={{fontSize:13,color:"#94a3b8",marginBottom:20}}>{tx.s3_sub}</p>
              <div style={{marginBottom:24}}>
                <label style={labelSt}>{tx.s3_label}</label>
                <div style={{display:"flex",border:"1px solid rgba(43,122,120,0.35)",borderRadius:10,overflow:"hidden"}}>
                  <span style={{padding:"11px 14px",background:"#f1f5f9",borderRight:"1px solid rgba(43,122,120,0.35)",fontFamily:"monospace",fontSize:13,color:"#2B7A78",whiteSpace:"nowrap",flexShrink:0,letterSpacing:"0.02em"}}>
                    {prefixo}
                  </span>
                  <input value={telefone} onChange={e => setTelefone(e.target.value)}
                    placeholder={ddd ? tx.s3_ph_ddd : tx.s3_ph}
                    style={{flex:1,padding:"11px 14px",fontSize:13,border:"none",outline:"none",fontFamily:"'Sora',sans-serif"}}/>
                </div>
                {ddd && <p style={{fontSize:11,color:"#2B7A78",marginTop:6,fontWeight:500}}>{tx.s3_auto}</p>}
                <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{tx.s3_hint}</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:13,borderRadius:10,padding:"10px 14px",marginBottom:16}}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegação */}
        <div style={{display:"flex",gap:10}}>
          {step > 0 && (
            <button onClick={back}
              style={{flex:1,padding:"13px 0",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",fontSize:13,fontWeight:600,color:"#64748b",cursor:"pointer",fontFamily:"'Sora',sans-serif"}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#94a3b8")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#e2e8f0")}>
              {tx.btn_back}
            </button>
          )}
          <button onClick={next} disabled={loading}
            style={{flex:2,padding:"13px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",color:"#fff",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,fontFamily:"'Sora',sans-serif"}}>
            {loading ? tx.btn_loading : step === 3 ? tx.btn_finish : tx.btn_next}
          </button>
        </div>

        <p style={{textAlign:"center",fontSize:12,color:"#94a3b8",marginTop:20}}>
          {tx.footer}{" "}
          <a href="/login" style={{color:"#2B7A78",fontWeight:600,textDecoration:"none"}}>{tx.footer_link}</a>
        </p>

      </motion.div>
    </div>
  );
}
