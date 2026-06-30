"use client";
import { useState, useEffect, useCallback, Fragment } from "react";
import { X, Plus, Check, RotateCcw } from "lucide-react";
import { type Paciente } from "@/lib/supabase";
import {
  carregarOdontograma, registrarAchado, resolverAchado, atualizarEstadoDente,
  corDominante, zonasDoDente,
  ACHADOS, ACHADO_POR_ID, CORES_CATEGORIA, corDoAchado,
  ROTULO_ZONA, ROTULO_ESTADO,
  ARCADA_SUPERIOR, ARCADA_INFERIOR,
  type DenteOdonto, type Zona, type EstadoDente, type CategoriaAchado,
} from "@/lib/odontograma";
import { toothAssetUrl } from "@/lib/odontograma-assets";

const BRAND = "#2B7A78";
const FONT = "'Sora',sans-serif";

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
  align: "flex-end" | "flex-start"; // superior alinha embaixo (coroa p/ centro), inferior em cima
  onSelect: (numero: string) => void;
}) {
  const url = toothAssetUrl(dente.numero_iso, "vestibular");
  const ausente = dente.estado === "ausente" || dente.estado === "extraido";
  const especial = dente.estado === "nao_erupcionado" || dente.estado === "impactado";
  const cor = corDominante(dente.eventos_ativos);
  const n = dente.eventos_ativos.length;

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
        {/* tint na forma do dente */}
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
        {/* X de ausente */}
        {ausente && (
          <svg viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <line x1="9" y1="9" x2="31" y2="31" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
            <line x1="31" y1="9" x2="9" y2="31" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
        )}
        {/* badge de contagem */}
        {n > 0 && !ausente && (
          <span style={{
            position: "absolute", top: -4, right: -4, minWidth: 13, height: 13, padding: "0 3px",
            borderRadius: 99, background: cor ?? "#64748b", color: "#fff", fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff",
          }}>{n}</span>
        )}
      </div>
    </div>
  );
}

// ── Arcada (2 fileiras + faixa de números no meio) ────────────────────────────

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
              {/* dente superior (coroa p/ baixo) */}
              <div style={{ height: 128 }}>
                {dSup && <ToothImage dente={dSup} selecionado={selecionado === nSup} align="flex-end" onSelect={onSelect} />}
              </div>
              {/* números */}
              <div style={{ padding: "3px 0", textAlign: "center", fontFamily: "monospace", lineHeight: 1.35 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nSup ? BRAND : "#64748b" }}>{nSup}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nInf ? BRAND : "#cbd5e1" }}>{nInf}</div>
              </div>
              {/* dente inferior (coroa p/ cima) */}
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

function DetalheDente({ dente, zonaInicial, salvando, onRegistrar, onResolver, onEstado }: {
  dente: DenteOdonto;
  zonaInicial?: Zona;
  salvando: boolean;
  onRegistrar: (achadoId: string, zonas: Zona[], obs: string) => void;
  onResolver: (eventoId: string) => void;
  onEstado: (estado: EstadoDente) => void;
}) {
  const [achadoId, setAchadoId] = useState("");
  const [zonas, setZonas] = useState<Zona[]>(zonaInicial ? [zonaInicial] : []);
  const [obs, setObs] = useState("");

  const zonasDisponiveis = zonasDoDente(dente);
  function toggleZona(z: Zona) {
    setZonas(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  }
  function registrar() {
    if (!achadoId) return;
    onRegistrar(achadoId, zonas, obs.trim());
    setAchadoId(""); setZonas([]); setObs("");
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
          Achados ativos {dente.eventos_ativos.length > 0 && `(${dente.eventos_ativos.length})`}
        </div>
        {dente.eventos_ativos.length === 0 ? (
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>Nenhum achado registrado.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dente.eventos_ativos.map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: corDoAchado(ev.achado_id), marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{ACHADO_POR_ID[ev.achado_id]?.nome ?? ev.achado_id}</div>
                  {ev.zonas?.length ? (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.zonas.map(z => ROTULO_ZONA[z]).join(", ")}</div>
                  ) : null}
                  {ev.observacoes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ev.observacoes}</div>}
                  {ev.criado_em && <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>{formatarData(ev.criado_em)}</div>}
                </div>
                <button type="button" disabled={salvando} onClick={() => onResolver(ev.id)} title="Resolver"
                  style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, padding: "4px 8px", cursor: salvando ? "wait" : "pointer", color: "#059669", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, fontFamily: FONT, flexShrink: 0 }}>
                  <Check size={12} /> Resolver
                </button>
              </div>
            ))}
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

        {achadoId && (
          <>
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

            <button type="button" onClick={registrar} disabled={salvando}
              style={{ marginTop: 10, width: "100%", padding: "9px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                border: "none", borderRadius: 9, cursor: salvando ? "wait" : "pointer", background: BRAND, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: salvando ? 0.7 : 1 }}>
              <Plus size={14} /> Registrar achado
            </button>
          </>
        )}
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
  usuarioId: string; // UUID do usuário logado — vai nos campos de autoria (criado_por etc.)
  onClose: () => void;
};

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OdontogramaModal({ paciente, clinicaId, usuarioId, onClose }: Props) {
  // só envia como autor se for um UUID válido; senão null (os campos *_por são uuid no banco)
  const autor = RE_UUID.test(usuarioId) ? usuarioId : undefined;
  const [dentes, setDentes] = useState<DenteOdonto[]>([]);
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
      try { const l = await carregarOdontograma(paciente.id, clinicaId); if (vivo) setDentes(l); }
      catch (e) { if (vivo) setErro(e instanceof Error ? e.message : "Erro ao carregar."); }
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

  function handleRegistrar(achadoId: string, zonas: Zona[], obs: string) {
    if (!denteSel) return;
    comSalvar(() => registrarAchado({
      denteId: denteSel.id, clinicaId, pacienteId: paciente.id, achadoId,
      zonas, observacoes: obs || undefined, criadoPor: autor,
    }));
  }
  function handleResolver(eventoId: string) {
    comSalvar(() => resolverAchado({ eventoId, status: "resolvido", resolvidoPor: autor }));
  }
  function handleEstado(estado: EstadoDente) {
    if (!denteSel) return;
    comSalvar(() => atualizarEstadoDente({ denteId: denteSel.id, estado, atualizadoPor: autor }));
  }

  const totalComAchados = dentes.filter(d => d.eventos_ativos.length > 0).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.45)", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(1120px,100%)", maxHeight: "94vh", background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Cabeçalho */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>Odontograma — {paciente.nome}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
              {loading ? "Carregando…" : `${totalComAchados} dente${totalComAchados !== 1 ? "s" : ""} com achados ativos`}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* Mapa */}
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

          {/* Detalhe */}
          {denteSel && (
            <div style={{ width: 340, borderLeft: "1px solid #f1f5f9", background: "#fff", padding: "20px 20px 24px", overflowY: "auto", flexShrink: 0 }}>
              {erro && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>{erro}</div>}
              <DetalheDente
                key={`${denteSel.id}-${sel?.nonce ?? 0}`}
                dente={denteSel}
                zonaInicial={sel?.zona}
                salvando={salvando}
                onRegistrar={handleRegistrar}
                onResolver={handleResolver}
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
