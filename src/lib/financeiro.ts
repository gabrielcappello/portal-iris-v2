// src/lib/financeiro.ts
//
// Acesso a dados + tipos do módulo Financeiro. Segue o padrão do resto do painel
// (sb.query/insert/update com filtro por clinica_id; RLS allow_all no banco).

import { sb } from "./supabase";

export type LancamentoTipo = "receita" | "despesa";
export type LancamentoStatus = "pendente" | "pago" | "cancelado";
export type FormaPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto";
// Origem rastreável — preparado para as próximas fases (orçamento, convênio, comissão).
export type OrigemTipo = "odontograma" | "orcamento" | "manual" | "convenio" | "comissao" | "ajuste" | "agendamento";

export type Lancamento = {
  id: string;
  clinica_id: string;
  paciente_id?: string | null;
  paciente_nome?: string | null;
  tipo: LancamentoTipo;
  descricao?: string | null;
  valor: number;
  status: LancamentoStatus;
  data_vencimento?: string | null;
  data_pagamento?: string | null;
  forma_pagamento?: FormaPagamento | null;
  // Rastreabilidade
  origem_tipo?: OrigemTipo | null;
  origem_id?: string | null;   // referência genérica (evento, orçamento, etc.)
  ref_dente?: string | null;
  dentista_nome?: string | null;
  categoria?: string | null;
  // Parcelamento
  parcela_numero?: number | null;
  parcela_total?: number | null;
  // Auditoria
  criado_por?: string | null;
  criado_em?: string | null;
  pago_por?: string | null;
  pagamento_observacao?: string | null;
};

export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro", pix: "PIX",
  cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", boleto: "Boleto",
};

export const FORMAS: FormaPagamento[] = ["dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto"];

// ── Config financeira por clínica (feature flags) ─────────────────────────────

// Quando a receita nasce: ao aprovar o orçamento, ao realizar o procedimento, ou manual.
export type GatilhoReceita = "aprovacao" | "realizado" | "manual";

export type ConfigFinanceiro = {
  convenios: boolean;             // mostra campos de convênio
  comissao_dentistas: boolean;    // sistema de % de repasse
  despesas: boolean;              // aba de contas a pagar
  gatilho_receita: GatilhoReceita; // desacoplamento execução↔faturamento
};

export const CONFIG_FIN_PADRAO: ConfigFinanceiro = {
  convenios: false,
  comissao_dentistas: false,
  despesas: true,
  gatilho_receita: "realizado", // padrão preserva o comportamento atual
};

export const ROTULO_GATILHO: Record<GatilhoReceita, string> = {
  aprovacao: "Ao aprovar o orçamento",
  realizado: "Ao marcar realizado",
  manual: "Manual (sem automático)",
};

export function lerConfigFinanceiro(raw: unknown): ConfigFinanceiro {
  const c = (raw ?? {}) as Partial<ConfigFinanceiro>;
  return { ...CONFIG_FIN_PADRAO, ...c };
}

// ── Utils ─────────────────────────────────────────────────────────────────────

export function formatBRL(v: number): string {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// Vencido = receita pendente com vencimento anterior a hoje (inadimplência).
export function estaVencido(l: Lancamento): boolean {
  return l.tipo === "receita" && l.status === "pendente"
    && !!l.data_vencimento && l.data_vencimento.slice(0, 10) < hoje();
}

// ── Cliente ───────────────────────────────────────────────────────────────────

export async function listarLancamentos(clinicaId: string): Promise<Lancamento[]> {
  return sb.query<Lancamento>(
    "financeiro_lancamentos",
    `?clinica_id=eq.${clinicaId}&order=data_vencimento.desc,criado_em.desc`
  );
}

// Lançamentos de um paciente (para a aba Financeiro na ficha).
export async function listarLancamentosPaciente(pacienteId: string): Promise<Lancamento[]> {
  return sb.query<Lancamento>(
    "financeiro_lancamentos",
    `?paciente_id=eq.${pacienteId}&order=data_vencimento.asc,criado_em.asc`
  );
}

export async function criarLancamento(data: Partial<Lancamento>): Promise<Lancamento[]> {
  return sb.insert("financeiro_lancamentos", data as Record<string, unknown>);
}

// Gera N parcelas (cada uma = 1 lançamento receita a receber) a partir de um valor.
export async function gerarParcelasReceita(args: {
  clinicaId: string; pacienteId?: string | null; pacienteNome?: string | null;
  valor: number; parcelas: number; descricaoBase: string;
  origemId?: string | null; criadoPor?: string | null; primeiroVencimento?: string;
}): Promise<void> {
  const n = Math.max(1, Math.floor(args.parcelas || 1));
  const totalCent = Math.round((args.valor || 0) * 100);
  const baseCent = Math.floor(totalCent / n);
  const base = new Date(args.primeiroVencimento || hoje());

  const linhas: Partial<Lancamento>[] = [];
  for (let i = 0; i < n; i++) {
    const cent = i === n - 1 ? totalCent - baseCent * (n - 1) : baseCent;
    const venc = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
    linhas.push({
      clinica_id: args.clinicaId, paciente_id: args.pacienteId ?? null, paciente_nome: args.pacienteNome ?? null,
      tipo: "receita", status: "pendente", valor: cent / 100,
      descricao: n > 1 ? `${args.descricaoBase} — Parcela ${i + 1}/${n}` : args.descricaoBase,
      data_vencimento: venc.toISOString().slice(0, 10),
      origem_tipo: "orcamento", origem_id: args.origemId ?? null,
      parcela_numero: i + 1, parcela_total: n, criado_por: args.criadoPor ?? null,
    });
  }
  await sb.insert("financeiro_lancamentos", linhas as unknown as Record<string, unknown>);
}

export async function marcarPago(
  id: string, forma: FormaPagamento, pagoPor?: string | null, observacao?: string | null
): Promise<void> {
  await sb.update("financeiro_lancamentos", id, {
    status: "pago", data_pagamento: hoje(), forma_pagamento: forma,
    pago_por: pagoPor || null, pagamento_observacao: observacao?.trim() || null,
  });
}

export async function marcarPendente(id: string): Promise<void> {
  await sb.update("financeiro_lancamentos", id, {
    status: "pendente", data_pagamento: null, forma_pagamento: null,
    pago_por: null, pagamento_observacao: null,
  });
}

export async function cancelarLancamento(id: string): Promise<void> {
  await sb.update("financeiro_lancamentos", id, { status: "cancelado" });
}
