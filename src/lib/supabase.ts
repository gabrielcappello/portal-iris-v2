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
  nome: string; titulo: string; calendar_id: string; senha: string; ativo: boolean;
  inicio: string; fim: string; dur: number; alm_ini: string; alm_fim: string;
  sabado: boolean; sab_ini: string; sab_fim: string; horarios: string; modo: string;
  whatsapp: string; procedimentos: {nome:string;ativo:boolean;tempo:number}[];
};

export type Clinica = {
  id: string; nome: string; telefone_clinica: string;
  endereco: string; sala: string; bairro: string; cidade: string; cep: string;
  referencia: string; email_clinica: string; google_maps: string;
  whatsapp_instancia: string; nome_agente: string; personalidade: string;
  telefone_agente: string; idioma: string; pais_codigo: string;
  fuso_horario: string; estado: string; dentistas: Dentista[];
};

export type AnamnesePaciente = {
  alergias?: string; medicamentos_uso_continuo?: string;
  diabetes?: boolean; hipertensao?: boolean; gravidez?: boolean;
  observacoes_saude?: string; data_ultima_atualizacao?: string|null;
};

export type Paciente = {
  id: string; clinica_id: string; nome: string; telefone: string;
  documento: string; data_nascimento?: string; anamnese?: AnamnesePaciente;
};

export type Agendamento = {
  id: string; clinica_id: string; paciente_id?: string;
  nome: string; telefone: string; documento: string;
  data: string; horario: string; dentista_nome: string;
  procedimento: string; status: "confirmado"|"remarcado"|"cancelado"|"ok"|"faltou";
  event_id?: string; calendar_id?: string;
};
