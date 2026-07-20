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
| `.table-view-shell` | Wrapper "full-bleed" de uma tabela de listagem que é o único filho de `.page-layout` na visão: preenche toda a largura e altura da área de conteúdo, colada na sub-header (margem negativa de `-10px` cancela o padding de `.page-content` nos quatro lados), sem cantos arredondados/borda/sombra — substitui o antigo padrão de "janela" (`.glass-panel` com `border-radius`) para tabelas de listagem. Requer que o `.page-layout` da página tenha `overflow: 'visible'` nessa visão (em vez de `'hidden'`), senão o bleed é cortado — ver `InitiativesPage.tsx` (visão Lista) |

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
| Seletor de visão do dashboard | Reusa as classes `.view-menu-trigger--icon-only` / `.view-menu` / `.view-menu-item` do `ViewMenu` — o dashboard não usa o componente porque suas visões não são roteadas, mas o visual é idêntico ao das demais páginas. O menu é **plano, com três opções** (Geral, Indicadores, Portfólio) e a descrição de cada visão em `title` (hint). **Não há submenu em cascata**: o recorte de cada visão (Abertas/Fechadas, período, Área de Negócio) fica em combos `HeaderSelect` no sub-header (D14). O menu fecha após a escolha, clique externo ou tecla `Esc`. |
| `.portfolio-*` | Visão consolidada do dashboard: totais compactos na faixa 2 do cabeçalho (pílulas de 21px, dimensionadas para a altura de 31px do sub-header), grade responsiva de Áreas Cliente, cartões escuros e tipografia compacta alinhada à escala de tabelas/sidebar para as seções de entregues e backlog/andamento. |

## 9. Cabeçalho: menu de visões e filtros

> **Não use *segmented control* (pílula) para trocar de visão.** Até 2026-07-20 esse padrão era reescrito inline em nove lugares, com cores hardcoded. Foi substituído pelo menu suspenso `ViewMenu`, alimentado por [`web/src/config/navigation.ts`](../../web/src/config/navigation.ts).

**A troca de visão é um único padrão visual em todo o produto:** trigger `.view-menu-trigger--icon-only` (30px de altura, **sem borda e sem fundo**) exibindo o ícone da visão ativa + o chevron de combo — sem rótulo; o nome vai para `title`/`aria-label`. O menu é `.view-menu` com itens `.view-menu-item`. Vale inclusive para o Dashboard, que monta o menu à mão por não ter visões roteadas. **Não** reestilize o trigger por página nem volte a exibir o rótulo nele.

### Indicador de combo — um só ícone nos dois controles

Os dois seletores do header usam **o mesmo** indicador: `ChevronsUpDown` (lucide) de **12px** em **`--text-primary`**. A única diferença é o lado:

| Controle | Posição do chevron | Por quê |
|---|---|---|
| Seletor de gestor (`.leader-filter-trigger--compact`) | **Esquerda** do avatar | mantém o avatar encostado na borda direita do header |
| Seletor de visão (`.view-menu-trigger--icon-only`) | **Direita** do ícone | ordem de leitura natural a partir da borda esquerda |

Nenhum dos dois gira ao abrir: um indicador bidirecional já mostra as duas direções, diferente do `ChevronDown` simples do `LeaderFilter` não-compacto, onde a virada para cima é o sinal de "aberto".

Ícone e chevron herdam `--text-primary`. **Não** aplique `--text-tertiary` (ou qualquer cinza de baixa ênfase) a eles: sem moldura, cinza faz o controle inteiro ler como desabilitado. O tom de baixa ênfase só vale para chevrons *dentro* de controles que ainda têm borda e fundo (ex.: `HeaderSelect`, `LeaderFilter` não-compacto).

| Classe | Uso |
|---|---|
| `.header-left` / `.header-center` / `.header-right` | Três faixas do `.top-header`: controles à esquerda, título/`headerContent` centralizado (absoluto), grupo ancorado à direita |
| `.header-actions` | Ações da visão dentro de `.header-right` (quando não delegadas ao sub-header) |
| `.header-title` | Título da seção quando a página não injeta `headerContent` |
| `.header-icon-btn` / `.header-icon-btn--danger` | Botões de ação icon-only do header (adicionar, configurações, excluir) |
| `.header-search` (+ `.is-open`) | Campo de busca que expande de 32px para 216px |
| `.view-menu-trigger` / `.view-menu` / `.view-menu-group-label` / `.view-menu-item` | Menu suspenso de visões; grupos com label viram cabeçalho de seção (usado por Produtos: Aplicações/Serviços) |
| `.leader-filter-trigger` / `.leader-filter-menu` / `.leader-filter-item` | Filtro de líder; variante `--naoti` para a opção "Não TI" de Produtos › Aplicações |
| `.leader-filter-trigger--compact` / `.leader-filter-menu--right` | Filtro de líder no canto direito do header: trigger com `ChevronsUpDown` de 12px **à esquerda** do avatar (28px) — o avatar encosta na borda direita do header (nome vai para o `title`) e menu ancorado pela direita. **Sem moldura** — o avatar é o próprio alvo de clique; borda e fundo do trigger seriam uma segunda circunferência competindo com a foto, encolhendo-a. Hover é `opacity`, não fundo. Chevron em `--text-primary`, igual ao do seletor de visão — ver §9 |
| `.header-filter-btn` / `.header-filter-menu` / `.header-filter-section` / `.header-filter-option` | Filtro de tipo/status das Iniciativas, com seções expansíveis e checkbox |
| `.dropdown-item-hover` | Hover de itens de dropdown genéricos (AllocationsPage, OrganizationPage) |
| `.view-placeholder` | Estado "em construção" de uma visão ainda não implementada |
| `.sub-header` / `.sub-header-title` / `.sub-header-lead` / `.sub-header-actions` | Segunda faixa de cabeçalho, específica da visão (D14): identificação e combos à esquerda, ações à direita. As duas faixas têm o mesmo padding lateral, então `.sub-header-lead` **não** leva recuo próprio — a borda do combo cai sobre a do trigger de visão da faixa 1. `.sub-header-title` leva `padding-left: 9px` por ser texto, alinhando-se ao ícone *dentro* do trigger |
| `.header-select-*` (`HeaderSelect.tsx`) | Combo de texto das faixas de cabeçalho — trigger com rótulo + chevron e menu de opções. Substitui dropdowns montados inline com estilo hardcoded |
| `.view-menu-trigger--icon-only` / `.view-menu-trigger-chevron` | Variante icon-only do trigger — **padrão único** de troca de visão em todas as páginas. Sem borda e sem fundo cinza; `ChevronsUpDown` de 12px **à direita** do ícone da visão sinaliza o combo. A borda vira `transparent` em vez de `none`: o recuo de 9px do `.sub-header-title` conta com esse 1px de geometria |

Para adicionar uma visão nova a uma seção existente, **edite apenas `navigation.ts`**: acrescente um `ViewDef` (rota, id de visão, rótulo, ícone, variante de filtro de líder, flags de toolbar) e registre a rota correspondente em `App.tsx`. O `Header`, o `SubHeader`, o `ViewMenu` e o `Sidebar` derivam tudo do registro — não há condicional por pathname a atualizar.

### 9.1 Cabeçalho em duas faixas (D14)

O cabeçalho separa **escopo** de **visão**:

- **`.top-header`** — o que é amplo e vale para a seção inteira: `ViewMenu`, título ou `headerContent` da página, e — ancorado no **canto direito** (`.header-right`) — o seletor de gestor em variante *icon-only* (`compact`: avatar de 28px sem moldura + chevron duplo de combo; o nome vai para o `title`/`aria-label`).
- **`.sub-header`** — o que é da visão atual: ícone + rótulo da visão e as ações `ViewToolbar` (adicionar, buscar, configurar, excluir selecionados).

A segunda faixa é **opt-in por visão**: marque o `ViewDef` com `toolbarPlacement: 'subheader'` em `navigation.ts`. Sem a flag, `SubHeader` renderiza `null` e o layout permanece de faixa única. Hoje usam o sub-header as três visões de **Iniciativas** (Lista, Kanban, Timeline) e a visão **Portfólio** do Dashboard.

Páginas sem `ViewDef` (o Dashboard, cuja visão não é roteada) participam da faixa injetando `subHeaderContent` (esquerda, `.sub-header-lead`), `subHeaderActions` (direita) e `subHeaderTitle` (opcional) pelo `ViewContext` — com conteúdo injetado, `SubHeader` renderiza mesmo sem `toolbarPlacement`. É assim que o Dashboard coloca os combos de recorte de Indicadores e Portfólio na faixa 2, com os totais consolidados do Portfólio à direita. Os controles herdados do header principal (`.header-icon-btn`, `.header-search`, `.header-filter-btn`) recebem override de tamanho/superfície dentro de `.sub-header` para caberem nos 31px e contrastarem com o fundo `--control-surface` da faixa.

Os botões são renderizados pelo componente compartilhado `ViewToolbar` em `web/src/components/layout/HeaderControls.tsx` — as duas faixas consomem o mesmo componente, então **não** reimplemente add/search/settings/delete numa página. Use `ToolbarFlags.addLabel` para rotular o botão de adicionar por visão (ex.: *"Criar Iniciativa"*).

## 10. Componentes React reutilizáveis existentes

Diferente do CSS (utilitário/global), há alguns componentes React genéricos em `web/src/components/common/`:

| Componente | Arquivo | Uso |
|---|---|---|
| `Avatar` | `Avatar.tsx` | Avatar de colaborador (foto ou iniciais) |
| `ViewMenu` | `ViewMenu.tsx` | Menu suspenso de visões da seção atual, montado a partir de `navigation.ts`. Suporta grupos com cabeçalho e oculta visões marcadas com `hideOnMobile` |
| `LeaderFilter` | `LeaderFilter.tsx` | Filtro de líder do header; `mode` define o rótulo do item "todos" (`'user'` → "Usuário Logado", `'all'` → "Todos") e se a opção "Não TI" aparece (`'all-naoti'`). `compact` reduz o trigger ao avatar e `align="right"` ancora o menu pela direita — combinação usada no canto direito do header |
| `HeaderSelect` | `HeaderSelect.tsx` | Combo de texto genérico das faixas de cabeçalho (genérico em `T extends string \| number`): opções com ícone/descrição, item ativo marcado, fecha por clique externo ou `Esc`. Usado pelos recortes do Dashboard (Abertas/Fechadas, período, Área de Negócio) |
| `PriorityPicker` | `PriorityPicker.tsx` | Seletor de prioridade de `MilestoneTask`/`Initiative` |
| `StatusIcon` | `StatusIcon.tsx` | Ícone/cor por status de domínio |
| `ChunkErrorBoundary` | `ChunkErrorBoundary.tsx` | Error boundary em volta do `Suspense` de rotas (`App.tsx`) — fallback quando um `React.lazy` falha ao carregar (chunk 404 pós-deploy); ver [architecture.md §8](../02-system-design/architecture.md#8-entrega-do-frontend-service-worker-e-cache-de-borda) |

Componentes específicos de iniciativa (editor, board, modais) vivem em `web/src/components/initiative/` e não são genéricos — não reusar fora do contexto de iniciativas sem antes avaliar se vale extrair para `common/`.

## 11. Regra geral para agentes gerando UI nova

1. Procure uma classe existente nesta página antes de escrever CSS novo.
2. Nunca hardcode cor/espaçamento/raio — use as variáveis CSS de [tokens.md](tokens.md).
3. Se precisar de um padrão visual novo e reutilizável (ex.: um novo tipo de card), adicione a classe em `web/src/index.css` perto de blocos análogos existentes, e documente aqui.
4. Mobile: teste contra o breakpoint único `768px` (ver [tokens.md §6](tokens.md#6-breakpoint-responsivo)) — o layout muda de sidebar lateral para navegação inferior (cinco itens, distribuídos sem scroll horizontal).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-20 | Agente de IA (Claude) | Fundo do título da tabela de Iniciativas (thead) trocado de `--bg-app` para `--control-surface` (mesmo tom da `.sub-header`, dando continuidade visual entre as duas faixas em vez de um cinza neutro "pesado"). |
| 2026-07-20 | Agente de IA (Claude) | Linhas de separação entre faixas escurecidas de `--glass-border` para `--glass-border-strong`: `.top-header` (header/sub-header) e `.sub-header` (sub-header/título da tabela); título da tabela de Iniciativas (thead) ganha fundo `--bg-app` e texto `--text-secondary` para contraste; borda do thead movida da `tr` para cada `th` (com `border-collapse: separate`) porque sumia ao rolar o scroll. |
| 2026-07-20 | Agente de IA (Claude) | Nova `.table-view-shell` (§6): a tabela da visão Lista de Iniciativas deixa de ser uma "janela" com cantos arredondados e respiro lateral/inferior dentro da área de conteúdo — passa a preencher toda a largura e a base disponíveis, sem `border-radius`/borda/sombra. |
| 2026-07-20 | Agente de IA (Claude) | Seletores do header sem moldura, com indicador de combo único (nova §9, "Indicador de combo"): `.leader-filter-trigger--compact` e `.view-menu-trigger--icon-only` perdem borda/fundo; avatar do gestor sobe de 22px para 28px; `ChevronsUpDown` de 12px em `--text-primary` nos dois — à esquerda no gestor, à direita na visão. |
| 2026-07-20 | Agente de IA (Claude) | Padronização do seletor de visão: trigger icon-only único em todas as páginas (Dashboard passa a reusar `.view-menu-*`); ícone do trigger herda `--text-primary` (a regra de chevron `svg:last-child` estava acinzentando o ícone). |
| 2026-07-20 | Agente de IA (Claude) | Menu do dashboard reduzido a 3 visões planas; novo `HeaderSelect` (`.header-select-*`) para os combos de recorte na faixa 2; `.sub-header-lead`; `ViewMenu` icon-only nas visões com sub-header. |
| 2026-07-20 | Agente de IA (Claude) | Nova §9.1 / decisão **D14** — cabeçalho em duas faixas (`.top-header` = escopo, `.sub-header` = visão), opt-in por `toolbarPlacement`; `ViewToolbar` extraído para `HeaderControls.tsx`; seletor de gestor movido para `.header-right` em variante icon-only. |
| 2026-07-20 | Agente de IA (Claude) | Nova §9 (cabeçalho: menu de visões e filtros): *segmented control* substituído pelo `ViewMenu`; registro de `ViewMenu` e `LeaderFilter` como componentes comuns; tokens `--control-surface*`. |
| 2026-07-19 | Agente de IA (Claude) | Menu de visões do dashboard reduzido a 3 opções: Geral, Indicadores (submenu com Iniciativas Abertas/Fechadas) e Portfólio. |
| 2026-07-19 | Agente de IA (Claude) | §9: registra `ChunkErrorBoundary` como componente comum novo. |
| 2026-07-19 | Codex | Totais do Portfólio no cabeçalho global, conteúdo harmonizado e submenu de Áreas de Negócio aberto por hover. |
| 2026-07-18 | Codex | Seletor hierárquico com botão icon-only, descrições em hint e padrão visual da visão de Portfólio. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, catalogando classes de `web/src/index.css` e componentes de `web/src/components/`. |
