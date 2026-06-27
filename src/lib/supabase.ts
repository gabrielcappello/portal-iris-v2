export const SUPABASE_URL = "https://udizowyfjnhuhgxkeayk.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXpvd3lmam5odWhneGtlYXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ1NDgsImV4cCI6MjA5NTQyMDU0OH0.EGX17VhE0IBlX5K-aqvJeAQ3GDIiDD-w-hXgTyQiaws";

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

export const sb = {
  async query<T>(table: string, params = ""): Promise<T[]> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: H });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async update(table: string, id: string, data: Record<string, unknown>) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
  },
  async insert(table: string, data: Record<string, unknown>) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

export type Dentista = {
  nome: string; titulo: string; calendar_id: string; token_acesso?: string; senha: string; ativo: boolean;
  inicio: string; fim: string; dur: number; alm_ini: string; alm_fim: string;
  sabado: boolean; sab_ini: string; sab_fim: string; horarios: string; modo: string;
  whatsapp: string; procedimentos: {nome:string;ativo:boolean;tempo:number}[];
};

export type Assistente = {
  token_acesso: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  permissoes: {
    ver_todas_agendas: boolean;
    editar_agendas: boolean;
    criar_agendamentos: boolean;
    remarcar_agendamentos: boolean;
    cancelar_agendamentos: boolean;
    ver_pacientes: boolean;
    enviar_mensagens_pacientes: boolean;
    editar_pacientes: boolean;
    editar_anamnese: boolean;
    ver_financeiro: boolean;
    editar_financeiro: boolean;
    ver_relatorios: boolean;
    gerenciar_dentistas: boolean;
    gerenciar_procedimentos: boolean;
    gerenciar_horarios: boolean;
    gerenciar_assistentes: boolean;
    editar_configuracoes_clinica: boolean;
  };
};

export type Clinica = {
  id: string; nome: string; telefone_clinica: string;
  endereco: string; sala: string; bairro: string; cidade: string; cep: string;
  referencia: string; email_clinica: string; google_maps: string;
  whatsapp_instancia: string; nome_agente: string; personalidade: string;
  telefone_agente: string; whatsapp_admin?: string; idioma: string; pais_codigo: string;
  fuso_horario: string; estado: string; dentistas: Dentista[]; assistentes?: Assistente[];
  automatizacoes?: Record<string,unknown>; horario_funcionamento?: Record<string,unknown>;
  whatsapp_status?: string; maps_link?: string; plano?: string;
  precios?: {esp:string;nome:string;valor:number;tempo:number;mostrar_valor?:boolean}[];
};

export function calcularIdade(dataNascimento?: string|null): string {
  if (!dataNascimento) return "";
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return "";
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();
  if (hoje.getDate() < nasc.getDate()) meses--;
  if (meses < 0) { anos--; meses += 12; }
  const totalMeses = anos * 12 + meses;
  if (totalMeses < 24) return `${totalMeses} ${totalMeses === 1 ? "mês" : "meses"}`;
  if (anos < 12) return `${anos} ${anos === 1 ? "ano" : "anos"} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

export type AnamnesePaciente = {
  alergias?: string; medicamentos_uso_continuo?: string;
  diabetes?: boolean; hipertensao?: boolean; gravidez?: boolean; fumante?: boolean;
  observacoes_saude?: string; data_ultima_atualizacao?: string|null;
};

export type Paciente = {
  id: string; clinica_id: string; nome: string; telefone: string;
  documento: string; data_nascimento?: string; email?: string; anamnese?: AnamnesePaciente;
};

export type Agendamento = {
  id: string; clinica_id: string; paciente_id?: string;
  nome: string; telefone: string; documento: string;
  data: string; horario: string; dentista_nome: string;
  procedimento: string; status: "confirmado"|"remarcado"|"cancelado"|"ok"|"faltou";
  event_id?: string; calendar_id?: string;
};
