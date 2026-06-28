"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, View, Event as RBCEvent, type Components } from "react-big-calendar";
import {
  format, parse, startOfWeek, getDay,
  startOfMonth, endOfMonth, startOfWeek as startOfWeekFn, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, isSameDay, isSameMonth, parseISO, eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, X } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
// @ts-expect-error react-big-calendar não publica tipos para o import interno /lib/Week
import Week from "react-big-calendar/lib/Week";
import { sb, SUPABASE_URL, SUPABASE_KEY, calcularIdade, type Clinica, type Dentista, type Agendamento, type Paciente, type AnamnesePaciente } from "@/lib/supabase";
import { useLang } from "@/lib/i18n/LangContext";
import type { TranslationKey } from "@/lib/i18n/translations";

type Tt = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// ── paleta de cores ────────────────────────────────────────────────────────────
const DENTIST_COLORS = [
  "#2563EB","#16A34A","#DC2626","#9333EA","#EA580C","#0891B2",
  "#DB2777","#65A30D","#7C3AED","#CA8A04","#0F766E","#BE123C",
];
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

// ── status (reaproveita as mesmas chaves i18n das abas Pacientes/Agendamentos) ──
function getStatusStyle(t: Tt): Record<string, { bg: string; color: string; label: string }> {
  return {
    confirmado: { bg: "rgba(59,130,246,0.12)",  color: "#2563eb", label: t("status.confirmed") },
    ok:         { bg: "rgba(16,185,129,0.12)",  color: "#059669", label: `✓ ${t("status.completed")}` },
    faltou:     { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: `✗ ${t("status.missed")}` },
    cancelado:  { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: t("status.cancelled") },
    remarcado:  { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: t("status.rescheduled") },
  };
}

function anamneseAlertas(a: AnamnesePaciente | undefined, t: Tt): string[] {
  if (!a) return [];
  const al: string[] = [];
  if (a.diabetes)    al.push(t("health.diabetes"));
  if (a.hipertensao) al.push(t("health.hypertension"));
  if (a.gravidez)    al.push(t("health.pregnancy"));
  if (a.fumante)     al.push(t("health.smoker"));
  if (a.alergias?.trim())                  al.push(t("patients.alert_allergies", { valor: a.alergias.trim() }));
  if (a.medicamentos_uso_continuo?.trim()) al.push(t("patients.alert_medications", { valor: a.medicamentos_uso_continuo.trim() }));
  if (a.observacoes_saude?.trim())         al.push(t("patients.alert_notes", { valor: a.observacoes_saude.trim() }));
  return al;
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
  status?: string;          // status do agendamento no Supabase (se cruzou)
  agendamentoId?: string;   // id do agendamento (se cruzou)
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

// "HH:MM" -> minutos desde 00:00 (null se inválido/vazio)
function minutosDoHorario(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// Slots/dia de UM dentista: ((fim-inicio) - almoço) ÷ 45min.
// Almoço ignorado se ambos forem "00:00"/vazios (slotsDoDentista trata via af>ai).
function slotsDoDentista(d: Dentista): number {
  const ini = minutosDoHorario(d.inicio);
  const fim = minutosDoHorario(d.fim);
  if (ini == null || fim == null || fim <= ini) return 0;
  let span = fim - ini;
  const ai = minutosDoHorario(d.alm_ini);
  const af = minutosDoHorario(d.alm_fim);
  if (ai != null && af != null && af > ai) span -= (af - ai); // "00:00"-"00:00" => af==ai => não desconta
  if (span <= 0) return 0;
  return Math.floor(span / 45);
}

// ── Vista Semana: oculta domingo (sempre) e sábado (se nenhum dentista trabalha) ──
// O render interno do RBC chama Week.range diretamente, então embrulhamos a função.
let MOSTRAR_SABADO = false; // atualizado pelo componente a cada render
const _weekRangeOrig = Week.range;
Week.range = (date: Date, opts: { localizer: unknown }) => {
  const dias: Date[] = _weekRangeOrig(date, opts);
  return dias.filter((d: Date) => {
    const dow = d.getDay();
    if (dow === 0) return false;             // domingo nunca
    if (dow === 6 && !MOSTRAR_SABADO) return false; // sábado só se algum trabalha
    return true;
  });
};

// status que ocupam um slot (contam para contador/ocupação)
const STATUS_OCUPA = ["confirmado", "ok", "faltou"];

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
  const STATUS_STYLE = getStatusStyle(t);

  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [carregandoClinica, setCarregandoClinica] = useState(true);

  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState<Date>(new Date());
  const [eventos, setEventos] = useState<CalEvent[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [dentistas, setDentistas] = useState<DentistaInfo[]>([]);
  const dentistasRef = useRef<DentistaInfo[]>([]);

  const [filtroTokens, setFiltroTokens] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [minTime, setMinTime] = useState<Date>(new Date(1970, 0, 1, 5, 0, 0));
  const [maxTime, setMaxTime] = useState<Date>(new Date(1970, 0, 1, 19, 0, 0));

  // mini calendário
  const [miniMonth, setMiniMonth] = useState<Date>(new Date());
  useEffect(() => { setMiniMonth(date); }, [date]);

  // drawer (ficha do paciente)
  const [drawerEvent, setDrawerEvent] = useState<CalEvent | null>(null);
  const [drawerAg, setDrawerAg] = useState<Agendamento | null>(null);
  const [drawerPaciente, setDrawerPaciente] = useState<Paciente | null>(null);
  const [drawerHist, setDrawerHist] = useState<Agendamento[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── color picker ─────────────────────────────────────────────────────────────
  const [colorPickerToken, setColorPickerToken] = useState<string | null>(null);
  const [hexInput, setHexInput] = useState("");
  const [savingCor, setSavingCor] = useState(false);
  const [corErro, setCorErro] = useState("");
  const colorPickerRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ p_clinica_id: clinica.id, p_token_acesso: token, p_cor: cor }),
      });
      const data = await res.json().catch(() => ({ sucesso: false, erro: "parse_error" }));
      if (!data.sucesso) {
        setCorErro(data.erro || "Erro ao salvar a cor. Tente novamente.");
        return;
      }
      const novaCor = data.cor?.trim() ? data.cor : corParaDentista(token, undefined);
      const updater = (d: DentistaInfo) => d.token === token ? { ...d, cor: novaCor } : d;
      dentistasRef.current = dentistasRef.current.map(updater);
      setDentistas(prev => prev.map(updater));
      setColorPickerToken(null);
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
    sb.query<Clinica>("clinicas", `?id=eq.${id}&select=id,dentistas`)
      .then(r => { if (r[0]) setClinica(r[0]); })
      .catch(() => {})
      .finally(() => setCarregandoClinica(false));
  }, [router]);

  // ── buscar eventos (Google Calendar) + agendamentos (Supabase) em paralelo ──
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
      const [res, agsRaw] = await Promise.all([
        fetch("/api/calendario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(r => r.json()).catch(() => ({ sucesso: false, erro: "parse_error" })),
        sb.query<Agendamento>("agendamentos",
          `?clinica_id=eq.${clinica.id}&data=gte.${inicio}&data=lte.${fim}`
        ).catch(() => [] as Agendamento[]),
      ]);

      const data = res as CalendarioResponse;
      if (!data.sucesso) {
        setErro("Não foi possível carregar a agenda. Tente novamente.");
        return;
      }

      const ags = agsRaw as Agendamento[];
      setAgendamentos(ags);

      // cruza event_id -> agendamento (status real)
      const agMap = new Map<string, Agendamento>();
      ags.forEach(a => { if (a.event_id) agMap.set(a.event_id, a); });

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

      const evs: CalEvent[] = (data.eventos ?? [])
        // remarcado / cancelado não aparecem na grade
        .filter(ev => {
          const a = agMap.get(ev.event_id);
          return !(a && (a.status === "cancelado" || a.status === "remarcado"));
        })
        .map(ev => {
          const a = agMap.get(ev.event_id);
          return {
            id: ev.event_id,
            title: ev.titulo,
            start: parseEventDate(ev.inicio, ev.dia_inteiro),
            end: parseEventDate(ev.fim, ev.dia_inteiro),
            allDay: ev.dia_inteiro,
            dentistaNome: ev.dentista_nome,
            cor: corParaDentista(ev.dentista_token, corMap.get(ev.dentista_token)),
            descricao: ev.descricao,
            diaInteiro: ev.dia_inteiro,
            status: a?.status,
            agendamentoId: a?.id,
          };
        });
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

  // ── ocupação % do período visível ───────────────────────────────────────────
  const ocupacao = useMemo(() => {
    const dentFull = clinica?.dentistas || [];
    const byToken = new Map(dentFull.map(d => [d.token_acesso, d]));
    // dentistas considerados: a seleção do filtro, ou todos se nenhum selecionado
    const tokens = filtroTokens.size > 0 ? Array.from(filtroTokens) : dentistas.map(d => d.token);
    if (tokens.length === 0) return null;

    // dias do período visível
    let periodo: Date[];
    if (view === "day") periodo = [date];
    else if (view === "week") periodo = eachDayOfInterval({ start: startOfWeekFn(date, { weekStartsOn: 0 }), end: endOfWeek(date, { weekStartsOn: 0 }) });
    else periodo = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });

    // total = Σ por dentista de (slots_dia × dias úteis dele no período)
    // domingo nunca conta; sábado só se sabado==="true"; seg–sex sempre
    let total = 0;
    for (const tk of tokens) {
      const d = byToken.get(tk);
      if (!d) continue;
      const sd = slotsDoDentista(d);
      if (sd <= 0) continue;
      const trabSab = String(d.sabado) === "true";
      let diasUteis = 0;
      for (const day of periodo) {
        const dow = getDay(day);
        if (dow === 0) continue;             // domingo
        if (dow === 6 && !trabSab) continue; // sábado
        diasUteis++;
      }
      total += sd * diasUteis;
    }
    if (total <= 0) return null;

    // ocupados = blocos exibidos (backend já filtra pelos dentistas selecionados)
    // com status confirmado / ok / faltou
    const ocupados = eventos.filter(e => e.status && STATUS_OCUPA.includes(e.status)).length;
    const pct = Math.round((ocupados / total) * 100);
    return { ocupados, total, pct };
  }, [clinica, dentistas, filtroTokens, eventos, view, date]);

  // ── estilo dos eventos (cor + status) ───────────────────────────────────────
  function eventPropGetter(event: object) {
    const ev = event as CalEvent;
    let opacity = 1;
    let filter = "none";
    if (ev.status === "ok") opacity = 0.7;
    else if (ev.status === "faltou") { opacity = 0.5; filter = "grayscale(55%)"; }
    return {
      style: {
        backgroundColor: ev.cor,
        borderLeft: `3px solid ${ev.cor}`,
        borderRadius: 5,
        fontSize: 11,
        fontFamily: "'Sora',sans-serif",
        color: "#fff",
        padding: "1px 4px",
        opacity,
        filter,
      },
    };
  }

  // ── componentes custom do RBC (bloco com ícone de status, header com contador) ──
  const calComponents = useMemo<Components<CalEvent, object>>(() => ({
    event: ({ event }) => {
      const ev = event as CalEvent;
      const past = ev.start instanceof Date && ev.start.getTime() < Date.now();
      const alerta = (view === "week" || view === "day") && ev.status === "confirmado" && past;
      const icon = ev.status === "ok" ? "✓" : ev.status === "faltou" ? "✗" : null;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 3, width: "100%", overflow: "hidden" }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title as string}</span>
          {alerta
            ? <span title={t("calendar.tip_needs_update")} style={{ flexShrink: 0 }}>⚠️</span>
            : icon ? <span style={{ flexShrink: 0, fontWeight: 700 }}>{icon}</span> : null}
        </div>
      );
    },
    header: ({ date: d, label }: { date: Date; label: string }) => {
      if (view === "month") return <span>{label}</span>;
      const dStr = format(d, "yyyy-MM-dd");
      const n = agendamentos.filter(a => a.data === dStr && STATUS_OCUPA.includes(a.status)).length;
      return (
        <div onClick={() => { setDate(d); setView("day"); }} title="Ver dia"
          style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, cursor: "pointer" }}>
          <span>{label}</span>
          {n > 0 && <span style={{ fontSize: 10, color: "#2B7A78", fontWeight: 600 }}>{t("calendar.appointments_count", { n })}</span>}
        </div>
      );
    },
  }), [view, agendamentos, t]);

  // ── drawer: abrir com ficha completa do paciente ────────────────────────────
  async function abrirDrawer(ev: CalEvent) {
    if (!clinica?.id) return;
    setDrawerEvent(ev);
    setDrawerLoading(true);
    setDrawerPaciente(null);
    setDrawerHist([]);
    const ag = ev.agendamentoId ? agendamentos.find(a => a.id === ev.agendamentoId) || null : null;
    setDrawerAg(ag);
    setDrawerStatus(ag?.status || ev.status || "");
    try {
      let pac: Paciente | null = null;
      if (ag?.paciente_id) {
        const r = await sb.query<Paciente>("pacientes", `?clinica_id=eq.${clinica.id}&id=eq.${ag.paciente_id}`);
        pac = r[0] || null;
      }
      if (!pac && ag?.telefone) {
        const r = await sb.query<Paciente>("pacientes", `?clinica_id=eq.${clinica.id}&telefone=eq.${encodeURIComponent(ag.telefone)}`);
        pac = r[0] || null;
      }
      let hist: Agendamento[] = [];
      if (pac) {
        const conds: string[] = [];
        if (pac.id) conds.push(`paciente_id.eq.${pac.id}`);
        if (pac.telefone) conds.push(`telefone.eq.${encodeURIComponent(pac.telefone)}`);
        if (conds.length) {
          const q = conds.length > 1
            ? `?clinica_id=eq.${clinica.id}&or=(${conds.join(",")})&order=data.desc,horario.desc`
            : `?clinica_id=eq.${clinica.id}&${conds[0].replace(".eq.", "=eq.")}&order=data.desc,horario.desc`;
          hist = await sb.query<Agendamento>("agendamentos", q).catch(() => []);
        }
      }
      setDrawerPaciente(pac);
      setDrawerHist(hist);
    } catch {
      /* ignore */
    } finally {
      setDrawerLoading(false);
    }
  }

  function fecharDrawer() {
    setDrawerEvent(null);
    setDrawerAg(null);
    setDrawerPaciente(null);
    setDrawerHist([]);
  }

  async function marcarStatus(novo: "confirmado" | "ok" | "faltou") {
    if (!drawerAg) return;
    // sempre dispara o update (permite reverter clicando no outro botão)
    setUpdatingStatus(true);
    try {
      await sb.update("agendamentos", drawerAg.id, { status: novo });
      setDrawerStatus(novo);
      setDrawerAg(prev => prev ? { ...prev, status: novo } : prev);
      setAgendamentos(prev => prev.map(a => a.id === drawerAg.id ? { ...a, status: novo as Agendamento["status"] } : a));
      setDrawerHist(prev => prev.map(a => a.id === drawerAg.id ? { ...a, status: novo as Agendamento["status"] } : a));
      setEventos(prev => prev.map(e => e.agendamentoId === drawerAg.id ? { ...e, status: novo } : e));
    } catch {
      /* ignore */
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── exportar dia em PDF (window.print, sem dependências) ─────────────────────
  function exportarDia() {
    const dia = format(date, "yyyy-MM-dd");
    const lista = agendamentos
      .filter(a => a.data === dia && !["cancelado", "remarcado"].includes(a.status))
      .sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
    const titulo = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    const esc = (s: string) => (s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c));
    const linhas = lista.map(a => {
      const st = STATUS_STYLE[a.status]?.label || a.status;
      return `<tr><td>${esc(a.horario)}</td><td>${esc(a.nome)}</td><td>${esc(a.procedimento)}</td><td>${esc(a.dentista_nome)}</td><td>${esc(st)}</td></tr>`;
    }).join("");
    const w = window.open("", "_blank", "width=820,height=640");
    if (!w) return;
    w.document.write(
      `<html><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>` +
      `body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#1e293b}` +
      `h1{font-size:18px;margin:0 0 4px;text-transform:capitalize}` +
      `p{color:#64748b;font-size:12px;margin:0 0 16px}` +
      `table{width:100%;border-collapse:collapse;font-size:13px}` +
      `th,td{border:1px solid #cbd5e1;padding:7px 9px;text-align:left}` +
      `th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.5px}` +
      `@media print{button{display:none}}` +
      `</style></head><body>` +
      `<h1>${esc(titulo)}</h1><p>${lista.length} ${esc(t("calendar.appointments_count", { n: lista.length }).replace(/^\d+\s*/, ""))}</p>` +
      `<table><thead><tr>` +
      `<th>${esc(t("appointments.col_time"))}</th>` +
      `<th>${esc(t("appointments.col_patient"))}</th>` +
      `<th>${esc(t("appointments.col_procedure"))}</th>` +
      `<th>${esc(t("appointments.col_dentist"))}</th>` +
      `<th>${esc(t("appointments.col_status"))}</th>` +
      `</tr></thead><tbody>${linhas || `<tr><td colspan="5">—</td></tr>`}</tbody></table>` +
      `<script>window.onload=function(){window.print();}<\/script></body></html>`
    );
    w.document.close();
  }

  // ── mini calendário ─────────────────────────────────────────────────────────
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

  if (carregandoClinica) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 13 }}>Carregando...</div>;
  }

  const drawerAlertas = anamneseAlertas(drawerPaciente?.anamnese, t);
  const drawerTotal = drawerHist.filter(a => ["confirmado", "ok"].includes(a.status)).length;
  // histórico mostra só o que é acionável aqui: confirmado / veio (ok) / faltou
  // (cancelado e remarcado não aparecem)
  const drawerHistVisivel = drawerHist.filter(a => !["cancelado", "remarcado"].includes(a.status));
  // Veio/Faltou só liberam após o horário do agendamento; antes, só Confirmado
  const horarioPassou = !!drawerAg && new Date() > new Date(`${drawerAg.data}T${drawerAg.horario}`);

  // mostra a coluna de sábado na vista Semana se algum dentista ativo trabalha sábado
  MOSTRAR_SABADO = (clinica?.dentistas || []).some(d => d.ativo && String(d.sabado) === "true");

  return (
    <div style={{ fontFamily: "'Sora',sans-serif" }}>

      {/* ── Controles + pílulas: fluem no container padrão, como as outras abas
           (sem barra sticky própria — o cabeçalho fixo é o do layout) ── */}
      <div>

      {/* ── Controles ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={navAnterior} style={{ ...btnBase, padding: "6px 10px" }}><ChevronLeft size={14} /></button>
          <button onClick={navHoje} style={btnBase}>Hoje</button>
          <button onClick={navProximo} style={{ ...btnBase, padding: "6px 10px" }}><ChevronRight size={14} /></button>
        </div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#1e293b", textTransform: "capitalize", minWidth: 140 }}>
          {labelPeriodo}
        </div>
        {view === "day" && (
          <button onClick={exportarDia} style={btnBase} title={t("calendar.export_day")}>
            {t("calendar.export_day")}
          </button>
        )}
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
              <div key={d.token} style={{ position: "relative" }} ref={pickerAberto ? colorPickerRef : undefined}>
                <button
                  onClick={() => toggleFiltro(d.token)}
                  onDoubleClick={() => abrirColorPicker(d.token, cor)}
                  title="Clique para filtrar · duplo clique para editar a cor"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 12px", borderRadius: 20,
                    border: `1px solid ${cor}`,
                    background: ativo ? cor : cor + "05", // não selecionado: ~2% da cor (bem suave)
                    color: ativo ? "#fff" : cor,
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Sora',sans-serif", transition: "all 0.15s",
                    outline: pickerAberto ? `2px solid ${cor}` : "none", outlineOffset: 1,
                    userSelect: "none",
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ativo ? "#fff" : cor, opacity: ativo ? 1 : 0.65, display: "inline-block", flexShrink: 0 }} />
                  {d.nome}
                </button>

                {pickerAberto && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: "1px solid #e2e8f0", padding: 14, minWidth: 220,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>{d.nome}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 12 }}>
                      {PALETTE_COLORS.map(c => (
                        <button key={c} onClick={() => salvarCor(d.token, c)} disabled={savingCor} title={c}
                          style={{ width: 26, height: 26, borderRadius: 6, background: c, border: "none", cursor: "pointer", outline: cor === c ? `2px solid ${c}` : "2px solid transparent", outlineOffset: 2, transition: "outline 0.1s" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, background: hexValido(hexInput) ? hexInput : "#e2e8f0", border: "1px solid #e2e8f0" }} />
                      <input value={hexInput} onChange={e => setHexInput(e.target.value)} placeholder="#RRGGBB" maxLength={7}
                        style={{ flex: 1, padding: "5px 8px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 7, fontFamily: "monospace", outline: "none", background: "#f8fafc", color: "#1e293b" }}
                        onKeyDown={e => { if (e.key === "Enter") salvarCor(d.token, hexInput.trim()); }} />
                      <button onClick={() => salvarCor(d.token, hexInput.trim())} disabled={savingCor || !hexValido(hexInput)}
                        style={{ padding: "5px 10px", background: hexValido(hexInput) ? "#2B7A78" : "#e2e8f0", color: hexValido(hexInput) ? "#fff" : "#94a3b8", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: hexValido(hexInput) ? "pointer" : "default", fontFamily: "'Sora',sans-serif" }}>OK</button>
                    </div>
                    {corErro && <div style={{ fontSize: 11, color: "#dc2626", marginBottom: 8, lineHeight: 1.4 }}>{corErro}</div>}
                    <button onClick={() => salvarCor(d.token, "")} disabled={savingCor}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#64748b", fontFamily: "'Sora',sans-serif" }}>
                      <RotateCcw size={11} /> Voltar ao automático
                    </button>
                    {savingCor && <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Salvando...</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      </div>{/* ── fim controles + pílulas ── */}

      {/* ── Ocupação do período ── */}
      {ocupacao && (
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ocupacao.pct >= 80 ? "#dc2626" : ocupacao.pct >= 50 ? "#d97706" : "#16a34a", display: "inline-block" }} />
          {t("calendar.occupancy", { occ: ocupacao.ocupados, total: ocupacao.total, pct: ocupacao.pct })}
        </div>
      )}

      {/* ── Erro ── */}
      {erro && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{erro}</div>
      )}

      {/* ── Sem dentistas ── */}
      {!carregando && dentistas.length === 0 && !erro && (
        <div style={{ textAlign: "center", padding: "32px 16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(43,122,120,0.2)", color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
          Nenhum dentista ativo configurado. Ative um profissional em Configurações.
        </div>
      )}

      {/* ── Grade + mini calendário ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* calendário */}
        <div style={{ flex: "1 1 520px", minWidth: 0, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
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
            components={calComponents}
            onSelectEvent={(ev) => abrirDrawer(ev as CalEvent)}
            onDrillDown={(d) => { setDate(d); setView("day"); }}
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
            dayPropGetter={(d) => ({ style: isToday(d) ? { background: "rgba(43,122,120,0.04)" } : {} })}
            toolbar={false}
          />
        </div>

        {/* mini calendário lateral (só Semana e Dia) */}
        {view !== "month" && (
        <aside style={{ flex: "0 0 230px", maxWidth: "100%", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => setMiniMonth(m => subMonths(m, 1))} style={{ ...btnBase, padding: "4px 7px" }}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>{format(miniMonth, "MMMM yyyy", { locale: ptBR })}</span>
            <button onClick={() => setMiniMonth(m => addMonths(m, 1))} style={{ ...btnBase, padding: "4px 7px" }}><ChevronRight size={13} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {semanaLabels.map((l, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", padding: "2px 0" }}>{l}</div>
            ))}
            {miniDias.map(dia => {
              const fora = !isSameMonth(dia, miniMonth);
              const hoje = isToday(dia);
              const sel = diaNoPeriodo(dia);
              return (
                <button key={dia.toISOString()} onClick={() => { setDate(dia); setView("day"); }}
                  style={{
                    aspectRatio: "1", border: "none", borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontFamily: "'Sora',sans-serif",
                    background: hoje ? "#2B7A78" : sel ? "rgba(43,122,120,0.12)" : "transparent",
                    color: hoje ? "#fff" : fora ? "#cbd5e1" : "#334155",
                    fontWeight: (hoje || sel) ? 700 : 400, transition: "background 0.12s",
                  }}>
                  {format(dia, "d")}
                </button>
              );
            })}
          </div>
        </aside>
        )}
      </div>

      {/* ── Drawer: ficha completa do paciente ── */}
      {drawerEvent && (
        <>
          <div onClick={fecharDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "min(440px,100%)", background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>

            {/* header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#DEF2F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#2B7A78", flexShrink: 0 }}>
                {((drawerPaciente?.nome || drawerEvent.dentistaNome || "?")[0] || "?").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {drawerPaciente?.nome || (drawerEvent.title as string)}
                </div>
                {drawerPaciente?.telefone && <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{drawerPaciente.telefone}</div>}
              </div>
              <button onClick={fecharDrawer} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, display: "flex" }}><X size={18} /></button>
            </div>

            {/* body */}
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
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif",
                            background: drawerStatus === "confirmado" ? "#DBEAFE" : "#fff",
                            color: drawerStatus === "confirmado" ? "#2563EB" : "#475569",
                            border: drawerStatus === "confirmado" ? "1px solid #2563EB" : "1px solid #e2e8f0",
                            opacity: updatingStatus ? 0.6 : 1,
                          }}>
                          ✓ {t("status.confirmed")}
                        </button>
                        <button onClick={() => marcarStatus("ok")} disabled={updatingStatus || !horarioPassou}
                          title={!horarioPassou ? t("calendar.tip_needs_update") : undefined}
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Sora',sans-serif",
                            cursor: (updatingStatus || !horarioPassou) ? "not-allowed" : "pointer",
                            background: !horarioPassou ? "#f1f5f9" : drawerStatus === "ok" ? "#DCFCE7" : "#fff",
                            color: !horarioPassou ? "#cbd5e1" : drawerStatus === "ok" ? "#16A34A" : "#475569",
                            border: !horarioPassou ? "1px solid #e2e8f0" : drawerStatus === "ok" ? "1px solid #16A34A" : "1px solid #e2e8f0",
                            opacity: updatingStatus ? 0.6 : 1,
                          }}>
                          {t("calendar.btn_came")}
                        </button>
                        <button onClick={() => marcarStatus("faltou")} disabled={updatingStatus || !horarioPassou}
                          title={!horarioPassou ? t("calendar.tip_needs_update") : undefined}
                          style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Sora',sans-serif",
                            cursor: (updatingStatus || !horarioPassou) ? "not-allowed" : "pointer",
                            background: !horarioPassou ? "#f1f5f9" : drawerStatus === "faltou" ? "#FEE2E2" : "#fff",
                            color: !horarioPassou ? "#cbd5e1" : drawerStatus === "faltou" ? "#DC2626" : "#475569",
                            border: !horarioPassou ? "1px solid #e2e8f0" : drawerStatus === "faltou" ? "1px solid #DC2626" : "1px solid #e2e8f0",
                            opacity: updatingStatus ? 0.6 : 1,
                          }}>
                          {t("calendar.btn_missed")}
                        </button>
                      </>
                    )}
                  </div>

                  {/* dados do agendamento */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                    {[
                      [t("appointments.detail_date"), drawerAg?.data || (drawerEvent.start ? format(drawerEvent.start as Date, "dd/MM/yyyy") : "—")],
                      [t("appointments.detail_time"), drawerAg?.horario || (drawerEvent.diaInteiro ? "—" : drawerEvent.start ? format(drawerEvent.start as Date, "HH:mm") : "—")],
                      [t("appointments.detail_procedure"), drawerAg?.procedimento || "—"],
                      [t("appointments.detail_dentist"), drawerAg?.dentista_nome || drawerEvent.dentistaNome || "—"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {!drawerPaciente ? (
                    <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>{t("patients.not_found")}</div>
                  ) : (
                    <>
                      {/* dados do paciente */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        {[
                          [t("patients.detail_document"), drawerPaciente.documento || "—"],
                          [t("patients.detail_birthdate"), drawerPaciente.data_nascimento || "—"],
                          [t("patients.detail_age"), calcularIdade(drawerPaciente.data_nascimento) || "—"],
                          [t("patients.detail_email"), drawerPaciente.email || "—"],
                          [t("patients.total_consults"), String(drawerTotal)],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, wordBreak: "break-word" }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* anamnese */}
                      {(() => {
                        const temAlerta = drawerAlertas.length > 0;
                        return (
                          <div style={{ padding: "10px 12px", background: temAlerta ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)", border: temAlerta ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(16,185,129,0.25)", borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: temAlerta ? 6 : 0 }}>
                              <span>{temAlerta ? "⚠️" : "✓"}</span>
                              <div style={{ fontSize: 12, fontWeight: 700, color: temAlerta ? "#dc2626" : "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {temAlerta ? t("patients.health_alerts") : t("patients.anamnesis_label")}
                              </div>
                            </div>
                            {!drawerPaciente.anamnese && <div style={{ fontSize: 11, color: "#059669", opacity: 0.8 }}>{t("patients.anamnesis_none")}</div>}
                            {drawerPaciente.anamnese && !temAlerta && <div style={{ fontSize: 11, color: "#059669", opacity: 0.8 }}>{t("patients.no_alerts")}</div>}
                            {temAlerta && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {drawerAlertas.map(al => (
                                  <span key={al} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{al}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* histórico (sem cancelado/remarcado) */}
                      {drawerHistVisivel.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{t("patients.history")}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {drawerHistVisivel.slice(0, 6).map((x, xi) => {
                              const xs = STATUS_STYLE[x.status] || { bg: "#f1f5f9", color: "#64748b", label: x.status };
                              return (
                                <div key={xi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#fff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{x.procedimento || t("patients.default_procedure")}</div>
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

                  {/* odontograma (placeholder) */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{t("patients.odontogram")}</div>
                    <div style={{ height: 56, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#cbd5e1" }}>{t("patients.odontogram_wip")}</div>
                  </div>

                  {/* arquivos / documentos (placeholder) */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{t("calendar.files")}</div>
                    <div style={{ height: 56, borderRadius: 8, border: "2px dashed #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#cbd5e1" }}>{t("calendar.coming_soon")}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CSS overrides para react-big-calendar ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rbc-calendar { font-family: 'Sora', sans-serif !important; font-size: 12px; }
        .rbc-header { font-size: 11px; font-weight: 600; color: #64748b; padding: 6px 2px; border-bottom: 1px solid #f1f5f9; }
        .rbc-month-view, .rbc-time-view { border: none !important; }
        /* cabeçalho dos dias (Semana/Dia) fixo ao rolar, acima dos eventos */
        .rbc-time-header { position: sticky; top: 0; z-index: 6; background: #fff; }
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
