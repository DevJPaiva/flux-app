# Flux Design System — Design Tokens

Documentação oficial dos Design Tokens da aplicação **Flux**, sincronizada com o arquivo Figma ([Flux no Figma](https://www.figma.com/design/ScAJh7BuTPJNXzYojLnfXW/flux?node-id=0-1)) e baseada em `src/index.css`.

## Arquitetura de Coleções

Os tokens são organizados em **duas coleções principais** usando **kebab-case** como convenção de nomenclatura:

1. **`Primitives`** *(1 modo: `Value` · 190 variáveis)* — Valores brutos e imutáveis (paletas de cor, tipografia, espaçamentos positivos e negativos, espessuras de borda/stroke, raios, dimensões e opacidades). Escopo oculto (`[]`) nos pickers do Figma para incentivar o uso exclusivo de tokens semânticos nos componentes.
2. **`Semantics`** *(2 modos: `Dark`, `Light` · 112 variáveis · 224 aliases)* — Tokens orientados à intenção de uso, **100% referenciados por alias (`VARIABLE_ALIAS`)** para `Primitives`, com escopos específicos por propriedade e sintaxe de código `WEB` (`var(--...)`).

---

## 1. Coleção `Primitives` (Modo: `Value`)

### 1.1 Cores Primitivas

#### Primary (Lilac)
| Token (Figma) | Valor Hex | CSS Variable (`WEB`) |
|---|---|---|
| `color/primary-50` | `#faf7fd` | `var(--eg-primary-50)` |
| `color/primary-100` | `#f1e8fb` | `var(--eg-primary-100)` |
| `color/primary-200` | `#e3cff6` | `var(--eg-primary-200)` |
| `color/primary-300` | `#d3b2f0` | `var(--eg-primary-300)` |
| `color/primary-400` | `#c392ec` | `var(--eg-primary-400)` |
| `color/primary-500` | `#c392ec` | `var(--eg-primary-500)` |
| `color/primary-600` | `#a875cb` | `var(--eg-primary-600)` |
| `color/primary-700` | `#865aa5` | `var(--eg-primary-700)` |
| `color/primary-800` | `#624277` | `var(--eg-primary-800)` |
| `color/primary-900` | `#3f2a4d` | `var(--eg-primary-900)` |

#### Neutral (Escala de Cinzas e Superfícies)
| Token (Figma) | Valor Hex | CSS Variable (`WEB`) |
|---|---|---|
| `color/neutral-0` | `#ffffff` | `var(--eg-secondary-50)` |
| `color/neutral-50` | `#fafafa` | `var(--eg-secondary-100)` |
| `color/neutral-75` | `#f8f7f8` | `var(--flux-neutral-75)` |
| `color/neutral-100` | `#f6f5f6` | `var(--eg-secondary-500)` |
| `color/neutral-150` | `#f3f3f3` | `var(--eg-secondary-200)` |
| `color/neutral-200` | `#e8e8e8` | `var(--eg-secondary-300)` |
| `color/neutral-250` | `#dadada` | `var(--eg-secondary-400)` |
| `color/neutral-300` | `#cccccc` | `var(--eg-secondary-600)` |
| `color/neutral-350` | `#c7c7c7` | `var(--flux-neutral-350)` |
| `color/neutral-400` | `#a3a3a3` | `var(--eg-secondary-700)` |
| `color/neutral-500` | `#999999` | `var(--flux-neutral-500)` |
| `color/neutral-600` | `#6b6b6b` | `var(--eg-secondary-800)` |
| `color/neutral-700` | `#404040` | `var(--flux-neutral-700)` |
| `color/neutral-750` | `#383838` | `var(--eg-secondary-900)` |
| `color/neutral-800` | `#2c2c2c` | `var(--flux-neutral-800)` |
| `color/neutral-850` | `#222222` | `var(--flux-neutral-850)` |
| `color/neutral-900` | `#1a1a1a` | `var(--flux-neutral-900)` |
| `color/neutral-950` | `#0a0a0a` | `var(--flux-neutral-950)` |
| `color/neutral-1000` | `#000000` | `var(--flux-neutral-1000)` |

#### Mint (Ação / Destaque)
| Token (Figma) | Valor Hex | CSS Variable (`WEB`) |
|---|---|---|
| `color/mint-100` | `#e8f7f4` | `var(--flux-mint-100)` |
| `color/mint-200` | `#a8e3d8` | `var(--flux-mint-200)` |
| `color/mint-300` | `#85d5c8` | `var(--eg-mint)` |
| `color/mint-400` | `#67bcae` | `var(--flux-mint-400)` |
| `color/mint-500` | `#59b6a8` | `var(--eg-mint-deep)` |
| `color/mint-600` | `#449d90` | `var(--flux-mint-600)` |
| `color/mint-700` | `#3e8f83` | `var(--flux-mint-700)` |

#### Plum, Teal & Gold (Superfícies Tingidas e Chip de Cartão)
| Token (Figma) | Valor Hex | CSS Variable (`WEB`) |
|---|---|---|
| `color/plum-700` | `#5c4b6b` | `var(--flux-plum-700)` |
| `color/plum-800` | `#40354b` | `var(--flux-plum-800)` |
| `color/plum-850` | `#3a3044` | `var(--flux-plum-850)` |
| `color/plum-900` | `#312b38` | `var(--flux-plum-900)` |
| `color/teal-900` | `#24332f` | `var(--flux-teal-900)` |
| `color/gold-200` | `#dbd2b2` | `var(--flux-gold-200)` |
| `color/gold-600` | `#94886c` | `var(--flux-gold-600)` |

#### Danger (Erro / Ação Destrutiva)
| Token (Figma) | Valor Hex | CSS Variable (`WEB`) |
|---|---|---|
| `color/danger-50` | `#fcf0f1` | `var(--flux-danger-50)` |
| `color/danger-200` | `#eac4c9` | `var(--flux-danger-200)` |
| `color/danger-300` | `#ffb3bb` | `var(--flux-danger-300)` |
| `color/danger-600` | `#a53540` | `var(--flux-danger-600)` |
| `color/danger-800` | `#5e343d` | `var(--flux-danger-800)` |
| `color/danger-900` | `#2a191d` | `var(--flux-danger-900)` |

#### Alpha / Overlays
| Token (Figma) | Valor RGBA | CSS Variable (`WEB`) |
|---|---|---|
| `color/alpha-black-08` | `rgba(0, 0, 0, 0.08)` | `var(--flux-alpha-black-08)` |
| `color/alpha-black-12` | `rgba(26, 26, 26, 0.12)` | `var(--flux-alpha-black-12)` |
| `color/alpha-black-38` | `rgba(26, 26, 26, 0.38)` | `var(--flux-alpha-black-38)` |
| `color/alpha-black-40` | `rgba(0, 0, 0, 0.40)` | `var(--flux-alpha-black-40)` |
| `color/alpha-black-68` | `rgba(0, 0, 0, 0.68)` | `var(--flux-alpha-black-68)` |
| `color/alpha-white-03` | `rgba(255, 255, 255, 0.03)` | `var(--flux-alpha-white-03)` |
| `color/alpha-white-15` | `rgba(255, 255, 255, 0.15)` | `var(--flux-alpha-white-15)` |
| `color/alpha-mint-14` | `rgba(133, 213, 200, 0.14)` | `var(--flux-alpha-mint-14)` |
| `color/alpha-mint-17` | `rgba(133, 213, 200, 0.17)` | `var(--flux-alpha-mint-17)` |
| `color/alpha-mint-18` | `rgba(103, 188, 174, 0.18)` | `var(--flux-alpha-mint-18)` |
| `color/alpha-mint-23` | `rgba(103, 188, 174, 0.23)` | `var(--flux-alpha-mint-23)` |

---

### 1.2 Tipografia Primitiva

#### Famílias e Pesos
| Token (Figma) | Tipo | Valor | CSS Variable (`WEB`) |
|---|---|---|---|
| `font/family-heading` | `STRING` | `Bricolage Grotesque` | `var(--eg-font-heading)` |
| `font/family-body` | `STRING` | `Geist` | `var(--eg-font-body)` |
| `font/family-mono` | `STRING` | `Geist Mono` | `var(--flux-font-mono)` |
| `font/weight-regular` | `STRING` | `Regular` | `var(--flux-font-weight-regular)` |
| `font/weight-medium` | `STRING` | `Medium` | `var(--flux-font-weight-medium)` |
| `font/weight-semibold` | `STRING` | `SemiBold` | `var(--flux-font-weight-semibold)` |
| `font/weight-bold` | `STRING` | `Bold` | `var(--flux-font-weight-bold)` |
| `font/weight-400` | `FLOAT` | `400` | `var(--flux-weight-400)` |
| `font/weight-500` | `FLOAT` | `500` | `var(--flux-weight-500)` |
| `font/weight-600` | `FLOAT` | `600` | `var(--flux-weight-600)` |
| `font/weight-700` | `FLOAT` | `700` | `var(--flux-weight-700)` |

#### Tamanhos de Fonte (`font/size-*`)
`9`, `10`, `11`, `12`, `13`, `14`, `15`, `16`, `18`, `20`, `22`, `24`, `26`, `28`, `32`, `36`, `40`, `48`, `54`, `64`, `76`, `88` (em `px`, ex: `font/size-14` → `14` → `var(--flux-font-size-14)`).

#### Alturas de Linha (`font/line-height-*`)
`12`, `14`, `16`, `18`, `20`, `22`, `24`, `28`, `32`, `36`, `42`, `52`, `60`, `76`, `88` (em `px`, ex: `font/line-height-20` → `20` → `var(--flux-lh-20)`).

#### Espaçamento entre Letras (`font/letter-spacing-*`)
| Token (Figma) | Valor (`px`) | CSS Variable (`WEB`) |
|---|---|---|
| `font/letter-spacing-neg-3` | `-3` | `var(--flux-ls-neg-3)` |
| `font/letter-spacing-neg-2` | `-2` | `var(--flux-ls-neg-2)` |
| `font/letter-spacing-neg-1` | `-1` | `var(--flux-ls-neg-1)` |
| `font/letter-spacing-neg-0-5` | `-0.5` | `var(--flux-ls-neg-0-5)` |
| `font/letter-spacing-0` | `0` | `var(--flux-ls-0)` |
| `font/letter-spacing-0-8` | `0.8` | `var(--flux-ls-0-8)` |
| `font/letter-spacing-1-2` | `1.2` | `var(--flux-ls-1-2)` |

---

### 1.3 Gaps / Espaçamentos Positivos (`gap/space-*`)
Escala completa em `px`:
`0`, `2`, `4`, `6`, `8`, `10`, `12`, `14`, `16`, `18`, `20`, `22`, `24`, `28`, `32`, `36`, `40`, `48`, `56`, `64`, `72`, `80`
*(ex: `gap/space-16` = `16` → `var(--flux-space-16)`)*.

### 1.4 Gaps Negativos (`gap-negative/space-neg-*`)
Escala para sobreposições (bandeira de cartão, empilhamento, badges):
`-2`, `-4`, `-6`, `-8`, `-10`, `-12`, `-16`, `-20`, `-24`, `-32`
*(ex: `gap-negative/space-neg-10` = `-10` → `var(--flux-space-neg-10)`)*.

### 1.5 Strokes / Espessuras de Borda (`stroke/stroke-*`)
| Token (Figma) | Valor (`px`) | CSS Variable (`WEB`) |
|---|---|---|
| `stroke/stroke-0` | `0` | `var(--flux-stroke-0)` |
| `stroke/stroke-1` | `1` | `var(--flux-stroke-1)` |
| `stroke/stroke-1-5` | `1.5` | `var(--flux-stroke-1-5)` |
| `stroke/stroke-1-8` | `1.8` | `var(--flux-stroke-1-8)` |
| `stroke/stroke-2` | `2` | `var(--flux-stroke-2)` |
| `stroke/stroke-3` | `3` | `var(--flux-stroke-3)` |
| `stroke/stroke-4` | `4` | `var(--flux-stroke-4)` |

### 1.6 Border Radius (`radius/radius-*`)
`0`, `4`, `6`, `8`, `10`, `12`, `14`, `16`, `18`, `20`, `22`, `24`, `28`, `32`, `36`, `full` (`9999`)
*(ex: `radius/radius-16` = `16` → `var(--flux-radius-16)`)*.

### 1.7 Dimensões / Sizing (`size/size-*`)
`16`, `20`, `24`, `32`, `40`, `44`, `48`, `52`, `56`, `64`, `72`
*(ex: `size/size-44` = `44` → `var(--flux-size-44)`)*.

### 1.8 Opacidades (`opacity/opacity-*`)
`0`, `15`, `40`, `50`, `60`, `65`, `80`, `85`, `100`
*(ex: `opacity/opacity-50` = `50` → `var(--flux-opacity-50)`)*.

---

## 2. Coleção `Semantics` (Modos: `Dark` | `Light`)

Todos os tokens semânticos utilizam **kebab-case** e apontam via **alias (`VARIABLE_ALIAS`)** para `Primitives`.

### 2.1 Cores Semânticas — Fundos e Superfícies (`FRAME_FILL`, `SHAPE_FILL`)
| Token Semântico | Alias (`Dark`) | Alias (`Light`) | CSS Variable (`WEB`) |
|---|---|---|---|
| `color/bg-canvas` | `color/neutral-900` (`#1a1a1a`) | `color/neutral-75` (`#f8f7f8`) | `var(--eg-bg)` |
| `color/bg-surface` | `color/neutral-850` (`#222222`) | `color/neutral-0` (`#ffffff`) | `var(--eg-surface)` |
| `color/bg-elevated` | `color/neutral-800` (`#2c2c2c`) | `color/neutral-150` (`#f3f3f3`) | `var(--eg-elevated)` |
| `color/bg-tint` | `color/plum-900` (`#312b38`) | `color/primary-50` (`#faf7fd`) | `var(--eg-tint)` |
| `color/bg-tint-strong` | `color/plum-800` (`#40354b`) | `color/primary-100` (`#f1e8fb`) | `var(--eg-tint-strong)` |
| `color/bg-card-offwhite` | `color/neutral-100` (`#f6f5f6`) | `color/neutral-100` (`#f6f5f6`) | `var(--eg-card)` |
| `color/bg-danger` | `color/danger-900` (`#2a191d`) | `color/danger-50` (`#fcf0f1`) | `var(--eg-danger-bg)` |
| `color/bg-backdrop` | `color/alpha-black-68` | `color/alpha-black-38` | `var(--eg-backdrop)` |
| `color/bg-action` | `color/mint-300` (`#85d5c8`) | `color/mint-400` (`#67bcae`) | `var(--eg-action)` |
| `color/bg-action-hover` | `color/mint-500` (`#59b6a8`) | `color/mint-600` (`#449d90`) | `var(--eg-action-hover)` |
| `color/bg-action-wash` | `color/alpha-mint-14` | `color/alpha-mint-18` | `var(--eg-action-wash)` |
| `color/bg-brand-primary` | `color/primary-500` (`#c392ec`) | `color/primary-500` (`#c392ec`) | `var(--eg-primary)` |
| `color/bg-brand-deep` | `color/primary-700` (`#865aa5`) | `color/primary-700` (`#865aa5`) | `var(--eg-primary-700)` |

### 2.2 Cores Semânticas — Texto (`TEXT_FILL`)
| Token Semântico | Alias (`Dark`) | Alias (`Light`) | CSS Variable (`WEB`) |
|---|---|---|---|
| `color/text-primary` | `color/neutral-100` (`#f6f5f6`) | `color/neutral-900` (`#1a1a1a`) | `var(--eg-text)` |
| `color/text-secondary` | `color/neutral-350` (`#c7c7c7`) | `color/neutral-750` (`#383838`) | `var(--eg-secondary)` |
| `color/text-muted` | `color/neutral-500` (`#999999`) | `color/neutral-750` (`#383838`) | `var(--eg-muted)` |
| `color/text-soft` | `color/primary-100` (`#f1e8fb`) | `color/primary-800` (`#624277`) | `var(--eg-soft-text)` |
| `color/text-accent` | `color/mint-300` (`#85d5c8`) | `color/mint-700` (`#3e8f83`) | `var(--eg-accent)` |
| `color/text-on-brand` | `color/neutral-900` (`#1a1a1a`) | `color/neutral-900` (`#1a1a1a`) | `var(--eg-on-brand)` |
| `color/text-danger` | `color/danger-300` (`#ffb3bb`) | `color/danger-600` (`#a53540`) | `var(--eg-danger)` |

### 2.3 Cores Semânticas — Bordas (`STROKE_COLOR`)
| Token Semântico | Alias (`Dark`) | Alias (`Light`) | CSS Variable (`WEB`) |
|---|---|---|---|
| `color/border-default` | `color/neutral-700` (`#404040`) | `color/neutral-300` (`#cccccc`) | `var(--eg-border)` |
| `color/border-tint` | `color/plum-700` (`#5c4b6b`) | `color/primary-100` (`#f1e8fb`) | `var(--eg-tint-border)` |
| `color/border-accent` | `color/mint-300` (`#85d5c8`) | `color/mint-700` (`#3e8f83`) | `var(--eg-accent)` |
| `color/border-focus` | `color/mint-300` (`#85d5c8`) | `color/mint-400` (`#67bcae`) | `var(--eg-action)` |
| `color/border-danger` | `color/danger-800` (`#5e343d`) | `color/danger-200` (`#eac4c9`) | `var(--eg-danger-border)` |

### 2.4 Cores Semânticas — Ícones, Gráficos e Efeitos
| Token Semântico | Alias (`Dark`) | Alias (`Light`) | Escopo | CSS Variable (`WEB`) |
|---|---|---|---|---|
| `color/icon-primary` | `color/neutral-100` | `color/neutral-900` | `SHAPE_FILL`, `STROKE_COLOR` | `var(--eg-text)` |
| `color/icon-secondary` | `color/neutral-350` | `color/neutral-750` | `SHAPE_FILL`, `STROKE_COLOR` | `var(--eg-secondary)` |
| `color/icon-accent` | `color/mint-300` | `color/mint-700` | `SHAPE_FILL`, `STROKE_COLOR` | `var(--eg-accent)` |
| `color/icon-on-brand` | `color/neutral-900` | `color/neutral-900` | `SHAPE_FILL`, `STROKE_COLOR` | `var(--eg-on-brand)` |
| `color/icon-danger` | `color/danger-300` | `color/danger-600` | `SHAPE_FILL`, `STROKE_COLOR` | `var(--eg-danger)` |
| `color/chart-action` | `color/mint-300` | `color/mint-400` | `FRAME_FILL`, `SHAPE_FILL` | `var(--eg-action)` |
| `color/chart-lilac` | `color/primary-300` | `color/primary-300` | `FRAME_FILL`, `SHAPE_FILL` | `var(--eg-primary-300)` |
| `color/chart-soft` | `color/primary-100` | `color/primary-100` | `FRAME_FILL`, `SHAPE_FILL` | `var(--eg-primary-100)` |
| `color/chart-muted` | `color/neutral-400` | `color/neutral-400` | `FRAME_FILL`, `SHAPE_FILL` | `var(--eg-secondary-700)` |
| `color/effect-shadow` | `color/alpha-black-40` | `color/alpha-black-12` | `EFFECT_COLOR` | `var(--eg-shadow-color)` |
| `color/effect-glow` | `color/alpha-mint-17` | `color/alpha-mint-23` | `EFFECT_COLOR` | `var(--eg-glow)` |

### 2.5 Tipografia Semântica
| Token Semântico | Alias (`Primitives`) | Escopo | CSS Variable (`WEB`) |
|---|---|---|---|
| `typography/font-heading` | `font/family-heading` | `FONT_FAMILY` | `var(--eg-font-heading)` |
| `typography/font-body` | `font/family-body` | `FONT_FAMILY` | `var(--eg-font-body)` |
| `typography/font-mono` | `font/family-mono` | `FONT_FAMILY` | `var(--flux-font-mono)` |
| `typography/weight-regular` | `font/weight-regular` | `FONT_STYLE` | `var(--flux-weight-regular)` |
| `typography/weight-medium` | `font/weight-medium` | `FONT_STYLE` | `var(--flux-weight-medium)` |
| `typography/weight-semibold` | `font/weight-semibold` | `FONT_STYLE` | `var(--flux-weight-semibold)` |
| `typography/weight-bold` | `font/weight-bold` | `FONT_STYLE` | `var(--flux-weight-bold)` |
| `typography/size-display-hero` | `font/size-76` (`76px`) | `FONT_SIZE` | `var(--flux-text-display-hero)` |
| `typography/size-display-balance` | `font/size-54` (`54px`) | `FONT_SIZE` | `var(--flux-text-display-balance)` |
| `typography/size-heading-xl` | `font/size-40` (`40px`) | `FONT_SIZE` | `var(--flux-text-heading-xl)` |
| `typography/size-heading-lg` | `font/size-28` (`28px`) | `FONT_SIZE` | `var(--flux-text-heading-lg)` |
| `typography/size-heading-md` | `font/size-24` (`24px`) | `FONT_SIZE` | `var(--flux-text-heading-md)` |
| `typography/size-heading-sm` | `font/size-20` (`20px`) | `FONT_SIZE` | `var(--flux-text-heading-sm)` |
| `typography/size-title` | `font/size-16` (`16px`) | `FONT_SIZE` | `var(--flux-text-title)` |
| `typography/size-body-md` | `font/size-14` (`14px`) | `FONT_SIZE` | `var(--flux-text-body-md)` |
| `typography/size-body-sm` | `font/size-13` (`13px`) | `FONT_SIZE` | `var(--flux-text-body-sm)` |
| `typography/size-caption` | `font/size-12` (`12px`) | `FONT_SIZE` | `var(--flux-text-caption)` |
| `typography/size-label` | `font/size-11` (`11px`) | `FONT_SIZE` | `var(--flux-text-label)` |
| `typography/size-eyebrow` | `font/size-10` (`10px`) | `FONT_SIZE` | `var(--flux-text-eyebrow)` |
| `typography/size-micro` | `font/size-9` (`9px`) | `FONT_SIZE` | `var(--flux-text-micro)` |
| `typography/line-height-display` | `font/line-height-76` | `LINE_HEIGHT` | `var(--flux-leading-display)` |
| `typography/line-height-heading` | `font/line-height-32` | `LINE_HEIGHT` | `var(--flux-leading-heading)` |
| `typography/line-height-body` | `font/line-height-20` | `LINE_HEIGHT` | `var(--flux-leading-body)` |
| `typography/line-height-compact` | `font/line-height-16` | `LINE_HEIGHT` | `var(--flux-leading-compact)` |
| `typography/letter-spacing-display` | `font/letter-spacing-neg-3` | `LETTER_SPACING` | `var(--flux-tracking-display)` |
| `typography/letter-spacing-heading` | `font/letter-spacing-neg-1` | `LETTER_SPACING` | `var(--flux-tracking-heading)` |
| `typography/letter-spacing-body` | `font/letter-spacing-0` | `LETTER_SPACING` | `var(--flux-tracking-body)` |
| `typography/letter-spacing-eyebrow` | `font/letter-spacing-1-2` | `LETTER_SPACING` | `var(--flux-tracking-eyebrow)` |

### 2.6 Gaps Positivos e Negativos Semânticos (`GAP`)
| Token Semântico | Alias (`Primitives`) | Valor | CSS Variable (`WEB`) |
|---|---|---|---|
| `gap/none` | `gap/space-0` | `0px` | `var(--flux-gap-none)` |
| `gap/2xs` | `gap/space-4` | `4px` | `var(--flux-gap-2xs)` |
| `gap/xs` | `gap/space-8` | `8px` | `var(--flux-gap-xs)` |
| `gap/sm` | `gap/space-12` | `12px` | `var(--flux-gap-sm)` |
| `gap/md` | `gap/space-16` | `16px` | `var(--flux-gap-md)` |
| `gap/lg` | `gap/space-20` | `20px` | `var(--flux-gap-lg)` |
| `gap/xl` | `gap/space-24` | `24px` | `var(--flux-gap-xl)` |
| `gap/2xl` | `gap/space-32` | `32px` | `var(--flux-gap-2xl)` |
| `gap/3xl` | `gap/space-48` | `48px` | `var(--flux-gap-3xl)` |
| `gap/layout-section` | `gap/space-24` | `24px` | `var(--flux-gap-layout-section)` |
| `gap/layout-grid` | `gap/space-16` | `16px` | `var(--flux-gap-layout-grid)` |
| `gap/panel-padding` | `gap/space-22` | `22px` | `var(--flux-gap-panel-padding)` |
| `gap/card-padding` | `gap/space-24` | `24px` | `var(--flux-gap-card-padding)` |
| `gap/nav-dock` | `gap/space-12` | `12px` | `var(--eg-nav-gap)` |
| `gap/nav-padding` | `gap/space-6` | `6px` | `var(--eg-nav-padding)` |
| `gap-negative/overlap-xs` | `gap-negative/space-neg-4` | `-4px` | `var(--flux-gap-overlap-xs)` |
| `gap-negative/overlap-sm` | `gap-negative/space-neg-8` | `-8px` | `var(--flux-gap-overlap-sm)` |
| `gap-negative/overlap-network-badge` | `gap-negative/space-neg-10` | `-10px` | `var(--flux-gap-overlap-network-badge)` |
| `gap-negative/overlap-card-stack` | `gap-negative/space-neg-12` | `-12px` | `var(--flux-gap-overlap-card-stack)` |
| `gap-negative/overlap-lg` | `gap-negative/space-neg-24` | `-24px` | `var(--flux-gap-overlap-lg)` |

### 2.7 Strokes, Raios, Dimensões e Opacidade Semânticos
| Categoria | Token Semântico | Alias (`Primitives`) | Valor | Escopo | CSS Variable (`WEB`) |
|---|---|---|---|---|---|
| Stroke | `stroke/none` | `stroke/stroke-0` | `0px` | `STROKE_FLOAT` | `var(--flux-stroke-none)` |
| Stroke | `stroke/border-default` | `stroke/stroke-1` | `1px` | `STROKE_FLOAT` | `var(--flux-stroke-border-default)` |
| Stroke | `stroke/icon-default` | `stroke/stroke-1-8` | `1.8px` | `STROKE_FLOAT` | `var(--flux-stroke-icon-default)` |
| Stroke | `stroke/focus-ring` | `stroke/stroke-2` | `2px` | `STROKE_FLOAT` | `var(--flux-stroke-focus-ring)` |
| Stroke | `stroke/emphasis` | `stroke/stroke-3` | `3px` | `STROKE_FLOAT` | `var(--flux-stroke-emphasis)` |
| Radius | `radius/none` | `radius/radius-0` | `0px` | `CORNER_RADIUS` | `var(--flux-radius-none)` |
| Radius | `radius/xs` | `radius/radius-6` | `6px` | `CORNER_RADIUS` | `var(--flux-radius-xs)` |
| Radius | `radius/sm` | `radius/radius-10` | `10px` | `CORNER_RADIUS` | `var(--flux-radius-sm)` |
| Radius | `radius/input` | `radius/radius-14` | `14px` | `CORNER_RADIUS` | `var(--flux-radius-input)` |
| Radius | `radius/button` | `radius/radius-16` | `16px` | `CORNER_RADIUS` | `var(--flux-radius-button)` |
| Radius | `radius/card-sm` | `radius/radius-20` | `20px` | `CORNER_RADIUS` | `var(--flux-radius-card-sm)` |
| Radius | `radius/card-md` | `radius/radius-24` | `24px` | `CORNER_RADIUS` | `var(--flux-radius-card-md)` |
| Radius | `radius/panel` | `radius/radius-28` | `28px` | `CORNER_RADIUS` | `var(--flux-radius-panel)` |
| Radius | `radius/hero` | `radius/radius-32` | `32px` | `CORNER_RADIUS` | `var(--flux-radius-hero)` |
| Radius | `radius/sheet` | `radius/radius-32` | `32px` | `CORNER_RADIUS` | `var(--flux-radius-sheet)` |
| Radius | `radius/pill` | `radius/radius-full` | `9999px` | `CORNER_RADIUS` | `var(--eg-nav-radius)` |
| Size | `size/icon-sm` | `size/size-16` | `16px` | `WIDTH_HEIGHT` | `var(--flux-size-icon-sm)` |
| Size | `size/icon-md` | `size/size-20` | `20px` | `WIDTH_HEIGHT` | `var(--flux-size-icon-md)` |
| Size | `size/icon-lg` | `size/size-24` | `24px` | `WIDTH_HEIGHT` | `var(--flux-size-icon-lg)` |
| Size | `size/row-icon` | `size/size-40` | `40px` | `WIDTH_HEIGHT` | `var(--eg-nav-icon-width)` |
| Size | `size/icon-button` | `size/size-44` | `44px` | `WIDTH_HEIGHT` | `var(--flux-size-icon-button)` |
| Size | `size/input-height` | `size/size-48` | `48px` | `WIDTH_HEIGHT` | `var(--flux-size-input-height)` |
| Size | `size/button-height` | `size/size-52` | `52px` | `WIDTH_HEIGHT` | `var(--flux-size-button-height)` |
| Size | `size/nav-height` | `size/size-72` | `72px` | `WIDTH_HEIGHT` | `var(--eg-nav-height)` |
| Opacity | `opacity/disabled` | `opacity/opacity-50` | `50%` | `OPACITY` | `var(--flux-opacity-disabled)` |
| Opacity | `opacity/subtle` | `opacity/opacity-65` | `65%` | `OPACITY` | `var(--flux-opacity-subtle)` |
| Opacity | `opacity/muted` | `opacity/opacity-80` | `80%` | `OPACITY` | `var(--flux-opacity-muted)` |
| Opacity | `opacity/full` | `opacity/opacity-100` | `100%` | `OPACITY` | `var(--flux-opacity-full)` |

---

## 3. Estilos no Figma (Text Styles & Effect Styles)

### Text Styles (12)
- `display/hero` — Bricolage Grotesque Medium · 76px / 78px · `-3px`
- `display/balance` — Bricolage Grotesque Medium · 54px / 54px · `-3px`
- `heading/xl` — Bricolage Grotesque Medium · 40px / 42px · `-2px`
- `heading/lg` — Bricolage Grotesque Medium · 28px / 32px · `-1px`
- `heading/md` — Bricolage Grotesque Medium · 24px / 28px · `-1px`
- `heading/sm` — Bricolage Grotesque Bold · 20px / 24px · `-0.5px`
- `body/md` — Geist Regular · 14px / 22px · `0px`
- `body/md-medium` — Geist Medium · 14px / 20px · `0px`
- `body/sm` — Geist Regular · 13px / 20px · `0px`
- `caption/default` — Geist Regular · 12px / 18px · `0px`
- `label/default` — Geist Medium · 11px / 16px · `0px`
- `eyebrow/default` — Geist SemiBold · 10px / 14px · `1.2px`

### Effect Styles (4)
- `shadow/nav-dock` — `0px 8px 32px rgba(0, 0, 0, 0.40)`
- `shadow/wallet-card` — `0px 15px 35px rgba(0, 0, 0, 0.40)`
- `shadow/toast` — `0px 12px 40px rgba(0, 0, 0, 0.40)`
- `shadow/balance-hero` — `0px 24px 80px rgba(0, 0, 0, 0.40)`
