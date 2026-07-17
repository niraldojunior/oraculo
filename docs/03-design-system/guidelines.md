# Guidelines de UI

> Não há componentes core React empacotados (tipo `Button.jsx`/`Card.jsx` reutilizáveis com `.prompt.md`, como no design system do Nexus). O padrão de UI do Oraculo é feito de **classes utilitárias CSS globais** em `web/src/index.css`, consumidas diretamente nos componentes de página. Este documento cataloga essas classes para reuso consistente — antes de escrever CSS novo, verifique se já existe uma classe aqui.

## 1. Estrutura de página

| Classe | Uso |
|---|---|
| `.app-container` | Container raiz — sidebar + conteúdo, `display: flex`, `height: 100vh` |
| `.sidebar` / `.sidebar.collapsed` | Navegação lateral (dark), largura controlada por `--sidebar-width`/`--sidebar-collapsed-width` |
| `.main-content` | Área de conteúdo principal |
| `.top-header` | Barra superior fixa (`--header-height`) |
| `.page-content` | Wrapper de conteúdo de página com scroll próprio |
| `.page-layout` | Layout de página em coluna com gap padrão |

## 2. Superfícies (cards/painéis)

| Classe | Uso |
|---|---|
| `.glass-panel` | Card estático — fundo branco, borda sutil, sombra média |
| `.glass-panel-interactive` | Igual ao anterior + hover com elevação e glow dourado (`--shadow-gold`) — usar em cards clicáveis |
| `.hierarchy-view` | Container do organograma (`.org-tree`), com cursor grab/pan |

## 3. Botões

| Classe | Uso |
|---|---|
| `.btn` | Base de todo botão (padding, radius, transição) |
| `.btn-primary` | Ação primária — fundo `--accent-base`, texto `--accent-text` |
| `.btn-glass` | Ação secundária — fundo translúcido |
| `.btn-danger` | Ação destrutiva — fundo `--status-red` |
| `.btn-danger-dim` | Ação destrutiva de baixa ênfase (ex.: item de menu) |
| `.btn-icon` | Botão icon-only, circular no hover |
| `.btn-close` | Botão de fechar modal (canto superior direito, gira 90° no hover) |

## 4. Badges e status

| Classe | Uso |
|---|---|
| `.badge` | Base — pill, uppercase, letter-spacing |
| `.badge-green` / `.badge-amber` / `.badge-red` / `.badge-accent` / `.badge-dark` | Variantes de status — mapear semanticamente (verde=ok/ativo, âmbar=atenção, vermelho=crítico/erro, accent=destaque, dark=especial) |
| `StatusIcon.tsx` (`web/src/components/common/`) | Componente React que decide qual variante de badge/ícone usar a partir de um status de domínio — reusar em vez de reimplementar mapeamento status→cor |

## 5. Formulários

| Classe | Uso |
|---|---|
| `.form-container` | Wrapper de formulário, coluna com gap |
| `.form-group` | Par label+input |
| `.form-actions` / `.form-actions-stack` | Linha ou coluna de botões de ação do formulário |
| Seletores globais `.form-group input/select/textarea` | Estilo padrão de campo (fundo `--bg-app`, borda `--glass-border`, focus com `--accent-base` + `--accent-dim`) — não redefinir estilo de input por componente |

## 6. Tabelas

| Classe | Uso |
|---|---|
| `.data-table` | Tabela padrão — header sticky, hover de linha |
| `.table-row-premium` | Linha com fade-in de `.btn-icon` no hover (ações aparecem só ao passar o mouse) |

## 7. Modais

| Classe | Uso |
|---|---|
| `.modal-overlay` | Overlay full-screen (abaixo do header) com blur |
| `.modal-content` | Container do modal — usa `--radius-lg`, `--shadow-lg` |
| `.confirm-delete` | Padrão de modal de confirmação de exclusão (título + texto centralizados) |

## 8. Outros padrões

| Classe | Uso |
|---|---|
| `.avatar-small` | Avatar circular pequeno (24px), usado em listas/tabelas |
| `.has-tooltip` / `[data-tooltip]` | Tooltip via CSS puro (`::after` com `content: attr(data-tooltip)`) — não usar lib de tooltip externa para casos simples |
| `.search-box-premium` | Campo de busca com pill radius e glow no focus |
| `.spinner` / `.spinner-container` | Loading state padrão |
| `.flex-center`, `.flex-between`, `.gap-sm/md/lg` | Utilitários de flexbox — preferir a CSS inline ad-hoc |

## 9. Componentes React reutilizáveis existentes

Diferente do CSS (utilitário/global), há alguns componentes React genéricos em `web/src/components/common/`:

| Componente | Arquivo | Uso |
|---|---|---|
| `Avatar` | `Avatar.tsx` | Avatar de colaborador (foto ou iniciais) |
| `PriorityPicker` | `PriorityPicker.tsx` | Seletor de prioridade de `MilestoneTask`/`Initiative` |
| `StatusIcon` | `StatusIcon.tsx` | Ícone/cor por status de domínio |

Componentes específicos de iniciativa (editor, board, modais) vivem em `web/src/components/initiative/` e não são genéricos — não reusar fora do contexto de iniciativas sem antes avaliar se vale extrair para `common/`.

## 10. Regra geral para agentes gerando UI nova

1. Procure uma classe existente nesta página antes de escrever CSS novo.
2. Nunca hardcode cor/espaçamento/raio — use as variáveis CSS de [tokens.md](tokens.md).
3. Se precisar de um padrão visual novo e reutilizável (ex.: um novo tipo de card), adicione a classe em `web/src/index.css` perto de blocos análogos existentes, e documente aqui.
4. Mobile: teste contra o breakpoint único `768px` (ver [tokens.md §6](tokens.md#6-breakpoint-responsivo)) — o layout muda de sidebar lateral para navegação inferior.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, catalogando classes de `web/src/index.css` e componentes de `web/src/components/`. |
