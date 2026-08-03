# Reporte de Sistema de Diseño — stepbro.site/apps/money/

> **TL;DR:** El sitio usa **Material Design 3** (tokens `md-sys-color-*` / `md-sys-typescale-*` / `md-ref-palette-*`) con dos paletas que se intercambian según `prefers-color-scheme`: una **azul** (M3 default) y una **verde** (overrides en `@media (prefers-color-scheme: ...)`). La tipografía principal es **DM Sans** (`var(--app-main-font)`), con **Inter** y **Geist Mono** como secundarias. Los componentes custom se nombran con prefijo numérico `style-1..7` (no `sb-` — el archivo está minificado, los `data-v-xxx` son scopes de Vue). Hay 28 `@keyframes` y 13 easing-curves distintivas.

---

## 1. Paleta de Colores

### 1.1 Tokens personalizados (no Material)
Definidos en `:root`:
```css
--md-source: #0066ff;                         /* brand seed */
--app-main-font: "DM Sans", sans-serif;
--app-main-font-name: "DM Sans";
--md-sys-color-neutral-background: 255,255,255;   /* light */
--md-sys-color-neutral-background: 0,0,0;         /* dark (en @media dark) */
--md-sys-color-neutral-on-background: 0,0,0;      /* light */
--md-sys-color-neutral-on-background: 255,255,255; /* dark */
--table-line-color: var(--md-sys-color-surface-container-highest);
--primary: #333;            /* fallback */
--on-primary: white;        /* fallback */
--error: #d32f2f;           /* fallback */
```

> **Cómo se usa neutral-background:** se referencia con `rgba(var(--md-sys-color-neutral-background), .5)` (con `,` como separador, NO como hex). Este es el patrón del sitio para tokens "alpha" — usar `color-mix(in srgb, X, transparent Y%)` en tu build.

### 1.2 Paleta AZUL (M3 default) — Tokens `md-sys-color-*`

| Token | Light | Dark |
|---|---|---|
| `primary` | `#0054d6` | `#b3c5ff` |
| `on-primary` | `#ffffff` | `#002b75` |
| `primary-container` | `#dae1ff` | `#003fa4` |
| `on-primary-container` | `#001849` | `#dae1ff` |
| `secondary` | `#585e71` | `#c1c6dd` |
| `secondary-container` | `#dde2f9` | `#414659` |
| `tertiary` | `#735471` | `#e1bbdc` |
| `tertiary-container` | `#ffd6f9` | `#5a3d58` |
| `error` | `#ba1a1a` | `#ffb4ab` |
| `error-container` | `#ffdad6` | `#93000a` |
| `background` | `#fefbff` | `#1b1b1f` |
| `on-background` | `#1b1b1f` | `#e4e2e6` |
| `surface` | `#fefbff` | `#1b1b1f` |
| `surface-variant` | `#e2e2ec` | `#45464f` |
| `on-surface-variant` | `#45464f` | `#c5c6d0` |
| `outline` | `#757680` | `#8f909a` |
| `outline-variant` | `#c5c6d0` | `#45464f` |
| `inverse-surface` | `#303034` | `#e4e2e6` |
| `inverse-on-surface` | `#f2f0f4` | `#1b1b1f` |
| `inverse-primary` | `#b3c5ff` | `#0054d6` |
| `surface-tint` | `#0054d6` | `#b3c5ff` |
| `shadow` / `scrim` | `#000000` | `#000000` |

### 1.3 Paleta VERDE (override en `@media`)

Esta paleta **NO está en `:root`** — se inyecta en `@media (prefers-color-scheme: light)` y `@media (prefers-color-scheme: dark)` sobre `:root,:host`, sobrescribiendo los tokens azules. Resultado: el sitio cambia de azul a verde cuando el sistema está en dark mode (o si lo activan vía toggle de clase — no hay `.dark` literal, usan `prefers-color-scheme`).

| Token | Light | Dark |
|---|---|---|
| `background` | `#f1fded` | `#0c160d` |
| `surface` | `#f1fded` | `#0c160d` |
| `surface-dim` | `#d2ddce` | `#0c160d` |
| `surface-bright` | `#f1fded` | `#313c31` |
| `surface-container-lowest` | `#ffffff` | `#071008` |
| `surface-container-low` | `#ebf7e7` | `#141e14` |
| `surface-container` | `#e6f1e1` | `#182218` |
| `surface-container-high` | `#e0ecdc` | `#222c22` |
| `surface-container-highest` | `#dae6d6` | `#2d372d` |
| `on-surface` | `#141e14` | `#dae6d6` |
| `surface-variant` | `#d5e8d2` | `#3b4b3b` |
| `outline` | `#6b7b69` | `#849582` |
| `outline-variant` | `#b9cbb7` | `#3b4b3b` |
| `surface-tint` | `#006e2c` | `#00e563` |
| `primary` | `#006e2c` | `#ffffff` |
| `on-primary` | `#ffffff` | `#003913` |
| `primary-container` | `#4dff7e` | `#00f46b` |
| `on-primary-container` | `#00521f` | `#004a1b` |
| `inverse-primary` | `#00e563` | `#006e2c` |
| `secondary` | `#006e2c` | `#7adb88` |
| `secondary-container` | `#9afda6` | `#006a2a` |
| `tertiary` | `#006972` | `#ffffff` |
| `tertiary-container` | `#7ef1ff` | `#4be8f9` |

> **Implementación:** En Next.js + Tailwind esto se traduce a definir las dos paletas en `tailwind.config.ts` bajo `darkMode: ['class', '.dark']` (o `media`) y mapearlas a variables CSS en `:root` y `.dark`.

### 1.4 Paleta de referencia (M3 ref-palette)
16 stops (0/10/20/25/30/35/40/50/60/70/80/90/95/98/99/100) por cada color (primary, secondary, tertiary, neutral, neutral-variant, error). Los 4 grupos están en el archivo. Son útiles si quieres generar paletas con Material Theme Builder.

---

## 2. Tipografía

### 2.1 Familias
| Variable | Valor | Uso |
|---|---|---|
| `--app-main-font` | `"DM Sans", sans-serif` | Default de toda la app (en `body`) |
| `--app-main-font-name` | `"DM Sans"` | Para los typescale M3 |
| `Inter, sans-serif` | hard-coded | Algunos botones (style-2, style-3) |
| `Geist Mono, monospace` | hard-coded | Code/tech accents |
| `DM Mono, Courier New, monospace` | hard-coded | Markdown code blocks |
| `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | hard-coded | `<code>` inline |

Pesos usados: **400, 500, 600, 700, 800, 900**.

### 2.2 Typescale M3 (usado por helpers `.body-large`, `.body-medium`, etc.)

| Rol | family | style | weight | size | line-height | tracking |
|---|---|---|---|---|---|---|
| `display-large` | DM Sans | Regular | 400 | 57 | 64 | -0.25 |
| `display-medium` | DM Sans | Regular | 400 | 45 | 52 | 0 |
| `display-small` | DM Sans | Regular | 400 | 36 | 44 | 0 |
| `headline-large` | DM Sans | Regular | 400 | 32 | 40 | 0 |
| `headline-medium` | DM Sans | Regular | 400 | 28 | 36 | 0 |
| `headline-small` | DM Sans | Regular | 400 | 24 | 32 | 0 |
| `title-large` | DM Sans | Regular | 400 | 22 | 28 | 0 |
| `title-medium` | DM Sans | Medium | 500 | 16 | 24 | 0.15 |
| `title-small` | DM Sans | Medium | 500 | 14 | 20 | 0.1 |
| `body-large` | DM Sans | Regular | 400 | 16 | 24 | 0.5 |
| `body-medium` | DM Sans | Regular | 400 | 14 | 20 | 0.25 |
| `body-small` | DM Sans | Regular | 400 | 12 | 16 | 0.4 |
| `label-large` | DM Sans | Medium | 500 | 14 | 20 | 0.1 |
| `label-medium` | DM Sans | Medium | 500 | 12 | 16 | 0.5 |
| `label-small` | DM Sans | Medium | 500 | 11 | 16 | 0.5 |

---

## 3. Componentes Clave

> **Nota:** Los nombres `sb-btn`, `md-button` que pediste **no existen tal cual**. El archivo minificado usa un esquema de clases numéricas (`style-1..7`) para variantes de button/input, y referencia componentes **Material Web 3** (`md-filled-button`, `md-outlined-text-field`, `md-dialog`, `md-filter-chip`, etc.) sin redefinir su CSS. Aquí están los **patrones custom** que detecté:

### 3.1 Botones — variantes `button.style-N`

| Variante | Estilo | Uso típico |
|---|---|---|
| `button.style-1` | `font-size:24px; padding:16px 32px; border-radius:64px; hover:scale(1.1)` cubic `(.38,.49,0,1.16)` | Botón hero / display |
| `button.style-2` | `font:Inter 14px; padding:8px 12px; border-radius:12px; bg:surface-container` + `[active]=primary-container` + `rounded`/`playful` morph a 64px | Chip-like / tab-like button |
| `button.style-3` | `font:Inter 16px; padding:16px 24px; border-radius:24px;` con `buttonClickAnimation` en focus | CTA glassy |
| `button.style-4` | `border-radius:24px; padding:8px 16px; display:flex; gap:8px; --md-icon-size:18px` | Inline con icono |
| `button.style-7` | `font:DM Sans 14px/500; padding:12px 18px; border-radius:12px;` con modificadores `.slim`, `.big`, `.chunky`, `.rounded`, `.for-icon`, `.text-big`, `.with-icon-left/right` | **Botón primario genérico** (el más usado) |
| `nav-button` | `height:40px; padding:8px 16px; border-radius:12px; font-size:16px; weight:500; color:outline` | Items de navegación |
| `subscribe-btn` | `padding:12px 20px; border-radius:12px; font-weight:600; --primary/--on-primary` | Suscripción / paywall |
| `toolbar-btn` | `40×40; border-radius:12px;` (icon-only) | Toolbar editor |
| `mic-button` | `56×56; border-radius:18px; bg:rgba(...,.03)` con `mic-pulse-4c1d300c` | Input de voz |

**Modificadores compartidos:** `.rounded` → `border-radius:64px`; `.slim` → `padding:8px 16px; font-size:13px`; `.big` → `padding:16px 24px`; `.chunky` → `padding:20px 28px; font-size:15px; border-radius:16px`; `[active]` y `.active` → swap a `primary-container` / `on-primary-container`; `:disabled` → `opacity:.5`.

### 3.2 Inputs / Text fields

| Variante | Estilo |
|---|---|
| `input/select/textarea.style-1` | `bg:surface-container` (o `transparent` con `.transparent`) |
| `.style-2` | `bg:background; box-shadow:0 0 0 .5px #0000000d, 0 .5px 2.5px #0000001f` (outline subtle) |
| `.style-3` | `bg:rgba(neutral-bg,.5); box-shadow:inset 1px 1px 1px rgba(neutral-bg,.6), inset -1px -1px 1px rgba(neutral-bg,.6), 0 0 16px #00000029; border-radius:24px` (glass) |
| `.style-4` | `bg:transparent; padding:0; height:auto; focus:bg:surface-container-low` |
| `setup-input` | `min-height:120px; padding:16px; border-radius:24px; font-size:18px; line-height:1.4; resize:none; bg:rgba(neutral-on-bg,.03)` |

Además usan `md-outlined-text-field`, `md-filled-text-field`, `md-filled-select` (Material Web 3) — los configs internos setean tokens como `--md-outlined-text-field-container-shape:16px` y `--md-outlined-text-field-outline-color: outline`.

### 3.3 Tarjetas / Containers — `.content-box`, `.grid-card`, `.total-balance-card`

**`.content-box`** con modificadores:
- `.style-glass` → `bg:rgba(neutral-on-bg,.02); box-shadow:inset 1px 1px 1px rgba(neutral-bg,.6), inset -1px -1px 1px rgba(neutral-bg,.6), 0 0 16px rgba(neutral-on-bg,.08)` (frosted)
- `.style-glass.frosted` → `bg:rgba(neutral-bg,.24)`

**`.grid-card`**: `bg:surface-container-low; border-radius:48px; overflow:hidden; transition:bg .3s ease;` con `.is-clickable:hover` → `surface-container`; `.is-tall` → `height:calc(100svh - 64px)`; `.wide` → `grid-column:span 2`.

**`.total-balance-card`**: `padding:32px; border-radius:40px; height:420px; overflow:hidden;` + capa de "noise" con PNG inline data-URI (textura granulada) y blobs animados con `blob-move-1-*` / `blob-move-2-*` (rotate+translate).

### 3.4 Tablas — `table.style-1`

```css
table.style-1 { border-collapse:collapse; border-radius:16px; box-shadow:inset 0 0 0 1px surface-container; }
table.style-1 th, td { height:40px; padding:4px 12px; font-size:14px; }
table.style-1 thead th { font-weight:500; color:outline; }
table.style-1 tr:hover { background: surface-container-low; }
table.style-1.variant-1 { --table-line-color: surface-container-highest; box-shadow:inset 0 0 0 1px var(--table-line-color); }
table.style-1.variant-1 td,th { border-bottom:1px solid var(--table-line-color); border-right:1px solid var(--table-line-color); }
```

También tienen un patrón `body td { border-bottom:1px solid var(--table-line-color); }` + filas alternadas con `tr:nth-child(odd) td { background: surface-container-low; }` y `first/last-child` con `border-top-left/right-radius:16px`.

### 3.5 Modales — `.modal-window` / `.modal-backdrop`

```css
.modal-backdrop {
  position:fixed; inset:0;
  background:#0000001a; display:flex; align-items:center; justify-content:center;
  padding:8px; box-sizing:border-box;
  animation:backdrop-in-253446d3 .15s;
  overscroll-behavior:contain;
}
.modal-window {
  position:absolute; display:flex; flex-direction:column;
  width:calc(100vw - 48px); max-width:600px; max-height:80vh;
  padding:24px; border-radius:32px;
  background: var(--md-sys-color-background);
  overscroll-behavior:contain; flex-grow:1;
}
.modal-window.slim { max-width:400px; }
.modal-window.increased { /* más grande */ }
.side-panel { width:100%; max-width:800px; height:100%; }
```

Posición modificable vía `modal-position-absolute` y modificadores de padding: `.padding-0-16`, `.padding-0-24`, `.padding-48-32`, `.top-padding-0-16` (ajustan `--modal-safe-top-min`).

### 3.6 Toasts — `.toast` / `.toast-shell` / `.toast-stack`

```css
.toast-stack { position:absolute; pointer-events:none; }
.toast { position:absolute; pointer-events:auto; touch-action:none; will-change:transform,opacity; }
.toast-shell {
  display:flex; background:var(--toast-bg, background); color:var(--toast-fg, on-background);
  border-radius:32px;
  box-shadow: 0 2px 12px #0000001f, 0 0 1px #00000038;
  max-width:min(460px, calc(100vw - 32px));
  transition:transform .3s cubic-bezier(0,0,.5,1);
}
.toast-shell:hover { transform:scale(1.05); }

.toast-shell.variant-success { --toast-bg:primary-container; --toast-fg:on-primary-container; }
.toast-shell.variant-error   { --toast-bg:error-container;   --toast-fg:on-error-container; }
.toast-shell.variant-info    { --toast-bg:tertiary-container; --toast-fg:on-tertiary-container; }
```

**Posiciones de la pila:** `.top-left`, `.top-center`, `.top-right`, `.center-left`, `.center-right`, `.bottom-left`, `.bottom-center`, `.bottom-right` (todas con `16px` offset, salvo top/bottom-center que usan `left:0;right:0`).

### 3.7 Navigation — `.app-nav`, `.app-header`, `.nav-button`, `.pretty-tabs`

```css
.app-header { display:flex; justify-content:space-between; align-items:center; }
.app-header-title { font:DM Sans 500; font-size:display-medium; line-height:1.1; } /* responsive variants */
.app-nav { order:-1; }
.nav-button { display:flex; align-items:center; gap:8px; background:transparent;
              color:outline; border-radius:12px; height:40px; padding:8px 16px;
              font:DM Sans 16px/500; cursor:pointer;
              transition:.15s color,.15s background; }
```

**`.pretty-tabs`** — tabs con pill indicator animado:
```css
.pretty-tabs { display:flex; gap:4px; padding:4px; border-radius:64px; bg:surface-container-low; overflow:auto; }
.pretty-tabs__tab { flex:1; display:inline-flex; gap:8px; border-radius:99em; padding:16px 24px;
                    font:DM Sans 14px/500; color:on-surface-variant; transition:color .2s, bg-color .2s; }
.pretty-tabs__tab.active { color:on-surface; }
.pretty-tabs__indicator { position:absolute; border-radius:99em; bg:surface;
                          box-shadow:0 0 0 1px rgba(0,0,0,.03), 0 .5px 2.5px rgba(0,0,0,.08);
                          will-change:transform,width,height; }
```
Variantes: `.orientation-vertical` (columna), y paddings por tamaño (16/24 → 12/16 → 8/14).

### 3.8 Badges / Chips — `.chip`, `.day`, `.time-chip`, `.period-chip`, `.cycle-option`

```css
.chip { padding:4px 8px; border-radius:16px; }
.amount { font-size:inherit; font-weight:500; text-wrap:nowrap; }
.positive { color:primary; bg:secondary-container; }
.negative { color:error;   bg:error-container; }
.day { display:flex; aspect-ratio:1; font-size:14px; border-radius:16px;
       color:on-surface-variant; transition:bg 125ms, color 125ms, font-size .2s, font-weight .2s; }
.time-chip { all:unset; cursor:pointer; font-size:44px/500; line-height:1;
             padding:10px 18px; border-radius:18px; min-width:72px; text-align:center;
             color:on-surface-variant; bg:surface-container-low; font-variant-numeric:tabular-nums; }
.period-chip { all:unset; font-size:20px/500; padding:12px 22px; border-radius:16px; min-width:48px; }
.cycle-option { display:inline-flex; gap:6px; padding:8px 16px; border-radius:999px;
                color:color-mix(in srgb, on-background 60%, transparent); }
```

También referencian `md-filter-chip` y `md-assist-chip` de Material Web.

### 3.9 Loading / Skeleton

```css
.animation-loading-1 { position:relative; overflow:hidden; pointer-events:none; }
.animation-loading-1:before {
  content:""; position:absolute; inset:0; border-radius:inherit;
  background:linear-gradient(to right, transparent, rgba(0,0,0,.1), transparent) !important;
  transform:translate(-100%);
  animation:hover-magic-1-shimmer 1s infinite;  /* reusa el shimmer */
}
```
Dark mode: `rgba(255,255,255,.05)` en lugar de negro.

Otros loading:
- `loading-glow-sweep-287d437a` (translate de -100% a 100%)
- `recording-pulse-287d437a` (opacity pulse 1)
- `progress-indicator-in` (opacity 0→1)
- `shimmer-overlay` (translate 100%)
- `mic-pulse-4c1d300c` (scale pulse)

### 3.10 Tooltips
No hay clase custom; usan `md-tooltip` / popovers de Material Web (no aparecen estilos custom en el archivo).

### 3.11 Otros componentes custom

- **`.hover-magic-1`**: contenedor con shimmer constante. `overflow:hidden; transition:transform .25s cubic-bezier(0,0,.5,1); :hover { transform:scale(1.03); box-shadow:0 24px 64px -32px primary-container; }` + `:before` con gradiente animado.
- **`.hover-magic-2` / `-2-small` / `-2-tiny`**: contenedor que al hover muestra un blob blur de `secondary-container`/`primary-container` que entra desde una esquina. `inset:0; border-radius:200px; filter:blur(100px)` (50px / 24px para small/tiny).
- **`.color-ball`**: círculo selector de color con `aspect-ratio:1; border-radius:50%; box-shadow:inset 0 0 0 4px rgba(neutral-on-bg,.1); transition:transform .2s, box-shadow .5s, border-radius .5s cubic-bezier(.38,.49,0,1)`. `.active` → `box-shadow:inset 0 0 0 3px rgba(neutral-on-bg,.3); border-radius:16px; opacity:1; filter:saturate(1.1)`.
- **`.message`** (chat bubble): `display:block; width:fit-content; max-width:80%; padding:16px 24px; border-radius:32px; font:DM Sans 16px/500; line-height:1.3;`
- **`.total-balance-card`** con **blobs animados** (`blob-move-1-*` / `blob-move-2-*`) — dos keyframes que rotan+trasladan `150px` para crear un efecto aurora suave.
- **`.hand-group`** + **`.ring`** (selector de tiempo): `transform-origin:120px 120px; transition:transform .62s cubic-bezier(.34,1.45,.5,1)` — usa curva spring/back.
- **`.movement-row`**: `display:flex; align-items:center; gap:16px; padding:8px; border-radius:24px; bg:background; transition:.2s background ease;`
- **`.text-gradient-rainbow-animated`**: `linear-gradient(90deg,#b00020,#b54700,#8a6a00,#0a7a2f,#006c84,#0050c7 80%,#6f2dbd); background-size:300% 100%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:text-rainbow-flow 6s linear infinite;` (dark: `#ff6b8a,#ffb15a,#ffe27a,#7bff9b,#7fe8ff,#89a8ff,#d2a6ff`).
- **`.text-pretty-flow`**: similar con `text-pretty-flow 8s cubic-bezier(.45,.05,.55,.95) infinite` (usa `primary`+`tertiary-container`).
- **`.background-blured-8`** / **`.background-blured-8-inverted`**: glass de nav — `background:#ffffffa3; backdrop-filter:blur(8px);` (dark: `#000c`).
- **`.outline-1-light`**, **`.outline-with-shadow`**, **`.outline-with-shadow-strong`**, **`.outline-with-shadow-light`**: niveles de borde/sombra (estilo M3 elevation 1/2/3).
- **`.mix-blend-mode-difference`**: `mix-blend-mode:difference`.
- **`.box-shadow-none`**: `box-shadow:none`.

---

## 4. Patrones de Animación (28 keyframes)

### 4.1 Entradas / Mounting
| Keyframe | Comportamiento |
|---|---|
| `animation-general-in` | `opacity:0→1, blur(16px)→0, scale(.96)→1` (entrada estándar, ~300ms) |
| `animation-general-in-2` | `opacity:0→1, blur(32px)→0, scale(.7)→1` (entrada más dramática) |
| `card-enter-fe2eeb04` | `opacity:0→1, translateY(8px)→0, scale(.985)→1` (entrada de card) |
| `search-result-item-in` | `opacity:0→1, blur(16px)→0, translateY(-20px)→0` |
| `entry-animation-1` | `scaleX(1.4) translate(0)→scaleX(1.4) translate(100%)` (reveal horizontal) |
| `progress-indicator-in` | `opacity:0→1` |
| `asyncstate-fade` | `opacity:0→?` (async loading) |
| `backdrop-in-253446d3` | `background:#0000→#0000001a` (modal backdrop fade) |
| `iconAnimation` | `font-variation-settings:"FILL" 0→1` (icon fill, típico M3) |

### 4.2 Salidas / Unmounting
| Keyframe | Comportamiento |
|---|---|
| `item-out` | `opacity:1→0, blur:0→?, translateY:0→?` (reverse) |
| `item-out-left` | exit deslizando a la izquierda |
| `item-out-bottom` | exit deslizando hacia abajo |
| `today-appt-item-out` | `padding:16px→0, max-height:94px→0` (colapsa espacio) |

### 4.3 Interacción / Feedback
| Keyframe | Comportamiento |
|---|---|
| `buttonClickAnimation` | `scaleX(1)/scaleY(1) → scaleX(.95)/scaleY(.9) → scaleX(1)` con `cubic-bezier(.37,1.42,.37,1)` (efecto "squish" spring) |
| `error-vibration` | `translate(0)→(-5)→(+5)→(-5)→(+5)→(0)` (vibración horizontal) |
| `shake` | `translate(0)→(-4)→(+4)→(-4)→(0)` (shake sutil) |
| `animation-highlight-2` | `scale(1)→?, box-shadow:0 0 0 0 primary-container → 0 0 0 4px primary-container` (highlight pulse) |

### 4.4 Loop / Continuos
| Keyframe | Comportamiento |
|---|---|
| `blob-move-1-32393eee` / `blob-move-1-52ed59c9` | rotación 0→360° + translate 150px (blobs de fondo) |
| `blob-move-2-32393eee` / `blob-move-2-52ed59c9` | rotación 180→180° (opuesto) + translate 120px |
| `text-rainbow-flow` | `background-position:0% 50% → 300% 50%` (6s linear) |
| `text-pretty-flow` | `background-position:0% 50% → 100% 50% → 0% 50%` (8s ease, ida y vuelta) |
| `hover-magic-1-shimmer` | `transform:translate(-100%) → translate(100%)` (2s, shimmer loop) |
| `shimmer-overlay` | `transform:translate(100%)` (similar) |
| `loading-glow-sweep-287d437a` | `translate(-100%) → 100%` |
| `recording-pulse-287d437a` | `opacity:1 ↔ ?` (pulso de grabación) |
| `mic-pulse-4c1d300c` | `scale(1) → scale(?) → scale(1)` |

### 4.5 Curvas de easing distintivas

```css
/* Spring / Back */
cubic-bezier(.34, 1.45, .5, 1)      /* hand-group, "elastic out" */
cubic-bezier(.37, 1.42, .37, 1)     /* buttonClickAnimation, "back out" */
cubic-bezier(.38, .49, 0, 1.16)     /* botones style-1, "back" */
cubic-bezier(.38, .49, 0, 1.5)      /* rounded/playful, "back fuerte" */
cubic-bezier(.38, .49, 0, 2)        /* más extremo */
cubic-bezier(.6, .6, .12, 1.26)     /* back suave */

/* Smooth / Material */
cubic-bezier(0, 0, .5, 1)            /* M3 standard easing */
cubic-bezier(.11, 1, 0, 1)           /* "ease out expo" */
cubic-bezier(.48, 0, 0, 1)           /* "ease in-out" custom */
cubic-bezier(.45, .05, .55, .95)     /* text-pretty-flow */
cubic-bezier(.75, 0, .41, -.06)      /* "ease out back" */
```

> **Implementación en Tailwind:** crea un `safelist` con las clases `transition-[cubic-bezier(0,0,0.5,1)]` o usa `theme.extend.transitionTimingFunction`.

---

## 5. Utilidades / Layout

No hay una "utility class library" tradicional (no es Tailwind ni un sistema de utility-first). El sitio usa clases compuestas con modificadores (`style-1` + `.rounded` + `.slim`). Las "utilidades" notables son:

```css
/* Opacity */
.opacity-0, .opacity-0-5, .opacity-0-8, .opacity-1

/* Direction / Layout */
.direction-row, .direction-col
.justify-right
.only-on-mobile    /* muestra solo en mobile (uses :first-child display:none en otros) */
.transparent       /* bg:transparent */
.for-icon          /* padding:12px */

/* Padding helpers */
.padding-0-16, .padding-0-24, .padding-48-32
.top-padding-0-16

/* Spacing primitives (via .app-view-content) */
.app-view-content { display:flex; flex-grow:1; flex-direction:column; gap:8px; padding:16px; }

/* z-index scale (literal) */
-1, 0, 1, 2, 3, 10, 20, 100, 2100, 9999
/* 2100 = toasts/overlays, 9999 = tooltip stack */

/* Common shadows */
.outline-1-light           { box-shadow:0 0 0 1px inverse-on-surface; }
.outline-with-shadow       { box-shadow:0 0 0 .5px #0000000d, 0 .5px 2.5px #00000029; }
.outline-with-shadow-strong{ box-shadow:0 0 0 .5px #0000000d, 0 0 12px #0000000f; }
.outline-with-shadow-light { box-shadow:0 .5px 2.5px #0000001f; }
```

**Para `body` (defaults globales):**
```css
body { margin:0; font-family:var(--app-main-font); font-optical-sizing:auto;
       background:var(--md-sys-color-background); color:var(--md-sys-color-on-background);
       width:100%; height:100svh; -webkit-tap-highlight-color:transparent;
       -webkit-font-smoothing:antialiased; }
html { overflow:hidden; overscroll-behavior:none; }
```

---

## 6. Dark / Light Mode

### 6.1 Mecánica de cambio
- **Light**: `:root` define `--md-sys-color-neutral-background: 255,255,255` y los tokens `-light` están en el bundle M3.
- **Dark**: dos mecanismos combinados:
  1. `@media (prefers-color-scheme: dark) { :root { --md-sys-color-neutral-background: 0,0,0; } }`
  2. `@media (prefers-color-scheme: light) { :root,:host { /* paleta VERDE */ } }` y `@media (prefers-color-scheme: dark) { :root,:host { /* paleta VERDE dark */ } }` — esto **sobreescribe los tokens azules por verdes** cuando el sistema está en dark.
- **No hay clase `.dark`** explícita — el toggle de tema se hace a nivel de `prefers-color-scheme`. Si quieres un toggle manual en Next.js, agrega un `<html class="dark">` y duplica los overrides dentro de `.dark { ... }` o usa `data-theme="green"`.

### 6.2 Qué cambia entre light y dark
| Aspecto | Light | Dark |
|---|---|---|
| `background` | `#fefbff` (azul) / `#f1fded` (verde) | `#1b1b1f` (azul) / `#0c160d` (verde) |
| `primary` | `#0054d6` (azul) / `#006e2c` (verde) | `#b3c5ff` (azul) / `#00e563` (verde) |
| `on-background` | `#1b1b1f` | `#e4e2e6` |
| `surface-container-low` | `#eef0ff` / `#ebf7e7` | `#1a1b23` / `#141e14` |
| Glass shadows | `0 0 16px #00000029` | `0 0 16px #00000014` |
| Backdrop opacity | `#0000001a` (10%) | `#00000014` (8%) |
| Glass inset shadows | `rgba(neutral-bg,.6)` | `rgba(neutral-on-bg,.04)` |
| Modal border | (no border en light) | `0 0 0 1px #ffffff0d` (white 5% en dark) |
| Text-gradient | warm gradient (rojo/naranja/...) | cool gradient (rosa/amarillo/verde/...) |
| Shimmer | `rgba(0,0,0,.1)` | `rgba(255,255,255,.05)` |

> **Implementación sugerida en Next.js + Tailwind:**
> 1. Carga DM Sans desde `next/font/google` con `variable: '--app-main-font-name'`.
> 2. Define los tokens en `globals.css` con dos bloques: `:root { /* light azul */ }` y `.dark { /* dark verde */ }` (o `.theme-green` si quieres toggle).
> 3. En `tailwind.config.ts`, usa `darkMode: 'class'` y mapea `colors: { 'md-primary': 'rgb(var(--md-sys-color-primary) / <alpha-value>)', ... }` — usa `rgb()` con variables en formato `255,255,255` (el formato `,` del archivo original).
> 4. Reusa las easings y `@keyframes` literalmente; crea componentes con `cva` (class-variance-authority) replicando `style-1..7` y modificadores.

---

## Bonus: Mapeo rápido a Tailwind config

```ts
// tailwind.config.ts
colors: {
  'md-primary':         'rgb(var(--md-sys-color-primary) / <alpha-value>)',
  'md-on-primary':      'rgb(var(--md-sys-color-on-primary) / <alpha-value>)',
  'md-primary-c':       'rgb(var(--md-sys-color-primary-container) / <alpha-value>)',
  'md-on-primary-c':    'rgb(var(--md-sys-color-on-primary-container) / <alpha-value>)',
  'md-secondary':       'rgb(var(--md-sys-color-secondary) / <alpha-value>)',
  'md-on-secondary':    'rgb(var(--md-sys-color-on-secondary) / <alpha-value>)',
  'md-tertiary':        'rgb(var(--md-sys-color-tertiary) / <alpha-value>)',
  'md-error':           'rgb(var(--md-sys-color-error) / <alpha-value>)',
  'md-on-error':        'rgb(var(--md-sys-color-on-error) / <alpha-value>)',
  'md-error-c':         'rgb(var(--md-sys-color-error-container) / <alpha-value>)',
  'md-on-error-c':      'rgb(var(--md-sys-color-on-error-container) / <alpha-value>)',
  'md-bg':              'rgb(var(--md-sys-color-background) / <alpha-value>)',
  'md-on-bg':           'rgb(var(--md-sys-color-on-background) / <alpha-value>)',
  'md-surface':         'rgb(var(--md-sys-color-surface) / <alpha-value>)',
  'md-on-surface':      'rgb(var(--md-sys-color-on-surface) / <alpha-value>)',
  'md-on-surface-var':  'rgb(var(--md-sys-color-on-surface-variant) / <alpha-value>)',
  'md-outline':         'rgb(var(--md-sys-color-outline) / <alpha-value>)',
  'md-outline-var':     'rgb(var(--md-sys-color-outline-variant) / <alpha-value>)',
  'md-surface-low':     'rgb(var(--md-sys-color-surface-container-low) / <alpha-value>)',
  'md-surface-c':       'rgb(var(--md-sys-color-surface-container) / <alpha-value>)',
  'md-surface-high':    'rgb(var(--md-sys-color-surface-container-high) / <alpha-value>)',
  'md-neutral-bg':      'rgb(var(--md-sys-color-neutral-background) / <alpha-value>)',
  'md-neutral-on-bg':   'rgb(var(--md-sys-color-neutral-on-background) / <alpha-value>)',
  'table-line':         'rgb(var(--table-line-color) / <alpha-value>)',
}

fontFamily: {
  sans: ['var(--app-main-font)', 'sans-serif'],
  mono: ['"Geist Mono"', 'monospace'],
  inter: ['Inter', 'sans-serif'],
}

borderRadius: {
  pill: '64px', card: '48px', card2: '40px', chip: '24px', chip2: '16px', chip3: '12px', bubble: '32px',
}

transitionTimingFunction: {
  'm3': 'cubic-bezier(0, 0, 0.5, 1)',
  'spring': 'cubic-bezier(.34, 1.45, .5, 1)',
  'back': 'cubic-bezier(.37, 1.42, .37, 1)',
  'back-strong': 'cubic-bezier(.38, .49, 0, 1.5)',
}

keyframes: {
  'in': { '0%': { opacity: '0', filter: 'blur(16px)', transform: 'scale(.96)' }, 'to': { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' } },
  'card-in': { '0%': { opacity: '0', transform: 'translateY(8px) scale(.985)' }, 'to': { opacity: '1', transform: 'translateY(0) scale(1)' } },
  'shimmer': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
  'click': { '0%, 100%': { transform: 'scaleX(1) scaleY(1)' }, '50%': { transform: 'scaleX(.95) scaleY(.9)' } },
  'shake': { '0%, 100%': { transform: 'translateX(0)' }, '25%, 75%': { transform: 'translateX(-4px)' }, '50%': { transform: 'translateX(4px)' } },
  'rainbow': { '0%': { backgroundPosition: '0% 50%' }, 'to': { backgroundPosition: '300% 50%' } },
  'vibrate': { '0%, 100%': { transform: 'translateX(0)' }, '20%, 60%': { transform: 'translateX(-5px)' }, '40%, 80%': { transform: 'translateX(5px)' } },
}
```

---

**Resumen ejecutivo para implementación:**
1. **Foundation:** M3 con tokens `md-sys-color-*` + paleta dual (azul/verde) por `prefers-color-scheme`.
2. **Tipografía:** DM Sans como variable `--app-main-font`, typescale M3 completo.
3. **Sistema de variantes:** 7 estilos numéricos (`style-1..7`) con modificadores (`.rounded`, `.slim`, `.big`, `.chunky`, `.active/[active]`, `.for-icon`).
4. **Animaciones:** 28 keyframes; los más reusables son `animation-general-in` (mount), `buttonClickAnimation` (squish), `error-vibration`/`shake` (feedback), `hover-magic-1-shimmer` (skeleton), `text-rainbow-flow` (gradient text).
5. **Easing signature:** `cubic-bezier(.38,.49,0,X)` (back) y `cubic-bezier(.34,1.45,.5,1)` (spring) son la firma del sitio.
6. **Glass/elevation:** `backdrop-filter:blur(8px)` + inset shadows + `rgba(...,.24)` es el patrón recurrente.
7. **Radio scale:** `12, 16, 18, 24, 32, 40, 48, 64, 88, 99em` — predominantemente generosos ("squircle-friendly").
