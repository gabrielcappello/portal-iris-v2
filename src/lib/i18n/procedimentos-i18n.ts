// Mapeamento de nomes em português (chaves de dados salvos, NÃO alterar)
// para chaves do dicionário de traduções (translations.ts).
// Usado apenas para EXIBIÇÃO — os valores salvos em `clinica.dentistas[i].procedimentos`
// e `clinica.precios` continuam em português, garantindo compatibilidade com dados existentes.

import { TranslationKey } from "./translations";

export const ESPECIALIDADE_KEY_MAP: Record<string, TranslationKey> = {
  '🦷 Clínico Geral': 'spec.general',
  '🔧 Endodontia': 'spec.endodontics',
  '📐 Ortodontia': 'spec.orthodontics',
  '🔩 Implantodontia': 'spec.implants',
  '🦴 Prótese': 'spec.prosthetics',
  '🩺 Periodontia': 'spec.periodontics',
  '✨ Estética': 'spec.aesthetics',
  '👶 Odontopediatria': 'spec.pediatrics',
  '🔪 Cirurgia': 'spec.surgery',
  '🩻 Radiologia': 'spec.radiology',
};

export const PROCEDIMENTO_KEY_MAP: Record<string, TranslationKey> = {
  'Consulta / Avaliação': 'proc.consultation_evaluation',
  'Limpeza dental (profilaxia)': 'proc.cleaning',
  'Restauração / Cárie (1 face)': 'proc.restoration_1',
  'Restauração / Cárie (2+ faces)': 'proc.restoration_2',
  'Extração simples': 'proc.simple_extraction',
  'Fluoretação': 'proc.fluoride',
  'Radiografia': 'proc.dental_xray',
  'Canal dente anterior (1 raiz)': 'proc.canal_anterior',
  'Canal pré-molar (2 raízes)': 'proc.canal_premolar',
  'Canal molar (3+ raízes)': 'proc.canal_molar',
  'Retratamento de canal': 'proc.canal_retreatment',
  'Consulta ortodontia': 'proc.ortho_consult',
  'Colocação de braquetes': 'proc.braces_placement',
  'Ajuste mensal braquetes': 'proc.braces_adjustment',
  'Alinhadores (entrega/ajuste)': 'proc.aligners',
  'Contenção / Retentores': 'proc.retainer',
  'Consulta / Planejamento': 'proc.implant_consult',
  'Cirurgia de implante': 'proc.implant_surgery',
  'Reabertura / 2ª fase': 'proc.implant_reopening',
  'Colocação de coroa sobre implante': 'proc.implant_crown',
  'Controle pós-operatório': 'proc.implant_postop',
  'Moldagem': 'proc.molding',
  'Prova de estrutura': 'proc.structure_test',
  'Entrega de prótese removível': 'proc.removable_denture',
  'Entrega de coroa fixa': 'proc.fixed_crown',
  'Ajuste de prótese': 'proc.prosthesis_adjust',
  'Raspagem supra-gengival': 'proc.scaling_supra',
  'Raspagem sub-gengival (por quadrante)': 'proc.scaling_sub',
  'Cirurgia periodontal': 'proc.perio_surgery',
  'Controle periodontal': 'proc.perio_control',
  'Clareamento em consultório': 'proc.whitening',
  'Facetas de porcelana (prep)': 'proc.veneer_porcelain',
  'Facetas de resina': 'proc.veneer_resin',
  'Harmonização do sorriso': 'proc.smile_design',
  'Consulta pediátrica': 'proc.pedo_consult',
  'Selantes': 'proc.sealant',
  'Extração de dente de leite': 'proc.baby_tooth_extraction',
  'Fluoretação niños': 'proc.pedo_fluoride',
  'Extração complexa / siso': 'proc.complex_extraction',
  'Frenectomia': 'proc.frenectomy',
  'Biópsia': 'proc.biopsy',
  'Cirurgia de cisto': 'proc.cyst_surgery',
  'Radiografia periapical': 'proc.xray_periapical',
  'Panorâmica': 'proc.panoramic',
  'Tomografia': 'proc.tomography',
  'Radiografia interproximal': 'proc.xray_interproximal',
};

/**
 * Traduz um nome de especialidade (com emoji) para o idioma atual, mantendo o emoji.
 * Se não encontrar mapeamento, retorna o nome original (fallback seguro).
 */
export function translateEspecialidade(
  nomeOriginal: string,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
): string {
  const key = ESPECIALIDADE_KEY_MAP[nomeOriginal];
  if (!key) return nomeOriginal;
  // Extrai o emoji (primeiro "caractere" / grupo) do nome original
  const match = nomeOriginal.match(/^(\S+)\s/);
  const emoji = match ? match[1] : '';
  const label = t(key);
  return emoji ? `${emoji} ${label}` : label;
}

/**
 * Traduz um nome de procedimento para o idioma atual.
 * Se não encontrar mapeamento, retorna o nome original (fallback seguro).
 */
export function translateProcedimento(
  nomeOriginal: string,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
): string {
  const key = PROCEDIMENTO_KEY_MAP[nomeOriginal];
  if (!key) return nomeOriginal;
  return t(key);
}
