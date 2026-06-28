"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, View, Event as RBCEvent } from "react-big-calendar";
import {
  format, parse, startOfWeek, getDay,
  startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { sb, SUPABASE_URL, SUPABASE_KEY, type Clinica } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";

// ── paleta de cores ────────────────────────────────────────────────────────────
// 12 cores vivas: usadas tanto na grade do seletor quanto na atribuição
// automática por hash (texto dos eventos é branco, então precisam ter contraste).
const DENTIST_COLORS = [
  "#2563EB","#16A34A","#DC2626","#9333EA","#EA580C","#0891B2",
  "#DB2777","#65A30D","#7C3AED","#CA8A04","#0F766E","#BE123C",
];

// Grade do seletor: 24 cores (as 12 vivas + 12 suaves), 6 colunas x 4 linhas.
// As suaves só ficam disponíveis para escolha manual, não para o hash automático.
const PALETTE_COLORS = [
  ...DENTIST_COLORS,
  "#93C5FD","#86EFAC","#FCA5A5","#D8B4FE","#FDBA74","#67E8F9",
  "#F9A8D4","#BEF264","#C4B5FD","#FDE68A","#99F6E4","#FDA4AF",
];

function corParaDentista(token: string, corAPI?: string): string {
  if (corAPI?.trim()) return corAPI;
  let hash = 0;
  for (let i = 0; i < token.length; i++) hash = ((hash * 31) + token.charCodeAt(i)) >>> 0;
  return DENTIST_COLORS[hash % DENTIST_COLORS.length];
}

// ── date-fns localizer ────────────────────────────────────────────────────────
const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// ── tipos da API ──────────────────────────────────────────────────────────────
type DentistaInfo = { token: string; nome: string; cor: string };

type EventoAPI = {
  event_id: string;
  dentista_token: string;
  dentista_nome: string;
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  dia_inteiro: boolean;
};

type CalendarioResponse = {
  sucesso: boolean;
  fuso_horario?: string;
  hora_abertura?: string | null;
  hora_fechamento?: string | null;
  dentistas?: DentistaInfo[];
  eventos?: EventoAPI[];
  erro?: string;
};

type CalEvent = RBCEvent & {
  id: string;
  dentistaNome: string;
  cor: string;
  descricao: string;
  diaInteiro: boolean;
};

// ── helpers ───────────────────────────────────────────────────────────────────
function parseEventDate(raw: string, diaInteiro: boolean): Date {
  if (diaInteiro) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return parseISO(raw);
}

function parseHoraRBC(hhmm: string | null | undefined, fallbackHour: number): Date {
  if (hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) return new Date(1970, 0, 1, h, m, 0);
  }
  return new Date(1970, 0, 1, fallbackHour, 0, 0);
}

function getRangeForView(view: View, date: Date): { inicio: string; fim: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (view === "month") {
    return {
      inicio: fmt(startOfWeekFn(startOfMonth(date), { weekStartsOn: 0 })),
      fim: fmt(endOfWeek(endOfMonth(date), { weekStartsOn: 0 })),
    };
  }
  if (view === "week") {
    return {
      inicio: fmt(startOfWeekFn(date, { weekStartsOn: 0 })),
      fim: fmt(endOfWeek(date, { weekStartsOn: 0 })),
    };
  }
  return { inicio: fmt(date), fim: fmt(date) };
}

function hexValido(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(s.trim());
}

// ── estilos base ──────────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0",
  borderRadius: 8, cursor: "pointer", fontFamily: "'Sora',sans-serif",
  background: "#fff", color: "#475569", transition: "all 0.15s",
};
const btnActive: React.CSSProperties = {
  ...btnBase, background: "#2B7A78", color: "#fff", border: "1px solid #2B7A78",
};

// ── componente ────────────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const router = useRouter();
  const { t } = useLang();
  void t;

  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [carregandoClinica, setCarregandoClinica] = useState(true);

  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [eventos, setEventos] = useState<CalEvent[]>([]);

  const [dentistas, setDentistas] = useState<DentistaInfo[]>([]);
  const dentistasRef = useRef<DentistaInfo[]>([]);

  const [filtroTokens, setFiltroTokens] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [minTime, setMinTime] = useState<Date>(new Date(1970, 0, 1, 5, 0, 0));
  const [maxTime, setMaxTime] = useState<Date>(new Date(1970, 0, 1, 19, 0, 0));

  const [eventoSel, setEventoSel] = useState<CalEvent | null>(null);

  // ── color picker ─────────────────────────────────────────────────────────────
  const [colorPickerToken, setColorPickerToken] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState("");
  const [savingCor, setSavingCor] = useState(false);
  const [corErro, setCorErro] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // fecha o picker ao clicar fora
  useEffect(() => {
    if (!colorPickerToken) return;
    function handleClick(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerToken(null);
        setCorErro("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [colorPickerToken]);

  function abrirColorPicker(token: string, corAtual: string) {
    setColorPickerToken(prev => prev === token ? null : token);
    setHexInput(hexValido(corAtual) ? corAtual : "");
    setCorErro("");
  }

  async function salvarCor(token: string, cor: string) {
    if (!clinica?.id) return;
    // valida hex se não for string vazia (vazio = automático)
    if (cor !== "" && !hexValido(cor)) {
      setCorErro("Formato inválido. Use #RRGGBB (ex: #2563EB)");
      return;
    }
    setSavingCor(true);
    setCorErro("");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/atualizar_cor_dentista`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_clinica_id: clinica.id,
          p_token_acesso: token,
          p_cor: cor,
        }),
      });
      const data = await res.json().catch(() => ({ sucesso: false, erro: "parse_error" }));
      if (!data.sucesso) {
        setCorErro(data.erro || "Erro ao salvar a cor. Tente novamente.");
        return;
      }
      // atualiza local imediatamente com a cor retornada pela RPC
      const novaCor = data.cor?.trim() ? data.cor : corParaDentista(token, undefined);
      const updater = (d: DentistaInfo) => d.token === token ? { ...d, cor: novaCor } : d;
      dentistasRef.current = dentistasRef.current.map(updater);
      setDentistas(prev => prev.map(updater));
      setColorPickerToken(null);
      // recarrega o calendário para refletir a cor nova nos eventos
      buscarEventos(view, date, filtroTokens);
    } catch {
      setCorErro("Falha de conexão. Tente novamente.");
    } finally {
      setSavingCor(false);
    }
  }

  // ── carregar clínica ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    const id = localStorage.getItem("clinica_id");
    if (!id) { setCarregandoClinica(false); return; }
    sb.query<Clinica>("clinicas", `?id=eq.${id}&select=id`)
      .then(r => { if (r[0]) setClinica(r[0]); })
      .catch(() => {})
      .finally(() => setCarregandoClinica(false));
  }, [router]);

  // ── buscar eventos ──────────────────────────────────────────────────────────
  const buscarEventos = useCallback(async (v: View, d: Date, tokens: Set<string>) => {
    if (!clinica?.id) return;
    const { inicio, fim } = getRangeForView(v, d);
    setCarregando(true);
    setErro("");
    try {
      const body = {
        clinica_id: clinica.id,
        data_inicio: inicio,
        data_fim: fim,
        dentistas_tokens: tokens.size > 0 ? Array.from(tokens) : [],
      };
      const res = await fetch("/api/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: CalendarioResponse = await res.json().catch(() => ({ sucesso: false, erro: "parse_error" }));

      if (!data.sucesso) {
        setErro("Não foi possível carregar a agenda. Tente novamente.");
        return;
      }

      setMinTime(parseHoraRBC(data.hora_abertura, 5));
      setMaxTime(parseHoraRBC(data.hora_fechamento, 19));

      // dentistas: union (nunca encolhe)
      const dentistasData = data.dentistas ?? [];
      if (dentistasData.length > 0) {
        const map = new Map(dentistasRef.current.map(d => [d.token, d]));
        dentistasData.forEach(d => map.set(d.token, d));
        const merged = Array.from(map.values());
        dentistasRef.current = merged;
        setDentistas(merged);
      }

      const corMap = new Map<string, string>(
        dentistasRef.current.map(d => [d.token, corParaDentista(d.token, d.cor)])
      );

      const evs: CalEvent[] = (data.eventos ?? []).map(ev => ({
        id: ev.event_id,
        title: ev.titulo,
        start: parseEventDate(ev.inicio, ev.dia_inteiro),
        end: parseEventDate(ev.fim, ev.dia_inteiro),
        allDay: ev.dia_inteiro,
        dentistaNome: ev.dentista_nome,
        cor: corParaDentista(ev.dentista_token, corMap.get(ev.dentista_token)),
        descricao: ev.descricao,
        diaInteiro: ev.dia_inteiro,
      }));
      setEventos(evs);
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [clinica?.id]);

  useEffect(() => {
    if (clinica?.id) buscarEventos(view, date, filtroTokens);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinica?.id, view, date]);

  useEffect(() => {
    if (clinica?.id) buscarEventos(view, date, filtroTokens);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTokens]);

  // ── navegação ───────────────────────────────────────────────────────────────
  function navAnterior() {
    if (view === "month") setDate(d => subMonths(d, 1));
    else if (view === "week") setDate(d => subWeeks(d, 1));
    else setDate(d => subDays(d, 1));
  }
  function navProximo() {
    if (view === "month") setDate(d => addMonths(d, 1));
    else if (view === "week") setDate(d => addWeeks(d, 1));
    else setDate(d => addDays(d, 1));
  }
  function navHoje() { setDate(new Date()); }

  function toggleFiltro(token: string) {
    setFiltroTokens(prev => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token); else next.add(token);
      return next;
    });
  }

  const labelPeriodo = useMemo(() => {
    if (view === "month") return format(date, "MMMM yyyy", { locale: ptBR });
    if (view === "week") {
      const ini = startOfWeekFn(date, { weekStartsOn: 0 });
      const fim = endOfWeek(date, { weekStartsOn: 0 });
      return `${format(ini, "d MMM", { locale: ptBR })} – ${format(fim, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  }, [view, date]);

  function eventPropGetter(event: object) {
    const ev = event as CalEvent;
    return {
      style: {
        backgroundColor: ev.cor,
        borderLeft: `3px solid ${ev.cor}`,
        borderRadius: 5,
        fontSize: 11,
        fontFamily: "'Sora',sans-serif",
        color: "#fff",
        padding: "1px 4px",
      },
    };
  }

  if (carregandoClinica) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 13 }}>Carregando...</div>;
  }

  return (
    <div style={{ fontFamily: "'Sora',sans-serif" }}>

      {/* ── Controles ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={navAnterior} style={{ ...btnBase, padding: "6px 10px" }}><ChevronLeft size={14} /></button>
          <button onClick={navHoje} style={btnBase}>Hoje</button>
          <button onClick={navProximo} style={{ ...btnBase, padding: "6px 10px" }}><ChevronRight size={14} /></button>
        </div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b", textTransform: "capitalize", minWidth: 160 }}>
          {labelPeriodo}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["month", "week", "day"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={view === v ? btnActive : btnBase}>
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>
        <button onClick={() => buscarEventos(view, date, filtroTokens)} disabled={carregando}
          style={{ ...btnBase, padding: "6px 10px", opacity: carregando ? 0.5 : 1 }}>
          <RefreshCw size={13} style={{ animation: carregando ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* ── Barra de dentistas com editor de cor ── */}
      {dentistas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {dentistas.map(d => {
            const cor = corParaDentista(d.token, d.cor);
            const ativo = filtroTokens.size === 0 || filtroTokens.has(d.token);
            const pickerAberto = colorPickerToken === d.token;

            return (
              <div key={d.token} style={{ position: "relative" }}
                ref={pickerAberto ? colorPickerRef : undefined}>

                {/* ── pílula: clique = filtra, duplo clique = editar cor ── */}
                <button
                  onClick={() => toggleFiltro(d.token)}
                  onDoubleClick={() => abrirColorPicker(d.token, cor)}
                  title="Clique para filtrar · duplo clique para editar a cor"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${cor}`,
                    background: ativo ? cor : cor + "28",
                    color: ativo ? "#fff" : cor,
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Sora',sans-serif", transition: "all 0.15s",
                    outline: pickerAberto ? `2px solid ${cor}` : "none",
                    outlineOffset: 1,
                    userSelect: "none",
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ativo ? "#fff" : cor, opacity: ativo ? 1 : 0.65, display: "inline-block", flexShrink: 0 }} />
                  {d.nome}
                </button>

                {/* ── color picker popover ── */}
                {pickerAberto && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: "1px solid #e2e8f0", padding: 14, minWidth: 220,
                  }}>
                    {/* nome do dentista */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                      {d.nome}
                    </div>

                    {/* grade de 24 cores (6 x 4) */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 12 }}>
                      {PALETTE_COLORS.map(c => (
                        <button key={c} onClick={() => salvarCor(d.token, c)} disabled={savingCor}
                          title={c}
                          style={{
                            width: 26, height: 26, borderRadius: 6, background: c, border: "none",
                            cursor: "pointer", outline: cor === c ? `2px solid ${c}` : "2px solid transparent",
                            outlineOffset: 2, transition: "outline 0.1s",
                          }} />
                      ))}
                    </div>

                    {/* input hex livre */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                        background: hexValido(hexInput) ? hexInput : "#e2e8f0",
                        border: "1px solid #e2e8f0",
                      }} />
                      <input
                        value={hexInput}
                        onChange={e => setHexInput(e.target.value)}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 12, border: "1px solid #e2e8f0",
                          borderRadius: 7, fontFamily: "monospace", outline: "none",
                          background: "#f8fafc", color: "#1e293b",
                        }}
                        onKeyDown={e => { if (e.key === "Enter") salvarCor(d.token, hexInput.trim()); }}
                      />
                      <button onClick={() => salvarCor(d.token, hexInput.trim())} disabled={savingCor || !hexValido(hexInput)}
                        style={{
                          padding: "5px 10px", background: hexValido(hexInput) ? "#2B7A78" : "#e2e8f0",
                          color: hexValido(hexInput) ? "#fff" : "#94a3b8",
                          border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600,
                          cursor: hexValido(hexInput) ? "pointer" : "default",
                          fontFamily: "'Sora',sans-serif",
                        }}>
                        OK
                      </button>
                    </div>

                    {/* erro */}
                    {corErro && (
                      <div style={{ fontSize: 11, color: "#dc2626", marginBottom: 8, lineHeight: 1.4 }}>
                        {corErro}
                      </div>
                    )}

                    {/* voltar ao automático */}
                    <button onClick={() => salvarCor(d.token, "")} disabled={savingCor}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        padding: "6px", background: "#f8fafc", border: "1px solid #e2e8f0",
                        borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        color: "#64748b", fontFamily: "'Sora',sans-serif",
                      }}>
                      <RotateCcw size={11} /> Voltar ao automático
                    </button>

                    {savingCor && (
                      <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                        Salvando...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Erro de calendário ── */}
      {erro && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>
          {erro}
        </div>
      )}

      {/* ── Sem dentistas ── */}
      {!carregando && dentistas.length === 0 && !erro && (
        <div style={{ textAlign: "center", padding: "32px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.2)", color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
          Nenhum dentista ativo configurado. Ative um profissional em Configurações.
        </div>
      )}

      {/* ── Calendário ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
        {carregando && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Carregando agenda...</div>
          </div>
        )}
        <Calendar
          localizer={localizer}
          events={eventos}
          view={view}
          date={date}
          onView={() => {}}
          onNavigate={() => {}}
          eventPropGetter={eventPropGetter}
          onSelectEvent={(ev) => setEventoSel(ev as CalEvent)}
          min={minTime}
          max={maxTime}
          style={{ height: view === "month" ? 620 : 700, padding: 8 }}
          messages={{
            today: "Hoje", previous: "Anterior", next: "Próximo",
            month: "Mês", week: "Semana", day: "Dia",
            noEventsInRange: "Nenhum evento neste período.",
            showMore: (total: number) => `+${total} mais`,
          }}
          culture="pt-BR"
          dayPropGetter={(d) => ({
            style: isToday(d) ? { background: "rgba(43,122,120,0.04)" } : {},
          })}
          toolbar={false}
        />
      </div>

      {/* ── Popover de evento ── */}
      {eventoSel && (
        <div onClick={() => setEventoSel(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ height: 4, borderRadius: 4, background: eventoSel.cor, marginBottom: 14 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12, lineHeight: 1.4 }}>
              {eventoSel.title as string}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <LinhaDetalhe label="Profissional" valor={eventoSel.dentistaNome} cor={eventoSel.cor} />
              {eventoSel.diaInteiro ? (
                <LinhaDetalhe label="Data" valor={format(eventoSel.start as Date, "dd/MM/yyyy")} />
              ) : (
                <LinhaDetalhe label="Horário"
                  valor={`${format(eventoSel.start as Date, "dd/MM/yyyy HH:mm")} – ${format(eventoSel.end as Date, "HH:mm")}`} />
              )}
              {eventoSel.descricao && <LinhaDetalhe label="Descrição" valor={eventoSel.descricao} />}
            </div>
            <button onClick={() => setEventoSel(null)}
              style={{ marginTop: 16, width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", fontFamily: "'Sora',sans-serif" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ── CSS overrides para react-big-calendar ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rbc-calendar { font-family: 'Sora', sans-serif !important; font-size: 12px; }
        .rbc-header { font-size: 11px; font-weight: 600; color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .rbc-month-view, .rbc-time-view { border: none !important; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9 !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #f1f5f9 !important; }
        .rbc-off-range-bg { background: #fafafa; }
        .rbc-today { background: rgba(43,122,120,0.06) !important; }
        .rbc-date-cell.rbc-now > a {
          background: #2B7A78; color: #fff; border-radius: 50%;
          width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
        }
        .rbc-event, .rbc-event.rbc-selected { background-color: transparent; border: none; }
        .rbc-event:focus { outline: none; }
        .rbc-show-more { font-size: 11px; color: #2B7A78; font-weight: 600; }
        .rbc-time-slot { font-size: 10px; color: #94a3b8; }
        .rbc-current-time-indicator { background: #2B7A78; }
        .rbc-allday-cell { font-size: 11px; }
      `}</style>
    </div>
  );
}

function LinhaDetalhe({ label, valor, cor }: { label: string; valor: string; cor?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px", minWidth: 80, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: cor ?? "#1e293b", fontWeight: cor ? 600 : 400, flex: 1 }}>
        {valor}
      </span>
    </div>
  );
}
