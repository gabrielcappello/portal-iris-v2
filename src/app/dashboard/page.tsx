"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Stethoscope, Building2, Users, Zap } from "lucide-react";
import { sb, type Clinica } from "@/lib/supabase";

type Section = "idioma" | "secretaria" | "clinica" | "dentistas" | "automacoes";

interface ConfigCard {
  id: Section;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}

const CARDS: ConfigCard[] = [
  { id: "idioma",     icon: <Globe size={18}/>,        title: "Idioma & Localização",    subtitle: "Idioma, país, estado e fuso horário da clínica" },
  { id: "secretaria", icon: <Stethoscope size={18}/>,  title: "Dados da Secretaria",     subtitle: "Identidade e configurações da Iris" },
  { id: "clinica",    icon: <Building2 size={18}/>,    title: "Dados da Clínica",        subtitle: "Informações usadas pelo agente nas conversas" },
  { id: "dentistas",  icon: <Users size={18}/>,        title: "Dentistas",               subtitle: "Até 10 profissionais com agendas independentes" },
  { id: "automacoes", icon: <Zap size={18}/>,          title: "Automações",              subtitle: "Mensagens automáticas para pacientes" },
];

export default function ConfigPage() {
  const [open, setOpen] = useState<Section | null>("idioma");
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const clinicaId = localStorage.getItem("clinica_id");
    if (!clinicaId) return;
    sb.query<Clinica>("clinicas", `?id=eq.${clinicaId}&select=*`)
      .then(rows => {
        if (rows[0]) {
          setClinica(rows[0]);
          localStorage.setItem("clinica_nome", rows[0].nome_clinica || "Clínica");
        }
      })
      .catch(console.error);
  }, []);

  async function saveField(field: string, value: string) {
    if (!clinica) return;
    setSaving(true);
    try {
      await sb.update("clinicas", clinica.id, { [field]: value });
      setClinica(prev => prev ? { ...prev, [field]: value } : prev);
      showToast("Salvo com sucesso!", "success");
    } catch {
      showToast("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggle(id: Section) {
    setOpen(prev => prev === id ? null : id);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Configuração</h2>

      <div className="space-y-3">
        {CARDS.map(card => (
          <motion.div
            key={card.id}
            layout
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-[#2B7A78]/30 transition-colors"
          >
            {/* Card Header */}
            <button
              onClick={() => toggle(card.id)}
              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#DEF2F1]/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#DEF2F1] to-[#DEF2F1]/50 flex items-center justify-center text-[#2B7A78] flex-shrink-0">
                {card.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-600 text-gray-900">{card.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{card.subtitle}</div>
              </div>
              {card.badge && (
                <span className="text-xs font-mono bg-[#DEF2F1] text-[#2B7A78] px-2 py-0.5 rounded-full">{card.badge}</span>
              )}
              <motion.div
                animate={{ rotate: open === card.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                <ChevronDown size={16} />
              </motion.div>
            </button>

            {/* Card Body */}
            <AnimatePresence initial={false}>
              {open === card.id && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-5 border-t border-gray-50">
                    {card.id === "clinica" && clinica && (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Nome da Clínica", field: "nome_clinica", value: clinica.nome_clinica },
                          { label: "Telefone", field: "telefone_clinica", value: clinica.telefone_clinica },
                          { label: "Endereço", field: "endereco", value: (clinica as unknown as Record<string, string>).endereco },
                          { label: "Cidade", field: "cidade", value: (clinica as unknown as Record<string, string>).cidade },
                        ].map(f => (
                          <div key={f.field}>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{f.label}</label>
                            <input
                              defaultValue={f.value || ""}
                              onBlur={e => saveField(f.field, e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B7A78]/40 focus:border-[#2B7A78] transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {card.id !== "clinica" && (
                      <p className="text-sm text-gray-400">Seção em desenvolvimento...</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg ${
              toast.type === "success" ? "bg-[#2B7A78]" : "bg-red-500"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
