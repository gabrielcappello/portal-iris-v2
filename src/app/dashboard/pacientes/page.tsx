"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { sb, type Paciente, type Agendamento } from "@/lib/supabase";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clinicaId = localStorage.getItem("clinica_id");
    if (!clinicaId) return;
    Promise.all([
      sb.query<Paciente>("pacientes", `?clinica_id=eq.${clinicaId}`),
      sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${clinicaId}`),
    ]).then(([p, a]) => {
      setPacientes(p);
      setAgendamentos(a);
    }).finally(() => setLoading(false));
  }, []);

  function pacienteStats(p: Paciente) {
    const hist = agendamentos.filter(a => a.paciente_id === p.id || a.telefone === p.telefone);
    const total = hist.filter(a => a.status === "confirmado" || a.status === "remarcado").length;
    const ultima = hist.sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0]?.data;
    return { total, ultima };
  }

  const filtered = pacientes.filter(p =>
    !search ||
    (p.nome || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone || "").includes(search) ||
    (p.documento || "").includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pacientes <span className="text-sm font-normal text-gray-400 ml-2">{pacientes.length} registrados</span></h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#2B7A78]/40 focus:border-[#2B7A78]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Nome", "Telefone", "Documento", "Total consultas", "Última consulta"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Carregando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Nenhum paciente encontrado</td></tr>
            )}
            {filtered.map((p, i) => {
              const { total, ultima } = pacienteStats(p);
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(p)}
                  className="border-b border-gray-50 hover:bg-[#DEF2F1]/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nome}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.telefone}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.documento}</td>
                  <td className="px-4 py-3">
                    <span className="bg-[#DEF2F1] text-[#2B7A78] text-xs font-semibold px-2 py-0.5 rounded-full">{total}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ultima || "—"}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal paciente */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">{selected.nome}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.telefone}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: "Documento", value: selected.documento },
                  { label: "Data de Nascimento", value: selected.data_nascimento || "—" },
                  { label: "Total de Consultas", value: String(pacienteStats(selected).total) },
                  { label: "Última Consulta", value: pacienteStats(selected).ultima || "—" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{f.label}</label>
                    <p className="text-sm text-gray-900 mt-0.5">{f.value}</p>
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Odontograma</label>
                  <div className="mt-2 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                    Em desenvolvimento
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
