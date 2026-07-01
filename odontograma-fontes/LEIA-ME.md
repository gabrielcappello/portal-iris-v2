# Imagens-fonte do odontograma (NÃO servidas publicamente)

Aqui ficam as imagens **originais** geradas por IA (a partir de descrição
anatômica) que dão origem aos dentes do odontograma. Ficam **fora de `public/`**
de propósito, para não serem acessíveis por URL. São só a fonte de verdade —
o app não lê daqui.

- `frontal.png` — vista vestibular (coroa + raiz), 2 arcadas. Já foi fatiada em
  32 PNGs → `public/odontograma/teeth/vestibular/`.
- `oclusal.png` — vista oclusal (de cima). A versão atual tem os dentes
  **encostados** (o recorte automático por blob não separa).

## Para completar a vista oclusal (4 fileiras estilo Derec)

1. Gerar a oclusal **com os dentes espaçados** (Firefly/etc.):
   > "…the complete upper permanent dental arch viewed from directly above,
   > occlusal chewing surface of each tooth, **16 teeth in one row clearly
   > separated with visible gaps between them, not touching**, ivory-white,
   > plain white background…" (e a versão lower)
2. Salvar por cima de `odontograma-fontes/oclusal.png`.
3. O recorte gera `public/odontograma/teeth/oclusal/{FDI}.png` e o chart passa
   a mostrar as 4 fileiras (ajustar `VIEWS_DISPONIVEIS` em
   `src/lib/odontograma-assets.ts`).
