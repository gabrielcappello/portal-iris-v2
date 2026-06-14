import { translations, Lang, TranslationKey } from './translations';

const SUPPORTED_LANGS: Lang[] = ['pt', 'es', 'en', 'fr', 'de', 'it', 'ru', 'ar'];
const DEFAULT_LANG: Lang = 'pt';

/**
 * Detecta o idioma do navegador e retorna um Lang suportado.
 * Usado antes do login, quando ainda não sabemos a clínica.
 */
export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return DEFAULT_LANG;
  const browserLang = navigator.language?.slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang as Lang)) {
    return browserLang as Lang;
  }
  return DEFAULT_LANG;
}

/**
 * Normaliza um valor de idioma vindo do Supabase (ex: "português", "pt-BR", "es")
 * para um Lang suportado pelo dicionário de traduções.
 */
export function normalizeLang(value: string | null | undefined): Lang {
  if (!value) return DEFAULT_LANG;
  const v = value.toLowerCase().trim();

  // Mapeamento de nomes completos / variantes comuns
  const map: Record<string, Lang> = {
    'pt': 'pt', 'pt-br': 'pt', 'pt-pt': 'pt', 'português': 'pt', 'portugues': 'pt',
    'es': 'es', 'es-ar': 'es', 'es-es': 'es', 'español': 'es', 'espanol': 'es', 'castellano': 'es',
    'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'english': 'en', 'inglês': 'en', 'ingles': 'en',
    'fr': 'fr', 'fr-fr': 'fr', 'français': 'fr', 'frances': 'fr', 'francês': 'fr',
    'de': 'de', 'de-de': 'de', 'deutsch': 'de', 'alemão': 'de', 'aleman': 'de',
    'it': 'it', 'it-it': 'it', 'italiano': 'it',
    'ru': 'ru', 'ru-ru': 'ru', 'русский': 'ru', 'russo': 'ru',
    'ar': 'ar', 'ar-sa': 'ar', 'العربية': 'ar', 'arabe': 'ar', 'árabe': 'ar',
  };

  if (map[v]) return map[v];

  // Tenta pegar só os 2 primeiros caracteres (ex: "es-AR" -> "es")
  const short = v.slice(0, 2);
  if (SUPPORTED_LANGS.includes(short as Lang)) return short as Lang;

  return DEFAULT_LANG;
}

/**
 * Retorna a função de tradução t() para um idioma específico.
 * Uso: const { t } = useTranslation(lang);
 *      t('login.welcome') -> "Bem-vindo" | "Welcome" | etc
 *      t('patients.count', { n: 12 }) -> substitui {n} pelo valor
 */
export function useTranslation(lang: Lang = DEFAULT_LANG) {
  const dict = translations[lang] || translations[DEFAULT_LANG];

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let text = dict[key] ?? translations[DEFAULT_LANG][key] ?? key;

    if (vars) {
      for (const [varKey, varValue] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(varValue));
      }
    }

    return text;
  }

  // Direção do texto: árabe é RTL
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  return { t, lang, dir };
}

export { SUPPORTED_LANGS, DEFAULT_LANG };
export type { Lang, TranslationKey };
