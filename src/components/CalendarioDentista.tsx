"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Calendar, dateFnsLocalizer, View, Event as RBCEvent, type Components } from "react-big-calendar";
import {
  format, parse, startOfWeek, getDay,
  startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, isSameDay, isSameMonth, parseISO, eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw, X, Ban } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
// @ts-expect-error react-big-calendar não publica tipos para o import interno /lib/Week
import Week from "react-big-calendar/lib/Week";
import { sb, calcularIdade, type Dentista, type Agendamento, type Paciente, type AnamnesePaciente } from "@/lib/supabase";

// ── paleta (espelho do painel) ──────────────────────────────────────────────
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

// ── status (pt fixo — app do dentista não usa LangProvider) ──────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  confirmado: { bg: "rgba(59,130,246,0.12)",  color: "#2563eb", label: "Confirmado" },
  ok:         { bg: "rgba(16,185,129,0.12)",  color: "#059669", label: "✓ Concluído" },
  faltou:     { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: "✗ Faltou" },
  cancelado:  { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: "Cancelado" },
  remarcado:  { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Remarcado" },
};

function anamneseAlertas(a: AnamnesePaciente | undefined): string[] {
  if (!a) return [];
  const al: string[] = [];
  if (a.diabetes)    al.push("Diabetes");
  if (a.hipertensao) al.push("Hipertensão");
  if (a.gravidez)    al.push("Gravidez");
  if (a.fumante)     al.push("Fumante");
  if (a.alergias?.trim())                  al.push(`Alergias: ${a.alergias.trim()}`);
  if (a.medicamentos_uso_continuo?.trim()) al.push(`Medicamentos: ${a.medicamentos_uso_continuo.trim()}`);
  if (a.observacoes_saude?.trim())         al.push(`Obs: ${a.observacoes_saude.trim()}`);
  return al;
}

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type EventoAPI = {
  event_id: string; dentista_token: string; dentista_nome: string;
  titulo: string; descricao: string; inicio: string; fim: string; dia_inteiro: boolean;
};
type CalendarioResponse = {
  sucesso: boolean; hora_abertura?: string | null; hora_fechamento?: string | null;
  dentistas?: { token: string; nome: string; cor: string }[]; eventos?: EventoAPI[]; erro?: string;
};
type CalEvent = RBCEvent & {
  id: string; dentistaNome: string; cor: string; descricao: string; diaInteiro: boolean;
  status?: string; agendamentoId?: string;
};

function parseEventDate(raw: string, diaInteiro: boolean): Date {
  if (diaInteiro) { const [y, m, d] = raw.split("-").map(Number); return new Date(y, m - 1, d); }
  return parseISO(raw);
}
function parseHoraRBC(hhmm: string | null | undefined, fallbackHour: number): Date {
  if (hhmm) { const [h, m] = hhmm.split(":").map(Number); if (!isNaN(h) && !isNaN(m)) return new Date(1970, 0, 1, h, m, 0); }
  return new Date(1970, 0, 1, fallbackHour, 0, 0);
}
function getRangeForView(view: View, date: Date): { inicio: string; fim: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (view === "month") return { inicio: fmt(startOfWeekFn(startOfMonth(date), { weekStartsOn: 0 })), fim: fmt(endOfWeek(endOfMonth(date), { weekStartsOn: 0 })) };
  if (view === "week") return { inicio: fmt(startOfWeekFn(date, { weekStartsOn: 0 })), fim: fmt(endOfWeek(date, { weekStartsOn: 0 })) };
  return { inicio: fmt(date), fim: fmt(date) };
}

const STATUS_OCUPA = ["confirmado", "ok", "faltou"];

// Vista Semana: oculta domingo sempre; sábado só se o dentista trabalha sábado
let MOSTRAR_SABADO = false;
const _weekRangeOrig = Week.range;
Week.range = (date: Date, opts: { localizer: unknown }) => {
  const dias: Date[] = _weekRangeOrig(date, opts);
  return dias.filter((d: Date) => {
    const dow = d.getDay();
    if (dow === 0) return false;
    if (dow === 6 && !MOSTRAR_SABADO) return false;
    return true;
  });
};

const btnBase: React.CSSProperties = {
  padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0",
  borderRadius: 8, cursor: "pointer", fontFamily: "'Sora',sans-serif",
  background: "#fff", color: "#475569", transition: "all 0.15s",
};

// ── componente ────────────────────────────────────────────────────────────────
export default function CalendarioDentista({ clinicaId, dentista }: { clinicaId: string; dentista: Dentista }) {
  const token = (dentista.token_acesso || "").trim();

  const [view, setView] = useState<View>("day"); // padrão Dia (app é mobile)
  const [date, setDate] = useState<Date>(new Date());
  const [eventos, setEventos] = useState<CalEvent[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [corDentista, setCorDentista] = useState<string>(corParaDentista(token));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [minTime, setMinTime] = useState<Date>(new Date(1970, 0, 1, 5, 0, 0));
  const [maxTime, setMaxTime] = useState<Date>(new Date(1970, 0, 1, 19, 0, 0));

  const [miniMonth, setMiniMonth] = useState<Date>(new Date());
  useEffect(() => { setMiniMonth(date); }, [date]);

  // drawer
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null);
  const [drawerAg, setDrawerAg] = useState<Agendamento | null>(null);
  const [drawerPaciente, setDrawerPaciente] = useState<Paciente | null>(null);
  const [drawerHist, setDrawerHist] = useState<Agendamento[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // sábado da vista semana = só se este dentista trabalha sábado
  MOSTRAR_SABADO = String(dentista.sabado) === "true";

  const buscarEventos = useCallback(async (v: View, d: Date) => {
    if (!token) return;
    const { inicio, fim } = getRangeForView(v, d);
    setCarregando(true);
    setErro("");
    try {
      const body = { clinica_id: clinicaId, data_inicio: inicio, data_fim: fim, dentistas_tokens: [token] };
      const [res, agsRaw] = await Promise.all([
        fetch("/api/calendario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          .then(r => r.json()).catch(() => ({ sucesso: false })),
        sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${clinicaId}&data=gte.${inicio}&data=lte.${fim}`).catch(() => [] as Agendamento[]),
      ]);
      const data = res as CalendarioResponse;
      if (!data.sucesso) { setErro("Não foi possível carregar a agenda. Tente novamente."); return; }

      const ags = agsRaw as Agendamento[];
      setAgendamentos(ags);
      const agMap = new Map<string, Agendamento>();
      ags.forEach(a => { if (a.event_id) agMap.set(a.event_id, a); });

      setMinTime(parseHoraRBC(data.hora_abertura, 5));
      setMaxTime(parseHoraRBC(data.hora_fechamento, 19));

      const cor = corParaDentista(token, data.dentistas?.[0]?.cor);
      setCorDentista(cor);

      const evs: CalEvent[] = (data.eventos ?? [])
        .filter(ev => { const a = agMap.get(ev.event_id); return !(a && (a.status === "cancelado" || a.status === "remarcado")); })
        .map(ev => {
          const a = agMap.get(ev.event_id);
          return {
            id: ev.event_id, title: ev.titulo,
            start: parseEventDate(ev.inicio, ev.dia_inteiro), end: parseEventDate(ev.fim, ev.dia_inteiro),
            allDay: ev.dia_inteiro, dentistaNome: ev.dentista_nome, cor,
            descricao: ev.descricao, diaInteiro: ev.dia_inteiro, status: a?.status, agendamentoId: a?.id,
          };
        });
      setEventos(evs);
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [clinicaId, token]);

  useEffect(() => { if (token) buscarEventos(view, date); }, [token, view, date, buscarEventos]);

  function navAnterior() { if (view === "month") setDate(d => subMonths(d, 1)); else if (view === "week") setDate(d => subWeeks(d, 1)); else setDate(d => subDays(d, 1)); }
  function navProximo() { if (view === "month") setDate(d => addMonths(d, 1)); else if (view === "week") setDate(d => addWeeks(d, 1)); else setDate(d => addDays(d, 1)); }
  function navHoje() { setDate(new Date()); }

  const labelPeriodo = useMemo(() => {
    if (view === "month") return format(date, "MMMM yyyy", { locale: ptBR });
    if (view === "week") {
      const ini = startOfWeekFn(date, { weekStartsOn: 0 }); const fim = endOfWeek(date, { weekStartsOn: 0 });
      return `${format(ini, "d MMM", { locale: ptBR })} – ${format(fim, "d MMM yyyy", { locale: ptBR })}`;
    }
    return format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  }, [view, date]);

  function eventPropGetter(event: object) {
    const ev = event as CalEvent;
    let opacity = 1; let filter = "none";
    if (ev.status === "ok") opacity = 0.7; else if (ev.status === "faltou") { opacity = 0.5; filter = "grayscale(55%)"; }
    return { style: { backgroundColor: ev.cor, border: "none", boxShadow: "none", borderRadius: 5, fontSize: 11, fontFamily: "'Sora',sans-serif", color: "#fff", padding: "3px 7px", opacity, filter } };
  }

  const calComponents = useMemo<Components<CalEvent, object>>(() => ({
    event: ({ event }) => {
      const ev = event as CalEvent;
      const past = ev.start instanceof Date && ev.start.getTime() < Date.now();
      const alerta = (view === "week" || view === "day") && ev.status === "confirmado" && past;
      const icon = ev.status === "ok" ? "✓" : ev.status === "faltou" ? "✗" : null;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 3, width: "100%", overflow: "hidden" }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title as string}</span>
          {alerta ? <span title="Atualize: compareceu ou faltou?" style={{ flexShrink: 0 }}>⚠️</span>
            : icon ? <span style={{ flexShrink: 0, fontWeight: 700 }}>{icon}</span> : null}
        </div>
      );
    },
    header: ({ date: d, label }: { date: Date; label: string }) => {
      if (view === "month") return <span style={{ textTransform: "uppercase", fontSize: 10.5, letterSpacing: "0.06em", color: "#93A29D", fontWeight: 600 }}>{label}</span>;
      const n = eventos.filter(e => e.start instanceof Date && isSameDay(e.start as Date, d) && e.status && STATUS_OCUPA.includes(e.status)).length;
      const hoje = isToday(d);
      return (
        <div onClick={() => { setDate(d); setView("day"); }} title="Ver dia"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "3px 0", cursor: "pointer" }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#93A29D" }}>{format(d, "EEE", { locale: ptBR })}</span>
          <span style={hoje
            ? { display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", background: "#2B7A78", color: "#fff", fontSize: 16, fontWeight: 700 }
            : { fontSize: 17, fontWeight: 700, color: "#0E1F1C", lineHeight: 1.2 }}>{format(d, "d")}</span>
          {n > 0 && <span style={{ fontSize: 10, color: "#2B7A78", fontWeight: 600 }}>{n} consulta{n !== 1 ? "s" : ""}</span>}
        </div>
      );
    },
  }), [view, eventos]);

  async function abrirDrawer(ev: CalEvent) {
    setDrawerEvent(ev); setDrawerLoading(true); setDrawerPaciente(null); setDrawerHist([]);
    const ag = ev.agendamentoId ? agendamentos.find(a => a.id === ev.agendamentoId) || null : null;
    setDrawerAg(ag);
    setDrawerStatus(ag?.status || ev.status || "");
    try {
      let pac: Paciente | null = null;
      if (ag?.paciente_id) { const r = await sb.query<Paciente>("pacientes", `?clinica_id=eq.${clinicaId}&id=eq.${ag.paciente_id}`); pac = r[0] || null; }
      if (!pac && ag?.telefone) { const r = await sb.query<Paciente>("pacientes", `?clinica_id=eq.${clinicaId}&telefone=eq.${encodeURIComponent(ag.telefone)}`); pac = r[0] || null; }
      let hist: Agendamento[] = [];
      if (pac) {
        const conds: string[] = [];
        if (pac.id) conds.push(`paciente_id.eq.${pac.id}`);
        if (pac.telefone) conds.push(`telefone.eq.${encodeURIComponent(pac.telefone)}`);
        if (conds.length) {
          const q = conds.length > 1
            ? `?clinica_id=eq.${clinicaId}&or=(${conds.join(",")})&order=data.desc,horario.desc`
            : `?clinica_id=eq.${clinicaId}&${conds[0].replace(".eq.", "=eq.")}&order=data.desc,horario.desc`;
          hist = await sb.query<Agendamento>("agendamentos", q).catch(() => []);
        }
      }
      setDrawerPaciente(pac); setDrawerHist(hist);
    } catch { /* ignore */ } finally { setDrawerLoading(false); }
  }
  function fecharDrawer() { setDrawerEvent(null); setDrawerAg(null); setDrawerPaciente(null); setDrawerHist([]); }

  async function marcarStatus(novo: "confirmado" | "ok" | "faltou") {
    if (!drawerAg) return;
    setUpdatingStatus(true);
    try {
      await sb.update("agendamentos", drawerAg.id, { status: novo });
      setDrawerStatus(novo);
      setDrawerAg(prev => prev ? { ...prev, status: novo } : prev);
      setAgendamentos(prev => prev.map(a => a.id === drawerAg.id ? { ...a, status: novo as Agendamento["status"] } : a));
      setDrawerHist(prev => prev.map(a => a.id === drawerAg.id ? { ...a, status: novo as Agendamento["status"] } : a));
      setEventos(prev => prev.map(e => e.agendamentoId === drawerAg.id ? { ...e, status: novo } : e));
    } catch { /* ignore */ } finally { setUpdatingStatus(false); }
  }

  // mini calendário
  const miniDias = useMemo(() => {
    const ini = startOfWeekFn(startOfMonth(miniMonth), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(miniMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: ini, end: fim });
  }, [miniMonth]);
  const semanaLabels = useMemo(() => miniDias.slice(0, 7).map(d => format(d, "eeeee", { locale: ptBR })), [miniDias]);
  function diaNoPeriodo(dia: Date): boolean {
    if (view === "day") return isSameDay(dia, date);
    if (view === "week") return dia >= startOfWeekFn(date, { weekStartsOn: 0 }) && dia <= endOfWeek(date, { weekStartsOn: 0 });
    return isSameMonth(dia, date);
  }

  // ── guard: sem token não dá para buscar a agenda ──
  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.2)", fontFamily: "'Sora',sans-serif" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⚙️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Token não configurado</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Fale com o administrador da clínica para ativar o calendário.</div>
      </div>
    );
  }

  void corDentista; // usado via eventos (cor já aplicada); mantém referência p/ futuro

  const drawerAlertas = anamneseAlertas(drawerPaciente?.anamnese);
  const drawerTotal = drawerHist.filter(a => ["confirmado", "ok"].includes(a.status)).length;
  const drawerHistVisivel = drawerHist.filter(a => !["cancelado", "remarcado"].includes(a.status));
  const horarioPassou = !!drawerAg && new Date() > new Date(`${drawerAg.data}T${drawerAg.horario}`);
  const drawerStat = STATUS_STYLE[drawerStatus];

  return (
    <div style={{ fontFamily: "'Sora',sans-serif" }}>

      {/* ── Controles ── */}
      <div style={{ marginBottom: 8 }}>
        {/* Linha 1: nav + período + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={navAnterior} style={{ padding: "3px 7px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#475569", display: "flex", alignItems: "center" }}><ChevronLeft size={12} /></button>
            <button onClick={navHoje} style={{ padding: "3px 9px", fontSize: 11, fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#475569", fontFamily: "'Sora',sans-serif" }}>Hoje</button>
            <button onClick={navProximo} style={{ padding: "3px 7px", fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#475569", display: "flex", alignItems: "center" }}><ChevronRight size={12} /></button>
          </div>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelPeriodo}</div>
          <button onClick={() => buscarEventos(view, date)} disabled={carregando}
            style={{ padding: "3px 7px", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: "#fff", color: "#475569", display: "flex", alignItems: "center", opacity: carregando ? 0.5 : 1 }}>
            <RefreshCw size={12} style={{ animation: carregando ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
        {/* Linha 2: seletor de vista — largura total */}
        <div style={{ display: "flex", background: "#eef2f1", border: "1px solid #e2e8f0", borderRadius: 8, padding: 2 }}>
          {(["month", "week", "day"] as View[]).map(v => {
            const on = view === v;
            return (
              <button key={v} onClick={() => setView(v)}
                style={{ flex: 1, fontSize: 11.5, fontWeight: 600, fontFamily: "'Sora',sans-serif", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", background: on ? "#2B7A78" : "transparent", color: on ? "#fff" : "#64748b", transition: "all 0.12s" }}>
                {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
              </button>
            );
          })}
        </div>
      </div>

      {erro && <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{erro}</div>}

      {/* ── Calendário principal ── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative", boxShadow: "0 1px 2px rgba(16,40,36,0.04)", marginBottom: 10 }}>
        {carregando && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Carregando...</div>
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
          components={calComponents}
          onSelectEvent={(ev) => abrirDrawer(ev as CalEvent)}
          onDrillDown={(d) => { setDate(d); setView("day"); }}
          min={minTime}
          max={maxTime}
          style={{ height: "calc(100vh - 210px)", minHeight: 440, padding: "4px 2px" }}
          messages={{ today: "Hoje", previous: "Anterior", next: "Próximo", month: "Mês", week: "Semana", day: "Dia", noEventsInRange: "Nenhum evento.", showMore: (total: number) => `+${total} mais` }}
          culture="pt-BR"
          dayPropGetter={(d) => ({ style: isToday(d) ? { background: "rgba(43,122,120,0.04)" } : {} })}
          toolbar={false}
        />
      </div>

      {/* ── Mini calendário + Bloquear (só Semana/Dia) ── */}
      {view !== "month" && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>

          {/* Mini calendário */}
          <div style={{ flex: 1, minWidth: 0, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "10px 10px 8px", boxShadow: "0 1px 2px rgba(16,40,36,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>{format(miniMonth, "MMMM yyyy", { locale: ptBR })}</span>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => setMiniMonth(m => subMonths(m, 1))} style={{ width: 20, height: 20, border: "none", background: "#f1f5f9", borderRadius: 6, cursor: "pointer", color: "#64748b", display: "grid", placeItems: "center" }}><ChevronLeft size={11} /></button>
                <button onClick={() => setMiniMonth(m => addMonths(m, 1))} style={{ width: 20, height: 20, border: "none", background: "#f1f5f9", borderRadius: 6, cursor: "pointer", color: "#64748b", display: "grid", placeItems: "center" }}><ChevronRight size={11} /></button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
              {semanaLabels.map((l, i) => <div key={i} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{l}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
              {miniDias.map(dia => {
                const fora = !isSameMonth(dia, miniMonth); const hoje = isToday(dia); const sel = diaNoPeriodo(dia);
                return (
                  <button key={dia.toISOString()} onClick={() => { setDate(dia); setView("day"); }}
                    style={{ aspectRatio: "1", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10, fontFamily: "'Sora',sans-serif", background: hoje ? "#2B7A78" : sel ? "rgba(43,122,120,0.12)" : "transparent", color: hoje ? "#fff" : fora ? "#cbd5e1" : "#334155", fontWeight: (hoje || sel) ? 700 : 400, transition: "background 0.12s" }}>
                    {format(dia, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloquear horários */}
          <button type="button" title="Bloquear horários"
            style={{ flexShrink: 0, width: 76, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "12px 6px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 10.5, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "'Sora',sans-serif", boxShadow: "0 1px 2px rgba(16,40,36,0.04)", alignSelf: "stretch" }}>
            <Ban size={16} color="#94a3b8" />
            <span style={{ textAlign: "center", lineHeight: 1.3 }}>Bloquear horários</span>
          </button>

        </div>
      )}

      {/* ── Drawer: ficha do paciente ── */}
      {drawerEvent && (
        <>
          <div onClick={fecharDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "min(440px,100%)", background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#DEF2F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#2B7A78", flexShrink: 0 }}>
                {((drawerPaciente?.nome || (drawerEvent.title as string) || "?")[0] || "?").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{drawerPaciente?.nome || (drawerEvent.title as string)}</div>
                {drawerPaciente?.telefone && <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{drawerPaciente.telefone}</div>}
              </div>
              <button onClick={fecharDrawer} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, display: "flex" }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {drawerLoading ? (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "40px 0" }}>Carregando...</div>
              ) : (
                <>
                  {/* status + ações */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {drawerAg && (
                      <>
                        <button onClick={() => marcarStatus("confirmado")} disabled={updatingStatus}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif", background: drawerStatus === "confirmado" ? "#DBEAFE" : "#fff", color: drawerStatus === "confirmado" ? "#2563EB" : "#475569", border: drawerStatus === "confirmado" ? "1px solid #2563EB" : "1px solid #e2e8f0", opacity: updatingStatus ? 0.6 : 1 }}>
                          ✓ Confirmado
                        </button>
                        <button onClick={() => marcarStatus("ok")} disabled={updatingStatus || !horarioPassou} title={!horarioPassou ? "Disponível após o horário" : undefined}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Sora',sans-serif", cursor: (updatingStatus || !horarioPassou) ? "not-allowed" : "pointer", background: !horarioPassou ? "#f1f5f9" : drawerStatus === "ok" ? "#DCFCE7" : "#fff", color: !horarioPassou ? "#cbd5e1" : drawerStatus === "ok" ? "#16A34A" : "#475569", border: !horarioPassou ? "1px solid #e2e8f0" : drawerStatus === "ok" ? "1px solid #16A34A" : "1px solid #e2e8f0", opacity: updatingStatus ? 0.6 : 1 }}>
                          ✓ Veio
                        </button>
                        <button onClick={() => marcarStatus("faltou")} disabled={updatingStatus || !horarioPassou} title={!horarioPassou ? "Disponível após o horário" : undefined}
                          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Sora',sans-serif", cursor: (updatingStatus || !horarioPassou) ? "not-allowed" : "pointer", background: !horarioPassou ? "#f1f5f9" : drawerStatus === "faltou" ? "#FEE2E2" : "#fff", color: !horarioPassou ? "#cbd5e1" : drawerStatus === "faltou" ? "#DC2626" : "#475569", border: !horarioPassou ? "1px solid #e2e8f0" : drawerStatus === "faltou" ? "1px solid #DC2626" : "1px solid #e2e8f0", opacity: updatingStatus ? 0.6 : 1 }}>
                          ✗ Faltou
                        </button>
                      </>
                    )}
                    {!drawerAg && drawerStat && (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: drawerStat.bg, color: drawerStat.color }}>{drawerStat.label}</span>
                    )}
                  </div>

                  {/* dados do agendamento */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                    {[
                      ["Data", drawerAg?.data || (drawerEvent.start ? format(drawerEvent.start as Date, "dd/MM/yyyy") : "—")],
                      ["Horário", drawerAg?.horario || (drawerEvent.diaInteiro ? "—" : drawerEvent.start ? format(drawerEvent.start as Date, "HH:mm") : "—")],
                      ["Procedimento", drawerAg?.procedimento || "—"],
                      ["Profissional", drawerAg?.dentista_nome || drawerEvent.dentistaNome || "—"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {!drawerPaciente ? (
                    <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>Paciente não encontrado.</div>
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        {[
                          ["Documento", drawerPaciente.documento || "—"],
                          ["Nascimento", drawerPaciente.data_nascimento || "—"],
                          ["Idade", calcularIdade(drawerPaciente.data_nascimento) || "—"],
                          ["Email", drawerPaciente.email || "—"],
                          ["Consultas", String(drawerTotal)],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, wordBreak: "break-word" }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {(() => {
                        const temAlerta = drawerAlertas.length > 0;
                        return (
                          <div style={{ padding: "10px 12px", background: temAlerta ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)", border: temAlerta ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(16,185,129,0.25)", borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: temAlerta ? 6 : 0 }}>
                              <span>{temAlerta ? "⚠️" : "✓"}</span>
                              <div style={{ fontSize: 12, fontWeight: 700, color: temAlerta ? "#dc2626" : "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>{temAlerta ? "Alertas de saúde" : "Anamnese"}</div>
                            </div>
                            {!drawerPaciente.anamnese && <div style={{ fontSize: 11, color: "#059669", opacity: 0.8 }}>Sem anamnese registrada.</div>}
                            {drawerPaciente.anamnese && !temAlerta && <div style={{ fontSize: 11, color: "#059669", opacity: 0.8 }}>Sem alertas.</div>}
                            {temAlerta && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {drawerAlertas.map(al => <span key={al} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{al}</span>)}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {drawerHistVisivel.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Histórico</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {drawerHistVisivel.slice(0, 6).map((x, xi) => {
                              const xs = STATUS_STYLE[x.status] || { bg: "#f1f5f9", color: "#64748b", label: x.status };
                              return (
                                <div key={xi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#fff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{x.procedimento || "Consulta"}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{x.data} · {x.horario} · {x.dentista_nome}</div>
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: xs.bg, color: xs.color, flexShrink: 0 }}>{xs.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Odontograma</div>
                    <div style={{ height: 56, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#cbd5e1" }}>Em breve</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Arquivos e documentos</div>
                    <div style={{ height: 56, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#cbd5e1" }}>Em breve</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CSS overrides (espelho do painel) ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rbc-calendar { font-family: 'Sora', sans-serif !important; font-size: 12px; }
        .rbc-header { font-size: 11px; font-weight: 600; color: #64748b; padding: 6px 2px; border-bottom: 1px solid #f1f5f9; }
        .rbc-month-view, .rbc-time-view { border: none !important; }
        .rbc-time-header { position: sticky; top: 0; z-index: 6; background: #fff; }
        .rbc-time-header .rbc-header { overflow: visible; padding: 4px 2px; border-bottom: none; }
        .rbc-time-header-content { border-bottom: 1px solid #E8EDEB; }
        .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9 !important; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #f1f5f9 !important; }
        .rbc-off-range-bg { background: #fafafa; }
        .rbc-today { background: rgba(43,122,120,0.06) !important; }
        .rbc-event, .rbc-day-slot .rbc-event, .rbc-month-view .rbc-event, .rbc-event.rbc-selected { background-color: transparent; border: none; box-shadow: none; }
        .rbc-event-content { font-weight: 600; }
        .rbc-event-label { font-size: 10px; opacity: 0.7; font-weight: 600; }
        .rbc-event:focus { outline: none; }
        .rbc-show-more { font-size: 11px; color: #2B7A78; font-weight: 600; }
        .rbc-time-slot { font-size: 10px; border-top: none; }
        .rbc-time-gutter .rbc-time-slot, .rbc-time-gutter .rbc-label { color: #64748b; font-weight: 500; }
        .rbc-current-time-indicator { background: #EA4335; height: 2px; position: relative; }
        .rbc-current-time-indicator::before { content: ""; position: absolute; left: -5px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #EA4335; }
        .rbc-allday-cell { font-size: 11px; }
        .rbc-time-content { border-top: 1px solid #E8EDEB; }
        .rbc-timeslot-group { border-bottom: 1px solid #e2e8f0; min-height: 48px; }
        .rbc-day-slot .rbc-time-slot + .rbc-time-slot { border-top: 1px solid rgba(226,232,240,0.4); }
        .rbc-time-content > * + * { border-left: 1px solid #F1F4F3; }
        .rbc-time-header.rbc-overflowing { border-right-color: #E8EDEB; }
        .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; }
        .rbc-time-gutter { min-width: 40px !important; width: 40px !important; }
        .rbc-time-header-gutter { min-width: 40px !important; width: 40px !important; }
        .rbc-time-gutter .rbc-label { font-size: 9px !important; padding: 0 4px !important; }
      `}</style>
    </div>
  );
}
