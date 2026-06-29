"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { X, Send, MessageCircle } from "lucide-react";
import { SUPABASE_URL, SUPABASE_KEY, type Paciente } from "@/lib/supabase";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Mensagem = {
  id: string;
  clinica_id: string;
  telefone: string;
  conteudo: string;
  origem: "paciente" | "clinica";
  criado_em: string;
};

type ConversaManual = {
  id: string;
  ativo: boolean;
  operador: string;
  inicio: string;
};

type Props = {
  paciente: Paciente;
  clinicaId: string;
  operadorNome: string;
  onClose: () => void;
};

export default function ChatManualModal({ paciente, clinicaId, operadorNome, onClose }: Props) {
  const [conversa, setConversa]       = useState<ConversaManual | null>(null);
  const [mensagens, setMensagens]     = useState<Mensagem[]>([]);
  const [texto, setTexto]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [enviando, setEnviando]       = useState(false);
  const [assumindo, setAssumindo]     = useState(false);
  const [devolvendo, setDevolvendo]   = useState(false);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const canalRef                      = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const telefone                      = paciente.telefone || "";

  const scrollParaBaixo = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Carrega estado inicial (conversa ativa + histórico)
  useEffect(() => {
    if (!telefone || !clinicaId) { setLoading(false); return; }

    async function carregar() {
      setLoading(true);
      try {
        const [convRes, msgRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/conversas_manuais?clinica_id=eq.${clinicaId}&telefone=eq.${encodeURIComponent(telefone)}&ativo=eq.true&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          }),
          fetch(`${SUPABASE_URL}/rest/v1/mensagens_manuais?clinica_id=eq.${clinicaId}&telefone=eq.${encodeURIComponent(telefone)}&order=criado_em.asc`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          }),
        ]);
        const convData: ConversaManual[] = await convRes.json();
        const msgData: Mensagem[]        = await msgRes.json();
        setConversa(convData[0] || null);
        setMensagens(msgData);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    carregar();
  }, [clinicaId, telefone]);

  // Subscrita Realtime ao montar; cancela ao fechar
  useEffect(() => {
    if (!telefone || !clinicaId) return;

    const canal = supabase
      .channel(`chat-manual-${clinicaId}-${telefone}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens_manuais", filter: `telefone=eq.${telefone}` },
        (payload) => {
          const nova = payload.new as Mensagem;
          if (nova.clinica_id !== clinicaId) return;
          setMensagens((prev) => {
            if (prev.some((m) => m.id === nova.id)) return prev;
            return [...prev, nova];
          });
          scrollParaBaixo();
        }
      )
      .subscribe();

    canalRef.current = canal;
    return () => { supabase.removeChannel(canal); };
  }, [clinicaId, telefone, scrollParaBaixo]);

  // Scroll ao carregar histórico
  useEffect(() => { if (!loading) scrollParaBaixo(); }, [loading, scrollParaBaixo]);

  async function assumirConversa() {
    setAssumindo(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/conversas_manuais`,
        {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ clinica_id: clinicaId, telefone, ativo: true, operador: operadorNome }),
        }
      );
      const data: ConversaManual[] = await res.json();
      setConversa(data[0] || null);
    } catch (e) { console.error(e); }
    setAssumindo(false);
  }

  async function devolverParaIris() {
    if (!conversa) return;
    setDevolvendo(true);
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/conversas_manuais?clinica_id=eq.${clinicaId}&telefone=eq.${encodeURIComponent(telefone)}&ativo=eq.true`,
        {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: false, fim: new Date().toISOString() }),
        }
      );
      setConversa(null);
    } catch (e) { console.error(e); }
    setDevolvendo(false);
  }

  async function enviarMensagem() {
    const msg = texto.trim();
    if (!msg || !conversa || enviando) return;
    setTexto("");
    setEnviando(true);
    try {
      await fetch("/api/chat-manual/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinica_id: clinicaId, telefone, conteudo: msg }),
      });
    } catch (e) { console.error(e); }
    setEnviando(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
  }

  const modoAtivo = !!conversa;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ width: "min(520px,96vw)", height: "min(640px,90vh)", background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Cabeçalho */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#DEF2F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#2B7A78", flexShrink: 0 }}>
            {(paciente.nome || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{paciente.nome}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{telefone}</div>
          </div>

          {/* Status Iris */}
          {modoAtivo && (
            <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(234,67,53,0.1)", color: "#dc2626", border: "1px solid rgba(234,67,53,0.2)", flexShrink: 0 }}>
              Iris pausada
            </div>
          )}

          {/* Botão assumir / devolver */}
          {!modoAtivo ? (
            <button onClick={assumirConversa} disabled={assumindo || loading}
              style={{ padding: "7px 14px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 9, cursor: assumindo ? "wait" : "pointer", background: "#2B7A78", color: "#fff", fontFamily: "'Sora',sans-serif", flexShrink: 0, opacity: assumindo ? 0.7 : 1 }}>
              {assumindo ? "Assumindo…" : "Assumir conversa"}
            </button>
          ) : (
            <button onClick={devolverParaIris} disabled={devolvendo}
              style={{ padding: "7px 14px", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 9, cursor: devolvendo ? "wait" : "pointer", background: "#f8fafc", color: "#475569", fontFamily: "'Sora',sans-serif", flexShrink: 0, opacity: devolvendo ? 0.7 : 1 }}>
              {devolvendo ? "Devolvendo…" : "Devolver para Iris"}
            </button>
          )}

          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4, flexShrink: 0, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Área de mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc" }}>
          {loading && (
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>Carregando histórico…</div>
          )}
          {!loading && mensagens.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <MessageCircle size={36} style={{ color: "#cbd5e1", marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: "#94a3b8" }}>Nenhuma mensagem ainda</div>
              {!modoAtivo && <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Assuma a conversa para começar</div>}
            </div>
          )}
          {mensagens.map((m) => {
            const daCli = m.origem === "clinica";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: daCli ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "75%", padding: "8px 12px", borderRadius: daCli ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: daCli ? "#2B7A78" : "#fff", color: daCli ? "#fff" : "#1e293b",
                  fontSize: 13, lineHeight: 1.45, boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  border: daCli ? "none" : "1px solid #e2e8f0",
                }}>
                  {m.conteudo}
                  <div style={{ fontSize: 10, marginTop: 3, opacity: 0.65, textAlign: daCli ? "right" : "left" }}>
                    {new Date(m.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Rodapé — input */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "flex-end", background: "#fff" }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!modoAtivo || enviando}
            placeholder={modoAtivo ? "Digite uma mensagem… (Enter para enviar)" : "Assuma a conversa para enviar mensagens"}
            rows={1}
            style={{
              flex: 1, resize: "none", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 12px",
              fontSize: 13, fontFamily: "'Sora',sans-serif", outline: "none", lineHeight: 1.4,
              background: modoAtivo ? "#fff" : "#f8fafc", color: modoAtivo ? "#1e293b" : "#94a3b8",
              maxHeight: 100, overflowY: "auto",
            }}
          />
          <button onClick={enviarMensagem} disabled={!modoAtivo || !texto.trim() || enviando}
            style={{
              width: 40, height: 40, borderRadius: 10, border: "none", cursor: modoAtivo && texto.trim() ? "pointer" : "default",
              background: modoAtivo && texto.trim() ? "#2B7A78" : "#e2e8f0",
              color: modoAtivo && texto.trim() ? "#fff" : "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
            }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
