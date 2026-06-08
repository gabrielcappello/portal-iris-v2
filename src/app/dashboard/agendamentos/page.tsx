"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { sb, type Agendamento } from "@/lib/supabase";

const STATUS_STYLE: Record<string, string> = {
  confirmado: "bg-emerald-50 text-emerald-700",
  remarcado:  "bg-amber-50 text-amber-700",
  cancelado:  "bg-red-50 text-red-600",
};

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clinicaId = localStorage.getItem("clinica_id");
    if (!clinicaId) return;
    sb.query<Agendamento>("agendamentos", `?clinica_id=eq.${clinicaId}&order=data.desc,horario.desc`)
      .then(setAgendamentos)
      .finally(() => setLoading(false));
  }, []);

  const filtered = agendamentos.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || (a.nome||"").toLowerCase().includes(q) || (a.data||"").includes(q) || (a.dentista_nome||"").toLowerCase().includes(q) || (a.documento||"").includes(q);
    const matchS = !statusFiltro || a.status === statusFiltro;
    return matchQ && matchS;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">
          Agendamentos <span className="text-sm font-normal text-gray-400 ml-2">{agendamentos.length} total</span>
        </h2>
        <div className="flex gap-2">
          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2B7A78]/40"
          >
            <option value="">Todos os status</option>
            <option value="confirmado">Confirmado</option>
            <option value="remarcado">Remarcado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-[#2B7A78]/40 focus:border-[#2B7A78]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Data", "Hora", "Paciente", "Documento", "Dentista", "Procedimento", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Carregando...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Nenhum agendamento encontrado</td></tr>}
            {filtered.map((a, i) => (
              <motion.tr
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-gray-50 hover:bg-[#DEF2F1]/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.data || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.horario || "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{a.nome}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.documento || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{a.dentista_nome || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.procedimento || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[a.status] || "bg-gray-100 text-gray-500"}`}>
                    {a.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
