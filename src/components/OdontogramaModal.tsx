"use client";
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { X, Plus, Check, RotateCcw } from "lucide-react";
import { sb, type Paciente } from "@/lib/supabase";
import {
  carregarOdontograma, registrarAchado, resolverAchado, atualizarEstadoDente,
  corDominante, corEvento, nomeEvento, zonasDoDente, getPlano, ehPlanejadoPendente,
  valorPendenteDente, formatBRL, COR_ESPECIALIDADE, COR_EXISTENTE, COR_A_FAZER,
  ROTULO_ZONA, ROTULO_ESTADO, ARCADA_SUPERIOR, ARCADA_INFERIOR,
  buscarSondagem, registrarSondagem, piorBolsa,
  type DenteOdonto, type Zona, type EstadoDente, type Intencao, type SondagemDente,
} from "@/lib/odontograma";
import { toothAssetUrl } from "@/lib/odontograma-assets";
import { criarLancamento } from "@/lib/financeiro";

const BRAND = "#2B7A78";
const FONT = "'Sora',sans-serif";

type Procedimento = { esp: string; nome: string; valor: number; tempo: number; ativo?: boolean; mostrar_valor?: boolean };

function formatarData(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// agrupa procedimentos por especialidade preservando a ordem da clínica
function agruparPorEsp(precios: Procedimento[]): [string, Procedimento[]][] {
  const grupos: [string, Procedimento[]][] = [];
  for (const p of precios) {
    if (p.ativo === false) continue;
    let g = grupos.find(([esp]) => esp === p.esp);
    if (!g) { g = [p.esp, []]; grupos.push(g); }
    g[1].push(p);
  }
  return grupos;
}

// ── Dente realista (imagem + tint) ────────────────────────────────────────────

function ToothImage({ dente, selecionado, align, sondagem, onSelect }: {
  dente: DenteOdonto;
  selecionado: boolean;
  align: "flex-end" | "flex-start";
  sondagem?: SondagemDente;
  onSelect: (numero: string) => void;
}) {
  const url = toothAssetUrl(dente.numero_iso, "vestibular");
  const ausente = dente.estado === "ausente" || dente.estado === "extraido";
  const especial = dente.estado === "nao_erupcionado" || dente.estado === "impactado";
  const cor = corDominante(dente.eventos_ativos);
  const n = dente.eventos_ativos.length;
  const temAFazer = dente.eventos_ativos.some(ehPlanejadoPendente);
  const bolsa = piorBolsa(sondagem);

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
        {bolsa >= 4 && !ausente && (
          <span title={`Bolsa ${bolsa}mm`} style={{
            position: "absolute", top: -4, left: -4, width: 9, height: 9, borderRadius: 99,
            background: bolsa >= 6 ? "#dc2626" : "#d97706", border: "1.5px solid #fff",
          }} />
        )}
      </div>
    </div>
  );
}

function Arcada({ porNumero, selecionado, sondagem, onSelect }: {
  porNumero: Record<string, DenteOdonto>;
  selecionado: string | null;
  sondagem: Record<string, SondagemDente>;
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
                {dSup && <ToothImage dente={dSup} selecionado={selecionado === nSup} align="flex-end" sondagem={sondagem[nSup]} onSelect={onSelect} />}
              </div>
              <div style={{ padding: "3px 0", textAlign: "center", fontFamily: "monospace", lineHeight: 1.35 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nSup ? BRAND : "#64748b" }}>{nSup}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: selecionado === nInf ? BRAND : "#cbd5e1" }}>{nInf}</div>
              </div>
              <div style={{ height: 128 }}>
                {dInf && <ToothImage dente={dInf} selecionado={selecionado === nInf} align="flex-start" sondagem={sondagem[nInf]} onSelect={onSelect} />}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Sondagem periodontal ──────────────────────────────────────────────────────

type SondagemArgs = {
  prof: (number | null)[]; marg: (number | null)[];
  mobilidade: number | null; furcacao: number | null;
  sangramento: boolean; placa: boolean; supuracao: boolean; tartaro: boolean;
};

function NumIn({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="number" min="0" max="15" value={value} onChange={e => onChange(e.target.value)}
      style={{ width: 34, padding: "5px 3px", fontSize: 12, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 6, outline: "none", fontFamily: FONT, color: "#1e293b", background: "#fff", boxSizing: "border-box" }} />
  );
}

const PROF_KEYS = ["prof_mv", "prof_v", "prof_dv", "prof_ml", "prof_l", "prof_dl"] as const;
const MARG_KEYS = ["marg_mv", "marg_v", "marg_dv", "marg_ml", "marg_l", "marg_dl"] as const;

function SondagemForm({ sondagem, salvando, onSalvar }: {
  sondagem?: SondagemDente;
  salvando: boolean;
  onSalvar: (args: SondagemArgs) => void;
}) {
  const ini = (keys: readonly (keyof SondagemDente)[]) =>
    keys.map(k => { const v = sondagem?.[k]; return v == null ? "" : String(v); });
  const [prof, setProf] = useState<string[]>(ini(PROF_KEYS));
  const [marg, setMarg] = useState<string[]>(ini(MARG_KEYS));
  const [mob, setMob] = useState(sondagem?.mobilidade != null ? String(sondagem.mobilidade) : "");
  const [furc, setFurc] = useState(sondagem?.furcacao != null ? String(sondagem.furcacao) : "");
  const [sang, setSang] = useState(!!sondagem?.sangramento);
  const [placa, setPlaca] = useState(!!sondagem?.placa);
  const [sup, setSup] = useState(!!sondagem?.supuracao);
  const [tart, setTart] = useState(!!sondagem?.tartaro);

  const num = (s: string): number | null => s === "" ? null : Number(s);
  const setAt = (arr: string[], set: (a: string[]) => void, i: number, v: string) => {
    const c = [...arr]; c[i] = v; set(c);
  };

  function salvar() {
    onSalvar({
      prof: prof.map(num), marg: marg.map(num),
      mobilidade: num(mob), furcacao: num(furc),
      sangramento: sang, placa, supuracao: sup, tartaro: tart,
    });
  }

  const linha = (label: string, arr: string[], set: (a: string[]) => void, base: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
      <span style={{ width: 34, fontSize: 10, color: "#94a3b8" }}>{label}</span>
      {[0, 1, 2].map(j => <NumIn key={j} value={arr[base + j]} onChange={v => setAt(arr, set, base + j, v)} />)}
    </div>
  );

  return (
    <div style={{ marginTop: 10 }}>
      {sondagem?.data_exame && (
        <div style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 8 }}>Último exame: {new Date(sondagem.data_exame).toLocaleDateString("pt-BR")}</div>
      )}

      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Profundidade de bolsa (mm)</div>
      {linha("Vest", prof, setProf, 0)}
      {linha("Ling", prof, setProf, 3)}

      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "10px 0 6px" }}>Margem / recessão (mm)</div>
      {linha("Vest", marg, setMarg, 0)}
      {linha("Ling", marg, setMarg, 3)}

      <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center" }}>
        <label style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
          Mobilidade
          <select value={mob} onChange={e => setMob(e.target.value)} style={{ padding: "4px 6px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, fontFamily: FONT, background: "#fff", color: "#1e293b" }}>
            <option value="">—</option>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
          Furcação
          <select value={furc} onChange={e => setFurc(e.target.value)} style={{ padding: "4px 6px", fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, fontFamily: FONT, background: "#fff", color: "#1e293b" }}>
            <option value="">—</option>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
        {([["sangramento", sang, setSang], ["placa", placa, setPlaca], ["supuração", sup, setSup], ["tártaro", tart, setTart]] as const).map(([label, val, set]) => (
          <label key={label} style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", textTransform: "capitalize" }}>
            <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <button type="button" onClick={salvar} disabled={salvando}
        style={{ marginTop: 12, width: "100%", padding: "9px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
          border: "none", borderRadius: 9, cursor: salvando ? "wait" : "pointer", background: "#0f766e", color: "#fff",
          opacity: salvando ? 0.7 : 1 }}>
        Salvar sondagem
      </button>
    </div>
  );
}

// ── Painel de detalhe do dente ────────────────────────────────────────────────

const ESTADOS: EstadoDente[] = ["presente", "ausente", "extraido", "nao_erupcionado", "impactado"];

function DetalheDente({ dente, zonaInicial, precios, sondagem, salvando, onRegistrar, onResolver, onRealizar, onEstado, onSondagem }: {
  dente: DenteOdonto;
  zonaInicial?: Zona;
  precios: Procedimento[];
  sondagem?: SondagemDente;
  salvando: boolean;
  onRegistrar: (proc: Procedimento, zonas: Zona[], obs: string, intencao: Intencao, valor?: number) => void;
  onResolver: (eventoId: string) => void;
  onRealizar: (ev: DenteOdonto["eventos_ativos"][number]) => void;
  onEstado: (estado: EstadoDente) => void;
  onSondagem: (args: SondagemArgs) => void;
}) {
  const [procNome, setProcNome] = useState("");
  const [intencao, setIntencao] = useState<Intencao>("planejado");
  const [valor, setValor] = useState("");
  const [zonas, setZonas] = useState<Zona[]>(zonaInicial ? [zonaInicial] : []);
  const [obs, setObs] = useState("");
  const [showPerio, setShowPerio] = useState(false);

  const grupos = useMemo(() => agruparPorEsp(precios), [precios]);
  const proc = precios.find(p => p.nome === procNome);
  const corSel = proc ? (COR_ESPECIALIDADE[proc.esp] ?? "#64748b") : "#64748b";
  const zonasDisponiveis = zonasDoDente(dente);

  function escolherProc(nome: string) {
    setProcNome(nome);
    const p = precios.find(x => x.nome === nome);
    if (p) setValor(p.valor ? String(p.valor) : "");
  }
  function toggleZona(z: Zona) {
    setZonas(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]);
  }
  function registrar() {
    if (!proc) return;
    onRegistrar(proc, zonas, obs.trim(), intencao, valor ? Number(valor) : undefined);
    setProcNome(""); setValor(""); setZonas([]); setObs(""); setIntencao("planejado");
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

      {/* Lista de procedimentos do dente */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
          Procedimentos {dente.eventos_ativos.length > 0 && `(${dente.eventos_ativos.length})`}
        </div>
        {dente.eventos_ativos.length === 0 ? (
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>Nenhum procedimento registrado.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dente.eventos_ativos.map(ev => {
              const plano = getPlano(ev);
              const aFazer = plano.intencao === "planejado" && plano.status !== "realizado";
              const realizado = plano.status === "realizado";
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: corEvento(ev), marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{nomeEvento(ev)}</span>
                      {aFazer && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: COR_A_FAZER, padding: "1px 6px", borderRadius: 99 }}>A FAZER</span>}
                      {realizado && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "#059669", padding: "1px 6px", borderRadius: 99 }}>REALIZADO</span>}
                      {!aFazer && !realizado && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: COR_EXISTENTE, padding: "1px 6px", borderRadius: 99 }}>EXISTENTE</span>}
                    </div>
                    {ev.zonas?.length ? <div style={{ fontSize: 11, color: "#94a3b8" }}>{ev.zonas.map(z => ROTULO_ZONA[z]).join(", ")}</div> : null}
                    {plano.valor != null && <div style={{ fontSize: 11, color: "#64748b" }}>{formatBRL(plano.valor)}</div>}
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

      {/* Registrar procedimento */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Registrar procedimento</div>

        <select value={procNome} onChange={e => escolherProc(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }}>
          <option value="">Selecione um procedimento…</option>
          {grupos.map(([esp, items]) => (
            <optgroup key={esp} label={esp}>
              {items.map((p, i) => <option key={i} value={p.nome}>{p.nome}{p.valor ? ` — ${formatBRL(p.valor)}` : ""}</option>)}
            </optgroup>
          ))}
        </select>
        {precios.length === 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#d97706" }}>Nenhum procedimento cadastrado em Procedimentos &amp; Preços.</div>
        )}

        {/* Intenção */}
        <div style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 6px" }}>Este procedimento é…</div>
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

        {/* Valor */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Valor R$</span>
          <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" min="0" step="0.01"
            style={{ flex: 1, padding: "7px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }} />
        </div>

        {/* Superfícies */}
        <div style={{ fontSize: 11, color: "#94a3b8", margin: "12px 0 6px" }}>Superfícies (opcional)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {zonasDisponiveis.map(z => {
            const on = zonas.includes(z);
            return (
              <button key={z} type="button" onClick={() => toggleZona(z)}
                style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, fontFamily: FONT,
                  border: `1px solid ${on ? corSel : "#e2e8f0"}`, borderRadius: 99, cursor: "pointer",
                  background: on ? corSel : "#fff", color: on ? "#fff" : "#64748b" }}>
                {ROTULO_ZONA[z]}
              </button>
            );
          })}
        </div>

        <input type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder="Observação (opcional)"
          style={{ marginTop: 10, width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, outline: "none", fontFamily: FONT, background: "#fff", color: "#1e293b", boxSizing: "border-box" }} />

        <button type="button" onClick={registrar} disabled={salvando || !proc}
          style={{ marginTop: 10, width: "100%", padding: "9px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
            border: "none", borderRadius: 9, cursor: (salvando || !proc) ? "not-allowed" : "pointer", background: BRAND, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (salvando || !proc) ? 0.5 : 1 }}>
          <Plus size={14} /> Registrar
        </button>
        {!proc && <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>Selecione um procedimento acima para registrar.</div>}
      </div>

      {/* Sondagem periodontal */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
        <button type="button" onClick={() => setShowPerio(v => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Sondagem periodontal
            {piorBolsa(sondagem) >= 4 && (
              <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: "#fff", background: piorBolsa(sondagem) >= 6 ? "#dc2626" : "#d97706", padding: "1px 6px", borderRadius: 99 }}>{piorBolsa(sondagem)}mm</span>
            )}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{showPerio ? "▲" : "▼"}</span>
        </button>
        {showPerio && <SondagemForm sondagem={sondagem} salvando={salvando} onSalvar={onSondagem} />}
      </div>
    </div>
  );
}

function Legenda({ precios }: { precios: Procedimento[] }) {
  const esps = Array.from(new Set(precios.filter(p => p.ativo !== false).map(p => p.esp)));
  if (!esps.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
      {esps.map(esp => (
        <div key={esp} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: COR_ESPECIALIDADE[esp] ?? "#64748b" }} />
          {esp}
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
  const [sondagem, setSondagem] = useState<Record<string, SondagemDente>>({});
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
        const [l, cli, snd] = await Promise.all([
          carregarOdontograma(paciente.id, clinicaId),
          sb.query<{ precios?: Procedimento[] }>("clinicas", `?id=eq.${clinicaId}&select=precios`).catch(() => []),
          buscarSondagem(paciente.id).catch(() => [] as SondagemDente[]),
        ]);
        if (vivo) {
          setDentes(l);
          setPrecios(cli[0]?.precios ?? []);
          setSondagem(Object.fromEntries(snd.map(s => [s.numero_iso, s])));
        }
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

  function handleRegistrar(proc: Procedimento, zonas: Zona[], obs: string, intencao: Intencao, valor?: number) {
    if (!denteSel) return;
    const detalhes: Record<string, unknown> = { procedimento: proc.nome, esp: proc.esp, intencao };
    if (valor != null && !Number.isNaN(valor)) detalhes.valor = valor;
    if (intencao === "planejado") detalhes.plano_status = "pendente";
    comSalvar(() => registrarAchado({
      denteId: denteSel.id, clinicaId, pacienteId: paciente.id, achadoId: "procedimento",
      zonas, detalhes, observacoes: obs || undefined, criadoPor: autor,
    }));
  }
  function handleResolver(eventoId: string) {
    comSalvar(() => resolverAchado({ eventoId, status: "resolvido", resolvidoPor: autor }));
  }
  function handleRealizar(ev: DenteOdonto["eventos_ativos"][number]) {
    if (!denteSel) return;
    const detalhes = { ...(ev.detalhes ?? {}), intencao: "planejado", plano_status: "realizado" };
    const plano = getPlano(ev);
    comSalvar(async () => {
      await registrarAchado({
        denteId: denteSel.id, clinicaId, pacienteId: paciente.id, achadoId: ev.achado_id,
        zonas: ev.zonas ?? [], detalhes, observacoes: ev.observacoes ?? undefined, criadoPor: autor,
      });
      await resolverAchado({ eventoId: ev.id, status: "substituido", resolvidoPor: autor });
      // Gancho financeiro: procedimento realizado com valor → receita a receber
      if (plano.valor && plano.valor > 0) {
        await criarLancamento({
          clinica_id: clinicaId, paciente_id: paciente.id, paciente_nome: paciente.nome,
          tipo: "receita", descricao: nomeEvento(ev), valor: plano.valor, status: "pendente",
          origem: "odontograma", ref_dente: denteSel.numero_iso, criado_por: autor ?? null,
        });
      }
    });
  }
  function handleEstado(estado: EstadoDente) {
    if (!denteSel) return;
    comSalvar(() => atualizarEstadoDente({ denteId: denteSel.id, estado, atualizadoPor: autor }));
  }
  function handleSondagem(args: { prof: (number|null)[]; marg: (number|null)[]; mobilidade: number|null; furcacao: number|null; sangramento: boolean; placa: boolean; supuracao: boolean; tartaro: boolean }) {
    if (!denteSel) return;
    comSalvar(async () => {
      await registrarSondagem({ denteId: denteSel.id, clinicaId, pacienteId: paciente.id, criadoPor: autor, ...args });
      const snd = await buscarSondagem(paciente.id);
      setSondagem(Object.fromEntries(snd.map(s => [s.numero_iso, s])));
    });
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
              {loading ? "Carregando…" : `${totalComAchados} dente${totalComAchados !== 1 ? "s" : ""} com procedimentos`}
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
                <Arcada porNumero={porNumero} selecionado={sel?.numero ?? null} sondagem={sondagem} onSelect={selecionar} />
                <Legenda precios={precios} />
                {!denteSel && (
                  <div style={{ textAlign: "center", fontSize: 12, color: "#cbd5e1" }}>
                    Clique em um dente para ver e registrar procedimentos.
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
                sondagem={sondagem[denteSel.numero_iso]}
                salvando={salvando}
                onRegistrar={handleRegistrar}
                onResolver={handleResolver}
                onRealizar={handleRealizar}
                onEstado={handleEstado}
                onSondagem={handleSondagem}
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
