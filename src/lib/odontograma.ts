// src/lib/odontograma.ts
//
// Tipos, catálogo de achados, geometria dos dentes e cliente para o odontograma.
// Toda comunicação com o Supabase passa pelo proxy /api/odontograma (server-side,
// usa a chave secreta). O frontend nunca fala direto com o banco aqui.

// ── Tipos ────────────────────────────────────────────────────────────────────

export type Zona =
  | "mesial" | "distal" | "oclusal" | "incisal"
  | "vestibular" | "lingual" | "palatina" | "cervical";

export type EstadoDente =
  | "presente" | "ausente" | "extraido" | "nao_erupcionado" | "impactado";

export type Arcada = "superior" | "inferior";
export type Lado = "direito" | "esquerdo";
export type TipoDente = "incisivo" | "canino" | "premolar" | "molar";
export type CategoriaAchado =
  | "patologia" | "restauracao" | "endodontia" | "protese_implante" | "sintoma";

export type EventoOdonto = {
  id: string;
  achado_id: string;
  zonas: Zona[] | null;
  detalhes: Record<string, unknown> | null;
  observacoes?: string | null;
  status?: string;
  criado_em?: string;
};

export type DenteOdonto = {
  id: string;
  numero_iso: string;
  arcada: Arcada;
  lado: Lado;
  tipo_dente: TipoDente;
  estado: EstadoDente;
  observacoes: string | null;
  eventos_ativos: EventoOdonto[];
};

// ── Catálogo de achados (fixo, espelha odontograma_achados_catalogo) ──────────

export type AchadoCatalogo = { id: string; nome: string; categoria: CategoriaAchado };

export const CORES_CATEGORIA: Record<CategoriaAchado, string> = {
  patologia:        "#dc2626", // vermelho
  restauracao:      "#2563eb", // azul
  endodontia:       "#7c3aed", // roxo
  protese_implante: "#0891b2", // ciano
  sintoma:          "#d97706", // âmbar
};

export const PRIORIDADE_CATEGORIA: CategoriaAchado[] = [
  "patologia", "sintoma", "endodontia", "protese_implante", "restauracao",
];

export const ACHADOS: AchadoCatalogo[] = [
  // patologia
  { id: "carie",                      nome: "Cárie",                       categoria: "patologia" },
  { id: "fratura",                    nome: "Fratura",                     categoria: "patologia" },
  { id: "desgaste",                   nome: "Desgaste",                    categoria: "patologia" },
  { id: "descoloracao",               nome: "Descoloração",                categoria: "patologia" },
  { id: "lesao_apical",               nome: "Lesão apical",                categoria: "patologia" },
  { id: "disturbio_desenvolvimento",  nome: "Distúrbio de desenvolvimento", categoria: "patologia" },
  { id: "raiz_retida",                nome: "Raiz retida",                 categoria: "patologia" },
  // restauração
  { id: "obturacao",                  nome: "Obturação",                   categoria: "restauracao" },
  { id: "onlay",                      nome: "Onlay",                       categoria: "restauracao" },
  { id: "coroa",                      nome: "Coroa",                       categoria: "restauracao" },
  { id: "faceta",                     nome: "Faceta",                      categoria: "restauracao" },
  // endodontia
  { id: "canal",                      nome: "Tratamento de canal",         categoria: "endodontia" },
  // prótese / implante
  { id: "implante",                   nome: "Implante",                    categoria: "protese_implante" },
  { id: "ponte",                      nome: "Ponte",                       categoria: "protese_implante" },
  // sintomas
  { id: "sintoma_frio",               nome: "Sensibilidade ao frio",       categoria: "sintoma" },
  { id: "sintoma_calor",              nome: "Sensibilidade ao calor",      categoria: "sintoma" },
  { id: "sintoma_percussao",          nome: "Dor à percussão",             categoria: "sintoma" },
  { id: "sintoma_espontanea",         nome: "Dor espontânea",              categoria: "sintoma" },
];

export const ACHADO_POR_ID: Record<string, AchadoCatalogo> =
  Object.fromEntries(ACHADOS.map(a => [a.id, a]));

export function corDoAchado(achadoId: string): string {
  const cat = ACHADO_POR_ID[achadoId]?.categoria;
  return cat ? CORES_CATEGORIA[cat] : "#64748b";
}

export const ROTULO_ESTADO: Record<EstadoDente, string> = {
  presente:        "Presente",
  ausente:         "Ausente",
  extraido:        "Extraído",
  nao_erupcionado: "Não erupcionado",
  impactado:       "Impactado",
};

// ── Geometria / layout ────────────────────────────────────────────────────────

// Ordem na tela, da esquerda para a direita.
// Superior: quadrante direito (18→11) + quadrante esquerdo (21→28).
// Inferior: quadrante direito (48→41) + quadrante esquerdo (31→38).
export const ARCADA_SUPERIOR = ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"];
export const ARCADA_INFERIOR = ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"];

// Zona central depende do tipo: molar/pré-molar têm oclusal; incisivo/canino têm incisal.
export function zonaCentral(tipo: TipoDente): Zona {
  return tipo === "molar" || tipo === "premolar" ? "oclusal" : "incisal";
}

// Zona inferior do glifo: superior → palatina; inferior → lingual.
export function zonaPalatinaLingual(arcada: Arcada): Zona {
  return arcada === "superior" ? "palatina" : "lingual";
}

// Mapa das 5 zonas do glifo (vista oclusal) → posição.
// mesial fica voltada para a linha média: lado direito → direita; esquerdo → esquerda.
export type GlifoZonas = {
  top: Zona;     // vestibular
  bottom: Zona;  // palatina / lingual
  center: Zona;  // oclusal / incisal
  left: Zona;
  right: Zona;
};

export function glifoZonas(d: Pick<DenteOdonto, "arcada" | "lado" | "tipo_dente">): GlifoZonas {
  const mesialNaDireita = d.lado === "direito";
  return {
    top: "vestibular",
    bottom: zonaPalatinaLingual(d.arcada),
    center: zonaCentral(d.tipo_dente),
    left:  mesialNaDireita ? "distal" : "mesial",
    right: mesialNaDireita ? "mesial" : "distal",
  };
}

// Zonas selecionáveis para um dente (inclui cervical, que não aparece no glifo).
export function zonasDoDente(d: Pick<DenteOdonto, "arcada" | "lado" | "tipo_dente">): Zona[] {
  return ["mesial", "distal", zonaCentral(d.tipo_dente), "vestibular", zonaPalatinaLingual(d.arcada), "cervical"];
}

export const ROTULO_ZONA: Record<Zona, string> = {
  mesial: "Mesial", distal: "Distal", oclusal: "Oclusal", incisal: "Incisal",
  vestibular: "Vestibular", lingual: "Lingual", palatina: "Palatina", cervical: "Cervical",
};

// Cor de cada zona do dente, derivada dos eventos ativos (maior prioridade vence).
export function coresPorZona(eventos: EventoOdonto[]): Partial<Record<Zona, string>> {
  const res: Partial<Record<Zona, string>> = {};
  const prioridade = (achadoId: string): number => {
    const cat = ACHADO_POR_ID[achadoId]?.categoria;
    const i = cat ? PRIORIDADE_CATEGORIA.indexOf(cat) : 99;
    return i < 0 ? 99 : i;
  };
  const melhor: Partial<Record<Zona, number>> = {};
  for (const ev of eventos) {
    if (!ev.zonas?.length) continue;
    const p = prioridade(ev.achado_id);
    for (const z of ev.zonas) {
      if (melhor[z] === undefined || p < melhor[z]!) {
        melhor[z] = p;
        res[z] = corDoAchado(ev.achado_id);
      }
    }
  }
  return res;
}

// Eventos do dente que não têm zona (ex.: implante, canal) → marcador no dente todo.
export function eventosSemZona(eventos: EventoOdonto[]): EventoOdonto[] {
  return eventos.filter(e => !e.zonas?.length);
}

// ── Plano de tratamento (modelado dentro de detalhes jsonb) ───────────────────

export type Intencao = "existente" | "planejado";
export type PlanoStatus = "pendente" | "realizado";
export type PlanoAchado = { intencao: Intencao; procedimento?: string; valor?: number; status: PlanoStatus | null };

export function getPlano(ev: EventoOdonto): PlanoAchado {
  const d = (ev.detalhes ?? {}) as Record<string, unknown>;
  const intencao: Intencao = d.intencao === "planejado" ? "planejado" : "existente";
  const status: PlanoStatus | null =
    d.plano_status === "realizado" ? "realizado" : (intencao === "planejado" ? "pendente" : null);
  return {
    intencao,
    procedimento: typeof d.procedimento === "string" ? d.procedimento : undefined,
    valor: typeof d.valor === "number" ? d.valor : undefined,
    status,
  };
}

export function ehPlanejadoPendente(ev: EventoOdonto): boolean {
  const p = getPlano(ev);
  return p.intencao === "planejado" && p.status !== "realizado";
}

export function valorPendenteDente(d: DenteOdonto): number {
  return d.eventos_ativos.reduce(
    (s, ev) => (ehPlanejadoPendente(ev) ? s + (getPlano(ev).valor ?? 0) : s), 0);
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const COR_EXISTENTE = "#2563eb"; // azul — já está na boca
export const COR_A_FAZER  = "#dc2626"; // vermelho — planejado

// Cor por especialidade da clínica (procedimentos). Chave = campo `esp` dos preços.
export const COR_ESPECIALIDADE: Record<string, string> = {
  "🦷 Clínico Geral":   "#2563eb",
  "🔧 Endodontia":      "#7c3aed",
  "📐 Ortodontia":      "#0891b2",
  "🔩 Implantodontia":  "#0d9488",
  "🦴 Prótese":         "#ca8a04",
  "🩺 Periodontia":     "#db2777",
  "✨ Estética":        "#d946ef",
  "👶 Odontopediatria": "#f59e0b",
  "🔪 Cirurgia":        "#dc2626",
  "🩻 Radiologia":      "#64748b",
};

// Nome a exibir do evento: procedimento da clínica (em detalhes) ou achado do catálogo.
export function nomeEvento(ev: EventoOdonto): string {
  const d = (ev.detalhes ?? {}) as Record<string, unknown>;
  if (typeof d.procedimento === "string") return d.procedimento;
  return ACHADO_POR_ID[ev.achado_id]?.nome ?? ev.achado_id;
}

// Cor do evento: por especialidade (procedimento) ou por categoria (achado do catálogo).
export function corEvento(ev: EventoOdonto): string {
  const d = (ev.detalhes ?? {}) as Record<string, unknown>;
  if (typeof d.esp === "string" && COR_ESPECIALIDADE[d.esp]) return COR_ESPECIALIDADE[d.esp];
  return corDoAchado(ev.achado_id);
}

// Cor dominante do dente — para o tint. Prioriza um "a fazer" pendente.
export function corDominante(eventos: EventoOdonto[]): string | null {
  if (!eventos.length) return null;
  const aFazer = eventos.find(ehPlanejadoPendente);
  return corEvento(aFazer ?? eventos[0]);
}

// ── Cliente (via proxy /api/odontograma) ──────────────────────────────────────

async function callRpc<T = unknown>(rpc: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/odontograma", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rpc, params }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.detalhe || json?.message || "Erro no odontograma.");
  }
  return json.data as T;
}

type RespostaCompleta = { dentes: DenteOdonto[] };

/** Carrega o odontograma; inicializa os 32 dentes se ainda não existirem. */
export async function carregarOdontograma(pacienteId: string, clinicaId: string): Promise<DenteOdonto[]> {
  let resp = await callRpc<RespostaCompleta>("buscar_odontograma_completo", { p_paciente_id: pacienteId });
  if (!resp?.dentes?.length) {
    await callRpc("inicializar_odontograma", { p_paciente_id: pacienteId, p_clinica_id: clinicaId });
    resp = await callRpc<RespostaCompleta>("buscar_odontograma_completo", { p_paciente_id: pacienteId });
  }
  return resp?.dentes ?? [];
}

/** Só lê o odontograma (não inicializa). Vazio se o paciente nunca abriu. */
export async function buscarOdontograma(pacienteId: string): Promise<DenteOdonto[]> {
  const resp = await callRpc<RespostaCompleta>("buscar_odontograma_completo", { p_paciente_id: pacienteId });
  return resp?.dentes ?? [];
}

export type TratamentoRealizado = {
  dente: string; procedimento: string; valor?: number; data?: string; zonas?: Zona[] | null;
};

/** Lista os procedimentos marcados como realizados (para a ficha do paciente). */
export async function listarTratamentosRealizados(pacienteId: string): Promise<TratamentoRealizado[]> {
  const dentes = await buscarOdontograma(pacienteId);
  const itens: TratamentoRealizado[] = [];
  for (const d of dentes) {
    for (const ev of d.eventos_ativos) {
      if (getPlano(ev).status === "realizado") {
        itens.push({ dente: d.numero_iso, procedimento: nomeEvento(ev), valor: getPlano(ev).valor ?? undefined, data: ev.criado_em, zonas: ev.zonas });
      }
    }
  }
  return itens.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
}

export async function registrarAchado(args: {
  denteId: string; clinicaId: string; pacienteId: string; achadoId: string;
  zonas: Zona[]; detalhes?: Record<string, unknown>; observacoes?: string;
  consultaId?: string | null; criadoPor?: string;
}): Promise<void> {
  await callRpc("registrar_achado_odontograma", {
    p_dente_id: args.denteId,
    p_clinica_id: args.clinicaId,
    p_paciente_id: args.pacienteId,
    p_achado_id: args.achadoId,
    p_zonas: args.zonas,
    p_detalhes: args.detalhes ?? {},
    p_observacoes: args.observacoes ?? null,
    p_consulta_id: args.consultaId ?? null,
    p_criado_por: args.criadoPor ?? null,
  });
}

export async function resolverAchado(args: {
  eventoId: string; status: "resolvido" | "substituido"; resolvidoPor?: string; substitutoId?: string | null;
}): Promise<void> {
  await callRpc("resolver_achado_odontograma", {
    p_evento_id: args.eventoId,
    p_status: args.status,
    p_resolvido_por: args.resolvidoPor ?? null,
    p_evento_substituto_id: args.substitutoId ?? null,
  });
}

// ── Sondagem periodontal ──────────────────────────────────────────────────────

export type SondagemDente = {
  dente_id: string; numero_iso: string; data_exame?: string;
  prof_mv?: number | null; prof_v?: number | null; prof_dv?: number | null;
  prof_ml?: number | null; prof_l?: number | null; prof_dl?: number | null;
  marg_mv?: number | null; marg_v?: number | null; marg_dv?: number | null;
  marg_ml?: number | null; marg_l?: number | null; marg_dl?: number | null;
  mobilidade?: number | null; furcacao?: number | null;
  sangramento?: boolean; placa?: boolean; supuracao?: boolean; tartaro?: boolean;
};

export const SITES_PROF: (keyof SondagemDente)[] = ["prof_mv", "prof_v", "prof_dv", "prof_ml", "prof_l", "prof_dl"];

// Maior profundidade de bolsa registrada (para alerta visual). >=4mm = atenção.
export function piorBolsa(s?: SondagemDente | null): number {
  if (!s) return 0;
  return SITES_PROF.reduce((m, k) => { const v = s[k]; return typeof v === "number" && v > m ? v : m; }, 0);
}

export async function buscarSondagem(pacienteId: string): Promise<SondagemDente[]> {
  return (await callRpc<SondagemDente[]>("buscar_sondagem_periodontal", { p_paciente_id: pacienteId })) ?? [];
}

export async function registrarSondagem(args: {
  denteId: string; clinicaId: string; pacienteId: string;
  prof: (number | null)[]; marg: (number | null)[]; // [mv,v,dv,ml,l,dl]
  mobilidade?: number | null; furcacao?: number | null;
  sangramento?: boolean; placa?: boolean; supuracao?: boolean; tartaro?: boolean;
  criadoPor?: string;
}): Promise<void> {
  await callRpc("registrar_sondagem_periodontal", {
    p_dente_id: args.denteId, p_clinica_id: args.clinicaId, p_paciente_id: args.pacienteId,
    p_prof_mv: args.prof[0], p_prof_v: args.prof[1], p_prof_dv: args.prof[2],
    p_prof_ml: args.prof[3], p_prof_l: args.prof[4], p_prof_dl: args.prof[5],
    p_marg_mv: args.marg[0], p_marg_v: args.marg[1], p_marg_dv: args.marg[2],
    p_marg_ml: args.marg[3], p_marg_l: args.marg[4], p_marg_dl: args.marg[5],
    p_mobilidade: args.mobilidade ?? null, p_furcacao: args.furcacao ?? null,
    p_sangramento: !!args.sangramento, p_placa: !!args.placa,
    p_supuracao: !!args.supuracao, p_tartaro: !!args.tartaro,
    p_criado_por: args.criadoPor ?? null,
  });
}

export async function atualizarEstadoDente(args: {
  denteId: string; estado: EstadoDente; atualizadoPor?: string; observacoes?: string;
}): Promise<void> {
  await callRpc("atualizar_estado_dente", {
    p_dente_id: args.denteId,
    p_estado: args.estado,
    p_atualizado_por: args.atualizadoPor ?? null,
    p_observacoes: args.observacoes ?? null,
  });
}
