"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, X, Check, RotateCcw } from "lucide-react";
import { sb } from "@/lib/supabase";
import {
  listarLancamentos, criarLancamento, marcarPago, marcarPendente,
  lerConfigFinanceiro, formatBRL, hoje, ROTULO_FORMA, FORMAS, ROTULO_GATILHO,
  type Lancamento, type LancamentoTipo, type FormaPagamento, type ConfigFinanceiro, type GatilhoReceita,
} from "@/lib/financeiro";
import IrisLoader from "@/components/IrisLoader";

const BRAND = "#2B7A78";
const FONT = "'Sora',sans-serif";

function fData(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
function mesmoMes(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso), n = new Date();
  return d.getUTCFullYear() === n.getFullYear() && d.getUTCMonth() === n.getMonth();
}

function Card({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div style={{ flex: 1, minWidth: 150, padding: "14px 16px", background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: cor, marginTop: 3 }}>{formatBRL(valor)}</div>
    </div>
  );
}

export default function FinanceiroPage() {
  const [clinicaId, setClinicaId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [config, setConfig] = useState<ConfigFinanceiro>(lerConfigFinanceiro(null));
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [fTipo, setFTipo] = useState<"todos" | LancamentoTipo>("todos");
  const [fStatus, setFStatus] = useState<"todos" | "pendente" | "pago">("todos");
  const [novo, setNovo] = useState(false);
  const [pagar, setPagar] = useState<Lancamento | null>(null);

  async function recarregar(id: string) {
    setLoading(true);
    try { setLancamentos(await listarLancamentos(id)); } finally { setLoading(false); }
  }

  useEffect(() => {
    const id = localStorage.getItem("clinica_id") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClinicaId(id);
    setUsuarioId(localStorage.getItem("user_id") || "");
    if (!id) { setLoading(false); return; }
    sb.query<{ config_financeiro?: unknown }>("clinicas", `?id=eq.${id}&select=config_financeiro`)
      .then(r => setConfig(lerConfigFinanceiro(r[0]?.config_financeiro))).catch(() => {});
    recarregar(id);
  }, []);

  const totais = useMemo(() => {
    let aReceber = 0, recebidoMes = 0, aPagar = 0, pagoDespesa = 0;
    for (const l of lancamentos) {
      if (l.status === "cancelado") continue;
      if (l.tipo === "receita") {
        if (l.status === "pendente") aReceber += Number(l.valor);
        else if (l.status === "pago" && mesmoMes(l.data_pagamento)) recebidoMes += Number(l.valor);
      } else {
        if (l.status === "pendente") aPagar += Number(l.valor);
        else if (l.status === "pago") pagoDespesa += Number(l.valor);
      }
    }
    const recebidoTotal = lancamentos.filter(l => l.tipo === "receita" && l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
    return { aReceber, recebidoMes, aPagar, saldo: recebidoTotal - pagoDespesa };
  }, [lancamentos]);

  const filtrados = lancamentos.filter(l =>
    (fTipo === "todos" || l.tipo === fTipo) &&
    (fStatus === "todos" || l.status === fStatus)
  );

  async function salvarNovo(data: Partial<Lancamento>) {
    await criarLancamento({ ...data, clinica_id: clinicaId, criado_por: usuarioId || null });
    setNovo(false);
    recarregar(clinicaId);
  }
  async function confirmarPago(forma: FormaPagamento, observacao?: string) {
    if (!pagar) return;
    await marcarPago(pagar.id, forma, usuarioId || null, observacao);
    setPagar(null);
    recarregar(clinicaId);
  }
  async function desfazer(l: Lancamento) {
    await marcarPendente(l.id);
    recarregar(clinicaId);
  }
  async function salvarGatilho(g: GatilhoReceita) {
    const novo = { ...config, gatilho_receita: g };
    setConfig(novo);
    try { await sb.update("clinicas", clinicaId, { config_financeiro: novo }); } catch {}
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", flex: 1 }}>Financeiro</h2>
        <button onClick={() => setNovo(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: 13, fontWeight: 700, fontFamily: FONT, border: "none", borderRadius: 10, cursor: "pointer", background: BRAND, color: "#fff" }}>
          <Plus size={15} /> Novo lançamento
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <Card label="A receber" valor={totais.aReceber} cor="#d97706" />
        <Card label="Recebido (mês)" valor={totais.recebidoMes} cor="#059669" />
        {config.despesas && <Card label="A pagar" valor={totais.aPagar} cor="#dc2626" />}
        <Card label="Saldo" valor={totais.saldo} cor={totais.saldo >= 0 ? BRAND : "#dc2626"} />
      </div>

      {/* Regra de cobrança (gatilho da receita) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: "#64748b" }}>
        <span>Regra de cobrança:</span>
        <select value={config.gatilho_receita} onChange={e => salvarGatilho(e.target.value as GatilhoReceita)}
          style={{ padding: "5px 8px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: FONT, background: "#fff", color: "#334155", cursor: "pointer" }}>
          {(Object.keys(ROTULO_GATILHO) as GatilhoReceita[]).map(g => <option key={g} value={g}>{ROTULO_GATILHO[g]}</option>)}
        </select>
        <span style={{ color: "#cbd5e1" }}>define quando a receita é gerada</span>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {((config.despesas ? ["todos", "receita", "despesa"] : ["todos", "receita"]) as ("todos" | LancamentoTipo)[]).map(t => (
          <button key={t} onClick={() => setFTipo(t)}
            style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, fontFamily: FONT, borderRadius: 8, cursor: "pointer", textTransform: "capitalize",
              border: `1px solid ${fTipo === t ? BRAND : "#e2e8f0"}`, background: fTipo === t ? "rgba(43,122,120,0.1)" : "#fff", color: fTipo === t ? BRAND : "#64748b" }}>
            {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
        <div style={{ width: 1, background: "#e2e8f0", margin: "0 4px" }} />
        {(["todos", "pendente", "pago"] as const).map(s => (
          <button key={s} onClick={() => setFStatus(s)}
            style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, fontFamily: FONT, borderRadius: 8, cursor: "pointer", textTransform: "capitalize",
              border: `1px solid ${fStatus === s ? BRAND : "#e2e8f0"}`, background: fStatus === s ? "rgba(43,122,120,0.1)" : "#fff", color: fStatus === s ? BRAND : "#64748b" }}>
            {s === "todos" ? "Todos status" : s}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <IrisLoader />
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#cbd5e1", fontSize: 13 }}>Nenhum lançamento.</div>
        ) : (
          filtrados.map((l, i) => {
            const receita = l.tipo === "receita";
            const stCor = l.status === "pago" ? "#059669" : l.status === "cancelado" ? "#94a3b8" : (receita ? "#d97706" : "#dc2626");
            return (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid #f8fafc" : "none" }}>
                <div style={{ width: 64, fontSize: 11, color: "#94a3b8", fontFamily: "monospace", flexShrink: 0 }}>{fData(l.data_vencimento)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{l.descricao || (receita ? "Receita" : "Despesa")}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {l.paciente_nome ? `${l.paciente_nome} · ` : ""}{l.origem_tipo === "odontograma" ? `odontograma${l.ref_dente ? ` (dente ${l.ref_dente})` : ""}` : (l.origem_tipo || "manual")}
                    {l.status === "pago" && l.forma_pagamento ? ` · ${ROTULO_FORMA[l.forma_pagamento]}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: receita ? "#059669" : "#dc2626", flexShrink: 0 }}>
                  {receita ? "" : "− "}{formatBRL(Number(l.valor))}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#fff", background: stCor, padding: "2px 8px", borderRadius: 99, flexShrink: 0 }}>{l.status}</span>
                <div style={{ width: 96, textAlign: "right", flexShrink: 0 }}>
                  {l.status === "pendente" && (
                    <button onClick={() => setPagar(l)}
                      style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, fontFamily: FONT, border: `1px solid ${BRAND}`, borderRadius: 7, cursor: "pointer", background: "#fff", color: BRAND }}>
                      {receita ? "Receber" : "Pagar"}
                    </button>
                  )}
                  {l.status === "pago" && (
                    <button onClick={() => desfazer(l)} title="Desfazer"
                      style={{ padding: "5px 8px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#94a3b8", display: "inline-flex" }}>
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {novo && <NovoLancamentoModal config={config} onClose={() => setNovo(false)} onSalvar={salvarNovo} />}
      {pagar && <PagarModal lancamento={pagar} onClose={() => setPagar(null)} onConfirmar={confirmarPago} />}
    </div>
  );
}

// ── Modal: novo lançamento ────────────────────────────────────────────────────

function NovoLancamentoModal({ config, onClose, onSalvar }: {
  config: ConfigFinanceiro;
  onClose: () => void;
  onSalvar: (data: Partial<Lancamento>) => void;
}) {
  const [tipo, setTipo] = useState<LancamentoTipo>("receita");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState(hoje());
  const [paciente, setPaciente] = useState("");
  const [salvando, setSalvando] = useState(false);

  const inp = { width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 9, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" as const };

  async function salvar() {
    const v = Number(valor);
    if (!v || v <= 0) return;
    setSalvando(true);
    onSalvar({ tipo, descricao: descricao.trim() || null, valor: v, data_vencimento: venc, paciente_nome: paciente.trim() || null, origem_tipo: "manual", status: "pendente" });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(420px,100%)", background: "#fff", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>Novo lançamento</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {config.despesas && (
            <div style={{ display: "flex", gap: 6 }}>
              {(["receita", "despesa"] as const).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  style={{ flex: 1, padding: "8px", fontSize: 12, fontWeight: 700, fontFamily: FONT, borderRadius: 9, cursor: "pointer", textTransform: "capitalize",
                    border: `1px solid ${tipo === t ? (t === "receita" ? "#059669" : "#dc2626") : "#e2e8f0"}`, background: tipo === t ? (t === "receita" ? "#059669" : "#dc2626") : "#fff", color: tipo === t ? "#fff" : "#64748b" }}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <input style={inp} placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inp, flex: 1 }} type="number" min="0" step="0.01" placeholder="Valor R$" value={valor} onChange={e => setValor(e.target.value)} />
            <input style={{ ...inp, flex: 1 }} type="date" value={venc} onChange={e => setVenc(e.target.value)} />
          </div>
          {tipo === "receita" && <input style={inp} placeholder="Paciente (opcional)" value={paciente} onChange={e => setPaciente(e.target.value)} />}
          <button onClick={salvar} disabled={salvando || !valor}
            style={{ marginTop: 4, padding: "11px", fontSize: 13, fontWeight: 700, fontFamily: FONT, border: "none", borderRadius: 10, cursor: (salvando || !valor) ? "not-allowed" : "pointer", background: BRAND, color: "#fff", opacity: (salvando || !valor) ? 0.5 : 1 }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: marcar pago (forma de pagamento) ───────────────────────────────────

function PagarModal({ lancamento, onClose, onConfirmar }: {
  lancamento: Lancamento;
  onClose: () => void;
  onConfirmar: (forma: FormaPagamento, observacao?: string) => void;
}) {
  const receita = lancamento.tipo === "receita";
  const [obs, setObs] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(380px,100%)", background: "#fff", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{receita ? "Registrar recebimento" : "Registrar pagamento"}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{lancamento.descricao} · {formatBRL(Number(lancamento.valor))}</div>
        </div>
        <div style={{ padding: 20 }}>
          <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Observação (opcional)"
            style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 9, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Forma de pagamento</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FORMAS.map(f => (
              <button key={f} onClick={() => onConfirmar(f, obs)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", fontSize: 13, fontWeight: 600, fontFamily: FONT, border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", background: "#fff", color: "#334155", textAlign: "left" }}>
                <Check size={14} color="#059669" /> {ROTULO_FORMA[f]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
