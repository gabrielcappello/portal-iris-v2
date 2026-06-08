const SUPABASE_URL = 'https://udizowyfjnhuhgxkeayk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaXpvd3lmam5odWhneGtlYXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ1NDgsImV4cCI6MjA5NTQyMDU0OH0.EGX17VhE0IBlX5K-aqvJeAQ3GDIiDD-w-hXgTyQiaws';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

export const sb = {
  async query<T>(table: string, params = ''): Promise<T[]> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table: string, id: string, data: Record<string, unknown>) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.ok;
  },

  async insert(table: string, data: Record<string, unknown>) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export type Clinica = {
  id: string;
  nome_clinica: string;
  telefone_clinica: string;
  endereco: string;
  cidade: string;
  whatsapp_instancia: string;
  nome_agente: string;
  personalidade: string;
};

export type Paciente = {
  id: string;
  clinica_id: string;
  nome: string;
  telefone: string;
  documento: string;
  data_nascimento?: string;
  ultima_consulta?: string;
  total_consultas?: number;
};

export type Agendamento = {
  id: string;
  clinica_id: string;
  paciente_id?: string;
  nome: string;
  telefone: string;
  documento: string;
  data: string;
  horario: string;
  dentista_nome: string;
  procedimento: string;
  status: 'confirmado' | 'remarcado' | 'cancelado';
  event_id?: string;
  calendar_id?: string;
};
