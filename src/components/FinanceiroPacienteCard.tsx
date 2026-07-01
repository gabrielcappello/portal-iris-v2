"use client";
import { useState, useEffect } from "react";
import { listarLancamentosPaciente, formatBRL, ROTULO_FORMA, type Lancamento } from "@/lib/financeiro";

const BRAND = "#2B7A78";

function fData(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Card de resumo financeiro do paciente (mesma fonte: financeiro_lancamentos).
// `ativo` controla a busca — só carrega quando a ficha está aberta (evita N+1).
export default function FinanceiroPacienteCard({ pacienteId, ativo }: { pacienteId: string; ativo: boolean }) {
  const [lancs, setLancs] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loaded = loadedFor === pacienteId;

  useEffect(() => {
    if (!ativo || loadedFor === pacienteId) return;
    let vivo = true;
    (async () => {
      setLoading(true);
      try { const l = await listarLancamentosPaciente(pacienteId); if (vivo) { setLancs(l); setLoadedFor(pacienteId); } }
      catch { /* silencioso */ }
      if (vivo) setLoading(false);
    })();
    return () => { vivo = false; };
  }, [ativo, pacienteId, loadedFor]);

  const receitas = lancs.filter(l => l.tipo === "receita" && l.status !== "cancelado");
  const aReceber = receitas.filter(l => l.status === "pendente").reduce((s, l) => s + Number(l.valor), 0);
  const recebido = receitas.filter(l => l.status === "pago").reduce((s, l) => s + Number(l.valor), 0);
  const pendencias = receitas.filter(l => l.status === "pendente");
  const pagamentos = receitas.filter(l => l.status === "pago")
    .sort((a, b) => (b.data_pagamento ?? "").localeCompare(a.data_pagamento ?? ""));

  const semDados = loaded && receitas.length === 0;

  return (
    <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: pendencias.length || pagamentos.length ? 10 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Financeiro</div>
          {loading && !loaded ? (
            <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>Carregando…</div>
          ) : semDados ? (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Nenhum lançamento.</div>
          ) : (
            <div style={{ display: "flex", gap: 16, marginTop: 3 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>A receber <b style={{ color: aReceber > 0 ? "#d97706" : "#64748b" }}>{formatBRL(aReceber)}</b></span>
              <span style={{ fontSize: 12, color: "#64748b" }}>Recebido <b style={{ color: "#059669" }}>{formatBRL(recebido)}</b></span>
            </div>
          )}
        </div>
        {!semDados && !loading && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Saldo devedor</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: aReceber > 0 ? "#d97706" : BRAND }}>{formatBRL(aReceber)}</div>
          </div>
        )}
      </div>

      {/* Pendências (parcelas a receber) */}
      {pendencias.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Pendências</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pendencias.slice(0, 5).map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "#94a3b8", fontFamily: "monospace", minWidth: 62 }}>{fData(l.data_vencimento)}</span>
                <span style={{ flex: 1, color: "#334155" }}>{l.descricao || "Receita"}</span>
                <span style={{ fontWeight: 700, color: "#d97706" }}>{formatBRL(Number(l.valor))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimos pagamentos */}
      {pagamentos.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Últimos pagamentos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pagamentos.slice(0, 3).map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "#94a3b8", fontFamily: "monospace", minWidth: 62 }}>{fData(l.data_pagamento)}</span>
                <span style={{ flex: 1, color: "#334155" }}>{l.descricao || "Receita"}{l.forma_pagamento ? ` · ${ROTULO_FORMA[l.forma_pagamento]}` : ""}</span>
                <span style={{ fontWeight: 700, color: "#059669" }}>{formatBRL(Number(l.valor))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
