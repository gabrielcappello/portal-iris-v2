// src/lib/odontograma-assets.ts
//
// Ponte entre o chart e o pack de arte realista dos dentes (vetorial licenciado).
// O chart é "guiado por assets": cada dente é uma imagem por vista, e os overlays
// clínicos (cárie, restauração, implante, ausente, sondagem) são desenhados POR CIMA.
//
// Como instalar o pack quando chegar:
// 1. Colocar os arquivos em  public/odontograma/teeth/{vestibular,oclusal}/{FDI}.svg
//    (32 arquivos por vista, nome = número FDI: 11..18, 21..28, 31..38, 41..48)
// 2. Ajustar TOOTH_ASSET_EXT para a extensão usada ("svg" ou "png").
// 3. Trocar TOOTH_ASSETS_INSTALADO para true.
// O componente passa a renderizar as imagens reais no lugar do placeholder.

export type ViewDente = "vestibular" | "oclusal";

// Extensão dos arquivos instalados.
export const TOOTH_ASSET_EXT = "png";

// Assets vestibulares instalados (32 dentes recortados de arte gerada original).
export const TOOTH_ASSETS_INSTALADO = true;

// Vistas disponíveis hoje. Só vestibular (frontal com raiz). Oclusal virá depois.
export const VIEWS_DISPONIVEIS: ViewDente[] = ["vestibular"];

// URL pública da imagem de um dente numa vista.
export function toothAssetUrl(fdi: string, view: ViewDente): string {
  return `/odontograma/teeth/${view}/${fdi}.${TOOTH_ASSET_EXT}`;
}
