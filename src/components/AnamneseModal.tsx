"use client";
import IrisLoader from "@/components/IrisLoader";
import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { SUPABASE_URL, SUPABASE_KEY, type Paciente } from "@/lib/supabase";

type TriVal = "sim" | "nao" | "nao_sei" | null;
type AnamneseMeta = { atualizada_em?: string; atualizada_por?: string };
export type AnamneseData = Record<string, unknown> & { _meta?: AnamneseMeta };

type Form = {
  fumante: TriVal; diabetes: TriVal; hipertensao: TriVal;
  anticoagulantes: TriVal; gravidez: TriVal;
  alergias: TriVal; alergias_texto: string;
  medicamentos: TriVal; medicamentos_texto: string;
  observacoes: string;
};

const FORM_VAZIO: Form = {
  fumante: null, diabetes: null, hipertensao: null,
  anticoagulantes: null, gravidez: null,
  alergias: null, alergias_texto: "",
  medicamentos: null, medicamentos_texto: "",
  observacoes: "",
};

function anamneseParaForm(a: AnamneseData): Form {
  const tri = (v: unknown): TriVal =>
    v === "sim" || v === "nao" || v === "nao_sei" ? v : null;
  const texto = (v: unknown): string =>
    typeof v === "string" && v !== "sim" && v !== "nao" && v !== "nao_sei" ? v : "";

  return {
    fumante:           tri(a.fumante),
    diabetes:          tri(a.diabetes),
    hipertensao:       tri(a.hipertensao),
    anticoagulantes:   tri(a.anticoagulantes),
    gravidez:          tri(a.gravidez),
    alergias:          typeof a.alergias === "string" ? (a.alergias === "nao" || a.alergias === "nao_sei" ? a.alergias : "sim") : null,
    alergias_texto:    texto(a.alergias),
    medicamentos:      typeof a.medicamentos === "string" ? (a.medicamentos === "nao" || a.medicamentos === "nao_sei" ? a.medicamentos : "sim") : null,
    medicamentos_texto: texto(a.medicamentos),
    observacoes:       typeof a.observacoes === "string" ? a.observacoes : "",
  };
}

function formParaAnamnese(f: Form, operador: string): AnamneseData {
  const obj: AnamneseData = {};
  if (f.fumante)         obj.fumante         = f.fumante;
  if (f.diabetes)        obj.diabetes        = f.diabetes;
  if (f.hipertensao)     obj.hipertensao     = f.hipertensao;
  if (f.anticoagulantes) obj.anticoagulantes = f.anticoagulantes;
  if (f.gravidez)        obj.gravidez        = f.gravidez;
  if (f.alergias) {
    obj.alergias = f.alergias === "sim"
      ? (f.alergias_texto.trim() || "sim")
      : f.alergias;
  }
  if (f.medicamentos) {
    obj.medicamentos = f.medicamentos === "sim"
      ? (f.medicamentos_texto.trim() || "sim")
      : f.medicamentos;
  }
  if (f.observacoes.trim()) obj.observacoes = f.observacoes.trim();
  obj._meta = { atualizada_por: operador };
  return obj;
}

function formatarData(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// Botão Sim / Não / Não sei
function TriBtn({ valor, selecionado, onChange }: { valor: TriVal; selecionado: TriVal; onChange: (v: TriVal) => void }) {
  const labels: Record<NonNullable<TriVal>, string> = { sim: "Sim", nao: "Não", nao_sei: "Não sei" };
  const on = selecionado === valor;
  const cores: Record<NonNullable<TriVal>, { bg: string; color: string; border: string }> = {
    sim:     { bg: "rgba(220,38,38,0.1)",  color: "#dc2626", border: "rgba(220,38,38,0.3)" },
    nao:     { bg: "rgba(16,185,129,0.1)", color: "#059669", border: "rgba(16,185,129,0.3)" },
    nao_sei: { bg: "rgba(100,116,139,0.1)", color: "#64748b", border: "rgba(100,116,139,0.3)" },
  };
  const c = on ? cores[valor!] : { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" };
  return (
    <button type="button" onClick={() => onChange(on ? null : valor)}
      style={{ padding: "5px 12px", fontSize: 12, fontWeight: 600, fontFamily: "'Sora',sans-serif",
        border: `1px solid ${c.border}`, borderRadius: 8, cursor: "pointer",
        background: c.bg, color: c.color, transition: "all 0.12s" }}>
      {labels[valor!]}
    </button>
  );
}

// Linha de campo Sim/Não/Não sei
function CampoTri({ label, valor, onChange }: { label: string; valor: TriVal; onChange: (v: TriVal) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#334155" }}>{label}</div>
      <div style={{ display: "flex", gap: 5 }}>
        {(["sim", "nao", "nao_sei"] as TriVal[]).map(v => (
          <TriBtn key={v} valor={v} selecionado={valor} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

// Linha de campo condicional (sim abre texto)
function CampoCondicional({ label, valor, texto, onValor, onTexto }:
  { label: string; valor: TriVal; texto: string; onValor: (v: TriVal) => void; onTexto: (s: string) => void }) {
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#334155" }}>{label}</div>
        <div style={{ display: "flex", gap: 5 }}>
          {(["sim", "nao", "nao_sei"] as TriVal[]).map(v => (
            <TriBtn key={v} valor={v} selecionado={valor} onChange={onValor} />
          ))}
        </div>
      </div>
      {valor === "sim" && (
        <input type="text" value={texto} onChange={e => onTexto(e.target.value)}
          placeholder="Quais?"
          style={{ marginTop: 8, width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #e2e8f0",
            borderRadius: 8, outline: "none", fontFamily: "'Sora',sans-serif", boxSizing: "border-box",
            background: "#fff", color: "#1e293b" }} />
      )}
    </div>
  );
}

type Props = {
  paciente: Paciente;
  clinicaId: string;
  operadorNome: string;
  onClose: (anamneseAtualizada?: AnamneseData) => void;
};

export default function AnamneseModal({ paciente, clinicaId, operadorNome, onClose }: Props) {
  const [form, setForm]       = useState<Form>(FORM_VAZIO);
  const [meta, setMeta]       = useState<AnamneseMeta>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]       = useState("");

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/pacientes?id=eq.${paciente.id}&select=anamnese`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const linhas: { anamnese?: AnamneseData }[] = await res.json();
        const a: AnamneseData = linhas[0]?.anamnese || {};
        setMeta((a._meta as AnamneseMeta) || {});
        setForm(anamneseParaForm(a));
      } catch { setErro("Erro ao carregar anamnese."); }
      setLoading(false);
    }
    carregar();
  }, [paciente.id]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function salvar() {
    setSalvando(true); setErro("");
    try {
      const obj = formParaAnamnese(form, operadorNome);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/atualizar_anamnese`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ p_paciente_id: paciente.id, p_clinica_id: clinicaId, p_anamnese: obj }),
      });
      if (!res.ok) { setErro("Erro ao salvar. Tente novamente."); setSalvando(false); return; }
      // recarrega para pegar _meta.atualizada_em do servidor
      const r2 = await fetch(
        `${SUPABASE_URL}/rest/v1/pacientes?id=eq.${paciente.id}&select=anamnese`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const linhas: { anamnese?: AnamneseData }[] = await r2.json();
      onClose(linhas[0]?.anamnese);
    } catch { setErro("Erro ao salvar. Tente novamente."); }
    setSalvando(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "stretch", justifyContent: "flex-end", background: "rgba(15,23,42,0.4)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ width: "min(520px,100vw)", height: "100%", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", overflowY: "auto" }}>

        {/* Cabeçalho */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Anamnese — {paciente.nome}</div>
              {meta.atualizada_em && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Última atualização: {formatarData(meta.atualizada_em)}
                  {meta.atualizada_por ? ` por ${meta.atualizada_por}` : ""}
                </div>
              )}
            </div>
            <button onClick={() => onClose()} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4, display: "flex" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <IrisLoader />
          ) : (
            <>
              {/* Grupo 1 — Sim / Não / Não sei */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Condições de saúde</div>
              <CampoTri label="Fumante"                 valor={form.fumante}         onChange={v => set("fumante", v)} />
              <CampoTri label="Diabetes"                valor={form.diabetes}        onChange={v => set("diabetes", v)} />
              <CampoTri label="Hipertensão (pressão alta)" valor={form.hipertensao} onChange={v => set("hipertensao", v)} />
              <CampoTri label="Usa anticoagulante"      valor={form.anticoagulantes} onChange={v => set("anticoagulantes", v)} />
              <CampoTri label="Gravidez"                valor={form.gravidez}        onChange={v => set("gravidez", v)} />

              {/* Grupo 2 — Condicionais */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4, marginTop: 20 }}>Detalhes</div>
              <CampoCondicional label="Alergias"
                valor={form.alergias} texto={form.alergias_texto}
                onValor={v => set("alergias", v)} onTexto={s => set("alergias_texto", s)} />
              <CampoCondicional label="Medicamentos de uso contínuo"
                valor={form.medicamentos} texto={form.medicamentos_texto}
                onValor={v => set("medicamentos", v)} onTexto={s => set("medicamentos_texto", s)} />

              {/* Grupo 3 — Observações */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4, marginTop: 20 }}>Observações</div>
              <textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)}
                placeholder="Anotações livres do dentista…"
                rows={4}
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 10,
                  outline: "none", fontFamily: "'Sora',sans-serif", resize: "vertical", boxSizing: "border-box",
                  background: "#fff", color: "#1e293b", lineHeight: 1.5 }} />

              {erro && <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626" }}>{erro}</div>}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#fff", position: "sticky", bottom: 0 }}>
          <button onClick={salvar} disabled={salvando || loading}
            style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 700, fontFamily: "'Sora',sans-serif",
              border: "none", borderRadius: 10, cursor: salvando ? "wait" : "pointer",
              background: "#2B7A78", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              opacity: salvando ? 0.7 : 1, transition: "opacity 0.15s" }}>
            <Save size={15} />
            {salvando ? "Salvando…" : "Salvar anamnese"}
          </button>
        </div>
      </div>
    </div>
  );
}
