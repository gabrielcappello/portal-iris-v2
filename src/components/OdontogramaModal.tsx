"use client";
import { useState, useEffect, useCallback, Fragment } from "react";
import { X, Plus, Check, RotateCcw } from "lucide-react";
import { sb, type Paciente } from "@/lib/supabase";
import {
  carregarOdontograma, registrarAchado, resolverAchado, atualizarEstadoDente,
  corDominante, zonasDoDente, getPlano, ehPlanejadoPendente, valorPendenteDente, formatBRL,
  COR_EXISTENTE, COR_A_FAZER,
  ACHADOS, ACHADO_POR_ID, CORES_CATEGORIA, corDoAchado,
  ROTULO_ZONA, ROTULO_ESTADO,
  ARCADA_SUPERIOR, ARCADA_INFERIOR,
  type DenteOdonto, type Zona, type EstadoDente, type CategoriaAchado, type Intencao,
} from "@/lib/odontograma";
import { toothAssetUrl } from "@/lib/odontograma-assets";

const BRAND = "#2B7A78";
const FONT = "'Sora',sans-serif";

type Procedimento = { esp: string; nome: string; valor: number; tempo: number; mostrar_valor?: boolean };
type PlanoForm = { intencao: Intencao; procedimento?: string; valor?: number };

const NOME_CATEGORIA: Record<CategoriaAchado, string> = {
  patologia: "Patologias", restauracao: "Restaurações", endodontia: "Endodontia",
  protese_implante: "Prótese / Implante", sintoma: "Sintomas",
};

function formatarData(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// ── Dente realista (imagem + tint do achado) ──────────────────────────────────

function ToothImage({ dente, selecionado, align, onSelect }: {
  dente: DenteOdonto;
  selecionado: boolean;
  align: "flex-end" | "flex-start";
  onSelect: (numero: string) => void;
}) {
  const url = toothAssetUrl(dente.numero_iso, "vestibular");
  const ausente = dente.estado === "ausente" || dente.estado === "extraido";
  const especial = dente.estado === "nao_erupcionado" || dente.estado === "impactado";
  const cor = corDominante(dente.eventos_ativos);
  const n = dente.eventos_ativos.length;
  const temAFazer = dente.eventos_ativos.some(ehPlanejadoPendente);

  return (
    <div
      onClick={() => onSelect(dente.numero_iso)}
      title={`Dente ${dente.numero_iso} — ${ROTULO_ESTADO[dente.estado]}`}
      style={{
        width: "100%", height: "100%", display: "flex", alignItems: align, justifyContent: "center",
        cursor: "pointer", position: "relative", borderRadius: 6, padding: "2px 1px", boxSizing: "border-box",
        background: selecionado ? "rgba(43,122,120,0.10)" : "transparent",
        outline: selecionado ? `1.5px solid ${BRAND}` : "1.5px solid transparent",
        transition: "background 0.12s, outline 0.12s",
      }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Dente ${dente.numero_iso}`} draggable={false}
          style={{
            maxWidth: "100%", maxHeight: 116, height: "auto", display: "block", userSelect: "none",
            opacity: ausente ? 0.2 : (especial ? 0.5 : 1),
            filter: ausente ? "grayscale(1)" : "none",
          }} />
        {cor && !ausente && (
          <div style={{
            position: "absolute", inset: 0,
            WebkitMaskImage: `url(${url})`, maskImage: `url(${url})`,
            WebkitMaskSize: "contain", maskSize: "contain",
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            background: cor, opacity: 0.45, mixBlendMode: "multiply", pointerEvents: "none",
          }} />
        )}
        {ausente && (
          <svg viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <line x1="9" y1="9" x2="31" y2="31" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
            <line x1="31" y1="9" x2="9" y2="31" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        )}
        {n > 0 && !ausente && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 13, height: 13, padding: "0 3px",
            borderRadius: 99, background: temAFazer ? COR_A_FAZER : (cor ?? "#64748b"), color: "#fff",
            fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid #fff",
          }}>{n}</span>
        )}
      </div>
    </div>
  );
}

function Arcada({ porNumero, selecionado, onSelect }: {
  porNumero: Record<string, DenteOdonto>;
  selecionado: string | null;
  onSelect: (n: string) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", gap: 1, width: "100%" }}>
      {ARCADA_SUPERIOR.map((nSup, c) => {
        const nInf = ARCADA_INFERIOR[c];
        const dSup = porNumero[nSup];
        const dInf = porNumero[nInf];
        return (
          <Fragment key={c}>
            {c === 8 && <div style={{ width: 10, flexShrink: 0, borderLeft: "1px dashed #e2e8f0", margin: "0 3px" }} />}
            <div style={{ flex: "1 1 0", maxWidth: 52, minWidth: 26, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 128 }}>
                {dSup && <ToothImage dente={dSup} selecionado={selecionado === nSup} align="flex-end" onSelect={onSelect} />}
              </div>
              <div style={{ padding: "3px 0", textAlign: "center", fontFamily: "monospace", lineHeight: 1.35 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nSup ? BRAND : "#64748b" }}>{nSup}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nInf ? BRAND : "#cbd5e1" }}>{nInf}</div>
              </div>
              <div style={{ height: 128 }}>
                {dInf && <ToothImage dente={dInf} selecionado={selecionado === nInf} align="flex-start" onSelect={onSelect} />}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Painel de detalhe do dente ────────────────────────────────────────────────

const ESTADOS: EstadoDente[] = ["presente", "ausente", "extraido", "nao_erupcionado", "impactado"];

function DetalheDente({ dente, zonaInicial, precios, salvando, onRegistrar, onResolver, onRealizar, onEstado }: {
  dente: DenteOdonto;
  zonaInicial?: Zona;
  precios: Procedimento[];
  salvando: boolean;
  onRegistrar: (achadoId: string, zonas: Zona[], obs: string, plano: PlanoForm) => void;
  onResolver: (eventoId: string) => void;
  onRealizar: (ev: DenteOdonto["eventos_ativos"][number]) => void;
  onEstado: (estado: EstadoDente) => void;
}) {
  const [achadoId, setAchadoId] = useState("");
  const [zonas, setZonas] = useState<Zona[]>(zonaInicial ? [zonaInicial] : []);
  const [obs, setObs] = useState("");
  const [intencao, setIntencao] = useState<Intencao>("existente");
  const [procedimento, setProcedimento] = useState("");
  const [valor, setValor] = useState("");

  const zonasDisponiveis = zonasDoDente(dente);
  function toggleZona(z: Zona) {
    setZonas(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  }
  function escolherProcedimento(nome: string) {
    setProcedimento(nome);
    const p = precios.find(x => x.nome === nome);
    if (p) setValor(String(p.valor));
  }
  function registrar() {
    if (!achadoId) return;
    const plano: PlanoForm = intencao === "planejado"
      ? { intencao, procedimento: procedimento || undefined, valor: valor ? Number(valor) : undefined }
      : { intencao: "existente" };
    onRegistrar(achadoId, zonas, obs.trim(), plano);
    setAchadoId(""); setZonas([]); setObs(""); setIntencao("existente"); setProcedimento(""); setValor("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={toothAssetUrl(dente.numero_iso, "vestibular")} alt="" style={{ height: 56, width: "auto" }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", fontFamily: "monospace" }}>{dente.numero_iso}</div>
          <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>
            {dente.tipo_dente} · {dente.arcada} {dente.lado}
          </div>
        </div>
      </div>

      {/* Estado estrutural */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>Estado do dente</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {ESTADOS.map(e => {
            const on = dente.estado === e;
            return (
              <button key={e} type="button" disabled={salvando} onClick={() => onEstado(e)}
                style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, fontFamily: FONT,
                  border: `1px solid ${on ? BRAND : "#e2e8f0"}`, borderRadius: 8, cursor: salvando ? "wait" : "pointer",
                  background: on ? "rgba(43,122,120,0.1)" : "#fff", color: on ? BRAND : "#64748b" }}>
                {ROTULO_ESTADO[e]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achados ativos */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
          Achados {dente.eventos_ativos.length > 0 && `(${dente.eventos_ativos.length})`}
        </div>
        {dente.eventos_ativos.length === 0 ? (
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>Nenhum achado registrado.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dente.eventos_ativos.map(ev => {
              const plano = getPlano(ev);
              const aFazer = plano.intencao === "planejado" && plano.status !== "realizado";
              const realizado = plano.status === "realizado";
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: corDoAchado(ev.achado_id), marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{ACHADO_POR_ID[ev.achado_id]?.nome ?? ev.achado_id}</span>
                      {aFazer && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: COR_A_FAZER, padding: "1px 6px", borderRadius: 99 }}>A FAZER</span>}
                      {realizado && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#059669", padding: "1px 6px", borderRadius: 99 }}>REALIZADO</span>}
                      {!aFazer && !realizado && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: COR_EXISTENTE, padding: "1px 6px", borderRadius: 99 }}>EXISTENTE</span>}
                    </div>
                    {ev.zonas?.length ? <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.zonas.map(z => ROTULO_ZONA[z]).join(", ")}</div> : null}
                    {plano.procedimento && <div style={{ fontSize: 11, color: "#64748b" }}>{plano.procedimento}{plano.valor != null ? ` · ${formatBRL(plano.valor)}` : ""}</div>}
                    {ev.observacoes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ev.observacoes}</div>}
                    {ev.criado_em && <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>{formatarData(ev.criado_em)}</div>}
                    {aFazer && (
                      <button type="button" disabled={salvando} onClick={() => onRealizar(ev)}
                        style={{ marginTop: 6, border: `1px solid ${COR_EXISTENTE}`, background: "#fff", borderRadius: 7, padding: "4px 10px", cursor: salvando ? "wait" : "pointer", color: COR_EXISTENTE, fontSize: 11, fontWeight: 700, fontFamily: FONT }}>
                        ✓ Marcar realizado
                      </button>
                    )}
                  </div>
                  <button type="button" disabled={salvando} onClick={() => onResolver(ev.id)} title="Remover / resolver"
                    style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, padding: "4px 7px", cursor: salvando ? "wait" : "pointer", color: "#94a3b8", display: "flex", flexShrink: 0 }}>
                    <Check size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registrar achado */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Registrar achado</div>

        <select value={achadoId} onChange={e => setAchadoId(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }}>
          <option value="">Selecione um achado…</option>
          {(Object.keys(NOME_CATEGORIA) as CategoriaAchado[]).map(cat => (
            <optgroup key={cat} label={NOME_CATEGORIA[cat]}>
              {ACHADOS.filter(a => a.categoria === cat).map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </optgroup>
          ))}
        </select>

            {/* Intenção: existente x a fazer */}
            <div style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 6px" }}>Este achado é…</div>
            <div style={{ display: "flex", gap: 6 }}>
              {([["existente", "Existente", COR_EXISTENTE], ["planejado", "A fazer", COR_A_FAZER]] as const).map(([val, label, c]) => {
                const on = intencao === val;
                return (
                  <button key={val} type="button" onClick={() => setIntencao(val)}
                    style={{ flex: 1, padding: "7px", fontSize: 12, fontWeight: 700, fontFamily: FONT, borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${on ? c : "#e2e8f0"}`, background: on ? c : "#fff", color: on ? "#fff" : "#64748b" }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Procedimento + valor (só p/ "a fazer") */}
            {intencao === "planejado" && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <select value={procedimento} onChange={e => escolherProcedimento(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }}>
                  <option value="">Procedimento (opcional)…</option>
                  {precios.map((p, i) => <option key={i} value={p.nome}>{p.nome}{p.valor ? ` — ${formatBRL(p.valor)}` : ""}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Valor R$</span>
                  <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" min="0" step="0.01"
                    style={{ flex: 1, padding: "7px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }} />
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 6px" }}>Superfícies (opcional)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {zonasDisponiveis.map(z => {
                const on = zonas.includes(z);
                return (
                  <button key={z} type="button" onClick={() => toggleZona(z)}
                    style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, fontFamily: FONT,
                      border: `1px solid ${on ? corDoAchado(achadoId) : "#e2e8f0"}`, borderRadius: 99, cursor: "pointer",
                      background: on ? corDoAchado(achadoId) : "#fff", color: on ? "#fff" : "#64748b" }}>
                    {ROTULO_ZONA[z]}
                  </button>
                );
              })}
            </div>

            <input type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder="Observação (opcional)"
              style={{ marginTop: 10, width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }} />

            <button type="button" onClick={registrar} disabled={salvando || !achadoId}
              style={{ marginTop: 10, width: "100%", padding: "9px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                border: "none", borderRadius: 9, cursor: (salvando || !achadoId) ? "not-allowed" : "pointer", background: BRAND, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (salvando || !achadoId) ? 0.5 : 1 }}>
              <Plus size={14} /> Registrar
            </button>
            {!achadoId && <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>Selecione um achado acima para registrar.</div>}
      </div>
    </div>
  );
}

function Legenda() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
      {(Object.keys(NOME_CATEGORIA) as CategoriaAchado[]).map(cat => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: CORES_CATEGORIA[cat] }} />
          {NOME_CATEGORIA[cat]}
        </div>
      ))}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────

type Props = {
  paciente: Paciente;
  clinicaId: string;
  usuarioId: string;
  onClose: () => void;
};

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OdontogramaModal({ paciente, clinicaId, usuarioId, onClose }: Props) {
  const autor = RE_UUID.test(usuarioId) ? usuarioId : undefined;

  const [dentes, setDentes] = useState<DenteOdonto[]>([]);
  const [precios, setPrecios] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sel, setSel] = useState<{ numero: string; zona?: Zona; nonce: number } | null>(null);

  const recarregar = useCallback(async () => {
    const lista = await carregarOdontograma(paciente.id, clinicaId);
    setDentes(lista);
    return lista;
  }, [paciente.id, clinicaId]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setLoading(true); setErro("");
      try {
        const [l, cli] = await Promise.all([
          carregarOdontograma(paciente.id, clinicaId),
          sb.query<{ precios?: Procedimento[] }>("clinicas", `?id=eq.${clinicaId}&select=precios`).catch(() => []),
        ]);
        if (vivo) { setDentes(l); setPrecios(cli[0]?.precios ?? []); }
      } catch (e) { if (vivo) setErro(e instanceof Error ? e.message : "Erro ao carregar."); }
      finally { if (vivo) setLoading(false); }
    })();
    return () => { vivo = false; };
  }, [paciente.id, clinicaId]);

  const porNumero: Record<string, DenteOdonto> = Object.fromEntries(dentes.map(d => [d.numero_iso, d]));
  const denteSel = sel ? porNumero[sel.numero] : null;

  function selecionar(numero: string) {
    setSel(prev => ({ numero, nonce: (prev?.nonce ?? 0) + 1 }));
  }

  async function comSalvar(fn: () => Promise<void>) {
    setSalvando(true); setErro("");
    try { await fn(); await recarregar(); }
    catch (e) { setErro(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  function handleRegistrar(achadoId: string, zonas: Zona[], obs: string, plano: PlanoForm) {
    if (!denteSel) return;
    const detalhes: Record<string, unknown> = { intencao: plano.intencao };
    if (plano.intencao === "planejado") {
      detalhes.plano_status = "pendente";
      if (plano.procedimento) detalhes.procedimento = plano.procedimento;
      if (plano.valor != null && !Number.isNaN(plano.valor)) detalhes.valor = plano.valor;
    }
    comSalvar(() => registrarAchado({
      denteId: denteSel.id, clinicaId, pacienteId: paciente.id, achadoId,
      zonas, detalhes, observacoes: obs || undefined, criadoPor: autor,
    }));
  }
  function handleResolver(eventoId: string) {
    comSalvar(() => resolverAchado({ eventoId, status: "resolvido", resolvidoPor: autor }));
  }
  function handleRealizar(ev: DenteOdonto["eventos_ativos"][number]) {
    if (!denteSel) return;
    const plano = getPlano(ev);
    const detalhes: Record<string, unknown> = { intencao: "planejado", plano_status: "realizado" };
    if (plano.procedimento) detalhes.procedimento = plano.procedimento;
    if (plano.valor != null) detalhes.valor = plano.valor;
    comSalvar(async () => {
      await registrarAchado({
        denteId: denteSel.id, clinicaId, pacienteId: paciente.id, achadoId: ev.achado_id,
        zonas: ev.zonas ?? [], detalhes, observacoes: ev.observacoes ?? undefined, criadoPor: autor,
      });
      await resolverAchado({ eventoId: ev.id, status: "substituido", resolvidoPor: autor });
    });
  }
  function handleEstado(estado: EstadoDente) {
    if (!denteSel) return;
    comSalvar(() => atualizarEstadoDente({ denteId: denteSel.id, estado, atualizadoPor: autor }));
  }

  const totalComAchados = dentes.filter(d => d.eventos_ativos.length > 0).length;
  const orcamentoAFazer = dentes.reduce((s, d) => s + valorPendenteDente(d), 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(1120px,100%)", maxHeight: "94vh", background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Cabeçalho */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Odontograma — {paciente.nome}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
              {loading ? "Carregando…" : `${totalComAchados} dente${totalComAchados !== 1 ? "s" : ""} com achados`}
            </div>
          </div>
          {orcamentoAFazer > 0 && (
            <div style={{ textAlign: "right", marginRight: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>A fazer</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: COR_A_FAZER }}>{formatBRL(orcamentoAFazer)}</div>
            </div>
          )}
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, paddingTop: 60 }}>Carregando odontograma…</div>
            ) : erro && dentes.length === 0 ? (
              <div style={{ textAlign: "center", color: "#dc2626", fontSize: 13, paddingTop: 60 }}>{erro}</div>
            ) : (
              <>
                <Arcada porNumero={porNumero} selecionado={sel?.numero ?? null} onSelect={selecionar} />
                <Legenda />
                {!denteSel && (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#cbd5e1" }}>
                    Clique em um dente para ver e registrar achados.
                  </div>
                )}
              </>
            )}
          </div>

          {denteSel && (
            <div style={{ width: 340, borderLeft: "1px solid #f1f5f9", background: "#fff", padding: "20px 20px 24px", overflowY: "auto", flexShrink: 0 }}>
              {erro && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>{erro}</div>}
              <DetalheDente
                key={`${denteSel.id}-${sel?.nonce ?? 0}`}
                dente={denteSel}
                zonaInicial={sel?.zona}
                precios={precios}
                salvando={salvando}
                onRegistrar={handleRegistrar}
                onResolver={handleResolver}
                onRealizar={handleRealizar}
                onEstado={handleEstado}
              />
              <button onClick={() => setSel(null)}
                style={{ marginTop: 18, fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: FONT }}>
                <RotateCcw size={12} /> Fechar dente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
