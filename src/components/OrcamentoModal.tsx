"use client";
import { useState, useEffect } from "react";
import { X, Check, Ban } from "lucide-react";
import { formatBRL } from "@/lib/financeiro";
import {
  buscarItens, atualizarDesconto, aprovarOrcamento, recusarOrcamento,
  ROTULO_STATUS_ORC,
  type Orcamento, type OrcamentoItem, type OrcamentoStatus,
} from "@/lib/orcamento";

const BRAND = "#2B7A78";
const FONT = "'Sora',sans-serif";

const COR_STATUS: Record<OrcamentoStatus, string> = {
  aberto: "#d97706", aprovado: "#059669", recusado: "#dc2626", cancelado: "#94a3b8",
};

export default function OrcamentoModal({ orcamento, pacienteNome, usuarioId, onClose }: {
  orcamento: Orcamento;
  pacienteNome?: string;
  usuarioId: string;
  onClose: (mudou?: boolean) => void;
}) {
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrcamentoStatus>(orcamento.status);
  const [desconto, setDesconto] = useState(String(orcamento.desconto || ""));
  const [salvando, setSalvando] = useState(false);
  const [mudou, setMudou] = useState(false);

  const total = Number(orcamento.valor_total) || 0;
  const descNum = Math.max(0, Math.min(Number(desconto) || 0, total));
  const final = total - descNum;
  const editavel = status === "aberto";

  useEffect(() => {
    buscarItens(orcamento.id).then(setItens).catch(() => {}).finally(() => setLoading(false));
  }, [orcamento.id]);

  async function salvarDesconto() {
    if (!editavel) return;
    await atualizarDesconto(orcamento.id, total, descNum);
    setMudou(true);
  }
  async function aprovar() {
    setSalvando(true);
    try { await aprovarOrcamento(orcamento.id, usuarioId || null); setStatus("aprovado"); setMudou(true); }
    finally { setSalvando(false); }
  }
  async function recusar() {
    setSalvando(true);
    try { await recusarOrcamento(orcamento.id); setStatus("recusado"); setMudou(true); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(mudou); }}>
      <div style={{ width: "min(560px,100%)", maxHeight: "92vh", background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Cabeçalho */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Orçamento{pacienteNome ? ` — ${pacienteNome}` : ""}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {orcamento.criado_em ? new Date(orcamento.criado_em).toLocaleDateString("pt-BR") : ""} · {itens.length} item{itens.length !== 1 ? "s" : ""}
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#fff", background: COR_STATUS[status], padding: "3px 10px", borderRadius: 99 }}>{ROTULO_STATUS_ORC[status]}</span>
          <button onClick={() => onClose(mudou)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={19} /></button>
        </div>

        {/* Itens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 22px" }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Carregando…</div>
          ) : itens.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#cbd5e1", fontSize: 13 }}>Sem itens.</div>
          ) : (
            itens.map((it, i) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid #f8fafc" : "none" }}>
                {it.dente && <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: BRAND, minWidth: 22, textAlign: "center" }}>{it.dente}</span>}
                <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{it.descricao}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{formatBRL(Number(it.valor))}</div>
              </div>
            ))
          )}
        </div>

        {/* Totais + ações */}
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "16px 22px", background: "#fafcfc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <span>Total</span><span>{formatBRL(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <span>Desconto</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#94a3b8" }}>R$</span>
              <input type="number" min="0" step="0.01" value={desconto} disabled={!editavel}
                onChange={e => setDesconto(e.target.value)} onBlur={salvarDesconto}
                style={{ width: 90, padding: "5px 8px", fontSize: 13, textAlign: "right", border: "1px solid #e2e8f0", borderRadius: 7, outline: "none", fontFamily: FONT, background: editavel ? "#fff" : "#f1f5f9", color: "#1e293b" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#0f172a", paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
            <span>Total final</span><span style={{ color: BRAND }}>{formatBRL(final)}</span>
          </div>

          {editavel && (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={recusar} disabled={salvando}
                style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 700, fontFamily: FONT, border: "1px solid #fecaca", borderRadius: 10, cursor: "pointer", background: "#fff", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Ban size={15} /> Recusar
              </button>
              <button onClick={aprovar} disabled={salvando}
                style={{ flex: 2, padding: "10px", fontSize: 13, fontWeight: 700, fontFamily: FONT, border: "none", borderRadius: 10, cursor: "pointer", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: salvando ? 0.7 : 1 }}>
                <Check size={15} /> Aprovar orçamento
              </button>
            </div>
          )}
          {status === "aprovado" && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#059669", textAlign: "center", fontWeight: 600 }}>
              ✓ Orçamento aprovado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
