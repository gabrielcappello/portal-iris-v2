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

export type ConfigFinanceiro = {
  convenios: boolean;          // mostra campos de convênio
  comissao_dentistas: boolean; // sistema de % de repasse
  despesas: boolean;           // aba de contas a pagar
};

export const CONFIG_FIN_PADRAO: ConfigFinanceiro = {
  convenios: false,
  comissao_dentistas: false,
  despesas: true,
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

// ── Cliente ───────────────────────────────────────────────────────────────────

export async function listarLancamentos(clinicaId: string): Promise<Lancamento[]> {
  return sb.query<Lancamento>(
    "financeiro_lancamentos",
    `?clinica_id=eq.${clinicaId}&order=data_vencimento.desc,criado_em.desc`
  );
}

export async function criarLancamento(data: Partial<Lancamento>): Promise<Lancamento[]> {
  return sb.insert("financeiro_lancamentos", data as Record<string, unknown>);
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
