"use client";
import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, addDays,
  format, isSameDay, isSameMonth, parseISO, isToday,
  addMonths, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value: string;          // YYYY-MM-DD ou ""
  onChange: (v: string) => void;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DatePickerInline({ value, onChange }: Props) {
  const today = new Date();
  const init = value ? parseISO(value) : today;
  const [mes, setMes] = useState<Date>(startOfMonth(init));

  const selecionado = value ? parseISO(value) : null;

  // gera as 6 semanas do grid
  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 0 });
  const dias: Date[] = Array.from({ length: 42 }, (_, i) => addDays(inicio, i));

  function selecionar(d: Date) {
    onChange(format(d, "yyyy-MM-dd"));
  }

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(43,122,120,0.35)", borderRadius: 12, overflow: "hidden", userSelect: "none" }}>
      {/* Header mês */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 8px", borderBottom: "1px solid #f1f5f9" }}>
        <button type="button" onClick={() => setMes(m => subMonths(m, 1))}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", padding: "2px 6px", borderRadius: 6, display: "flex" }}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "capitalize" }}>
          {format(mes, "MMMM yyyy", { locale: ptBR })}
        </div>
        <button type="button" onClick={() => setMes(m => addMonths(m, 1))}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", padding: "2px 6px", borderRadius: 6, display: "flex" }}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Cabeçalho dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "6px 8px 2px" }}>
        {DIAS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "2px 8px 10px", gap: "2px 0" }}>
        {dias.map((d, i) => {
          const doMes = isSameMonth(d, mes);
          const sel   = !!selecionado && isSameDay(d, selecionado);
          const hoje  = isToday(d);

          return (
            <button key={i} type="button" onClick={() => selecionar(d)}
              style={{
                border: "none", background: "none", cursor: "pointer", padding: "3px 0",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <span style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12.5, fontWeight: sel ? 700 : hoje ? 600 : 400,
                fontFamily: "'Sora',sans-serif",
                background: sel ? "#2B7A78" : hoje ? "rgba(43,122,120,0.12)" : "transparent",
                color: sel ? "#fff" : hoje ? "#2B7A78" : doMes ? "#1e293b" : "#cbd5e1",
                transition: "background 0.12s",
              }}>
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
