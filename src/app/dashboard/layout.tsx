"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const TABS = [
  { href: "/dashboard", label: "Configuração", icon: "⚙️" },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: "👥" },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: "📅" },
  { href: "/dashboard/procedimentos", label: "Procedimentos", icon: "🦷" },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: "💰" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [clinicaNome, setClinicaNome] = useState("Carregando...");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    const nome = localStorage.getItem("clinica_nome");
    if (nome) setClinicaNome(nome);
  }, [router]);

  function logout() {
    localStorage.clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2B7A78] to-[#3AAFA9] flex items-center justify-center shadow-md shadow-[#2B7A78]/20 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <circle cx="12" cy="12" r="10" fillOpacity="0.15"/>
            <circle cx="12" cy="12" r="6" fillOpacity="0.3"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Iris Portal</h1>
          <p className="text-xs text-gray-400 font-mono">{clinicaNome}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-all"
        >
          Sair
        </button>
      </header>

      {/* Tab Nav */}
      <nav className="bg-white border-b border-gray-100 px-8 flex overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href} className="relative">
              <button className={`px-5 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${isActive ? "text-[#2B7A78]" : "text-gray-400 hover:text-gray-600"}`}>
                <span>{tab.icon}</span>
                {tab.label}
              </button>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B7A78]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
