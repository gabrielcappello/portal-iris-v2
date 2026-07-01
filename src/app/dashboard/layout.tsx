"use client";
import IrisLoader from "@/components/IrisLoader";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { LangProvider, useLang } from "@/lib/i18n/LangContext";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [clinicaNome, setClinicaNome] = useState("Clínica");
  const { t, dir, loading } = useLang();

  const TABS = [
    { href: "/dashboard",                   label: t("nav.tab_config"),       icon: "⚙️" },
    { href: "/dashboard/pacientes",         label: t("nav.tab_patients"),     icon: "👥" },
    { href: "/dashboard/agendamentos",      label: t("nav.tab_appointments"), icon: "📅" },
    { href: "/dashboard/calendario",        label: t("nav.tab_calendar"),     icon: "📆" },
    { href: "/dashboard/remarcar",          label: t("nav.tab_reschedule"),   icon: "🔄" },
    { href: "/dashboard/financeiro",        label: t("nav.tab_financial"),    icon: "💰" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    const nome = localStorage.getItem("clinica_nome");
    if (nome) setClinicaNome(nome);
  }, [router]);

  // Mede a altura da barra superior fixa (header + abas) e expõe como
  // CSS var, para que páginas com barras próprias possam alinhar seu
  // position:sticky logo abaixo das abas (ex.: aba Calendário).
  const topbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty("--dash-topbar-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  function logout() { localStorage.clear(); router.replace("/login"); }

  if (loading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <IrisLoader label={t("nav.loading_settings")} />
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen" style={{background:"#f8fafc"}}>

      {/* ── Barra superior fixa: header + abas (sempre presente) ── */}
      <div ref={topbarRef} style={{position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>

      {/* ── Header + abas (linha única) ── */}
      <header style={{
        background:"#fff",borderBottom:"1px solid #e2e8f0",
        padding:"8px 16px",display:"flex",alignItems:"stretch",gap:"12px"
      }}>
        {/* Logo */}
        <div style={{
          width:36,height:36,borderRadius:10,flexShrink:0,alignSelf:"center",
          background:"linear-gradient(135deg,#2B7A78,#3AAFA9)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 12px rgba(43,122,120,0.25)"
        }}>
          <svg viewBox="0 0 24 24" style={{width:18,height:18}} fill="white">
            <circle cx="12" cy="12" r="10" fillOpacity="0.2"/>
            <circle cx="12" cy="12" r="6" fillOpacity="0.35"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>

        {/* Título */}
        <div style={{flexShrink:0,minWidth:0,alignSelf:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1e293b",lineHeight:1.2}}>{t("nav.app_name")}</div>
          <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>
            {clinicaNome}
          </div>
        </div>

        {/* ── Abas (à direita; roláveis se faltar espaço) ── */}
        <nav style={{
          marginLeft:"auto",display:"flex",alignItems:"stretch",
          overflowX:"auto",minWidth:0,flexShrink:1,
          scrollbarWidth:"none",WebkitOverflowScrolling:"touch" as React.CSSProperties["WebkitOverflowScrolling"],
        }}>
          {TABS.map(tab => {
            const isActive = pathname === tab.href ||
              (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href} style={{textDecoration:"none",flexShrink:0,position:"relative",display:"flex",alignItems:"stretch"}}>
                <button style={{
                  padding:"10px 12px",border:"none",background:"transparent",
                  fontSize:13,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",
                  color: isActive ? "#2B7A78" : "#94a3b8",
                  display:"flex",alignItems:"center",gap:6,
                  fontFamily:"'Sora',sans-serif",
                }}>
                  <span style={{fontSize:15}}>{tab.icon}</span>
                  <span style={{fontSize:12}}>{tab.label}</span>
                </button>
                {isActive && (
                  <motion.div layoutId="tab-indicator"
                    style={{position:"absolute",bottom:-8,left:0,right:0,height:2,background:"#2B7A78",borderRadius:2}}
                    transition={{type:"spring",stiffness:500,damping:30}}/>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sair — discreto */}
        <button onClick={logout} title={t("nav.logout")} style={{
          flexShrink:0,alignSelf:"center",
          background:"transparent",border:"none",cursor:"pointer",
          color:"#cbd5e1",padding:"6px",borderRadius:8,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"color 0.15s"
        }}
          onMouseEnter={e=>(e.currentTarget.style.color="#94a3b8")}
          onMouseLeave={e=>(e.currentTarget.style.color="#cbd5e1")}>
          <LogOut size={16}/>
        </button>
      </header>

      </div>{/* ── fim barra superior fixa ── */}

      {/* ── Content ── */}
      <main style={{maxWidth:960,margin:"0 auto",padding:"16px 12px"}}>
        <motion.div
          key={pathname}
          initial={{opacity:0,y:5}}
          animate={{opacity:1,y:0}}
          transition={{duration:0.2,ease:"easeOut"}}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <DashboardInner>{children}</DashboardInner>
    </LangProvider>
  );
}
