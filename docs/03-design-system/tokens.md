# Design Tokens — V.tal Brand

> O Oraculo **não tem um design system empacotado** (sem `tokens/*.json`, sem componentes core publicados). Os tokens vivem como variáveis CSS em `web/src/index.css` (`:root`) e componentes reutilizáveis em `web/src/components/common/`. **Este arquivo é uma leitura de referência — a fonte de verdade é `web/src/index.css`.** Se o CSS mudar, atualize este documento; nunca o contrário.

## Paleta de Cores — V.tal Brand

Identidade: **amarelo V.tal** (`#FFD919`) como accent primário + escala neutra de cinzas.

### Accent Primário
| Papel | Variável | Valor |
|---|---|---|
| Base | `--accent-base` | `#FFD919` (amarelo V.tal) |
| Claro | `--accent-light` | `#FFE047` |
| Dim (fundo) | `--accent-dim` | `rgba(255, 217, 25, 0.1)` |
| Texto sobre accent | `--accent-text` | `#181919` |

### Escala Neutra (Cinzas)
Usada para backgrounds, borders, textos secundários.

| Token | Valor | Uso |
|---|---|---|
| `--neutral-50` | `#FAFAFA` | Backgrounds muito claros |
| `--neutral-100` | `#F5F5F5` | Backgrounds secundários |
| `--neutral-200` | `#E5E7EB` | `--bg-app`, borders leves |
| `--neutral-300` | `#D1D5DB` | Borders padrão |
| `--neutral-400` | `#9CA3AF` | Text secundário, placeholders |
| `--neutral-500` | `#6B7280` | Text médio |
| `--neutral-600` | `#4B5563` | `--text-secondary`, labels |
| `--neutral-700` | `#374151` | Text forte |
| `--neutral-800` | `#1F2937` | Text muito forte |
| `--neutral-900` | `#111827` | `--text-primary` |

### Status Colors
| Papel | Variável | Valor | Dim (background) |
|---|---|---|---|
| Sucesso | `--status-green` | `#10B981` | `--status-green-dim` `rgba(16, 185, 129, 0.1)` |
| Aviso | `--status-amber` | `#F59E0B` | `--status-amber-dim` `rgba(245, 158, 11, 0.1)` |
| Erro | `--status-red` | `#EF4444` | `--status-red-dim` `rgba(239, 68, 68, 0.1)` |
| Informação | `--status-blue` | `#3B82F6` | — |
| Secundário | `--status-purple` | `#8B5CF6` | — |

### Tipos de Unidade Organizacional
| Papel | Variável | Valor |
|---|---|---|
| Master | `--type-master` | `#9333EA` |
| VP | `--type-vp` | `#FFD919` |
| Diretoria | `--type-diretoria` | `#F97316` |
| Gerência | `--type-gerencia` | `#10B981` |
| Liderança | `--type-lideranca` | `#3B82F6` |

### Superfícies
| Papel | Variável | Valor |
|---|---|---|
| Fundo da app | `--bg-app` | `#E5E7EB` |
| Card / modal / superfície elevada | `--bg-card` | `#FFFFFF` |
| Card hover | `--bg-card-hover` | `#F8FAFC` |
| Sidebar dark | `--bg-sidebar-dark` | `#2E3238` |
| Borda padrão (glass) | `--glass-border` | `#E2E8F0` |
| Borda forte (glass) | `--glass-border-strong` | `#CBD5E1` |
| Controle de header (menus, busca, botões) | `--control-surface` | `#F1F5F9` |
| Controle de header — hover | `--control-surface-hover` | `#E8EEF5` |

### Texto
| Papel | Variável | Valor |
|---|---|---|
| Primário (light theme) | `--text-primary` | `#111827` |
| Secundário | `--text-secondary` | `#4B5563` |
| Terciário | `--text-tertiary` | `#9CA3AF` |
| Invertido (dark backgrounds) | `--text-inverted` | `#FFFFFF` |

---

## Tipografia

**Fontes:** `Inter` (corpo) + `Montserrat` (nav/sidebar)

### Escala de Tamanhos
Baseada em 16px = 1rem:

```css
--text-xs:   0.75rem   /* 12px */
--text-sm:   0.875rem  /* 14px */
--text-base: 1rem      /* 16px */
--text-lg:   1.125rem  /* 18px */
--text-xl:   1.25rem   /* 20px */
--text-2xl:  1.5rem    /* 24px */
--text-3xl:  1.875rem  /* 30px */
```

### Font Weights
```css
--font-regular:   400
--font-medium:    500
--font-semibold:  600
--font-bold:      700
--font-extrabold: 800
```

### Padrões de Uso
- `<h1>` — `--text-3xl` + `--font-extrabold`
- `<h2>` — `--text-2xl` + `--font-extrabold`
- `<h3>` — `--text-xl` + `--font-bold`
- `<p>` — `--text-base` + `--font-regular`, cor: `--text-secondary`
- Rótulos — `--text-sm` + `--font-medium`, cor: `--text-secondary`

Classes utilitárias: `.text-{xs,sm,base,lg,xl,2xl,3xl}` + `.font-{regular,medium,semibold,bold,extrabold}`

---

## Espaçamento (Base 4px)

Toda distância deve usar essa escala — **nunca hardcode** `0.7rem`, `0.65rem`, etc.

```css
--space-1: 0.25rem    /*  4px */
--space-2: 0.5rem     /*  8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
```

Classes utilitárias:
- `.gap-{1,2,3,4,6,8}` — flex gap
- `.p-{1,2,3,4,6,8}` — padding
- `.m-{0,1,2,4}` — margin
- `.mt-{2,4}`, `.mb-{2,4}` — margin-top/bottom

---

## Radii e Shadows

### Border Radii
```css
--radius-sm:  6px
--radius-md:  10px
--radius-lg:  16px
--radius-full: 9999px
```

### Shadows
```css
--shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.05)
--shadow-md:   0 4px 20px rgba(0, 0, 0, 0.06)
--shadow-lg:   0 10px 30px rgba(0, 0, 0, 0.08)
--shadow-xl:   0 20px 50px rgba(0, 0, 0, 0.12)
--shadow-gold: 0 0 15px rgba(255, 217, 25, 0.4)  /* V.tal glow */
```

---

## Transições

```css
--transition-fast:    150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-normal:  300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow:    500ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-sidebar: 400ms cubic-bezier(0.4, 0, 0.2, 1)
```

Automática para `@media (prefers-reduced-motion: reduce)` — animations → 0.01ms.

---

## Layout

```css
--sidebar-width: 160px
--sidebar-collapsed-width: 50px
--header-height: 44px
--subheader-height: 38px   /* menor que o header principal (D14) */
```

---

## Componentes Reutilizáveis

Vivem em `web/src/components/common/`.

### Button
Variantes: `primary` | `secondary` | `danger` | `ghost`  
Tamanhos: `sm` | `md` | `lg`

```tsx
<Button variant="primary" size="md" isLoading={false} disabled={false}>
  Salvar
</Button>
```

Estados:
- `:hover` — transform -1px, shadow upgrade, brightness +5%
- `:focus-visible` — outline 2px `--accent-base`
- `:disabled` — opacity 0.5, cursor not-allowed

### Input
```tsx
<Input
  label="E-mail"
  type="email"
  placeholder="seu@email.com"
  error={errorMsg}
  helper="Texto de ajuda"
/>
```

Sempre com `<label>` associado via `htmlFor`. Erros em `--status-red`, helpers em `--text-tertiary`.

### Modal / ConfirmDialog
Classe `.modal-overlay` + `.modal-content`. Backdrop com blur, content centrado.

`<ConfirmDialog title="" message="" onConfirm={fn} onCancel={fn} isOpen={bool} isDestructive={bool} />`

### Toast
Tipos: `success` | `error` | `warning` | `info`  
Auto-dismiss em 5s. Slide-in animation.

---

## Regras de Ouro

1. **Sempre use tokens** — nunca hardcode cores/espaçamento/fontes
2. **Classes utilitárias primeiro** antes de inline styles — `.gap-4`, `.p-3`, `.text-sm`
3. **ZERO `style={{}}`** — tudo em CSS classes
4. **Componentes extratos** — `<Button>`, `<Input>`, `<Modal>`, `<Toast>` com props semânticas
5. **Labels com inputs** — sempre `<label htmlFor={id}>` associado
6. **Sem diálogos nativos** — use `<ConfirmDialog>` em vez de `window.confirm()` / `alert()`
7. **Focus visible sempre** — navegação por teclado deve ser óbvia (`:focus-visible`)
8. **Paleta é fixa** — não invente cores, reutilize o que existe
9. **Tipografia de escala** — use classes `.text-{size}` + `.font-{weight}`, não hardcode

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-20 | Agente de IA (Claude) | `--subheader-height` de `31px` para `38px` (estava apertado); linha entre `.top-header` e `.sub-header` escurecida de `--glass-border` para `--glass-border-strong`. |
| 2026-07-20 | Agente de IA (Claude) | Novo token `--subheader-height: 31px` — altura da segunda faixa de cabeçalho (D14), ~30% menor que `--header-height`. |
| 2026-07-20 | Agente de IA (Claude) | Novos tokens `--control-surface` / `--control-surface-hover` para a superfície neutra dos controles de cabeçalho (antes `#F1F5F9` hardcoded em ~15 lugares). |
| 2026-07-17 | Claude Code | Reestrutura completa: escala tipográfica (7 tamanhos), espaçamento base-4 (9 valores), escala neutra de 10 cinzas, componentes reutilizáveis (Button, Input, Modal, Toast, ConfirmDialog). Paleta confirmada: V.tal amarelo `#FFD919`. Adicionado suporte a `prefers-reduced-motion`. LoginPage migrada como PoC. |
| 2026-07-16 | Agente de IA | Criação inicial, extraída de `web/src/index.css`. |
