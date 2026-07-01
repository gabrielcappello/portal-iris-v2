// src/lib/orcamento.ts
//
// Orçamento = origem oficial do financeiro (Fase 2). Fica separado de
// lib/financeiro.ts de propósito (entidades/responsabilidades distintas).
// Preparado para o Plano de Tratamento como entidade-pai: todo orçamento
// nasce ligado a um plano (planos_tratamento).

import { sb } from "./supabase";

export type OrcamentoStatus = "aberto" | "aprovado" | "recusado" | "cancelado";

export type Orcamento = {
  id: string;
  clinica_id: string;
  paciente_id?: string | null;
  plano_tratamento_id?: string | null;
  titulo?: string | null;
  status: OrcamentoStatus;
  valor_total: number;
  desconto: number;
  valor_final: number;
  observacoes?: string | null;
  criado_em?: string | null;
  criado_por?: string | null;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
};

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  descricao?: string | null;
  dente?: string | null;
  valor: number;
  origem_tipo?: string | null;
  origem_id?: string | null;
};

export type ItemNovo = { descricao: string; dente?: string | null; valor: number; origem_id?: string | null };

export const ROTULO_STATUS_ORC: Record<OrcamentoStatus, string> = {
  aberto: "Aberto", aprovado: "Aprovado", recusado: "Recusado", cancelado: "Cancelado",
};

// ── Plano de Tratamento (entidade-pai; reutiliza o ativo do paciente) ─────────

async function garantirPlano(clinicaId: string, pacienteId: string, criadoPor?: string | null): Promise<string> {
  const existentes = await sb.query<{ id: string }>(
    "planos_tratamento",
    `?clinica_id=eq.${clinicaId}&paciente_id=eq.${pacienteId}&status=eq.ativo&select=id&limit=1`
  );
  if (existentes[0]?.id) return existentes[0].id;
  const criado = await sb.insert("planos_tratamento", {
    clinica_id: clinicaId, paciente_id: pacienteId, criado_por: criadoPor || null,
  }) as { id: string }[];
  return criado[0].id;
}

// ── Orçamento ─────────────────────────────────────────────────────────────────

export async function criarOrcamentoDoPlano(args: {
  clinicaId: string; pacienteId: string; criadoPor?: string | null;
  itens: ItemNovo[]; titulo?: string; observacoes?: string;
}): Promise<Orcamento> {
  const planoId = await garantirPlano(args.clinicaId, args.pacienteId, args.criadoPor);
  const total = args.itens.reduce((s, i) => s + (Number(i.valor) || 0), 0);

  const criado = await sb.insert("financeiro_orcamentos", {
    clinica_id: args.clinicaId, paciente_id: args.pacienteId, plano_tratamento_id: planoId,
    titulo: args.titulo || "Orçamento", status: "aberto",
    valor_total: total, desconto: 0, valor_final: total,
    observacoes: args.observacoes || null, criado_por: args.criadoPor || null,
  }) as Orcamento[];
  const orc = criado[0];

  if (args.itens.length) {
    await sb.insert("financeiro_orcamento_itens", args.itens.map(i => ({
      orcamento_id: orc.id, descricao: i.descricao, dente: i.dente || null,
      valor: i.valor, origem_tipo: "odontograma", origem_id: i.origem_id || null,
    })) as unknown as Record<string, unknown>);
  }
  return orc;
}

export async function listarOrcamentos(clinicaId: string, pacienteId?: string): Promise<Orcamento[]> {
  const filtroPac = pacienteId ? `&paciente_id=eq.${pacienteId}` : "";
  return sb.query<Orcamento>("financeiro_orcamentos", `?clinica_id=eq.${clinicaId}${filtroPac}&order=criado_em.desc`);
}

export async function buscarItens(orcamentoId: string): Promise<OrcamentoItem[]> {
  return sb.query<OrcamentoItem>("financeiro_orcamento_itens", `?orcamento_id=eq.${orcamentoId}&order=criado_em.asc`);
}

export async function atualizarDesconto(id: string, valorTotal: number, desconto: number): Promise<void> {
  const d = Math.max(0, Math.min(desconto || 0, valorTotal));
  await sb.update("financeiro_orcamentos", id, { desconto: d, valor_final: valorTotal - d });
}

export async function aprovarOrcamento(id: string, aprovadoPor?: string | null): Promise<void> {
  await sb.update("financeiro_orcamentos", id, {
    status: "aprovado", aprovado_em: new Date().toISOString(), aprovado_por: aprovadoPor || null,
  });
}

export async function recusarOrcamento(id: string): Promise<void> {
  await sb.update("financeiro_orcamentos", id, { status: "recusado" });
}

export async function cancelarOrcamento(id: string): Promise<void> {
  await sb.update("financeiro_orcamentos", id, { status: "cancelado" });
}
