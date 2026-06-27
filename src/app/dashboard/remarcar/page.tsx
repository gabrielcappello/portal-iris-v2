"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { sb, type Clinica, type Dentista } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";

// URL de producao do webhook de remarcacao em massa (n8n)
const N8N_REMARCACAO_URL = "https://singingdugong-n8n.cloudfy.live/webhook/iris-remarcacao-massa";

const MOTIVO_PADRAO = "Imprevisto na agenda do profissional";

// ── Estilos (mesmo padrao do painel) ──
const inputSt: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid rgba(43,122,120,0.35)", borderRadius: 8, outline: "none", background: "#fff", fontFamily: "'Sora',sans-serif", boxSizing: "border-box" };
const labelSt: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 };

type Etapa = "lista" | "config" | "confirmacao" | "enviando" | "resultado";
type EscopoTipo = "dia_inteiro" | "intervalo";

type ResultadoEnvio = {
  ok: boolean;
  total_pacientes?: number;
  mensagem?: string;
  idempotente?: boolean;
  erro?: string;
};

export default function RemarcarPage() {
  const router = useRouter();
  const { t } = useLang();

  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Fluxo
  const [etapa, setEtapa] = useState<Etapa>("lista");
  const [dentistaSel, setDentistaSel] = useState<Dentista | null>(null);
  const [escopoTipo, setEscopoTipo] = useState<EscopoTipo>("dia_inteiro");
  const [dataAlvo, setDataAlvo] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState(MOTIVO_PADRAO);

  // comando_id gerado no clique e reutilizado em retries
  const [comandoId, setComandoId] = useState("");
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const [erroValidacao, setErroValidacao] = useState("");

  // Guard de rota + carregar clinica
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    const id = localStorage.getItem("clinica_id");
    if (!id) { setCarregando(false); return; }
    sb.query<Clinica>("clinicas", `?id=eq.${id}&select=*`)
      .then(r => { if (r[0]) setClinica(r[0]); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [router]);

  // Dentistas validos: ativos e completos (com token_acesso)
  const dentistasValidos = (Array.isArray(clinica?.dentistas) ? clinica!.dentistas : [])
    .filter((d: Dentista) =>
      d?.ativo &&
      d?.nome?.trim() &&
      d?.calendar_id?.trim() &&
      d?.token_acesso?.trim()
    );

  function escolherDentista(d: Dentista) {
    setDentistaSel(d);
    setEscopoTipo("dia_inteiro");
    setDataAlvo("");
    setHoraInicio("");
    setHoraFim("");
    setMotivo(MOTIVO_PADRAO);
    setErroValidacao("");
    setEtapa("config");
  }

  function voltarLista() {
    setDentistaSel(null);
    setEtapa("lista");
    setErroValidacao("");
  }

  function irParaConfirmacao() {
    setErroValidacao("");
    if (!dataAlvo) { setErroValidacao("Escolha a data afetada."); return; }
    if (escopoTipo === "intervalo") {
      if (!horaInicio || !horaFim) { setErroValidacao("Preencha o horário de início e fim."); return; }
      if (horaFim < horaInicio) { setErroValidacao("O horário de fim deve ser após o início."); return; }
    }
    setEtapa("confirmacao");
  }

  async function enviarComando(idReuso?: string) {
    if (!clinica || !dentistaSel) return;
    const token = dentistaSel.token_acesso || "";
    const userId = localStorage.getItem("user_id") || null;

    // Gera UUID v4 no primeiro envio; reutiliza no retry
    const idComando = idReuso || comandoId || crypto.randomUUID();
    if (!comandoId) setComandoId(idComando);

    const payload = {
      versao: "1.0",
      comando_id: idComando,
      clinica_id: clinica.id,
      dentista_token: token,
      solicitante: { perfil: "administrador", id: userId },
      escopo: {
        tipo: escopoTipo,
        data_alvo: dataAlvo,
        hora_inicio: escopoTipo === "intervalo" ? horaInicio : null,
        hora_fim: escopoTipo === "intervalo" ? horaFim : null,
      },
      motivo: motivo?.trim() || MOTIVO_PADRAO,
    };

    setEtapa("enviando");
    try {
      const res = await fetch(N8N_REMARCACAO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ResultadoEnvio = await res.json().catch(() => ({ ok: res.ok }));
      setResultado(data);
      setEtapa("resultado");
    } catch {
      setResultado({ ok: false, erro: "Não foi possível conectar ao servidor. Tente novamente." });
      setEtapa("resultado");
    }
  }

  function reiniciar() {
    setDentistaSel(null);
    setComandoId("");
    setResultado(null);
    setEtapa("lista");
  }

  function nomeDentista(d: Dentista) {
    return `${d.titulo || "Dr."} ${d.nome}`.trim();
  }

  // Suprime warning de t não utilizado (layout usa i18n, página usa strings fixas em pt)
  void t;

  if (carregando) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 13 }}>Carregando...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Remarcar atendimentos</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
        Avise os pacientes de um dia quando houver um imprevisto na agenda de um profissional.
      </p>

      <AnimatePresence mode="wait">
        {/* ── ETAPA: LISTA DE DENTISTAS ── */}
        {etapa === "lista" && (
          <motion.div key="lista" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {dentistasValidos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8", fontSize: 13, background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.2)" }}>
                Nenhum profissional ativo disponível para remarcação.
                <div style={{ fontSize: 12, marginTop: 6 }}>Ative um dentista completo em Configurações.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dentistasValidos.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.35)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{nomeDentista(d)}</div>
                    </div>
                    <button onClick={() => escolherDentista(d)}
                      style={{ padding: "8px 16px", background: "linear-gradient(135deg,#2B7A78,#3AAFA9)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", flexShrink: 0 }}>
                      Remarcar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ETAPA: CONFIGURACAO ── */}
        {etapa === "config" && dentistaSel && (
          <motion.div key="config" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.35)", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", padding: 16 }}>

            <button onClick={voltarLista} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12, fontFamily: "'Sora',sans-serif", padding: 0, marginBottom: 14 }}>
              <ArrowLeft size={14} /> Voltar
            </button>

            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>{nomeDentista(dentistaSel)}</div>

            {/* Tipo de escopo */}
            <label style={labelSt}>O que remarcar?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {([["dia_inteiro", "Dia inteiro", <Calendar size={16} key="c" />], ["intervalo", "Período de horas", <Clock size={16} key="r" />]] as const).map(([val, label, icon]) => (
                <button key={val} onClick={() => setEscopoTipo(val as EscopoTipo)}
                  style={{ padding: "12px 8px", border: `1px solid ${escopoTipo === val ? "#2B7A78" : "rgba(43,122,120,0.35)"}`, borderRadius: 10, background: escopoTipo === val ? "rgba(43,122,120,0.08)" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, fontFamily: "'Sora',sans-serif", color: escopoTipo === val ? "#2B7A78" : "#64748b", transition: "all 0.15s" }}>
                  {icon}
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
                  {escopoTipo === val && <Check size={12} color="#2B7A78" />}
                </button>
              ))}
            </div>

            {/* Data */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Data afetada</label>
              <input type="date" value={dataAlvo} onChange={e => setDataAlvo(e.target.value)} style={inputSt} />
            </div>

            {/* Intervalo de horas (condicional) */}
            {escopoTipo === "intervalo" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelSt}>Início</label>
                  <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Fim</label>
                  <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} style={inputSt} />
                </div>
              </div>
            )}

            {/* Motivo */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt}>Motivo (interno)</label>
              <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={MOTIVO_PADRAO} style={inputSt} />
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                Uso interno. A mensagem ao paciente é enviada pela Iris no idioma dele.
              </span>
            </div>

            {erroValidacao && (
              <div style={{ fontSize: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)", marginBottom: 12 }}>
                <AlertTriangle size={14} /> {erroValidacao}
              </div>
            )}

            <button onClick={irParaConfirmacao}
              style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#2B7A78,#3AAFA9)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
              Revisar antes de enviar
            </button>
          </motion.div>
        )}

        {/* ── ETAPA: CONFIRMACAO ── */}
        {etapa === "confirmacao" && dentistaSel && (
          <motion.div key="confirmacao" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
            style={{ background: "#fff", borderRadius: 12, border: "1px solid #fecaca", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", padding: 16 }}>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={18} color="#dc2626" />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>Confirmar remarcação</div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <LinhaResumo label="Profissional" valor={nomeDentista(dentistaSel)} />
              <LinhaResumo label="Data" valor={formatarData(dataAlvo)} />
              <LinhaResumo label="Escopo" valor={escopoTipo === "dia_inteiro" ? "Dia inteiro" : `Das ${horaInicio} às ${horaFim}`} />
              <LinhaResumo label="Motivo" valor={motivo?.trim() || MOTIVO_PADRAO} />
            </div>

            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 16, padding: "10px 12px", background: "rgba(245,158,11,0.06)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
              A Iris vai avisar por WhatsApp todos os pacientes confirmados desse profissional na data informada, e conduzir a remarcação de cada um. Esta ação não pode ser desfeita.
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEtapa("config")}
                style={{ flex: 1, padding: "12px", background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                Cancelar
              </button>
              <button onClick={() => enviarComando()}
                style={{ flex: 2, padding: "12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                Confirmar remarcação
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA: ENVIANDO ── */}
        {etapa === "enviando" && (
          <motion.div key="enviando" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: "center", padding: "48px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.2)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📨</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Enviando avisos de remarcação...</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Isso pode levar alguns segundos.</div>
          </motion.div>
        )}

        {/* ── ETAPA: RESULTADO ── */}
        {etapa === "resultado" && resultado && (
          <motion.div key="resultado" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: "#fff", borderRadius: 12, border: `1px solid ${resultado.ok ? "#bbf7d0" : "#fecaca"}`, boxShadow: "0 6px 16px rgba(0,0,0,0.1)", padding: 20, textAlign: "center" }}>

            {resultado.ok ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>
                  {resultado.idempotente ? "Comando já recebido" : "Remarcação iniciada"}
                </div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                  {resultado.idempotente
                    ? "Este comando já tinha sido enviado. Nenhuma nova mensagem foi disparada."
                    : typeof resultado.total_pacientes === "number"
                      ? `${resultado.total_pacientes} paciente${resultado.total_pacientes !== 1 ? "s" : ""} ${resultado.total_pacientes !== 1 ? "serão avisados" : "será avisado"} pela Iris.`
                      : (resultado.mensagem || "Os pacientes serão avisados pela Iris.")}
                </div>
                {resultado.total_pacientes === 0 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Não havia agendamentos confirmados para esse profissional na data.
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>❌</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>Não foi possível enviar</div>
                <div style={{ fontSize: 13, color: "#ef4444", lineHeight: 1.5 }}>{resultado.erro || "Ocorreu um erro. Tente novamente."}</div>
                <button onClick={() => enviarComando(comandoId)}
                  style={{ marginTop: 16, padding: "10px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                  Tentar novamente
                </button>
              </>
            )}

            {resultado.ok && (
              <button onClick={reiniciar}
                style={{ marginTop: 18, padding: "10px 20px", background: "linear-gradient(135deg,#2B7A78,#3AAFA9)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                Concluir
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinhaResumo({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", textAlign: "right" }}>{valor}</span>
    </div>
  );
}

function formatarData(iso: string): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}
