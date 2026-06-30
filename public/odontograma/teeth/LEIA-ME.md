# Arte dos dentes (pack vetorial licenciado)

O odontograma é "guiado por assets": cada dente é uma imagem, e os overlays
clínicos (cárie, restauração, implante, ausente, sondagem) são desenhados por
cima no chart. Esta pasta guarda a arte realista do pack comprado.

## Estrutura esperada

```
public/odontograma/teeth/
  vestibular/   ← vista frontal (coroa + raiz). Fileiras de cima e de baixo do Derec.
    11.svg 12.svg 13.svg ... 18.svg
    21.svg ... 28.svg
    31.svg ... 38.svg
    41.svg ... 48.svg          (32 arquivos)
  oclusal/      ← vista de cima (superfície de mordida). Fileiras do meio do Derec.
    11.svg ... 48.svg          (32 arquivos)
```

Nome do arquivo = número FDI/ISO do dente (11–18, 21–28, 31–38, 41–48).
Extensão: `.svg` (preferido) ou `.png` (ajustar `TOOTH_ASSET_EXT` em
`src/lib/odontograma-assets.ts`).

## Requisitos da arte (para os overlays funcionarem)

- Dentes em **branco/marfim neutro**, fundo **transparente** — NÃO pré-coloridos
  com condições (a cor de cárie/restauração é aplicada pelo chart).
- Cada dente **separável** (um objeto/path por dente), não uma imagem achatada.
- Idealmente **duas vistas** por dente (vestibular + oclusal). Se vier só uma,
  priorizar a vestibular com raiz.
- Estilo consistente em toda a dentição (mesmo pack/artista), arcadas sup. e inf.

## Licença

Uso comercial em UI de software permitido (ex.: Adobe Stock Standard License).
Guardar o comprovante/licença do pack junto ao projeto.
