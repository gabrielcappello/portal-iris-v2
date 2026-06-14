"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations, Lang, TranslationKey } from "./translations";
import { normalizeLang, DEFAULT_LANG } from "./useTranslation";
import { sb } from "@/lib/supabase";

type LangContextType = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  loading: boolean;
  refreshLang: () => void;
};

const LangContext = createContext<LangContextType>({
  lang: DEFAULT_LANG,
  dir: "ltr",
  t: (key) => key,
  loading: true,
  refreshLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [loading, setLoading] = useState(true);

  const loadLang = useCallback(async () => {
    const clinicaId = localStorage.getItem("clinica_id");
    if (!clinicaId) { setLoading(false); return; }
    try {
      const rows = await sb.query<{ idioma?: string }>("clinicas", `?id=eq.${clinicaId}&select=idioma`);
      const idiomaVal = rows[0]?.idioma || "português-br";
      // idioma vem como "english-us", "português-br", etc -> extrai a parte do idioma
      const dash = idiomaVal.lastIndexOf("-");
      const idiomaExtenso = dash > 0 ? idiomaVal.substring(0, dash) : idiomaVal;
      setLang(normalizeLang(idiomaExtenso));
    } catch {
      setLang(DEFAULT_LANG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLang(); }, [loadLang]);

  const dict = translations[lang] || translations[DEFAULT_LANG];
  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text = dict[key] ?? translations[DEFAULT_LANG][key] ?? key;
    if (vars) {
      for (const [varKey, varValue] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(varValue));
      }
    }
    return text;
  }

  return (
    <LangContext.Provider value={{ lang, dir, t, loading, refreshLang: loadLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
