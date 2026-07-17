# Design Tokens

> O Oraculo **não tem um design system empacotado** (sem `tokens/*.json`, sem componentes core publicados como no design system do Nexus). Os tokens vivem como variáveis CSS em `web/src/index.css` (`:root`). **Este arquivo é uma leitura de referência — a fonte de verdade é sempre `web/src/index.css`.** Se o CSS mudar, atualize este documento; nunca o contrário.

## 1. Cores

### Superfícies

| Papel | Variável | Valor |
|---|---|---|
| Fundo da aplicação | `--bg-app` | `#E5E7EB` |
| Card / superfície elevada | `--bg-card` | `#FFFFFF` |
| Card hover | `--bg-card-hover` | `#F8FAFC` |
| Sidebar (dark) | `--bg-sidebar-dark` | `#2E3238` |
| Borda padrão | `--glass-border` | `#E2E8F0` |
| Borda forte | `--glass-border-strong` | `#CBD5E1` |

### Accent (identidade V.tal)

| Papel | Variável | Valor |
|---|---|---|
| Accent base | `--accent-base` | `#FFD919` (amarelo) |
| Accent claro | `--accent-light` | `#FFE047` |
| Accent dim (fundo sutil) | `--accent-dim` | `rgba(255, 217, 25, 0.1)` |
| Texto sobre accent | `--accent-text` | `#181919` |
| Accent secundário (corporate blue/gray) | `--sec-accent` | `#334155` |

### Status

| Papel | Variável | Valor |
|---|---|---|
| Sucesso | `--status-green` | `#10B981` |
| Roxo (informativo) | `--status-purple` | `#8B5CF6` |
| Azul (informativo) | `--status-blue` | `#3B82F6` |
| Erro | `--status-red` | `#EF4444` |
| Aviso | `--status-amber` | `#F59E0B` |

### Tipos de time (`--type-*`, usados no organograma)

| Papel | Variável | Valor |
|---|---|---|
| Master | `--type-master` | `#9333EA` |
| VP | `--type-vp` | `#FFD919` |
| Diretoria | `--type-diretoria` | `#F97316` |
| Gerência | `--type-gerencia` | `#10B981` |
| Liderança | `--type-lideranca` | `#3B82F6` |

### Texto

| Papel | Variável | Valor |
|---|---|---|
| Primário | `--text-primary` | `#181919` |
| Secundário | `--text-secondary` | `#4B5563` |
| Terciário | `--text-tertiary` | `#9CA3AF` |

## 2. Layout

| Papel | Variável | Valor |
|---|---|---|
| Largura da sidebar (expandida) | `--sidebar-width` | `160px` |
| Largura da sidebar (colapsada) | `--sidebar-collapsed-width` | `50px` |
| Altura do header | `--header-height` | `44px` |

## 3. Raios e sombras

| Papel | Variável | Valor |
|---|---|---|
| Raio pequeno | `--radius-sm` | `6px` |
| Raio médio | `--radius-md` | `10px` |
| Raio grande | `--radius-lg` | `16px` |
| Raio total (pill) | `--radius-full` | `9999px` |
| Sombra pequena | `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.05)` |
| Sombra média | `--shadow-md` | `0 4px 20px rgba(0,0,0,0.06)` |
| Sombra grande | `--shadow-lg` | `0 10px 30px rgba(0,0,0,0.08)` |
| Glow dourado (hover accent) | `--shadow-gold` | `0 0 15px rgba(255, 217, 25, 0.4)` |

## 4. Transições

| Papel | Variável | Valor |
|---|---|---|
| Rápida | `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| Normal | `--transition-normal` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` |
| Sidebar (collapse/expand) | `--transition-sidebar` | `400ms cubic-bezier(0.4, 0, 0.2, 1)` |

## 5. Tipografia

- **Fonte de corpo**: `Inter` (300/400/500/600/700), fallback `sans-serif`.
- **Fonte de navegação/sidebar**: `Montserrat` (400/500/600/700).
- Escala de headings definida diretamente em `web/src/index.css`, não em variável: `h1` = `1.8rem`/800, `h2` = `1.4rem`/800, `h3` = `1.15rem`/700, `p` = `1rem`/400.
- `html { font-size: 90%; }` — redução global de 10% em relação ao padrão do navegador.

## 6. Breakpoint responsivo

Único breakpoint: `@media (max-width: 768px)` — sidebar vira barra de navegação inferior fixa; ver `web/src/index.css` para o bloco completo.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, extraída de `web/src/index.css`. |
