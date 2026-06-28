"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, View, Event as RBCEvent } from "react-big-calendar";
import {
  format, parse, startOfWeek, getDay,
  startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { sb, type Clinica } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";

// ── paleta de cores dos dentistas ────────────────────────────────────────────
const DENTIST_COLORS = [
  "#2563EB","#16A34A","#DC2626","#9333EA","#EA580C","#0891B2",
  "#DB2777","#65A30D","#7C3AED","#CA8A04","#0F766E","#BE123C",
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
  dentistas?: DentistaInfo[];
  eventos?: EventoAPI[];
  erro?: string;
};

// Evento tipado para o react-big-calendar
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
    // "2026-07-01" — interpretar como meia-noite local, sem conversão
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // ISO com offset — usar parseISO do date-fns (preserva o offset sem reconverter)
  return parseISO(raw);
}

function getRangeForView(view: View, date: Date): { inicio: string; fim: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (view === "month") {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    return {
      inicio: fmt(startOfWeekFn(monthStart, { weekStartsOn: 0 })),
      fim: fmt(endOfWeek(monthEnd, { weekStartsOn: 0 })),
    };
  }
  if (view === "week") {
    return {
      inicio: fmt(startOfWeekFn(date, { weekStartsOn: 0 })),
      fim: fmt(endOfWeek(date, { weekStartsOn: 0 })),
    };
  }
  // day
  return { inicio: fmt(date), fim: fmt(date) };
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
  void t; // painel usa i18n no layout; textos da aba são strings fixas (todas as chaves estão no translations.ts)

  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [carregandoClinica, setCarregandoClinica] = useState(true);

  // Estado do calendário
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [eventos, setEventos] = useState<CalEvent[]>([]);
  const [dentistas, setDentistas] = useState<DentistaInfo[]>([]);
  const [filtroTokens, setFiltroTokens] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // popover
  const [eventoSel, setEventoSel] = useState<CalEvent | null>(null);

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

      const dentistasData = data.dentistas ?? [];
      setDentistas(dentistasData);

      const corMap = new Map<string, string>(
        dentistasData.map(d => [d.token, corParaDentista(d.token, d.cor)])
      );

      const evs: CalEvent[] = (data.eventos ?? []).map(ev => ({
        id: ev.event_id,
        title: ev.titulo,
        start: parseEventDate(ev.inicio, ev.dia_inteiro),
        end: parseEventDate(ev.fim, ev.dia_inteiro),
        allDay: ev.dia_inteiro,
        dentistaNome: ev.dentista_nome,
        cor: corMap.get(ev.dentista_token) ?? "#94a3b8",
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

  // dispara busca quando clínica carrega ou view/date mudam
  useEffect(() => {
    if (clinica?.id) buscarEventos(view, date, filtroTokens);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinica?.id, view, date]);

  // ── filtro por dentista ─────────────────────────────────────────────────────
  function toggleFiltro(token: string) {
    setFiltroTokens(prev => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token); else next.add(token);
      return next;
    });
  }

  // rebusca quando filtro muda (após clinica carregada)
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

  // ── label do período ────────────────────────────────────────────────────────
  const labelPeriodo = useMemo(() => {
    if (view === "month") return format(date, "MMMM yyyy", { locale: ptBR });
    if (view === "week") {
      const ini = startOfWeekFn(date, { weekStartsOn: 0 });
      const fim = endOfWeek(date, { weekStartsOn: 0 });
      return `${format(ini, "d MMM", { locale: ptBR })} – ${format(fim, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  }, [view, date]);

  // ── estilo dos eventos (cor por dentista) ───────────────────────────────────
  function eventPropGetter(event: object) {
    const ev = event as CalEvent;
    return {
      style: {
        backgroundColor: ev.cor,
        borderColor: ev.cor,
        borderRadius: 5,
        fontSize: 11,
        fontFamily: "'Sora',sans-serif",
        color: "#fff",
        border: "none",
        padding: "1px 4px",
      },
    };
  }

  // ── render ──────────────────────────────────────────────────────────────────
  if (carregandoClinica) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 13 }}>Carregando...</div>;
  }

  return (
    <div style={{ fontFamily: "'Sora',sans-serif" }}>
      {/* ── Cabeçalho de controles ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {/* Navegação */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={navAnterior} style={{ ...btnBase, padding: "6px 10px" }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={navHoje} style={btnBase}>Hoje</button>
          <button onClick={navProximo} style={{ ...btnBase, padding: "6px 10px" }}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Label do período */}
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b", textTransform: "capitalize", minWidth: 160 }}>
          {labelPeriodo}
        </div>

        {/* Toggle de modo */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["month", "week", "day"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={view === v ? btnActive : btnBase}>
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button onClick={() => buscarEventos(view, date, filtroTokens)}
          disabled={carregando}
          style={{ ...btnBase, padding: "6px 10px", opacity: carregando ? 0.5 : 1 }}>
          <RefreshCw size={13} style={{ animation: carregando ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {/* ── Legenda + filtro por dentista ── */}
      {dentistas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {dentistas.map(d => {
            const cor = corParaDentista(d.token, d.cor);
            const ativo = filtroTokens.size === 0 || filtroTokens.has(d.token);
            return (
              <button key={d.token} onClick={() => toggleFiltro(d.token)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  border: `1px solid ${ativo ? cor : cor + "60"}`,
                  background: ativo ? cor : cor + "28",
                  color: ativo ? "#fff" : cor,
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Sora',sans-serif", transition: "all 0.15s",
                }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: ativo ? "#fff" : cor, opacity: ativo ? 1 : 0.7, display: "inline-block" }} />
                {d.nome}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Erro ── */}
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
          onView={() => {/* controlado externamente */}}
          onNavigate={() => {/* controlado externamente */}}
          eventPropGetter={eventPropGetter}
          onSelectEvent={(ev) => setEventoSel(ev as CalEvent)}
          min={new Date(1970, 0, 1, 7, 0, 0)}
          max={new Date(1970, 0, 1, 19, 0, 0)}
          style={{ height: view === "month" ? 620 : 700, padding: 8 }}
          messages={{
            today: "Hoje", previous: "Anterior", next: "Próximo",
            month: "Mês", week: "Semana", day: "Dia",
            noEventsInRange: "Nenhum evento neste período.",
            showMore: (total: number) => `+${total} mais`,
          }}
          culture="pt-BR"
          dayPropGetter={(d) => ({
            style: isToday(d)
              ? { background: "rgba(43,122,120,0.04)" }
              : {},
          })}
          toolbar={false}
        />
      </div>

      {/* ── Popover de evento ── */}
      {eventoSel && (
        <div
          onClick={() => setEventoSel(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

            {/* barra de cor do dentista */}
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
              {eventoSel.descricao && (
                <LinhaDetalhe label="Descrição" valor={eventoSel.descricao} />
              )}
            </div>

            <button onClick={() => setEventoSel(null)}
              style={{ marginTop: 16, width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#475569", fontFamily: "'Sora',sans-serif" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ── CSS global para o RBC ── */}
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
        .rbc-event { cursor: pointer; }
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
