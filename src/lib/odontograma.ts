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

// Cor dominante do dente (maior prioridade entre os achados ativos) — para o tint.
export function corDominante(eventos: EventoOdonto[]): string | null {
  let melhor = 99;
  let cor: string | null = null;
  for (const ev of eventos) {
    const cat = ACHADO_POR_ID[ev.achado_id]?.categoria;
    const p = cat ? PRIORIDADE_CATEGORIA.indexOf(cat) : 99;
    if (p >= 0 && p < melhor) { melhor = p; cor = corDoAchado(ev.achado_id); }
  }
  return cor;
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
